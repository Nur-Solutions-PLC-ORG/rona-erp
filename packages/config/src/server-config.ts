export const DEFAULT_PORT = 8502;

export const serverConfig = {
  port: 8502,
  apiUrl: process.env.NODE_ENV === 'production'
    ? '/api'
    : 'http://localhost:8502/api',
};
