export const RECHARGE_PRESETS = [100, 250, 500, 1000, 2000];

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
    UPDATE_PROFILE: '/api/auth/profile',
    LOGOUT: '/api/auth/logout',
  },
  EDUCATORS: {
    LIST: '/api/educators',
    ME: '/api/educators/me',
    DETAIL: (id: string) => `/api/educators/${id}`,
    SLOTS: (id: string) => `/api/educators/${id}/slots`,
    MY_SLOTS: '/api/educators/slots/manage',
    CREATE_SLOT: '/api/educators/slots/manage',
    BATCH_CREATE_SLOTS: '/api/educators/slots/manage/batch',
    UPDATE_SLOT: (slotId: string) => `/api/educators/slots/manage/${slotId}`,
    DELETE_SLOT: (slotId: string) => `/api/educators/slots/manage/${slotId}`,
    CREATE: '/api/educators/create',
    UPDATE: (id: string) => `/api/educators/update/${id}`,
  },
  SUBJECTS: {
    LIST: '/api/subjects',
  },
  BOOKINGS: {
    LIST: '/api/bookings',
    DETAIL: (id: string) => `/api/bookings/${id}`,
    CREATE: '/api/bookings',
    CANCEL: (id: string) => `/api/bookings/${id}/cancel`,
    COMPLETE: (id: string) => `/api/bookings/${id}/complete`,
    EDUCATOR_EARNINGS: '/api/bookings/educator/earnings',
  },
  WALLET: {
    GET: '/api/wallet',
    RECHARGE: '/api/wallet/recharge',
    WITHDRAW: '/api/wallet/withdraw',
    TRANSACTIONS: '/api/wallet/transactions',
  },
  CHAT: {
    ROOMS: '/api/chats',
    ROOM: (id: string) => `/api/chats/${id}`,
    BY_EDUCATOR: (educatorId: string) => `/api/chats/educator/${educatorId}`,
    MESSAGES: (id: string) => `/api/chats/${id}/messages`,
  },
} as const;
