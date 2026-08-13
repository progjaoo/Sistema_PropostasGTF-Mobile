import { apiCall } from '@/src/api/client';
import {
  PasswordResetValidationError,
  getResetToken,
  requestPasswordReset,
  resetPassword,
} from '../passwordReset';

jest.mock('@/src/api/client', () => ({
  apiCall: jest.fn(),
}));

const mockedApiCall = jest.mocked(apiCall);

describe('mobile password recovery client', () => {
  beforeEach(() => {
    mockedApiCall.mockReset();
  });

  it('normalizes the email and uses the public recovery endpoint', async () => {
    mockedApiCall.mockResolvedValue({ message: 'accepted' });

    await requestPasswordReset('  User@Example.COM ');

    expect(mockedApiCall).toHaveBeenCalledWith('POST', '/auth/forgot-password', {
      email: 'user@example.com',
    });
  });

  it('rejects invalid email without making a request', async () => {
    await expect(requestPasswordReset('invalid')).rejects.toBeInstanceOf(
      PasswordResetValidationError,
    );
    expect(mockedApiCall).not.toHaveBeenCalled();
  });

  it('extracts a plausible token from Expo Router params', () => {
    const token = 'a'.repeat(43);
    expect(getResetToken(token)).toBe(token);
    expect(getResetToken([token, 'ignored'])).toBe(token);
    expect(getResetToken('short')).toBeNull();
    expect(getResetToken(undefined)).toBeNull();
  });

  it('validates matching passwords and submits the token once', async () => {
    mockedApiCall.mockResolvedValue({ message: 'updated' });
    const token = 'a'.repeat(43);

    await resetPassword({
      token,
      newPassword: 'NewSecurePassword@123',
      confirmPassword: 'NewSecurePassword@123',
    });

    expect(mockedApiCall).toHaveBeenCalledWith('POST', '/auth/reset-password', {
      token,
      newPassword: 'NewSecurePassword@123',
      confirmPassword: 'NewSecurePassword@123',
    });
  });

  it('rejects short passwords and divergent confirmation before the API', async () => {
    await expect(
      resetPassword({
        token: 'a'.repeat(43),
        newPassword: 'short',
        confirmPassword: 'short',
      }),
    ).rejects.toThrow('entre 8 e 128');
    await expect(
      resetPassword({
        token: 'a'.repeat(43),
        newPassword: 'NewSecurePassword@123',
        confirmPassword: 'DifferentPassword@123',
      }),
    ).rejects.toThrow('não conferem');
    expect(mockedApiCall).not.toHaveBeenCalled();
  });
});
