import { act, renderHook } from '@testing-library/react-native';
import { useProposalAutosave } from '../useProposalAutosave';
import { olderProposal, newerProposal } from '@/src/test/fixtures/parity';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}

describe('useProposalAutosave', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('flushes the newest revision and ignores an older response', async () => {
    const first = deferred<typeof olderProposal>();
    const save = jest.fn().mockReturnValueOnce(first.promise).mockResolvedValueOnce(newerProposal);
    const { result } = renderHook(() => useProposalAutosave({
      proposalId: 'p1', save, onSaved: jest.fn(), onError: jest.fn(), delayMs: 20,
    }));
    act(() => result.current.schedule({ investValue: '100.00' }));
    await act(async () => { jest.advanceTimersByTime(20); await Promise.resolve(); });
    act(() => result.current.schedule({ investValue: '200.00' }));
    const flushing = result.current.flush();
    first.resolve(olderProposal);
    await act(async () => { await flushing; });
    expect(save).toHaveBeenLastCalledWith({ investValue: '200.00' });
  });
});
