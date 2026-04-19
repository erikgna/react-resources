const { ipcRenderer } = require('electron')

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

module.exports = { gitAPI }
