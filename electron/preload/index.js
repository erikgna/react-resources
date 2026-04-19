const { contextBridge, ipcRenderer } = require('electron')

function invoke(channel, payload) {
    return ipcRenderer.invoke(channel, payload)
}

const gitAPI = {
    isRepo(repoPath) { return invoke('git:isRepo', repoPath) },
    getStatus(repoPath) { return invoke('git:status', repoPath) },
    stage(repoPath, files) { return invoke('git:stage', { repoPath, files }) },
    unstage(repoPath, files) { return invoke('git:unstage', { repoPath, files }) },
    commit(repoPath, message) { return invoke('git:commit', { repoPath, message }) },
    getLog(repoPath, limit) { return invoke('git:log', { repoPath, limit }) },
    getBranches(repoPath) { return invoke('git:branches', repoPath) },
    checkout(repoPath, branch) { return invoke('git:checkout', { repoPath, branch }) },
    createBranch(repoPath, branch) { return invoke('git:createBranch', { repoPath, branch }) },
    pull(repoPath) { return invoke('git:pull', repoPath) },
    push(repoPath) { return invoke('git:push', repoPath) },
    getDiff(repoPath, file) { return invoke('git:diff', { repoPath, file }) },
}

const systemAPI = {
    openDirectory() { return invoke('system:openDirectory') },
    openFile() { return invoke('system:openFile') },
    saveFile(defaultPath) { return invoke('system:saveFile', defaultPath) },
    showItemInFolder(targetPath) { return invoke('system:showItemInFolder', targetPath) },
    openExternal(url) { return invoke('system:openExternal', url) },
    notify(title, body) { return invoke('system:notify', { title, body }) },
    getAppVersion() { return invoke('system:getAppVersion') },
    getPath(name) { return invoke('system:getPath', name) },
    getUserDataPath() { return invoke('system:getUserDataPath') },
    copyToClipboard(text) { return invoke('system:copyToClipboard', text) },

    onRepoSelected(callback) {
        const handler = (_, path) => callback(path)
        ipcRenderer.on('repo:selected', handler)
        return () => ipcRenderer.removeListener('repo:selected', handler)
    },
}

const fileAPI = {
    readDir(dirPath) { return invoke('file:readDir', dirPath) },
    readFile(filePath) { return invoke('file:readFile', filePath) },
    writeFile(filePath, content) { return invoke('file:writeFile', { filePath, content }) },
    exists(targetPath) { return invoke('file:exists', targetPath) },
    createDir(dirPath) { return invoke('file:createDir', dirPath) },
    remove(targetPath) { return invoke('file:remove', targetPath) },
    rename(oldPath, newPath) { return invoke('file:rename', { oldPath, newPath }) },
    watch(dirPath) { return invoke('file:watch', dirPath) },
    unwatch(dirPath) { return invoke('file:unwatch', dirPath) },

    onChanged(callback) {
        ipcRenderer.on('file:changed', (_, data) => callback(data))
    },
}

contextBridge.exposeInMainWorld('git', gitAPI)
contextBridge.exposeInMainWorld('system', systemAPI)
contextBridge.exposeInMainWorld('file', fileAPI)
contextBridge.exposeInMainWorld('env', { isElectron: true })
