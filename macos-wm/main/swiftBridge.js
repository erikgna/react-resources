import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { app } from 'electron'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function getBinaryPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'wm-helper')
  }
  return path.join(__dirname, '../swift-helper/.build/release/wm-helper')
}

function runHelper(request) {
  return new Promise((resolve, reject) => {
    const binaryPath = getBinaryPath()
    const proc = spawn(binaryPath, [], { stdio: ['pipe', 'pipe', 'pipe'] })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (d) => { stdout += d })
    proc.stderr.on('data', (d) => { stderr += d })

    proc.on('close', (code) => {
      try {
        resolve(JSON.parse(stdout))
      } catch {
        reject(new Error(`wm-helper exit ${code}: ${stderr || stdout}`))
      }
    })

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn wm-helper: ${err.message}. Build it with: cd swift-helper && swift build -c release`))
    })

    proc.stdin.write(JSON.stringify(request))
    proc.stdin.end()
  })
}

export const swiftBridge = {
  getScreenInfo() {
    return runHelper({ action: 'getScreenInfo' })
  },
  moveWindow(pid, frame) {
    return runHelper({ action: 'moveWindow', pid, frame })
  },
}
