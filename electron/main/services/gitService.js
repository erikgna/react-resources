import simpleGit from 'simple-git'

// ----------------------
// Helpers
// ----------------------
function getGit(repoPath) {
  return simpleGit({
    baseDir: repoPath,
    binary: 'git',
    maxConcurrentProcesses: 4,
  })
}

function normalizeError(error) {
  if (error instanceof Error) return error
  return new Error(typeof error === 'string' ? error : 'Unknown git error')
}

// ----------------------
// Service
// ----------------------
export const gitService = {
  // ----------------------
  // Repo validation
  // ----------------------
  async isRepo(repoPath) {
    try {
      const git = getGit(repoPath)
      return await git.checkIsRepo()
    } catch {
      return false
    }
  },

  // ----------------------
  // Status
  // ----------------------
  async getStatus(repoPath) {
    try {
      const git = getGit(repoPath)
      const status = await git.status()

      return {
        current: status.current,
        ahead: status.ahead,
        behind: status.behind,
        files: status.files.map((f) => ({
          path: f.path,
          index: f.index,
          working_dir: f.working_dir,
        })),
      }
    } catch (err) {
      throw normalizeError(err)
    }
  },

  // ----------------------
  // Stage / Unstage
  // ----------------------
  async stageFiles(repoPath, files) {
    try {
      const git = getGit(repoPath)
      await git.add(files)
      return true
    } catch (err) {
      throw normalizeError(err)
    }
  },

  async unstageFiles(repoPath, files) {
    try {
      const git = getGit(repoPath)
      await git.reset(['HEAD', ...files])
      return true
    } catch (err) {
      throw normalizeError(err)
    }
  },

  // ----------------------
  // Commit
  // ----------------------
  async commit(repoPath, message) {
    if (!message || !message.trim()) {
      throw new Error('Commit message cannot be empty')
    }

    try {
      const git = getGit(repoPath)
      const result = await git.commit(message)

      return {
        commit: result.commit,
        summary: result.summary,
      }
    } catch (err) {
      throw normalizeError(err)
    }
  },

  // ----------------------
  // Log / History
  // ----------------------
  async getLog(repoPath, limit = 50) {
    try {
      const git = getGit(repoPath)
      const log = await git.log({ maxCount: limit })

      return log.all.map((c) => ({
        hash: c.hash,
        message: c.message,
        author_name: c.author_name,
        date: c.date,
      }))
    } catch (err) {
      throw normalizeError(err)
    }
  },

  // ----------------------
  // Branches
  // ----------------------
  async getBranches(repoPath) {
    try {
      const git = getGit(repoPath)
      return await git.branch()
    } catch (err) {
      throw normalizeError(err)
    }
  },

  async checkoutBranch(repoPath, branch) {
    try {
      const git = getGit(repoPath)
      await git.checkout(branch)
      return true
    } catch (err) {
      throw normalizeError(err)
    }
  },

  async createBranch(repoPath, branch) {
    try {
      const git = getGit(repoPath)
      await git.checkoutLocalBranch(branch)
      return true
    } catch (err) {
      throw normalizeError(err)
    }
  },

  // ----------------------
  // Sync
  // ----------------------
  async pull(repoPath) {
    try {
      const git = getGit(repoPath)
      return await git.pull()
    } catch (err) {
      throw normalizeError(err)
    }
  },

  async push(repoPath) {
    try {
      const git = getGit(repoPath)
      return await git.push()
    } catch (err) {
      throw normalizeError(err)
    }
  },

  // ----------------------
  // Diff (basic)
  // ----------------------
  async getDiff(repoPath, file) {
    try {
      const git = getGit(repoPath)
      return await git.diff(file ? [file] : undefined)
    } catch (err) {
      throw normalizeError(err)
    }
  },
}