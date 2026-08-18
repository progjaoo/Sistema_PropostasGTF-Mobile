import { commercialContractForecastSchema, commercialContractSchema, commercialContractSummarySchema } from '@/src/api/schemas';
import { forecastFixture, ownContract, summaryFixture } from '@/src/test/fixtures/parity';

describe('contract API schemas', () => {
  it('parses list, summary and forecast fixtures', () => {
    expect(commercialContractSchema.parse(ownContract).status).toBe('ACTIVE');
    expect(commercialContractSummarySchema.parse(summaryFixture).activeContracts).toBe(1);
    expect(commercialContractForecastSchema.parse(forecastFixture).data).toHaveLength(2);
  });
});
