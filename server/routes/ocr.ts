import { Router, Request, Response } from 'express'
import multer from 'multer'
import { getProvider, getProviderStatuses } from '../ocr'
import { parseReceiptText } from '../ocr/receipt-parser'

const router = Router()

const ACCEPTED_MIMETYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'application/pdf',
])

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (ACCEPTED_MIMETYPES.has(file.mimetype)) {
      callback(null, true)
    } else {
      callback(new Error(`Unsupported file type: ${file.mimetype}`))
    }
  },
})

// GET /api/ocr/providers - Which OCR engines are usable right now
router.get('/providers', async (_req: Request, res: Response) => {
  try {
    const providers = await getProviderStatuses()
    res.json(providers)
  } catch (error) {
    console.error('Error listing OCR providers:', error)
    res.status(500).json({ error: 'Failed to list OCR providers' })
  }
})

// POST /api/ocr/scan - Analyze an uploaded bill
// multipart/form-data: file=<image|pdf>, provider=<tesseract|easyocr|mistral>
router.post('/scan', (req: Request, res: Response) => {
  upload.single('file')(req, res, async (uploadError: unknown) => {
    if (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Upload failed'
      res.status(400).json({ error: message })
      return
    }

    try {
      const file = req.file
      if (!file) {
        res.status(400).json({ error: 'No file uploaded (field name: file)' })
        return
      }

      const providerId = (req.body?.provider as string) || 'tesseract'
      const provider = getProvider(providerId)
      if (!provider) {
        res.status(400).json({ error: `Unknown OCR provider: ${providerId}` })
        return
      }

      const { available, reason } = await provider.isAvailable()
      if (!available) {
        res.status(400).json({ error: `Provider ${provider.label} is not available${reason ? `: ${reason}` : ''}` })
        return
      }

      if (file.mimetype === 'application/pdf' && !provider.supportsPdf) {
        res.status(400).json({ error: `${provider.label} cannot read PDFs — use the Mistral provider or upload an image` })
        return
      }

      const result = await provider.extract(file.buffer, file.mimetype)
      const receipt = result.structured ?? parseReceiptText(result.rawText)

      if (receipt.lines.length === 0) {
        res.status(422).json({
          error: 'No line items could be extracted from this bill',
          rawText: result.rawText,
        })
        return
      }

      res.json({
        provider: provider.id,
        receipt,
        rawText: result.rawText,
      })
    } catch (error) {
      console.error('Error scanning bill:', error)
      const message = error instanceof Error ? error.message : 'Failed to scan the bill'
      res.status(500).json({ error: message })
    }
  })
})

export default router
