import { and, eq, gte, lte, ilike, sql, desc, asc } from 'drizzle-orm';
import { db, sqlClient } from '../../database/db';
import {
  educators,
  subjects,
  educatorSubjects,
  educatorAvailability,
  reviews,
  users,
} from '../../database/schema';
import type { EducatorFilterInput } from '@expert/validation';

export class EducatorsService {
  async getEducators(filters: EducatorFilterInput) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const _baseQuery = db
      .select({
        id: educators.id,
        userId: educators.userId,
        name: educators.name,
        title: educators.title,
        bio: educators.bio,
        avatarUrl: educators.avatarUrl,
        rating: educators.rating,
        reviewCount: educators.reviewCount,
        experienceYears: educators.experienceYears,
        hourlyRate: educators.hourlyRate,
        isOnline: educators.isOnline,
        isVerified: educators.isVerified,
        education: educators.education,
        languages: educators.languages,
      })
      .from(educators);

    const conditions: any[] = [];

    if (filters.search) {
      conditions.push(
        sql`(${educators.name} ILIKE ${`%${filters.search}%`} OR ${educators.title} ILIKE ${`%${filters.search}%`} OR ${educators.bio} ILIKE ${`%${filters.search}%`})`,
      );
    }

    if (filters.minPrice !== undefined) {
      conditions.push(gte(educators.hourlyRate, filters.minPrice));
    }

    if (filters.maxPrice !== undefined) {
      conditions.push(lte(educators.hourlyRate, filters.maxPrice));
    }

    if (filters.minRating !== undefined) {
      conditions.push(gte(educators.rating, filters.minRating));
    }

    if (filters.isOnline !== undefined) {
      conditions.push(eq(educators.isOnline, filters.isOnline));
    }

    if (filters.subjectId) {
      const matchingEducatorIds = await db
        .select({ educatorId: educatorSubjects.educatorId })
        .from(educatorSubjects)
        .where(eq(educatorSubjects.subjectId, filters.subjectId));

      const ids = matchingEducatorIds.map((m) => m.educatorId);
      if (ids.length === 0) {
        return { educators: [], total: 0, page, totalPages: 0 };
      }
      conditions.push(sql`${educators.id} IN ${ids}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let orderClause = desc(educators.rating);
    if (filters.sortBy === 'price_asc') {
      orderClause = asc(educators.hourlyRate);
    } else if (filters.sortBy === 'price_desc') {
      orderClause = desc(educators.hourlyRate);
    } else if (filters.sortBy === 'experience') {
      orderClause = desc(educators.experienceYears);
    }

    const result = await db
      .select({
        id: educators.id,
        userId: educators.userId,
        name: educators.name,
        title: educators.title,
        bio: educators.bio,
        avatarUrl: educators.avatarUrl,
        rating: educators.rating,
        reviewCount: educators.reviewCount,
        experienceYears: educators.experienceYears,
        hourlyRate: educators.hourlyRate,
        isOnline: educators.isOnline,
        isVerified: educators.isVerified,
        education: educators.education,
        languages: educators.languages,
      })
      .from(educators)
      .where(whereClause)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset);

    // Get subjects for each educator
    const educatorIds = result.map((e) => e.id);
    const subjectsMap: Record<string, any[]> = {};

    if (educatorIds.length > 0) {
      const edSubjects = await sqlClient`
        SELECT es.educator_id, s.id, s.name, s.slug, s.icon_name, s.description
        FROM educator_subjects es
        JOIN subjects s ON s.id = es.subject_id
        WHERE es.educator_id IN ${sqlClient(educatorIds)}
      `;

      for (const row of edSubjects) {
        if (!subjectsMap[row.educator_id]) {
          subjectsMap[row.educator_id] = [];
        }
        subjectsMap[row.educator_id].push({
          id: row.id,
          name: row.name,
          slug: row.slug,
          iconName: row.icon_name,
          description: row.description,
        });
      }
    }

    const educatorsWithSubjects = result.map((e) => ({
      ...e,
      subjects: subjectsMap[e.id] || [],
    }));

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(educators)
      .where(whereClause);

    const total = Number(countResult?.count || 0);

    return {
      educators: educatorsWithSubjects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getEducatorById(id: string) {
    const [educator] = await db.select().from(educators).where(eq(educators.id, id));

    if (!educator) {
      throw new Error('Educator not found');
    }

    // Fetch subjects
    const edSubjects = await sqlClient`
      SELECT s.id, s.name, s.slug, s.icon_name, s.description
      FROM educator_subjects es
      JOIN subjects s ON s.id = es.subject_id
      WHERE es.educator_id = ${id}
    `;

    // Fetch available slots
    const slots = await db
      .select()
      .from(educatorAvailability)
      .where(and(eq(educatorAvailability.educatorId, id), eq(educatorAvailability.isBooked, false)))
      .orderBy(asc(educatorAvailability.date), asc(educatorAvailability.startTime));

    // Fetch reviews with student details
    const educatorReviews = await sqlClient`
      SELECT r.id, r.rating, r.comment, r.created_at, u.name as student_name, u.avatar_url as student_avatar
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.educator_id = ${id}
      ORDER BY r.created_at DESC
      LIMIT 10
    `;

    return {
      ...educator,
      subjects: edSubjects.map((s: any) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        iconName: s.icon_name,
        description: s.description,
      })),
      availableSlots: slots.map((s) => ({
        id: s.id,
        educatorId: s.educatorId,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        isBooked: s.isBooked,
      })),
      reviews: educatorReviews.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        studentName: r.student_name,
        studentAvatar: r.student_avatar,
        createdAt: r.created_at,
      })),
    };
  }

  async getSubjects() {
    const allSubjects = await db.select().from(subjects);

    // Count educators per subject
    const counts = await sqlClient`
      SELECT subject_id, count(educator_id) as educator_count
      FROM educator_subjects
      GROUP BY subject_id
    `;

    const countMap = new Map(counts.map((c: any) => [c.subject_id, Number(c.educator_count)]));

    return allSubjects.map((s) => ({
      ...s,
      educatorCount: countMap.get(s.id) || 0,
    }));
  }

  async getEducatorSlots(educatorId: string, date?: string) {
    const conditions = [
      eq(educatorAvailability.educatorId, educatorId),
      eq(educatorAvailability.isBooked, false),
    ];

    if (date) {
      conditions.push(eq(educatorAvailability.date, date));
    }

    return await db
      .select()
      .from(educatorAvailability)
      .where(and(...conditions))
      .orderBy(asc(educatorAvailability.date), asc(educatorAvailability.startTime));
  }
}

export const educatorsService = new EducatorsService();
