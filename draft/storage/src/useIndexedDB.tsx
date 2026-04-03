type StoreSchema = {
  name: string;
  options?: IDBObjectStoreParameters; // Configures primary key { keyPath: 'id', autoIncrement: true }
  indexes?: {
    name: string; // Name of the index
    keyPath: string | string[]; // The object property to index
    options?: IDBIndexParameters; // Index constraints { unique: true }
  }[];
};

export class IndexedDBService {
  private db: IDBDatabase | null = null;

  constructor(
    private dbName: string,
    private version: number,
    private stores: StoreSchema[],
  ) {}

  async open() {
    if (this.db) return this.db;

    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      // This event fires ONLY when the requested version is higher than the currently installed version.
      request.onupgradeneeded = () => {
        const db = request.result;

        // Iterate through the provided schema definitions
        this.stores.forEach((store) => {
          // Check if the table already exists to prevent errors during minor version bumps
          if (!db.objectStoreNames.contains(store.name)) {
            // Create the table
            const objectStore = db.createObjectStore(store.name, store.options);

            // Create any specified secondary indexes for faster querying
            store.indexes?.forEach((idx) => {
              objectStore.createIndex(idx.name, idx.keyPath, idx.options);
            });
          }
        });
      };

      // Fired when the DB is successfully opened (and after onupgradeneeded finishes, if it ran)
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      // Fired if the user denies access or if there's a file system error
      request.onerror = () => reject(request.error);
    });
  }

  private async getStore(
    storeName: string, // The name of the table
    mode: IDBTransactionMode = "readonly",
  ) {
    const db = await this.open();
    // Start a transaction on the target store with the required permissions
    const tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  async put<T>(storeName: string, value: T) {
    const store = await this.getStore(storeName, "readwrite");

    return new Promise<void>((resolve, reject) => {
      const req = store.put(value);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async get<T>(storeName: string, key: IDBValidKey) {
    const store = await this.getStore(storeName);

    return new Promise<T | undefined>((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll<T>(storeName: string) {
    const store = await this.getStore(storeName);

    return new Promise<T[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: IDBValidKey,
  ) {
    const store = await this.getStore(storeName);
    // Access the specific index on the store
    const index = store.index(indexName);

    return new Promise<T | undefined>((resolve, reject) => {
      const req = index.get(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(storeName: string, key: IDBValidKey) {
    const store = await this.getStore(storeName, "readwrite");

    return new Promise<void>((resolve, reject) => {
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clear(storeName: string) {
    const store = await this.getStore(storeName, "readwrite");

    return new Promise<void>((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Retrieves all records using a cursor.
   * Cursors iterate over records one by one. While this method pushes them all
   * into a single array (similar to getAll), cursors are typically used for
   * processing large datasets in chunks, filtering, or modifying records on the fly.
   */
  async getAllWithCursor<T>(storeName: string): Promise<T[]> {
    const store = await this.getStore(storeName);

    return new Promise((resolve, reject) => {
      const results: T[] = [];
      // Opens a cursor to iterate over the store
      const req = store.openCursor();

      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          // If a record exists at the current cursor position, save it
          results.push(cursor.value);
          // Move the cursor to the next record. This re-triggers the onsuccess event.
          cursor.continue();
        } else {
          // When cursor is null, we've reached the end of the store
          resolve(results);
        }
      };

      req.onerror = () => reject(req.error);
    });
  }
}
