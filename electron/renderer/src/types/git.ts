export interface GitFile {
  path: string
  index: string
  working_dir: string
}

export interface GitStatus {
  current: string | null
  ahead: number
  behind: number
  files: GitFile[]
}

export interface GitCommit {
  hash: string
  message: string
  author_name: string
  date: string
}

export interface GitBranches {
  current: string
  all: string[]
}
