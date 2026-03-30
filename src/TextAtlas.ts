import { createCanvas, get2DContext } from './utils/canvas'
import { ensureFontReady, parseFontSize } from './utils/fontLoader'
import { measureTextBlock } from './utils/layout'
import type { TextAtlas, TextAtlasEntry, TextAtlasOptions } from './types'

function nextPowerOfTwo(value: number): number {
  let size = 1
  while (size < value) {
    size *= 2
  }
  return size
}

function uniqueTexts(texts: string[]): string[] {
  return [...new Set(texts)]
}

function packShelf(
  blocks: Array<{ text: string; width: number; height: number }>,
  size: number,
  padding: number,
): Map<string, TextAtlasEntry> | null {
  let x = padding
  let y = padding
  let rowHeight = 0
  const entries = new Map<string, TextAtlasEntry>()

  for (const block of blocks) {
    if (block.width > size - padding * 2 || block.height > size - padding * 2) {
      return null
    }

    if (x + block.width > size - padding) {
      x = padding
      y += rowHeight + padding
      rowHeight = 0
    }

    if (y + block.height > size - padding) {
      return null
    }

    const entryX = x
    const entryY = y
    const entryWidth = block.width
    const entryHeight = block.height

    entries.set(block.text, {
      text: block.text,
      x: entryX,
      y: entryY,
      width: entryWidth,
      height: entryHeight,
      uv: {
        u0: entryX / size,
        v0: entryY / size,
        u1: (entryX + entryWidth) / size,
        v1: (entryY + entryHeight) / size,
      },
    })

    x += block.width + padding
    rowHeight = Math.max(rowHeight, block.height)
  }

  return entries
}

export async function createTextAtlas(
  texts: string[],
  font: string,
  options: TextAtlasOptions = {},
): Promise<TextAtlas> {
  await ensureFontReady(font)

  const maxWidth = options.maxWidth ?? 256
  const padding = options.padding ?? 8
  const baseSize = options.atlasSize ?? 1024
  const fontSize = parseFontSize(font)
  const lineHeight = Math.ceil(fontSize * 1.25)
  const blocks = uniqueTexts(texts).map((text) => {
    const measured = measureTextBlock(text, font, maxWidth, lineHeight)
    return {
      text,
      width: Math.ceil(measured.width) + padding * 2,
      height: Math.ceil(Math.max(lineHeight, measured.height)) + padding * 2,
    }
  })

  blocks.sort((a, b) => b.height - a.height || b.width - a.width)

  const estimated = nextPowerOfTwo(
    Math.max(
      baseSize,
      Math.ceil(Math.sqrt(blocks.reduce((sum, block) => sum + block.width * block.height, 0))) * 2,
    ),
  )

  let atlasSize = estimated
  let entries = packShelf(blocks, atlasSize, padding)
  while (!entries) {
    atlasSize *= 2
    entries = packShelf(blocks, atlasSize, padding)
  }

  const canvas = createCanvas(atlasSize, atlasSize)
  const ctx = get2DContext(canvas)
  ctx.clearRect(0, 0, atlasSize, atlasSize)
  ctx.font = font
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#000000'

  for (const block of blocks) {
    const entry = entries.get(block.text)
    if (!entry) {
      continue
    }
    const measured = measureTextBlock(block.text, font, maxWidth, lineHeight)
    const startX = entry.x + padding
    const startY = entry.y + padding
    measured.lines.forEach((line, index) => {
      ctx.fillText(line.text, startX, startY + index * lineHeight)
    })
  }

  return {
    canvas,
    entries,
    font,
    maxWidth,
    padding,
    atlasSize,
    getUV(text: string): TextAtlasEntry | undefined {
      return entries.get(text)
    },
  }
}
