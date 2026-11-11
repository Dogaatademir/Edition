// src/lib/session.ts
// Ziyaret (oturum) kimliği.
//  - Analitik onayı VARSA: sessionStorage'da tutulur, sekme açık kaldıkça sayfa yenilemelerinde de aynı kalır.
//  - Onay YOKSA: yalnızca bellekte tutulur, tarayıcıya hiçbir şey yazılmaz. Sayfa yenilenince yeni kimlik üretilir.
//  - Ziyaret sırasında onay verilirse bellekteki kimlik saklanır, böylece oturum kesintisiz devam eder.
import { hasConsent } from './consent';

const SESSION_KEY = 'sfa_session_id';

function generateId(): string {
  // crypto.randomUUID → sadece HTTPS veya localhost'ta çalışır
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // HTTP (yerel ağ) için fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let memoryId: string | null = null;

export function getSessionId(): string {
  if (hasConsent('analytics')) {
    try {
      let id = sessionStorage.getItem(SESSION_KEY);
      if (!id) {
        id = memoryId ?? generateId();
        sessionStorage.setItem(SESSION_KEY, id);
      }
      memoryId = id;
      return id;
    } catch {
      // depolama kapalı: bellekteki kimlikle devam et
    }
  }
  if (!memoryId) memoryId = generateId();
  return memoryId;
}
