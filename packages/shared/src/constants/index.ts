export const RECHARGE_PRESETS = [100, 250, 500, 1000, 2000];

export const DEFAULT_PAGE_SIZE = 10;

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
    LOGOUT: '/api/auth/logout',
  },
  EDUCATORS: {
    LIST: '/api/educators',
    DETAIL: (id: string) => `/api/educators/${id}`,
    SLOTS: (id: string) => `/api/educators/${id}/slots`,
  },
  SUBJECTS: {
    LIST: '/api/subjects',
  },
  BOOKINGS: {
    LIST: '/api/bookings',
    DETAIL: (id: string) => `/api/bookings/${id}`,
    CREATE: '/api/bookings',
    CANCEL: (id: string) => `/api/bookings/${id}/cancel`,
  },
  WALLET: {
    GET: '/api/wallet',
    RECHARGE: '/api/wallet/recharge',
    TRANSACTIONS: '/api/wallet/transactions',
  },
  CHAT: {
    ROOMS: '/api/chats',
    MESSAGES: (id: string) => `/api/chats/${id}/messages`,
  },
} as const;
