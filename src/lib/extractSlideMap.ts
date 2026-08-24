/**
 * Slide extraction.
 *
 * Pulls both halves of what the narrator will eventually need out of a PDF:
 * the machine-readable text, and a rendered image of the page. The image is
 * what lets the narrator talk about diagrams and formulas — those carry no
 * extractable text at all, so a text-only pass sees a slide like that as empty.
 *
 * This opens its own pdf.js document, independent of the one the viewer is
 * rendering, so extraction can't disturb what's on screen.
 */

import { pdfjs } from './pdf'
import type { Slide, SlideMap } from '../types'

/**
 * Longest edge, in px, of the rendered page image. Sized for a vision model:
 * large enough to keep formulas and diagram labels legible, small enough to
 * keep the base64 payload reasonable.
 */
const MAX_IMAGE_EDGE = 1600

/** Never upscale a page more than this, however small its native size is. */
const MAX_SCALE = 3

/** JPEG rather than PNG: a slide image is ~10x smaller with no meaningful loss. */
const IMAGE_TYPE = 'image/jpeg'
const IMAGE_QUALITY = 0.85

type PdfPage = Awaited<ReturnType<Awaited<ReturnType<typeof pdfjs.getDocument>['promise']>['getPage']>>

/** Flatten a page's text items, preserving pdf.js's line breaks. */
async function extractText(page: PdfPage): Promise<string> {
  const content = await page.getTextContent()

  const text = content.items
    .map(item => {
      // items are TextItem | TextMarkedContent; only the former carries text
      if (!('str' in item)) return ''
      return item.str + (item.hasEOL ? '\n' : '')
    })
    .join('')

  return text
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim()
}

/** Render a page to an offscreen canvas and return it as a base64 data URL. */
async function renderToDataUrl(page: PdfPage): Promise<string> {
  const natural = page.getViewport({ scale: 1 })
  const scale = Math.min(MAX_IMAGE_EDGE / Math.max(natural.width, natural.height), MAX_SCALE)
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)

  await page.render({
    canvas,
    viewport,
    // PDF pages are transparent; without an explicit fill the JPEG encodes as black
    background: '#ffffff',
  }).promise

  return canvas.toDataURL(IMAGE_TYPE, IMAGE_QUALITY)
}

/**
 * Extract every page of `url` as a Slide carrying both its text and its image.
 * `Slide.index` is the 1-based PDF page number, matching how pages are
 * identified elsewhere in the app (e.g. the viewer's skipped-page set).
 */
export async function extractSlideMap(url: string, sourceFileName: string): Promise<SlideMap> {
  const doc = await pdfjs.getDocument(url).promise

  try {
    const slides: Slide[] = []

    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      const page = await doc.getPage(pageNumber)

      try {
        const rawText = await extractText(page)
        const imageUrl = await renderToDataUrl(page)
        slides.push({ id: String(pageNumber), index: pageNumber, rawText, imageUrl })
      } finally {
        page.cleanup()
      }
    }

    return { slides, totalSlides: slides.length, sourceFileName }
  } finally {
    await doc.destroy()
  }
}
