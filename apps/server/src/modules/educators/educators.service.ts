import { parseSlotDateTime } from '@repo/shared';
import type {
  BatchCreateSlotsInput,
  CreateSlotInput,
  EducatorFilterInput,
  RegisterEducatorProfileFormData,
  UpdateEducatorProfileFormData,
  UpdateSlotInput,
} from '@repo/validation';
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, ne, or } from 'drizzle-orm';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { ENV } from '../../config/env';
import { db } from '../../database/db';
import {
  bookings,
  educatorAvailability,
  educatorSubjects,
  educators,
  reviews,
  subjects,
  users,
} from '../../database/schema';

export class EducatorsService {
  async getEducators(filters: EducatorFilterInput) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;

      conditions.push(
        or(
          ilike(educators.name, searchTerm),
          ilike(educators.title, searchTerm),
          ilike(educators.bio, searchTerm),
        )!,
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
      const matchingEducators = db
        .select({ educatorId: educatorSubjects.educatorId })
        .from(educatorSubjects)
        .where(eq(educatorSubjects.subjectId, filters.subjectId));

      conditions.push(inArray(educators.id, matchingEducators));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    // Sorting
    const orderClause =
      filters.sortBy === 'price_asc'
        ? asc(educators.hourlyRate)
        : filters.sortBy === 'price_desc'
          ? desc(educators.hourlyRate)
          : filters.sortBy === 'experience'
            ? desc(educators.experienceYears)
            : desc(educators.rating);

    // Fetch educators and total count in parallel
    const [result, [countResult]] = await Promise.all([
      db
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
        .offset(offset),

      db.select({ count: count() }).from(educators).where(whereClause),
    ]);

    const total = countResult?.count ?? 0;

    // Fetch subjects for all educators in one query
    const educatorIds = result.map((educator) => educator.id);

    const edSubjects =
      educatorIds.length > 0
        ? await db
            .select({
              educatorId: educatorSubjects.educatorId,
              id: subjects.id,
              name: subjects.name,
              slug: subjects.slug,
              iconName: subjects.iconName,
              description: subjects.description,
            })
            .from(educatorSubjects)
            .innerJoin(subjects, eq(educatorSubjects.subjectId, subjects.id))
            .where(inArray(educatorSubjects.educatorId, educatorIds))
        : [];

    // Group subjects by educator
    const subjectsMap = new Map<string, (typeof edSubjects)[number][]>();

    for (const subject of edSubjects) {
      const existing = subjectsMap.get(subject.educatorId) ?? [];
      existing.push(subject);
      subjectsMap.set(subject.educatorId, existing);
    }

    const educatorsWithSubjects = result.map((educator) => ({
      ...educator,
      subjects: (subjectsMap.get(educator.id) ?? []).map(
        ({ educatorId: _educatorId, ...subject }) => subject,
      ),
    }));

    console.log('educatorsWithSubjects', educatorsWithSubjects);
    return {
      educators: educatorsWithSubjects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getEducatorById(id: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      throw new Error('Educator not found');
    }

    const [educator] = await db.select().from(educators).where(eq(educators.id, id));

    if (!educator) {
      throw new Error('Educator not found');
    }

    // Fetch subjects, slots and reviews in parallel
    const [edSubjects, slots, educatorReviews] = await Promise.all([
      db
        .select({
          id: subjects.id,
          name: subjects.name,
          slug: subjects.slug,
          iconName: subjects.iconName,
          description: subjects.description,
        })
        .from(educatorSubjects)
        .innerJoin(subjects, eq(educatorSubjects.subjectId, subjects.id))
        .where(eq(educatorSubjects.educatorId, id)),

      db
        .select()
        .from(educatorAvailability)
        .where(
          and(eq(educatorAvailability.educatorId, id), eq(educatorAvailability.isBooked, false)),
        )
        .orderBy(asc(educatorAvailability.date), asc(educatorAvailability.startTime)),

      db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          comment: reviews.comment,
          createdAt: reviews.createdAt,
          studentName: users.name,
          studentAvatar: users.avatarUrl,
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.userId, users.id))
        .where(eq(reviews.educatorId, id))
        .orderBy(desc(reviews.createdAt))
        .limit(10),
    ]);

