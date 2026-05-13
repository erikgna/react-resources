import { Database } from "@db/sqlite";

export interface Task {
  id: number;
  title: string;
  done: number;
  created_at: string;
}

const db = new Database(":memory:");

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

const stmtInsert = db.prepare("INSERT INTO tasks (title) VALUES (?) RETURNING *");
const stmtAll = db.prepare("SELECT * FROM tasks ORDER BY id");
const stmtOne = db.prepare("SELECT * FROM tasks WHERE id = ?");
const stmtUpdate = db.prepare("UPDATE tasks SET done = ? WHERE id = ? RETURNING *");
const stmtDelete = db.prepare("DELETE FROM tasks WHERE id = ? RETURNING *");

export function createTask(title: string): Task {
  return stmtInsert.get<Task>(title)!;
}

export function getAllTasks(): Task[] {
  return stmtAll.all<Task>();
}

export function getTask(id: number): Task | undefined {
  return stmtOne.get<Task>(id) ?? undefined;
}

export function updateTask(id: number, done: boolean): Task | undefined {
  return stmtUpdate.get<Task>(done ? 1 : 0, id) ?? undefined;
}

export function deleteTask(id: number): Task | undefined {
  return stmtDelete.get<Task>(id) ?? undefined;
}

export function bulkInsert(titles: string[]): Task[] {
  const insert = db.transaction((items: string[]) =>
    items.map((t) => stmtInsert.get<Task>(t)!)
  );
  return insert(titles);
}
