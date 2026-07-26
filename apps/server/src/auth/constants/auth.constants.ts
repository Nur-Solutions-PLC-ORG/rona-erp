const is_prod = process.env.NODE_ENV === 'production';
const secret = process.env.JWT_SECRET;
if (is_prod && !secret) {
  throw new Error('JWT_SECRET is not configured');
}
export const JWT_SECRET = secret || '';
