import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { createTask, getAllTasks, getTask, updateTask, deleteTask, bulkInsert } from "../db"

describe("bun:sqlite — tasks CRUD", () => {
  it("creates a task", () => {
    const task = createTask("write tests")
    expect(task.id).toBeGreaterThan(0)
    expect(task.title).toBe("write tests")
    expect(task.done).toBe(0)
    expect(task.created_at).toBeTruthy()
  })

  it("retrieves all tasks", () => {
    createTask("second task")
    const tasks = getAllTasks()
    expect(tasks.length).toBeGreaterThanOrEqual(2)
  })

  it("retrieves a single task by id", () => {
    const created = createTask("findable task")
    const found = getTask(created.id)
    expect(found).not.toBeNull()
    expect(found!.title).toBe("findable task")
  })

  it("returns null for missing task", () => {
    const found = getTask(999999)
    expect(found).toBeNull()
  })

  it("updates task done status", () => {
    const task = createTask("mark me done")
    const updated = updateTask(task.id, true)
    expect(updated).not.toBeNull()
    expect(updated!.done).toBe(1)

    const reverted = updateTask(task.id, false)
    expect(reverted!.done).toBe(0)
  })

  it("returns null when updating missing task", () => {
    const result = updateTask(999999, true)
    expect(result).toBeNull()
  })

  it("deletes a task", () => {
    const task = createTask("delete me")
    const ok = deleteTask(task.id)
    expect(ok).toBe(true)
    expect(getTask(task.id)).toBeNull()
  })

  it("returns false when deleting missing task", () => {
    const ok = deleteTask(999999)
    expect(ok).toBe(false)
  })

  it("bulk inserts via transaction", () => {
    const titles = ["bulk-a", "bulk-b", "bulk-c"]
    const tasks = bulkInsert(titles)
    expect(tasks).toHaveLength(3)
    expect(tasks.map((t) => t.title)).toEqual(titles)
    tasks.forEach((t) => expect(t.id).toBeGreaterThan(0))
  })
})

describe("Bun.password", () => {
  let hash: string

  beforeAll(async () => {
    hash = await Bun.password.hash("correct-horse-battery-staple", "argon2id")
  })

  it("hashes produce bcrypt-style or argon2id-style prefix", () => {
    expect(hash.startsWith("$argon2")).toBe(true)
  })

  it("verifies correct password", async () => {
    const match = await Bun.password.verify("correct-horse-battery-staple", hash)
    expect(match).toBe(true)
  })

  it("rejects wrong password", async () => {
    const match = await Bun.password.verify("wrong-password", hash)
    expect(match).toBe(false)
  })

  it("bcrypt hash is different from argon2id hash", async () => {
    const bcryptHash = await Bun.password.hash("same-password", "bcrypt")
    expect(bcryptHash.startsWith("$2")).toBe(true)
    expect(bcryptHash).not.toBe(hash)
  })
})

describe("Bun.file", () => {
  const testFile = "./test-output.txt"
  const content = "hello from bun:test"

  afterAll(async () => {
    const { unlink } = await import("fs/promises")
    await unlink(testFile).catch(() => {})
  })

  it("writes a file with Bun.write()", async () => {
    const bytes = await Bun.write(testFile, content)
    expect(bytes).toBe(content.length)
  })

  it("reads file lazily with Bun.file()", async () => {
    const file = Bun.file(testFile)
    const text = await file.text()
    expect(text).toBe(content)
  })

  it("reports correct file size and type", async () => {
    const file = Bun.file(testFile)
    expect(file.size).toBe(content.length)
    expect(file.type).toContain("text")
  })

  it("returns false for missing file exists()", async () => {
    const file = Bun.file("./does-not-exist-12345.txt")
    expect(await file.exists()).toBe(false)
  })
})
