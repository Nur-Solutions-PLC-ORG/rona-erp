export const jwtConstants = {
  get secret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET environment variable is required in production');
      }
      return 'dev_jwt_secret_key_change_in_production';
    }
    return secret;
  },
};

