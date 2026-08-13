import { getApiBaseUrl } from '../client';

describe('mobile API base URL', () => {
  it('uses the deployed API when no Expo URL is provided', () => {
    expect(getApiBaseUrl({})).toBe('https://propostasmosaico-one.vercel.app/api');
  });

  it('keeps an explicit API URL for local device testing', () => {
    expect(getApiBaseUrl({ EXPO_PUBLIC_API_URL: 'http://192.168.18.22:8081/api' }))
      .toBe('http://192.168.18.22:8081/api');
  });
});
