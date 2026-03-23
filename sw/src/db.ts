const DB_NAME = 'sw-poc';
const OUTBOX_STORE = 'outbox';
const DB_VERSION = 1;

export interface OutboxItem {
  id?: number;
  title: string;
  body: string;
  status: 'pending' | 'done' | 'failed';
  createdAt: string;
  syncedAt?: string;
  responseId?: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(OUTBOX_STORE, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function store(db: IDBDatabase, mode: IDBTransactionMode) {
  return db.transaction(OUTBOX_STORE, mode).objectStore(OUTBOX_STORE);
}

export async function addToOutbox(item: Omit<OutboxItem, 'id'>): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = store(db, 'readwrite').add(item);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllOutbox(): Promise<OutboxItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = store(db, 'readonly').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function clearOutbox(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = store(db, 'readwrite').clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
