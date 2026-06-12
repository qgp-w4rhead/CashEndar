// EasyOCR provider — optional Python sidecar. Requires `pip install
// easyocr` (pulls PyTorch, heavy); availability is probed once and the
// provider simply reports unavailable otherwise.
import { spawn } from 'child_process'
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { OcrProvider, OcrResult } from '../types'

const RUNNER_PATH = join(__dirname, '..', 'easyocr_runner.py')
const PYTHON = process.env.EASYOCR_PYTHON || 'python3'

let availabilityProbe: Promise<{ available: boolean, reason?: string }> | null = null

function probeAvailability(): Promise<{ available: boolean, reason?: string }> {
  if (!availabilityProbe) {
    availabilityProbe = new Promise(resolve => {
      const probe = spawn(PYTHON, ['-c', 'import easyocr'], { stdio: 'ignore' })
      const timer = setTimeout(() => {
        probe.kill()
        resolve({ available: false, reason: 'python probe timed out' })
      }, 30000)
      probe.on('error', () => {
        clearTimeout(timer)
        resolve({ available: false, reason: `${PYTHON} not found` })
      })
      probe.on('exit', code => {
        clearTimeout(timer)
        resolve(code === 0
          ? { available: true }
          : { available: false, reason: 'easyocr not installed (pip install easyocr)' })
      })
    })
  }
  return availabilityProbe
}

function runEasyOcr(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON, [RUNNER_PATH, imagePath])
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => {
      child.kill()
      reject(new Error('EasyOCR timed out'))
    }, 120000)

    child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.on('data', chunk => { stderr += chunk })
    child.on('error', error => {
      clearTimeout(timer)
      reject(error)
    })
    child.on('exit', code => {
      clearTimeout(timer)
      if (code !== 0) {
        reject(new Error(`EasyOCR failed: ${stderr || `exit code ${code}`}`))
        return
      }
      try {
        const parsed = JSON.parse(stdout)
        resolve(parsed.text ?? '')
      } catch {
        reject(new Error('EasyOCR returned invalid JSON'))
      }
    })
  })
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/bmp': '.bmp',
  'image/tiff': '.tiff',
}

export const easyocrProvider: OcrProvider = {
  id: 'easyocr',
  label: 'EasyOCR (local, Python)',
  supportsPdf: false,

  isAvailable: probeAvailability,

  async extract(buffer: Buffer, mimetype: string): Promise<OcrResult> {
    const extension = EXTENSIONS[mimetype] || '.jpg'
    const tmpPath = join(tmpdir(), `cashendar-ocr-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`)
    await writeFile(tmpPath, buffer)
    try {
      const rawText = await runEasyOcr(tmpPath)
      return { rawText }
    } finally {
      unlink(tmpPath).catch(() => { /* tmp cleanup is best-effort */ })
    }
  },
}