    return {
      ...educator,
      subjects: edSubjects,
      availableSlots: slots.map((slot) => ({
        id: slot.id,
        educatorId: slot.educatorId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: slot.isBooked,
      })),
      reviews: educatorReviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        studentName: review.studentName,
        studentAvatar: review.studentAvatar,
        createdAt: review.createdAt,
      })),
    };
  }

  async getSubjects() {
    const allSubjects = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        slug: subjects.slug,
        iconName: subjects.iconName,
        description: subjects.description,
        createdAt: subjects.createdAt,
        educatorCount: count(educatorSubjects.educatorId),
      })
      .from(subjects)
      .leftJoin(educatorSubjects, eq(subjects.id, educatorSubjects.subjectId))
      .groupBy(subjects.id)
      .orderBy(asc(subjects.name));

    return allSubjects;
  }

  async getEducatorSlots(educatorId: string, date?: string) {
    const conditions = [
      eq(educatorAvailability.educatorId, educatorId),
      eq(educatorAvailability.isBooked, false),
    ];

    if (date) {
      conditions.push(eq(educatorAvailability.date, date));
    }

    return db
      .select()
      .from(educatorAvailability)
      .where(and(...conditions))
      .orderBy(asc(educatorAvailability.date), asc(educatorAvailability.startTime));
  }

  async resolveSubjectIds(subjectsInput: string[]): Promise<string[]> {
    if (!subjectsInput || subjectsInput.length === 0) {
      return [];
    }

    const allDbSubjects = await db.select().from(subjects);
    const resolvedIds = new Set<string>();

    for (const input of subjectsInput) {
      const trimmed = input.trim();
      const match = allDbSubjects.find(
        (s) =>
          s.id.toLowerCase() === trimmed.toLowerCase() ||
          s.slug.toLowerCase() === trimmed.toLowerCase() ||
          s.name.toLowerCase() === trimmed.toLowerCase(),
      );

      if (match) {
        resolvedIds.add(match.id);
      } else {
        throw new Error(
          `Subject not found: "${trimmed}". Please provide a valid subject ID, slug, or name.`,
        );
      }
    }

    return Array.from(resolvedIds);
  }

  async registerEducatorProfile(userId: string, data: RegisterEducatorProfileFormData) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    const existingEducator = await db.query.educators.findFirst({
      where: eq(educators.userId, userId),
    });

    if (existingEducator) {
      throw new Error('User is already registered as an educator');
    }

    const subjectList = data.subjects || data.subjectIds || [];
    const resolvedSubjectIds = await this.resolveSubjectIds(subjectList);
    if (resolvedSubjectIds.length === 0) {
      throw new Error('At least one valid subject is required');
    }

    const experienceYears = data.experienceYears ?? data.experience ?? 1;
    const hourlyRate = data.hourlyRate ?? data.ratePerSession ?? data.rate ?? 500;
    const education = data.education || 'Professional Educator';
    const languages = data.languages && data.languages.length > 0 ? data.languages : ['English'];
    const avatarUrl =
      data.avatarUrl ||
      user.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

    return await db.transaction(async (tx) => {
      // 1. Promote user role to educator
      await tx
        .update(users)
        .set({
          role: 'educator',
          avatarUrl: user.avatarUrl || avatarUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // 2. Insert educator profile
      const [newEducator] = await tx
        .insert(educators)
        .values({
          userId: user.id,
          name: user.name,
          title: data.title,
          bio: data.bio,
          avatarUrl,
          experienceYears,
          hourlyRate,
          education,
          languages,
          rating: 5.0,
          reviewCount: 0,
          isOnline: false,
          isVerified: true,
        })
        .returning();

      // 3. Link subjects
      for (const subjectId of resolvedSubjectIds) {
        await tx.insert(educatorSubjects).values({
          educatorId: newEducator.id,
          subjectId,
        });
      }

      // 4. Fetch full educator details with subjects
      const fullEducator = await this.getEducatorById(newEducator.id);

      // Generate updated JWT token with educator role

      const options: SignOptions = {
        expiresIn: ENV.JWT_EXPIRES_IN as SignOptions['expiresIn'],
      };

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: 'educator',
        },
        ENV.JWT_SECRET,
        options,
      );

      return {
        educator: fullEducator,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'educator',
          avatarUrl: user.avatarUrl || avatarUrl,
          phoneNumber: user.phoneNumber,
          createdAt: user.createdAt.toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token,
      };
    });
  }

  async ensureEducatorRecord(userId: string) {
    const [educator] = await db.select().from(educators).where(eq(educators.userId, userId));
    if (educator) {
      return educator;
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      throw new Error('User not found');
    }

    const defaultSubjects = await db.select().from(subjects).limit(1);
    const [newEducator] = await db
      .insert(educators)
      .values({
        userId: user.id,
        name: user.name,
        title: 'Professional Educator',
        bio: 'Passionate educator dedicated to student success and interactive learning.',
        avatarUrl:
          user.avatarUrl ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        experienceYears: 1,
        hourlyRate: 500,
        education: 'Professional Educator',
        languages: ['English'],
        rating: 5.0,
        reviewCount: 0,
        isOnline: false,
        isVerified: true,
      })
      .returning();

    if (defaultSubjects.length > 0) {
      await db
        .insert(educatorSubjects)
        .values({
          educatorId: newEducator.id,
          subjectId: defaultSubjects[0].id,
        })
        .onConflictDoNothing();
    }

    return newEducator;
  }

  async getMyEducatorProfile(userId: string) {
    let [educator] = await db.select().from(educators).where(eq(educators.userId, userId));

    if (!educator) {
      educator = await this.ensureEducatorRecord(userId);
    }

    return this.getEducatorById(educator.id);
  }

  async updateEducatorProfile(userId: string, data: UpdateEducatorProfileFormData) {
    console.log('data', data, userId);
    let [educator] = await db.select().from(educators).where(eq(educators.userId, userId));

    if (!educator) {
      educator = await this.ensureEducatorRecord(userId);
    }

    const experienceYears = data.experienceYears ?? data.experience;
    const hourlyRate = data.hourlyRate ?? data.ratePerSession ?? data.rate;

    const updateValues: Partial<typeof educators.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined && data.name.trim() !== '') {
      updateValues.name = data.name.trim();
    }
    if (data.title !== undefined) updateValues.title = data.title;
    if (data.bio !== undefined) updateValues.bio = data.bio;
    if (data.education !== undefined) updateValues.education = data.education;
    if (data.languages !== undefined) updateValues.languages = data.languages;
    if (data.avatarUrl !== undefined && data.avatarUrl !== '')
      updateValues.avatarUrl = data.avatarUrl;
    if (experienceYears !== undefined) updateValues.experienceYears = experienceYears;
    if (hourlyRate !== undefined) updateValues.hourlyRate = hourlyRate;
    if (data.isOnline !== undefined) updateValues.isOnline = data.isOnline;

    await db.transaction(async (tx) => {
      if (Object.keys(updateValues).length > 1) {
        await tx.update(educators).set(updateValues).where(eq(educators.id, educator.id));
      }

      const userUpdate: Partial<typeof users.$inferInsert> = {};
      if (data.name !== undefined && data.name.trim() !== '') {
        userUpdate.name = data.name.trim();
      }
      if (data.avatarUrl !== undefined && data.avatarUrl !== '') {
        userUpdate.avatarUrl = data.avatarUrl;
      }
      if (Object.keys(userUpdate).length > 0) {
        userUpdate.updatedAt = new Date();
        await tx.update(users).set(userUpdate).where(eq(users.id, userId));
      }

      const subjectList = data.subjects || data.subjectIds;
      if (subjectList && subjectList.length > 0) {
        const resolvedSubjectIds = await this.resolveSubjectIds(subjectList);
        // Replace subjects
        await tx.delete(educatorSubjects).where(eq(educatorSubjects.educatorId, educator.id));
        for (const subjectId of resolvedSubjectIds) {
          await tx.insert(educatorSubjects).values({
            educatorId: educator.id,
            subjectId,
          });
        }
      }
    });

    return this.getEducatorById(educator.id);
  }

  async getMySlots(userId: string) {
    let [educator] = await db.select().from(educators).where(eq(educators.userId, userId));
    if (!educator) {
      educator = await this.ensureEducatorRecord(userId);
    }

    const slots = await db
      .select({
        id: educatorAvailability.id,
        educatorId: educatorAvailability.educatorId,
        date: educatorAvailability.date,
        startTime: educatorAvailability.startTime,
        endTime: educatorAvailability.endTime,
        isBooked: educatorAvailability.isBooked,
        createdAt: educatorAvailability.createdAt,
        bookingId: bookings.id,
        bookingStatus: bookings.status,
        studentName: users.name,
      })
      .from(educatorAvailability)
      .leftJoin(
        bookings,
        and(eq(bookings.slotId, educatorAvailability.id), ne(bookings.status, 'cancelled')),
      )
      .leftJoin(users, eq(bookings.userId, users.id))
      .where(eq(educatorAvailability.educatorId, educator.id))
      .orderBy(asc(educatorAvailability.date), asc(educatorAvailability.startTime));

    return slots.map((s) => ({
      ...s,
      createdAt: s.createdAt?.toISOString(),
    }));
  }

  async createSlot(userId: string, data: CreateSlotInput) {
    let [educator] = await db.select().from(educators).where(eq(educators.userId, userId));
    if (!educator) {
      educator = await this.ensureEducatorRecord(userId);
    }

    const start = parseSlotDateTime(data.date, data.startTime);
    const end = parseSlotDateTime(data.date, data.endTime);
    if (!start || !end) {
      throw new Error('Invalid date or time format');
    }
    if (start >= end) {
      throw new Error('Start time must be before end time');
    }
    if (data.startTime >= data.endTime) {
      throw new Error('Start time must be less than end time');
    }

    // Check for existing slot with exact same time
    const [existing] = await db
      .select()
      .from(educatorAvailability)
      .where(
        and(
          eq(educatorAvailability.educatorId, educator.id),
          eq(educatorAvailability.date, data.date),
          eq(educatorAvailability.startTime, data.startTime),
          eq(educatorAvailability.endTime, data.endTime),
        ),
      );

    if (existing) {
      throw new Error('A slot for this date and time already exists');
    }

    const [newSlot] = await db
      .insert(educatorAvailability)
      .values({
        educatorId: educator.id,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        isBooked: false,
      })
      .returning();

    return newSlot;
  }

  async batchCreateSlots(userId: string, data: BatchCreateSlotsInput) {
    let [educator] = await db.select().from(educators).where(eq(educators.userId, userId));
    if (!educator) {
      educator = await this.ensureEducatorRecord(userId);
    }

    const results = [];
    for (const item of data.slots) {
      const start = parseSlotDateTime(item.date, item.startTime);
      const end = parseSlotDateTime(item.date, item.endTime);
      if (!start || !end || start >= end || item.startTime >= item.endTime) {
        continue;
      }

      const [existing] = await db
        .select()
        .from(educatorAvailability)
        .where(
          and(
            eq(educatorAvailability.educatorId, educator.id),
            eq(educatorAvailability.date, item.date),
            eq(educatorAvailability.startTime, item.startTime),
            eq(educatorAvailability.endTime, item.endTime),
          ),
        );

      if (!existing) {
        const [slot] = await db
          .insert(educatorAvailability)
          .values({
            educatorId: educator.id,
            date: item.date,
            startTime: item.startTime,
            endTime: item.endTime,
            isBooked: false,
          })
          .returning();
        results.push(slot);
      }
    }

    return results;
  }

  async updateSlot(userId: string, slotId: string, data: UpdateSlotInput) {
    let [educator] = await db.select().from(educators).where(eq(educators.userId, userId));
    if (!educator) {
      educator = await this.ensureEducatorRecord(userId);
    }

    const [slot] = await db
      .select()
      .from(educatorAvailability)
      .where(
        and(eq(educatorAvailability.id, slotId), eq(educatorAvailability.educatorId, educator.id)),
      );

    if (!slot) {
      throw new Error('Slot not found or you do not have permission to modify it');
    }

    if (slot.isBooked) {
      throw new Error('Cannot modify a time slot that has already been booked by a student');
    }

    const targetDate = data.date ?? slot.date;
    const targetStartTime = data.startTime ?? slot.startTime;
    const targetEndTime = data.endTime ?? slot.endTime;

    const start = parseSlotDateTime(targetDate, targetStartTime);
    const end = parseSlotDateTime(targetDate, targetEndTime);
    if (!start || !end) {
      throw new Error('Invalid date or time format');
    }
    if (start >= end) {
      throw new Error('Start time must be before end time');
    }
    if (targetStartTime >= targetEndTime) {
      throw new Error('Start time must be less than end time');
    }

    // Check duplicate
    const [existing] = await db
      .select()
      .from(educatorAvailability)
      .where(
        and(
          eq(educatorAvailability.educatorId, educator.id),
          eq(educatorAvailability.date, targetDate),
          eq(educatorAvailability.startTime, targetStartTime),
          eq(educatorAvailability.endTime, targetEndTime),
          ne(educatorAvailability.id, slot.id),
        ),
      );

    if (existing) {
      throw new Error('Another slot with this date and time already exists');
    }

    const [updated] = await db
      .update(educatorAvailability)
      .set({
        date: targetDate,
        startTime: targetStartTime,
        endTime: targetEndTime,
      })
      .where(eq(educatorAvailability.id, slot.id))
      .returning();

    return updated;
  }

  async deleteSlot(userId: string, slotId: string) {
    let [educator] = await db.select().from(educators).where(eq(educators.userId, userId));
    if (!educator) {
      educator = await this.ensureEducatorRecord(userId);
    }

    const [slot] = await db
      .select()
      .from(educatorAvailability)
      .where(
        and(eq(educatorAvailability.id, slotId), eq(educatorAvailability.educatorId, educator.id)),
      );

    if (!slot) {
      throw new Error('Slot not found or you do not have permission to delete it');
    }

    if (slot.isBooked) {
      throw new Error('Cannot delete a time slot that has already been booked by a student');
    }

    await db.delete(educatorAvailability).where(eq(educatorAvailability.id, slot.id));

    return { message: 'Slot deleted successfully' };
  }
}

export const educatorsService = new EducatorsService();
