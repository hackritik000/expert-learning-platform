import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from './db';
import {
  bookings,
  chats,
  educatorAvailability,
  educatorSubjects,
  educators,
  messages,
  reviews,
  subjects,
  users,
  wallets,
  walletTransactions,
} from './schema';

export async function seedDatabase() {
  // Clear existing data in reverse dependency order
  await db.execute(
    'TRUNCATE TABLE messages, chats, reviews, bookings, wallet_transactions, wallets, educator_availability, educator_subjects, educators, subjects, users CASCADE;',
  );

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create Demo Users
  const [demoStudent] = await db
    .insert(users)
    .values({
      name: 'Rohan Sharma',
      email: 'student@demo.com',
      password: hashedPassword,
      role: 'student',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      phoneNumber: '+919876543210',
    })
    .returning();

  const [demoEducatorUser] = await db
    .insert(users)
    .values({
      name: 'Dr. Ananya Verma',
      email: 'ananya@expert.com',
      password: hashedPassword,
      role: 'educator',
      avatarUrl:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      phoneNumber: '+919876543211',
    })
    .returning();

  // Initialize Demo Student Wallet with ₹1,500 initial balance
  const [studentWallet] = await db
    .insert(wallets)
    .values({
      userId: demoStudent.id,
      balance: 1500,
      currency: 'INR',
    })
    .returning();

  // Add initial recharge transaction for demo student
  await db.insert(walletTransactions).values({
    walletId: studentWallet.id,
    userId: demoStudent.id,
    amount: 1500,
    type: 'recharge',
    status: 'success',
    description: 'Welcome Bonus & Wallet Recharge via UPI',
    referenceId: 'UPI-TXN-8392104',
  });

  // 2. Create 7 Subject Categories
  const createdSubjects = await db
    .insert(subjects)
    .values([
      {
        name: 'Mathematics',
        slug: 'mathematics',
        iconName: 'Calculator',
        description: 'Calculus, Algebra, Statistics, and Competitive Exam Math',
      },
      {
        name: 'Computer Science',
        slug: 'computer-science',
        iconName: 'Code',
        description: 'Data Structures, Algorithms, Web Development, and AI',
      },
      {
        name: 'Physics',
        slug: 'physics',
        iconName: 'Atom',
        description: 'Mechanics, Quantum Physics, Electrodynamics & IIT-JEE',
      },
      {
        name: 'English & Communication',
        slug: 'english-communication',
        iconName: 'MessageSquare',
        description: 'IELTS, TOEFL, Spoken English, and Professional Writing',
      },
      {
        name: 'Business & Finance',
        slug: 'business-finance',
        iconName: 'TrendingUp',
        description: 'Stock Markets, Corporate Finance, Accounting & Economics',
      },
      {
        name: 'Chemistry',
        slug: 'chemistry',
        iconName: 'FlaskConical',
        description: 'Organic, Inorganic, Physical Chemistry for NEET & Board exams',
      },
      {
        name: 'UI/UX Design',
        slug: 'ui-ux-design',
        iconName: 'Palette',
        description: 'Figma, Product Design, Design Systems, and Portfolio Building',
      },
    ])
    .returning();

  const subjectMap = new Map(createdSubjects.map((s) => [s.slug, s.id]));

  // 3. Create 10 Realistic Educators
  const educatorDataList = [
    {
      name: 'Dr. Ananya Verma',
      email: 'ananya@expert.com',
      userId: demoEducatorUser.id,
      title: 'Ph.D. in Computer Science | Ex-Google Senior Staff',
      bio: 'Over 12 years of industry and academic mentorship. Specializing in advanced Data Structures, System Design, and preparing engineers for top tech tier interviews.',
      avatarUrl:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      rating: 4.95,
      reviewCount: 142,
      experienceYears: 12,
      hourlyRate: 600,
      isOnline: true,
      isVerified: true,
      education: 'Ph.D. in CS from IIT Delhi, B.Tech from BITS Pilani',
      languages: ['English', 'Hindi'],
      subjectSlugs: ['computer-science'],
    },
    {
      name: 'Prof. Rajesh Kulkarni',
      email: 'rajesh@expert.com',
      title: 'IIT Bombay Gold Medalist | Math Wizard',
      bio: 'Passionate about demystifying advanced Calculus, Probability, and Linear Algebra for competitive exams like JEE Advanced, GATE, and Olympiads.',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      rating: 4.88,
      reviewCount: 98,
      experienceYears: 15,
      hourlyRate: 450,
      isOnline: true,
      isVerified: true,
      education: 'M.Sc. Mathematics, IIT Bombay',
      languages: ['English', 'Hindi', 'Marathi'],
      subjectSlugs: ['mathematics'],
    },
    {
      name: 'Dr. Priya Sundaram',
      email: 'priya@expert.com',
      title: 'Astrophysics Researcher & IIT-JEE Physics Mentor',
      bio: 'Making physics intuitive through real-world analogies and problem solving. Mentored over 500+ students into top medical and engineering colleges.',
      avatarUrl:
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
      rating: 4.92,
      reviewCount: 110,
      experienceYears: 9,
      hourlyRate: 500,
      isOnline: true,
      isVerified: true,
      education: 'Ph.D. in Physics from IISc Bangalore',
      languages: ['English', 'Tamil', 'Hindi'],
      subjectSlugs: ['physics'],
    },
    {
      name: 'Arjun Mehta',
      email: 'arjun@expert.com',
      title: 'CFA Charterholder | Financial Markets Consultant',
      bio: 'Learn equity research, personal wealth building, and financial modeling with a seasoned investment banking strategist.',
      avatarUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      rating: 4.85,
      reviewCount: 76,
      experienceYears: 8,
      hourlyRate: 700,
      isOnline: false,
      isVerified: true,
      education: 'MBA in Finance from IIM Ahmedabad, CFA',
      languages: ['English', 'Gujarati', 'Hindi'],
      subjectSlugs: ['business-finance'],
    },
    {
      name: 'Sarah Jenkins',
      email: 'sarah@expert.com',
      title: 'Certified IELTS Trainer & Corporate Communications Coach',
      bio: 'British Council certified trainer helping aspirants achieve 8.0+ Band in IELTS and executive-level corporate communication fluency.',
      avatarUrl:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      rating: 4.97,
      reviewCount: 164,
      experienceYears: 10,
      hourlyRate: 550,
      isOnline: true,
      isVerified: true,
      education: 'M.A. English Literature, Cambridge University',
      languages: ['English'],
      subjectSlugs: ['english-communication'],
    },
    {
      name: 'Vikram Sengupta',
      email: 'vikram@expert.com',
      title: 'Lead Product Designer at Fintech Unicorn',
      bio: 'Hands-on mentor for UX research, interface architecture, design thinking, and building standout portfolios that land international design roles.',
      avatarUrl:
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
      rating: 4.91,
      reviewCount: 65,
      experienceYears: 7,
      hourlyRate: 650,
      isOnline: true,
      isVerified: true,
      education: 'B.Des from National Institute of Design (NID)',
      languages: ['English', 'Hindi', 'Bengali'],
      subjectSlugs: ['ui-ux-design'],
    },
    {
      name: 'Dr. Meenakshi Iyer',
      email: 'meenakshi@expert.com',
      title: 'Senior Chemistry Faculty & NEET Specialist',
      bio: 'Simplified Organic Mechanisms and physical chemistry numericals. 14+ years producing top 100 ranks across national entrance exams.',
      avatarUrl:
        'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80',
      rating: 4.79,
      reviewCount: 89,
      experienceYears: 14,
      hourlyRate: 400,
      isOnline: false,
      isVerified: true,
      education: 'Ph.D. Organic Chemistry from University of Hyderabad',
      languages: ['English', 'Hindi', 'Telugu'],
      subjectSlugs: ['chemistry'],
    },
    {
      name: 'Kavita Chawla',
      email: 'kavita@expert.com',
      title: 'Full Stack Architect & Cloud Specialist',
      bio: 'React Native, Node.js, and AWS Architect. I help students and early career developers build real-world production mobile and web platforms.',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      rating: 4.86,
      reviewCount: 52,
      experienceYears: 6,
      hourlyRate: 450,
      isOnline: true,
      isVerified: false,
      education: 'B.Tech CS, DTU Delhi',
      languages: ['English', 'Hindi', 'Punjabi'],
      subjectSlugs: ['computer-science'],
    },
    {
      name: 'Harish Nambiar',
      email: 'harish@expert.com',
      title: 'Quantitative Aptitude & Logic Trainer for CAT / GMAT',
      bio: '100%iler in CAT QA. Specializing in mental math tricks, speed techniques, and cracking difficult puzzles in seconds.',
      avatarUrl:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
      rating: 4.82,
      reviewCount: 74,
      experienceYears: 11,
      hourlyRate: 500,
      isOnline: false,
      isVerified: true,
      education: 'M.Sc. Statistics, University of Delhi',
      languages: ['English', 'Malayalam', 'Hindi'],
      subjectSlugs: ['mathematics'],
    },
    {
      name: 'Tanvi Saxena',
      email: 'tanvi@expert.com',
      title: 'Brand Strategist & Creative Director',
      bio: 'Consulting on brand identity, visual storytelling, and human-centered design for digital startups and modern consumer brands.',
      avatarUrl:
        'https://images.unsplash.com/photo-1548142813-c348350df52b?w=400&auto=format&fit=crop&q=80',
      rating: 4.93,
      reviewCount: 43,
      experienceYears: 9,
      hourlyRate: 550,
      isOnline: true,
      isVerified: true,
      education: 'Master of Design from IDC, IIT Bombay',
      languages: ['English', 'Hindi'],
      subjectSlugs: ['ui-ux-design'],
    },
  ];

  for (const item of educatorDataList) {
    const [educatorUser] = item.userId
      ? [{ id: item.userId }]
      : await db
          .insert(users)
          .values({
            name: item.name,
            email: item.email,
            password: hashedPassword,
            role: 'educator',
            avatarUrl: item.avatarUrl,
            phoneNumber: null,
          })
          .returning();
    const [ed] = await db
      .insert(educators)
      .values({
        userId: item.userId || educatorUser.id,
        name: item.name,
        title: item.title,
        bio: item.bio,
        avatarUrl: item.avatarUrl,
        rating: item.rating,
        reviewCount: item.reviewCount,
        experienceYears: item.experienceYears,
        hourlyRate: item.hourlyRate,
        isOnline: item.isOnline,
        isVerified: item.isVerified,
        education: item.education,
        languages: item.languages,
      })
      .returning();

    // Map subjects
    for (const slug of item.subjectSlugs) {
      const subjectId = subjectMap.get(slug);
      if (subjectId) {
        await db.insert(educatorSubjects).values({
          educatorId: ed.id,
          subjectId,
        });
      }
    }

    // Add 4 Time Slots for each educator (upcoming days)
    const dates = ['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13'];
    const times = [
      { start: '10:00 AM', end: '11:00 AM' },
      { start: '02:00 PM', end: '03:00 PM' },
      { start: '04:30 PM', end: '05:30 PM' },
      { start: '07:00 PM', end: '08:00 PM' },
    ];

    for (let i = 0; i < dates.length; i++) {
      await db.insert(educatorAvailability).values({
        educatorId: ed.id,
        date: dates[i],
        startTime: times[i].start,
        endTime: times[i].end,
        isBooked: false,
      });
    }

    // Add 2 reviews per educator
    await db.insert(reviews).values([
      {
        educatorId: ed.id,
        userId: demoStudent.id,
        rating: 5,
        comment: `Excellent session! ${ed.name} explained difficult concepts in the simplest way possible. Highly recommend!`,
      },
      // {
      //   educatorId: ed.id,
      //   userId: demoStudent.id,
      //   rating: 5,
      //   comment: 'Very patient and punctual. Solved all my doubts and provided practical guidance.',
      // },
    ]);
  }

  // 4. Create a Sample Chat with Dr. Ananya Verma
  const [firstEducator] = await db.select().from(educators).limit(1);
  const [chatRoom] = await db
    .insert(chats)
    .values({
      educatorId: firstEducator.id,
      userId: demoStudent.id,
    })
    .returning();

  await db.insert(messages).values([
    {
      chatId: chatRoom.id,
      senderId: demoStudent.id,
      senderRole: 'student',
      content: 'Hello Dr. Ananya! I wanted to consult you regarding system design preparation.',
    },
    {
      chatId: chatRoom.id,
      senderId: demoEducatorUser.id,
      senderRole: 'educator',
      content:
        'Hi Rohan! Delighted to connect. Please book an available slot on my profile and we will do a deep-dive mock consultation!',
    },
  ]);

  // 5. Create a Sample Confirmed Booking
  const [sampleSlot] = await db
    .select()
    .from(educatorAvailability)
    .where(eq(educatorAvailability.isBooked, false))
    .limit(1);

  if (sampleSlot) {
    await db
      .update(educatorAvailability)
      .set({ isBooked: true })
      .where(eq(educatorAvailability.id, sampleSlot.id));

    const [sampleBooking] = await db
      .insert(bookings)
      .values({
        userId: demoStudent.id,
        educatorId: firstEducator.id,
        slotId: sampleSlot.id,
        date: sampleSlot.date,
        startTime: sampleSlot.startTime,
        endTime: sampleSlot.endTime,
        amount: firstEducator.hourlyRate,
        status: 'confirmed',
        notes: 'Discussion on distributed caching and microservices architecture.',
      })
      .returning();

    // Record wallet deduction transaction for this booking
    await db.insert(walletTransactions).values({
      walletId: studentWallet.id,
      userId: demoStudent.id,
      amount: -firstEducator.hourlyRate,
      type: 'consultation_payment',
      status: 'success',
      description: `Consultation Booking with ${firstEducator.name}`,
      referenceId: sampleBooking.id,
    });
  }

  console.log(
    '✅ Database seeded with 10 educators, 7 subjects, slots, reviews, wallet transactions, and chat!',
  );
}

if (import.meta.main) {
  seedDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed script error:', err);
      process.exit(1);
    });
}
