import { renderText } from './CanvasText'
import { ensureFontReady } from './utils/fontLoader'
import { measureTextBlock } from './utils/layout'
import type { Padding, RenderTextResult, TextBoxOptions } from './types'

function normalizePadding(padding?: Partial<Padding>): Padding {
  return {
    top: padding?.top ?? 0,
    right: padding?.right ?? 0,
    bottom: padding?.bottom ?? 0,
    left: padding?.left ?? 0,
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2))
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export async function renderTextBox(
  ctx: CanvasRenderingContext2D,
  text: string,
  options: TextBoxOptions,
): Promise<RenderTextResult> {
  const padding = normalizePadding(options.padding)

  // Measure text first (without drawing) to determine box dimensions.
  // We use a dry-run renderText to get the metrics, then draw the box,
  // then draw the text on top.
  const innerOptions = {
    ...options,
    x: options.x + padding.left,
    y: options.y + padding.top,
    maxWidth: Math.max(0, options.maxWidth - padding.left - padding.right),
  }

  await ensureFontReady(options.font)
  const measured = measureTextBlock(text, options.font, innerOptions.maxWidth, options.lineHeight)

  const width = Math.max(measured.width + padding.left + padding.right, options.maxWidth)
  const height = measured.height + padding.top + padding.bottom
  const radius = options.borderRadius ?? 0

  // 1. Draw shadow + background
  ctx.save()

  if (options.shadow) {
    ctx.shadowOffsetX = options.shadow.offsetX
    ctx.shadowOffsetY = options.shadow.offsetY
    ctx.shadowBlur = options.shadow.blur
    ctx.shadowColor = options.shadow.color
  }

  if (options.backgroundColor) {
    ctx.fillStyle = options.backgroundColor
    drawRoundedRect(ctx, options.x, options.y, width, height, radius)
    ctx.fill()
  }

  // 2. Draw border (after clearing shadow so it doesn't double-shadow)
  if (options.borderColor && (options.borderWidth ?? 0) > 0) {
    ctx.shadowColor = 'transparent'
    ctx.lineWidth = options.borderWidth ?? 1
    ctx.strokeStyle = options.borderColor
    drawRoundedRect(ctx, options.x, options.y, width, height, radius)
    ctx.stroke()
  }

  ctx.restore()

  // 3. Render text inside padded area (on top of background)
  const textResult = await renderText(ctx, text, innerOptions)

  return {
    ...textResult,
    width,
    height,
  }
}
