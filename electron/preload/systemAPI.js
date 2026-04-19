const { ipcRenderer } = require('electron')

function invoke(channel, payload) {
    return ipcRenderer.invoke(channel, payload)
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

module.exports = { systemAPI }
