export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  frontendUrl: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173',
  cashfreeAppId: import.meta.env.VITE_CASHFREE_APP_ID || '',
  cashfreeMode: import.meta.env.VITE_CASHFREE_MODE || 'SANDBOX',
};

