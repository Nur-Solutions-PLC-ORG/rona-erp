import { OAuth2Client } from 'google-auth-library';
import { DEFAULT_API_URL } from '@rona/config/server';
import { API_AUTH_GOOGLE_CALLBACK_URL } from '@rona/routes/auth';

const getRedirectUri = () => {
  const apiUrl = process.env.API_URL || DEFAULT_API_URL;
  return `${apiUrl}${API_AUTH_GOOGLE_CALLBACK_URL}`;
};

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  getRedirectUri(),
);

export const getGoogleAuthUrl = (state?: string) => {
  return client.generateAuthUrl({
    access_type: 'offline',
    ...(state ? { state } : {}),
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'consent',
  });
};

export const getGoogleUserProfile = async (code: string) => {
  const requestClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri(),
  );

  const { tokens } = await requestClient.getToken(code);
  requestClient.setCredentials(tokens);

  const res = await requestClient.request({
    url: 'https://www.googleapis.com/oauth2/v2/userinfo',
  });

  return res.data as {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    locale: string;
  };
};
