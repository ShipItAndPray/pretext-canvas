import { layoutWithLines, prepareWithSegments } from '@chenglou/pretext'

import type { TextLine } from '../types'

export interface MeasuredBlock {
  lines: TextLine[]
  width: number
  height: number
  lineCount: number
}

function normalizeLine(line: unknown, index: number): TextLine {
  if (typeof line === 'string') {
    return { text: line, width: 0, y: index }
  }

  if (line && typeof line === 'object') {
    const candidate = line as { text?: unknown; width?: unknown; y?: unknown }
    return {
      text: typeof candidate.text === 'string' ? candidate.text : '',
      width: typeof candidate.width === 'number' ? candidate.width : 0,
      y: typeof candidate.y === 'number' ? candidate.y : index,
    }
  }

  return { text: String(line ?? ''), width: 0, y: index }
}

function extractLines(layout: unknown): TextLine[] {
  if (Array.isArray(layout)) {
    return layout.map((line, index) => normalizeLine(line, index))
  }

  if (layout && typeof layout === 'object') {
    const candidate = layout as { lines?: unknown; text?: unknown; width?: unknown }
    if (Array.isArray(candidate.lines)) {
      return candidate.lines.map((line, index) => normalizeLine(line, index))
    }
    if (typeof candidate.text === 'string') {
      return [{ text: candidate.text, width: typeof candidate.width === 'number' ? candidate.width : 0, y: 0 }]
    }
  }

  return [{ text: String(layout ?? ''), width: 0, y: 0 }]
}

export function measureTextBlock(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
): MeasuredBlock {
  const prepared = prepareWithSegments(text, font)
  const layout = layoutWithLines(prepared, maxWidth, lineHeight)
  const lines = extractLines(layout).map((line, index) => ({
    ...line,
    y: index * lineHeight,
  }))
  const width = lines.reduce((max, line) => Math.max(max, line.width), 0)
  const height = layout.height

  return { lines, width, height, lineCount: layout.lineCount }
}
