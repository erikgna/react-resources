const { ipcRenderer } = require('electron')

function invoke(channel, payload) {
    return ipcRenderer.invoke(channel, payload)
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

module.exports = { fileAPI }
