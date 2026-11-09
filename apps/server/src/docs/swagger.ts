import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerJsdoc from 'swagger-jsdoc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Expert Learning & Consultation Platform API',
      version: '1.0.0',
      description:
        'Production REST API for AstroTalk-inspired Expert Consultation Platform. Connect students with top verified educators for 1-on-1 consultations, instant bookings, wallet transactions, and interactive chat.',
      contact: {
        name: 'Technical Assignment Demo',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Local Development Server',
      },
    ],
    tags: [
      { name: 'Health', description: 'System health check and operational status' },
      {
        name: 'Auth',
        description: 'User registration, login, JWT authentication, and session management',
      },
      { name: 'Subjects', description: 'Academic subjects and consultation categories' },
      {
        name: 'Educators',
        description: 'Educator directory, search, filtering, and availability slots',
      },
      {
        name: 'Bookings',
        description: 'Consultation scheduling, booking details, and cancellations',
      },
      {
        name: 'Wallet',
        description: 'User balance management, simulated recharge, and transaction history',
      },
      { name: 'Chat', description: '1-on-1 consultation chat rooms and messaging' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT bearer token received from /api/auth/login or /api/auth/register',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
            name: { type: 'string', example: 'Demo Student' },
            email: { type: 'string', format: 'email', example: 'student@demo.com' },
            role: { type: 'string', enum: ['student', 'educator', 'admin'], example: 'student' },
            avatarUrl: {
              type: 'string',
              nullable: true,
              example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
            },
            phoneNumber: { type: 'string', nullable: true, example: '+91 9876543210' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            expiresIn: { type: 'string', example: '7d' },
          },
        },
        Subject: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174001' },
            name: { type: 'string', example: 'Mathematics' },
            slug: { type: 'string', example: 'mathematics' },
            iconName: { type: 'string', example: 'Calculator' },
            description: { type: 'string', example: 'Calculus, Algebra, and Linear Algebra' },
            educatorCount: { type: 'integer', example: 12 },
          },
        },
        TimeSlot: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174002' },
            educatorId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174003',
            },
            date: { type: 'string', example: '2026-11-06' },
            startTime: { type: 'string', example: '14:00' },
            endTime: { type: 'string', example: '15:00' },
            isBooked: { type: 'boolean', example: false },
          },
        },
        Review: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            studentName: { type: 'string', example: 'Aarav Sharma' },
            studentAvatar: { type: 'string', nullable: true },
            rating: { type: 'number', example: 5 },
            comment: {
              type: 'string',
              example: 'Exceptional teaching style! Solved all doubts with clear intuition.',
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Educator: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174003' },
            userId: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Dr. Ananya Sharma' },
            title: { type: 'string', example: 'Senior AI & ML Researcher, IIT Bombay' },
            bio: {
              type: 'string',
              example:
                'Specialist in Deep Learning, PyTorch, and NLP with 8+ years teaching experience.',
            },
            avatarUrl: {
              type: 'string',
              example: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
            },
            rating: { type: 'number', example: 4.95 },
            reviewCount: { type: 'integer', example: 128 },
            experienceYears: { type: 'integer', example: 8 },
            hourlyRate: { type: 'integer', example: 600 },
            isOnline: { type: 'boolean', example: true },
            isVerified: { type: 'boolean', example: true },
            education: { type: 'string', example: 'Ph.D. Computer Science, IIT Bombay' },
            languages: { type: 'array', items: { type: 'string' }, example: ['English', 'Hindi'] },
            subjects: {
              type: 'array',
              items: { $ref: '#/components/schemas/Subject' },
            },
            availableSlots: {
              type: 'array',
              items: { $ref: '#/components/schemas/TimeSlot' },
            },
            reviews: {
              type: 'array',
              items: { $ref: '#/components/schemas/Review' },
            },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174004' },
            userId: { type: 'string', format: 'uuid' },
            educatorId: { type: 'string', format: 'uuid' },
            slotId: { type: 'string', format: 'uuid' },
            date: { type: 'string', example: '2026-11-06' },
            startTime: { type: 'string', example: '14:00' },
            endTime: { type: 'string', example: '15:00' },
            amount: { type: 'integer', example: 600 },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'completed', 'cancelled'],
              example: 'confirmed',
            },
            notes: {
              type: 'string',
              nullable: true,
              example: 'Need assistance with dynamic programming',
            },
            educatorName: { type: 'string', example: 'Dr. Ananya Sharma' },
            educatorAvatar: {
              type: 'string',
              example: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
            },
            educatorTitle: { type: 'string', example: 'Senior AI & ML Researcher' },
            studentName: { type: 'string', example: 'Demo Student' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Wallet: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174005' },
            userId: { type: 'string', format: 'uuid' },
            balance: { type: 'integer', example: 1500 },
            currency: { type: 'string', example: 'INR' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        WalletTransaction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174006' },
            walletId: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            amount: { type: 'integer', example: 500 },
            type: {
              type: 'string',
              enum: ['recharge', 'consultation_payment', 'refund'],
              example: 'recharge',
            },
            status: {
              type: 'string',
              enum: ['pending', 'success', 'failed'],
              example: 'success',
            },
            description: { type: 'string', example: 'Wallet recharge via UPI' },
            referenceId: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ChatRoom: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174007' },
            educatorId: { type: 'string', format: 'uuid' },
            educatorName: { type: 'string', example: 'Dr. Ananya Sharma' },
            educatorAvatar: {
              type: 'string',
              example: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
            },
            isOnline: { type: 'boolean', example: true },
            userId: { type: 'string', format: 'uuid' },
            userName: { type: 'string', example: 'Demo Student' },
            lastMessage: {
              type: 'string',
              nullable: true,
              example: 'See you in the consultation session!',
            },
            lastMessageAt: { type: 'string', nullable: true, format: 'date-time' },
            unreadCount: { type: 'integer', example: 0 },
          },
        },
        ChatMessage: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174008' },
            chatId: { type: 'string', format: 'uuid' },
            senderId: { type: 'string', format: 'uuid' },
            senderName: { type: 'string', example: 'Demo Student' },
            senderRole: { type: 'string', enum: ['student', 'educator'], example: 'student' },
            content: {
              type: 'string',
              example: 'Hello, I have a question regarding graph theory.',
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Detailed error explanation' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    path.join(__dirname, '../modules/**/*.routes.ts'),
    path.join(__dirname, '../modules/**/*.routes.js'),
    path.join(__dirname, '../app.ts'),
    path.join(__dirname, '../app.js'),
    './src/modules/**/*.routes.ts',
    './src/app.ts',
    './apps/server/src/modules/**/*.routes.ts',
    './apps/server/src/app.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
