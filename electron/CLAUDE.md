# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Run the app (dev):**
```sh
npm start                  # from /electron root — launches Electron via electron-forge
```

**Renderer only (React dev server, no Electron):**
```sh
cd renderer && npm run dev  # Vite on http://localhost:3000
```

**Lint (renderer):**
```sh
cd renderer && npm run lint
```

**Build renderer for production:**
```sh
cd renderer && npm run build
```

**Package/distribute:**
```sh
npm run package   # creates distributable
npm run make      # creates installer
```

There are no tests.

## Architecture

This is a Git desktop client POC (simplified GitHub Desktop clone) built on Electron with three distinct processes:

### Process separation

**Main process** (`main/`) — Node.js, runs natively. Owns window lifecycle and all Git/file system operations. Entry: `main/main.js`.

**Renderer process** (`renderer/`) — React 19 + TypeScript + Vite, sandboxed (no Node access). Entry: `renderer/src/main.tsx`. Dev server runs on port 3000; main process loads `http://localhost:3000` in dev and `file://` in production.

**Preload** (`preload/`) — context-isolated bridge. Exposes three objects on `window` using `contextBridge.exposeInMainWorld()`: `window.git`, `window.system`, `window.file`.

### IPC contract

All cross-process calls use `ipcRenderer.invoke()` (request/response, not events). The flow:

```
Renderer → ipcClient.ts (typed wrapper)
  → preload/gitAPI.js (ipcRenderer.invoke)
    → main/ipc/gitHandlers.js (ipcMain.handle)
      → main/services/gitService.js (simple-git)
```

Every IPC handler returns `{ success: boolean, data?: any, error?: string }` via a `safeExecute()` wrapper.

**IPC channel namespaces:** `git:*`, `system:*`, `file:*`

### Key files

| File | Role |
|------|------|
| `main/main.js` | App entry, window creation, registers IPC handlers |
| `main/services/gitService.js` | All git operations (simple-git) |
| `main/services/fileService.js` | File I/O with path normalization |
| `main/ipc/gitHandlers.js` | Registers `git:*` IPC channels |
| `main/ipc/systemHandlers.js` | Registers `system:*` IPC channels |
| `preload/index.js` | Exposes `window.git/system/file` via contextBridge |
| `renderer/src/services/ipcClient.ts` | Typed `gitClient`, `systemClient`, `fileClient` exports |

### Security model

`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`. Renderer has zero Node access. All native capability must be threaded through preload → IPC → main.

### Adding a new IPC operation

1. Implement in `main/services/gitService.js` (or relevant service)
2. Register handler in `main/ipc/gitHandlers.js` with `ipcMain.handle('git:operationName', ...)`
3. Expose via `preload/gitAPI.js` using `ipcRenderer.invoke('git:operationName', ...)`
4. Add typed wrapper in `renderer/src/services/ipcClient.ts`
