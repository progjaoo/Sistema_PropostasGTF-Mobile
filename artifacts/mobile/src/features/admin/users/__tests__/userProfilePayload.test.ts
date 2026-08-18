import { buildAdminUserPayload } from '../userProfilePayload';

describe('admin user profile payload', () => {
  it('normalizes login email and preserves commercial profile fields', () => {
    expect(buildAdminUserPayload({
      name: 'Ana', email: 'ANA@EXAMPLE.COM', role: 'COMERCIAL', active: true,
      jobTitle: 'Executiva', contactPhone: '(11) 99999-0000', contactEmail: 'ana@empresa.com',
      avatarBase64: null, stationAccesses: [],
    })).toMatchObject({ email: 'ana@example.com', jobTitle: 'Executiva', contactEmail: 'ana@empresa.com' });
  });
});
