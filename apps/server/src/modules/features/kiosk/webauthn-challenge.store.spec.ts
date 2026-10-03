import { redisClient } from '@/redis';
import { WEB_AUTHN_CHALLENGE_TTL_SECONDS } from '@rona/config/webauthn';
import {
  WebAuthnChallengeStore,
  type WebAuthnChallenge,
} from './webauthn-challenge.store';

jest.mock('@/redis', () => ({
  redisClient: { set: jest.fn(), get: jest.fn(), del: jest.fn() },
  rateLimit: jest.fn(),
}));

const store = new WebAuthnChallengeStore();
const CHALLENGE = 'challenge-value';
const DATA: WebAuthnChallenge = {
  purpose: 'registration',
  organizationId: 'org-1',
  employeeId: 'employee-1',
};

describe('WebAuthnChallengeStore', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (redisClient.set as unknown as jest.Mock).mockResolvedValue('OK');
    (redisClient.get as unknown as jest.Mock).mockResolvedValue(DATA);
    (redisClient.del as unknown as jest.Mock).mockResolvedValue(1);
  });

  it('stores a challenge under a namespaced key with an expiring TTL', async () => {
    await store.issue(CHALLENGE, DATA);
    expect(redisClient.set).toHaveBeenCalledWith(
      `kiosk:webauthn:challenge:${CHALLENGE}`,
      DATA,
      { ex: WEB_AUTHN_CHALLENGE_TTL_SECONDS },
    );
  });

  it('returns and deletes a challenge on consume (single use)', async () => {
    await expect(store.consume(CHALLENGE)).resolves.toEqual(DATA);
    expect(redisClient.get).toHaveBeenCalledWith(
      `kiosk:webauthn:challenge:${CHALLENGE}`,
    );
    expect(redisClient.del).toHaveBeenCalledWith(
      `kiosk:webauthn:challenge:${CHALLENGE}`,
    );
  });

  it('returns null when the challenge has expired or is missing', async () => {
    (redisClient.get as unknown as jest.Mock).mockResolvedValue(null);
    await expect(store.consume(CHALLENGE)).resolves.toBeNull();
  });

  it('returns null when the challenge was already consumed', async () => {
    (redisClient.get as unknown as jest.Mock).mockResolvedValue(null);
    await store.consume(CHALLENGE);
    await expect(store.consume(CHALLENGE)).resolves.toBeNull();
  });
});
