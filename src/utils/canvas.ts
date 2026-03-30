import type { CanvasLike } from '../types'

export function createCanvas(width: number, height: number): CanvasLike {
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  }

  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height)
  }

  throw new Error('No canvas implementation is available in this environment.')
}

export type Canvas2DContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

export function get2DContext(canvas: CanvasLike): Canvas2DContext {
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Unable to acquire a 2D canvas context.')
  }
  return context
}
