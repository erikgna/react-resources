# Electron POC — Presentation Guide

## What this POC is

A simplified Git desktop client (think GitHub Desktop) built with Electron.
Goal: understand how Electron separates processes and how React communicates with Node.js.

---

## The 3-Process Model (open with this)

Electron runs three distinct processes. This is the core concept everything else follows from.

```
┌─────────────────────────────────────────────┐
│  Main Process (Node.js)                      │
│  main/main.js                                │
│  - Owns windows, file system, git, OS APIs  │
│  - Registers IPC handlers                   │
└──────────────┬──────────────────────────────┘
               │  IPC bridge
┌──────────────▼──────────────────────────────┐
│  Preload Script (isolated bridge)            │
│  preload/index.js                            │
│  - Runs before renderer loads                │
│  - Has access to ipcRenderer (Node)          │
│  - Exposes safe API to renderer via          │
│    contextBridge.exposeInMainWorld()         │
└──────────────┬──────────────────────────────┘
               │  window.git / window.system / window.file
┌──────────────▼──────────────────────────────┐
│  Renderer Process (React + Vite)             │
│  renderer/src/                               │
│  - Standard browser environment              │
│  - Zero Node.js access                       │
│  - Calls window.git.getStatus() etc.        │
└─────────────────────────────────────────────┘
```

**Say:** "The renderer is sandboxed like a browser tab. It has no file system, no git, no OS.
Everything it needs must be explicitly handed to it through the preload bridge."

---

## Security Model — why it's designed this way

Point to `main/main.js` lines 23–26:

```js
contextIsolation: true,
nodeIntegration: false,
```

**Say:** "These two flags are the security contract.
`nodeIntegration: false` means the renderer can't call `require()` or use Node APIs.
`contextIsolation: true` means the preload script runs in a separate JS context —
the renderer can't reach into it and steal `ipcRenderer` directly.
If we set `nodeIntegration: true`, any XSS in the UI could execute arbitrary shell commands."

---

## The Preload Bridge — contextBridge

Point to `preload/index.js` bottom:

```js
contextBridge.exposeInMainWorld('git', gitAPI)
```

**Say:** "This is the only legal crossing point. `exposeInMainWorld` copies the `gitAPI` object
into the renderer's `window` object, but keeps the Node.js context sealed off.
The renderer sees `window.git.getStatus` as a normal function — it has no idea IPC is happening underneath."

---

## IPC Flow — how a call travels end to end

Walk through one full call: `git:status`.

**Step 1 — Renderer calls the client wrapper** (`renderer/src/services/ipcClient.ts`):
```ts
gitClient.getStatus(repoPath)
// → calls window.git.getStatus(repoPath)
```

**Step 2 — Preload forwards via IPC** (`preload/index.js`):
```js
getStatus(repoPath) { return ipcRenderer.invoke('git:status', repoPath) }
```

**Step 3 — Main receives it** (`main/ipc/gitHandlers.js`):
```js
ipcMain.handle('git:status', async (_, repoPath) => {
    return safeExecute(() => gitService.getStatus(repoPath))
})
```

**Step 4 — Service runs git** (`main/services/gitService.js`):
```js
const git = getGit(repoPath)   // simple-git instance
return await git.status()
```

**Say:** "`ipcRenderer.invoke` and `ipcMain.handle` are a matched pair — one sends, one receives.
It's async request/response over a named channel string. The `_` in the handler is the event object
(who sent it) — we ignore it here because we don't need the sender info."

---

## Two IPC Patterns

**Pattern 1: Request/Response** (`invoke` / `handle`) — used for all git and file operations.
Renderer asks, main answers. Returns a Promise.

**Pattern 2: Push** (`webContents.send` / `ipcRenderer.on`) — used for two cases:
- Menu → renderer: user picks "Open Repository" from the app menu
- File watcher → renderer: a file changed on disk

Point to `main/main.js` line 58:
```js
mainWindow.webContents.send('repo:selected', result.filePaths[0])
```

Point to `preload/index.js`:
```js
onRepoSelected(callback) {
    const handler = (_, path) => callback(path)
    ipcRenderer.on('repo:selected', handler)
    return () => ipcRenderer.removeListener('repo:selected', handler)
}
```

**Say:** "Push is one-way. Main decides to send — the renderer didn't ask.
The cleanup function matters: if the React component unmounts but the listener stays,
it'll fire on a dead component."

---

## safeExecute — why every handler is wrapped

Point to `main/ipc/gitHandlers.js`:

```js
async function safeExecute(fn) {
    try {
        const data = await fn()
        return { success: true, data }
    } catch (error) {
        return handleError(error)
    }
}
```

**Say:** "If an `ipcMain.handle` throws, the renderer's Promise never resolves — it hangs.
`safeExecute` catches everything and converts it to `{ success: false, error: '...' }`.
Every IPC call in this app returns that same shape, so the renderer always gets a response."

---

## unwrap vs safeCall — renderer error handling

Point to `renderer/src/services/ipcClient.ts`:

```ts
// throws on failure
export async function unwrap<T>(promise): Promise<T>

// returns [data, error] tuple
export async function safeCall<T>(promise): Promise<[T | null, string | null]>
```

**Say:** "Two styles. `unwrap` is for operations where failure should bubble up as an exception.
`safeCall` is for operations where you want to handle the error in place without try/catch."

---

## App Lifecycle — macOS behavior

Point to `main/main.js`:

```js
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
    }
})
```

**Say:** "On macOS, closing all windows doesn't quit the app — it stays in the dock.
`activate` fires when the user clicks the dock icon, so we re-create the window.
On Windows/Linux, closing the last window quits."

---

## What was hard / non-obvious

- **Preload runs in a third context** — not main, not renderer. It has Node access but its variables
  are invisible to the renderer. `contextBridge` is the only safe handoff.
- **`ipcMain.handle` must never throw** — discovered this by breaking it and seeing promises hang.
- **`rename` event in `fs.watch` means both add and delete** — Node's file watcher doesn't distinguish.
  Had to check `fs.access` after the event to figure out which.
- **`show: false` + `ready-to-show`** — without this, the window flashes white before React renders.

---

## One refactor worth mentioning

`preload/gitAPI.js` is a leftover file — `preload/index.js` defines everything inline and doesn't import it.
It can be deleted. Shows the POC went through iteration.
