import { Database } from "bun:sqlite"

export interface Task {
  id: number
  title: string
  done: number
  created_at: string
}

const db = new Database(":memory:")

db.run(`
  CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

const stmts = {
  insert: db.prepare<Task, { $title: string }>(
    "INSERT INTO tasks (title) VALUES ($title) RETURNING *"
  ),
  findAll: db.query<Task, []>("SELECT * FROM tasks ORDER BY id"),
  findOne: db.query<Task, [number]>("SELECT * FROM tasks WHERE id = ?"),
  update: db.prepare<Task, { $id: number; $done: number }>(
    "UPDATE tasks SET done = $done WHERE id = $id RETURNING *"
  ),
  delete: db.prepare<{ id: number }, [number]>(
    "DELETE FROM tasks WHERE id = ? RETURNING id"
  ),
}

export function createTask(title: string): Task {
  return stmts.insert.get({ $title: title })!
}

export function getAllTasks(): Task[] {
  return stmts.findAll.all()
}

export function getTask(id: number): Task | null {
  return stmts.findOne.get(id) ?? null
}

export function updateTask(id: number, done: boolean): Task | null {
  return stmts.update.get({ $id: id, $done: done ? 1 : 0 }) ?? null
}

export function deleteTask(id: number): boolean {
  return stmts.delete.get(id) !== null
}

export function bulkInsert(titles: string[]): Task[] {
  const insertMany = db.transaction((items: string[]) =>
    items.map((title) => stmts.insert.get({ $title: title })!)
  )
  return insertMany(titles)
}
