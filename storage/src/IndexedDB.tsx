import { IndexedDBService } from "./useIndexedDB";

export function IndexedDB() {
  const service = new IndexedDBService("poc-db", 1, [
    {
      name: "users",
      options: { keyPath: "id" },
      indexes: [
        {
          name: "by-email",
          keyPath: "email",
        },
      ],
    },
  ]);

  async function insertUsers() {
    await service.put("users", { id: 1, name: "Erik" });

    const user = await service.get("users", 1);
    console.log("User:", user);

    for (let i = 0; i < 1000; i++) {
      await service.put("users", {
        id: i,
        name: `User ${i}`,
        email: `user${i}@test.com`,
      });
    }

    const all = await service.getAll("users");
    console.log("Total users:", all.length);

    const byEmail = await service.getByIndex(
      "users",
      "by-email",
      "user10@test.com",
    );
    console.log("Query result:", byEmail);

    const cursorData = await service.getAllWithCursor("users");
    console.log("Cursor count:", cursorData.length);
  }

  async function deleteUsers() {
    await service.delete("users", 1);
    console.log("Deleted user 1");

    await service.clear("users");
    console.log("Cleared store");
  }

  return (
    <div>
      <h1>IndexedDB</h1>
      <button onClick={() => insertUsers()}>Insert</button>
      <button onClick={() => deleteUsers()}>Delete</button>
    </div>
  );
}
