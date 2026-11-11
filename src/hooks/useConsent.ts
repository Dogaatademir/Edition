import { useSyncExternalStore } from 'react';
import { getConsent, subscribeConsent, type ConsentState } from '../lib/consent';

/** Güncel çerez onayını döndürür; kullanıcı seçim yapmadıysa null. */
export function useConsent(): ConsentState | null {
  return useSyncExternalStore(subscribeConsent, getConsent, () => null);
}
