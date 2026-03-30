export async function ensureFontReady(font: string): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return
  }

  const fontSet = document.fonts
  const load = fontSet.load?.bind(fontSet)
  if (load) {
    await load(font)
  }

  if (fontSet.ready) {
    await fontSet.ready
  }
}

export function parseFontSize(font: string): number {
  const match = /(\d+(?:\.\d+)?)px/i.exec(font)
  if (!match) {
    return 16
  }
  return Number(match[1])
}
