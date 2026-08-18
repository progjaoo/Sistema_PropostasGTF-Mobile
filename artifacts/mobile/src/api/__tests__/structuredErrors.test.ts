import { ApiError, parseApiErrorPayload } from '../client';

describe('structured API errors', () => {
  it('preserves conflict metadata returned by the API', () => {
    const payload = parseApiErrorPayload(409, {
      code: 'STATION_PROGRAMS_IN_USE',
      error: 'Remova os vínculos antes de continuar',
      blockers: { activePrograms: 2, products: 4 },
    });
    const error = new ApiError(409, payload.message, payload);

    expect(error.code).toBe('STATION_PROGRAMS_IN_USE');
    expect(error.payload.blockers).toEqual({ activePrograms: 2, products: 4 });
  });
});
