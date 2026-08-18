import { runAfterProposalFlush } from '../criticalActions';

describe('proposal critical actions', () => {
  it('waits for flush before sharing the PDF', async () => {
    const order: string[] = [];
    await runAfterProposalFlush(
      async () => { order.push('flush'); },
      async () => { order.push('pdf'); },
    );
    expect(order).toEqual(['flush', 'pdf']);
  });
});
