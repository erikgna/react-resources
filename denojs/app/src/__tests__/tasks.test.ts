import { assertEquals, assertExists } from "@std/assert";
import { createTask, getAllTasks, getTask, updateTask, deleteTask, bulkInsert } from "../db.ts";

Deno.test("createTask returns task with id", () => {
  const task = createTask("write tests");
  assertExists(task.id);
  assertEquals(task.title, "write tests");
  assertEquals(task.done, 0);
});

Deno.test("getAllTasks includes created tasks", () => {
  createTask("task-list-test");
  const all = getAllTasks();
  assertEquals(all.length > 0, true);
});

Deno.test("getTask returns task by id", () => {
  const created = createTask("get by id");
  const found = getTask(created.id);
  assertExists(found);
  assertEquals(found.id, created.id);
  assertEquals(found.title, "get by id");
});

Deno.test("getTask returns undefined for missing id", () => {
  assertEquals(getTask(999999), undefined);
});

Deno.test("updateTask marks task done", () => {
  const task = createTask("update me");
  const updated = updateTask(task.id, true);
  assertExists(updated);
  assertEquals(updated.done, 1);
});

Deno.test("updateTask returns undefined for missing id", () => {
  assertEquals(updateTask(999999, true), undefined);
});

Deno.test("deleteTask removes task", () => {
  const task = createTask("delete me");
  const deleted = deleteTask(task.id);
  assertExists(deleted);
  assertEquals(getTask(task.id), undefined);
});

Deno.test("bulkInsert creates multiple tasks atomically", () => {
  const titles = ["bulk-a", "bulk-b", "bulk-c"];
  const tasks = bulkInsert(titles);
  assertEquals(tasks.length, 3);
  for (let i = 0; i < titles.length; i++) {
    assertEquals(tasks[i].title, titles[i]);
  }
});
