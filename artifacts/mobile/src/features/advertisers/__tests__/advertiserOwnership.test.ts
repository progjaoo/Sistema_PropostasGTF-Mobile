import { ApiError } from '@/src/api/client';
import { advertiserWithProposalsSchema } from '@/src/api/schemas';
import { advertiserScopeLabel, getAdvertiserErrorMessage } from '../api';

describe('advertiser ownership contracts', () => {
  it('preserves owner metadata returned by the API', () => {
    const advertiser = advertiserWithProposalsSchema.parse({
      id: 'adv-1', tradeName: 'Cliente', active: true, createdAt: '2026-01-01',
      ownerId: 'seller-a', owner: { id: 'seller-a', name: 'Ana', email: 'ana@example.com' }, proposals: [],
    });
    expect(advertiser.ownerId).toBe('seller-a');
    expect(advertiser.owner?.name).toBe('Ana');
  });

  it('uses a neutral message for resources outside the wallet', () => {
    expect(getAdvertiserErrorMessage(new ApiError(404, 'not found'))).toBe('Cadastro não encontrado ou sem acesso.');
    expect(advertiserScopeLabel({ ownerId: 'seller-b' }, { id: 'seller-a', role: 'COMERCIAL' })).toBe('Cadastro fora da carteira atual');
    expect(advertiserScopeLabel({ ownerId: 'seller-b' }, { id: 'seller-a', role: 'ADMIN' })).toBe('Responsável: seller-b');
  });
});
