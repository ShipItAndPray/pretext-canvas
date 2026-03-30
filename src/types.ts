export interface Padding {
  top: number
  right: number
  bottom: number
  left: number
}

export interface ShadowSpec {
  offsetX: number
  offsetY: number
  blur: number
  color: string
}

export interface TextLine {
  text: string
  width: number
  y: number
}

export interface RenderTextResult {
  width: number
  height: number
  lineCount: number
  lines: TextLine[]
}

export interface RenderTextOptions {
  x: number
  y: number
  maxWidth: number
  font: string
  lineHeight: number
  color?: string
  textAlign?: CanvasTextAlign
  textBaseline?: CanvasTextBaseline
  opacity?: number
}

export interface TextBoxOptions extends RenderTextOptions {
  padding?: Partial<Padding>
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  shadow?: ShadowSpec
}

export interface TextAtlasEntry {
  text: string
  x: number
  y: number
  width: number
  height: number
  uv: { u0: number; v0: number; u1: number; v1: number }
}

export type CanvasLike = HTMLCanvasElement | OffscreenCanvas

export interface TextAtlas {
  canvas: CanvasLike
  entries: Map<string, TextAtlasEntry>
  font: string
  maxWidth: number
  padding: number
  atlasSize: number
  getUV(text: string): TextAtlasEntry | undefined
}

export interface TextAtlasOptions {
  maxWidth?: number
  padding?: number
  atlasSize?: number
}

export interface RichTextSegment {
  text: string
  font?: string
  color?: string
  opacity?: number
}

export interface RenderRichTextOptions extends Omit<RenderTextOptions, 'font' | 'color'> {
  segments: RichTextSegment[]
}

export interface WebGLTextPosition {
  x: number
  y: number
}
