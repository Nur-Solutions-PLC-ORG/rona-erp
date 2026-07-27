export const DEFAULT_PORT = 8502;

export const DEFAULT_API_URL = `http://localhost:${DEFAULT_PORT}`;

export const serverConfig = {
  port: 8502,
  apiUrl: process.env.NODE_ENV === 'production'
    ? '/api'
    : DEFAULT_API_URL,
  auth: {
    cookieName: 'rona_session',
    cookieMaxAge: 7 * 24 * 60 * 60 * 1000,
    csrfMaxAge: 60 * 60 * 1000,
  },
};
