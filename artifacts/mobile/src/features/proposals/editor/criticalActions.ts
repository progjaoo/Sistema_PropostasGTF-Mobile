export async function runAfterProposalFlush<T>(flush: () => Promise<unknown>, action: () => Promise<T> | T): Promise<T> {
  await flush();
  return action();
}
