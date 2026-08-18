import { useCallback, useEffect, useRef, useState } from 'react';
import type { Proposal } from '@/src/types';
import { cleanProposalPatch, type ProposalUpdatePayload } from './proposalPayload';

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
type SaveFn = (patch: ProposalUpdatePayload) => Promise<Proposal | void>;

export function useProposalAutosave({
  proposalId: _proposalId,
  save,
  onSaved,
  onError,
  delayMs = 600,
}: {
  proposalId: string;
  save: SaveFn;
  onSaved: (proposal: Proposal | void) => void;
  onError: (error: unknown) => void;
  delayMs?: number;
}) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<unknown>(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const pendingRef = useRef<ProposalUpdatePayload>({});
  const inFlightRef = useRef<Promise<Proposal | void> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revisionRef = useRef(0);
  const latestAppliedRef = useRef(0);

  const runQueue = useCallback(async (): Promise<Proposal | void> => {
    if (inFlightRef.current) return inFlightRef.current;
    const payload = pendingRef.current;
    pendingRef.current = {};
    if (!Object.keys(payload).length) {
      setHasPendingChanges(false);
      return undefined;
    }
    const revision = ++revisionRef.current;
    setStatus('saving');
    setError(null);
    const request = save(payload)
      .then((result) => {
        if (revision >= latestAppliedRef.current) {
          latestAppliedRef.current = revision;
          onSaved(result);
        }
        setStatus('saved');
        return result;
      })
      .catch((reason) => {
        pendingRef.current = { ...payload, ...pendingRef.current };
        setHasPendingChanges(true);
        setStatus('error');
        setError(reason);
        onError(reason);
        throw reason;
      })
      .finally(() => {
        inFlightRef.current = null;
      });
    inFlightRef.current = request;
    await request;
    if (Object.keys(pendingRef.current).length) return runQueue();
    setHasPendingChanges(false);
    return request;
  }, [onError, onSaved, save]);

  const schedule = useCallback((patch: Partial<Proposal>) => {
    const cleaned = cleanProposalPatch(patch);
    if (!Object.keys(cleaned).length) return;
    pendingRef.current = { ...pendingRef.current, ...cleaned };
    setHasPendingChanges(true);
    setStatus('dirty');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void runQueue();
    }, delayMs);
  }, [delayMs, runQueue]);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    return runQueue();
  }, [runQueue]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { schedule, flush, status, error, hasPendingChanges };
}
