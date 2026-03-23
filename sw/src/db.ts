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

// Opens (or creates) the versioned IndexedDB database.
// onupgradeneeded only fires on first creation or when DB_VERSION increments,
// making it the right place to define object stores and indexes.
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

// Shorthand to open a transaction and return the object store in one step.
// Each IDB operation needs its own transaction scoped to the correct mode.
function store(db: IDBDatabase, mode: IDBTransactionMode) {
  return db.transaction(OUTBOX_STORE, mode).objectStore(OUTBOX_STORE);
}

// Insert a new item into the outbox and return the auto-assigned numeric ID.
// The ID is used later to match SW sync responses back to the original record.
export async function addToOutbox(item: Omit<OutboxItem, 'id'>): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = store(db, 'readwrite').add(item);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

// Fetch all records from the outbox regardless of status.
// The caller filters by status when needed (e.g. show all in UI, sync only pending).
export async function getAllOutbox(): Promise<OutboxItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = store(db, 'readonly').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Delete every record from the outbox store without dropping the store itself.
export async function clearOutbox(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = store(db, 'readwrite').clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
