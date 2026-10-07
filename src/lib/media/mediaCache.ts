/**
 * Browser-side store for downloaded chat media (photos, videos, audio), WhatsApp-style:
 * a file is fetched from the server only when the user chooses to download it, then kept
 * in IndexedDB and displayed from there — no server/CDN traffic on later views.
 *
 * Entries expire after MEDIA_CACHE_TTL_MS without being viewed (sliding expiry), and are
 * namespaced per user so a shared browser never shows one account's media to another.
 */

const DB_NAME = 'chatty-media';
const DB_VERSION = 1;
const STORE = 'files';
const LAST_ACCESSED_INDEX = 'lastAccessedAt';

export const MEDIA_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface CachedMediaEntry {
  key: string;
  blob: Blob;
  cachedAt: number;
  lastAccessedAt: number;
}

export const mediaKey = (userId: string, fileId: string) => `${userId}:${fileId}`;

let dbPromise: Promise<IDBDatabase> | null = null;
let prunedThisSession = false;

const isSupported = () => typeof window !== 'undefined' && typeof indexedDB !== 'undefined';

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore(STORE, { keyPath: 'key' });
        store.createIndex(LAST_ACCESSED_INDEX, 'lastAccessedAt');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null; // allow a retry later (e.g. private mode blocked it once)
        reject(request.error);
      };
    });
  }
  return dbPromise;
}

function asPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Returns the cached file, or null if it was never downloaded or has expired. */
export async function getCachedMedia(key: string): Promise<Blob | null> {
  if (!isSupported()) return null;

  const db = await openDb();

  if (!prunedThisSession) {
    prunedThisSession = true;
    void pruneExpiredMedia();
  }

  const entry = await asPromise<CachedMediaEntry | undefined>(
    db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
  );

  if (!entry) return null;

  const now = Date.now();
  const store = db.transaction(STORE, 'readwrite').objectStore(STORE);

  if (now - entry.lastAccessedAt > MEDIA_CACHE_TTL_MS) {
    store.delete(key);
    return null;
  }

  // Viewing keeps it alive — a file you keep looking at shouldn't expire.
  store.put({ ...entry, lastAccessedAt: now });
  return entry.blob;
}

/** Stores a downloaded (or just-sent) file. Never throws — caching is best effort. */
export async function putCachedMedia(key: string, blob: Blob): Promise<void> {
  if (!isSupported()) return;

  try {
    const db = await openDb();
    const now = Date.now();
    await asPromise(
      db.transaction(STORE, 'readwrite').objectStore(STORE).put({ key, blob, cachedAt: now, lastAccessedAt: now })
    );
  } catch (err) {
    // Most likely the storage quota — the file still shows for this session from memory.
    console.warn('Could not cache media locally:', err);
  }
}

/** Deletes every entry not viewed within the TTL. */
export async function pruneExpiredMedia(): Promise<void> {
  if (!isSupported()) return;

  try {
    const db = await openDb();
    const index = db.transaction(STORE, 'readwrite').objectStore(STORE).index(LAST_ACCESSED_INDEX);
    const request = index.openCursor(IDBKeyRange.upperBound(Date.now() - MEDIA_CACHE_TTL_MS));

    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return resolve();
        cursor.delete();
        cursor.continue();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not prune the media cache:', err);
  }
}
