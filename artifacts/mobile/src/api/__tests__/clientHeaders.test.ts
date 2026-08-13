import { buildClientHeaders } from '../clientHeaders';

describe('mobile API request headers', () => {
  it('identifies public requests as mobile without requiring a token', () => {
    expect(buildClientHeaders(null)).toEqual({
      'Content-Type': 'application/json',
      'X-Client-Platform': 'mobile',
      'X-Client-Version': '1.0.0',
    });
  });

  it('adds the bearer token without changing the platform header', () => {
    expect(buildClientHeaders('access-token')).toMatchObject({
      Authorization: 'Bearer access-token',
      'X-Client-Platform': 'mobile',
    });
  });
});
