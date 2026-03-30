import { createTextAtlas } from './TextAtlas'
import type { TextAtlas, WebGLTextPosition } from './types'

type GL = WebGLRenderingContext | WebGL2RenderingContext

const programCache = new WeakMap<GL, WebGLProgram>()
const textureCache = new WeakMap<GL, WebGLTexture>()

const VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec2 a_uv;
uniform vec2 u_resolution;
uniform vec2 u_position;
uniform vec2 u_size;
uniform float u_scale;
varying vec2 v_uv;

void main() {
  vec2 pixelPosition = u_position + a_position * u_size * u_scale;
  vec2 zeroToOne = pixelPosition / u_resolution;
  vec2 clipSpace = zeroToOne * 2.0 - 1.0;
  gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
  v_uv = a_uv;
}
`

const FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D u_texture;
varying vec2 v_uv;

void main() {
  gl_FragColor = texture2D(u_texture, v_uv);
}
`

function compileShader(gl: GL, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) {
    throw new Error('Unable to create a WebGL shader.')
  }
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? 'unknown error'
    gl.deleteShader(shader)
    throw new Error(`Failed to compile WebGL shader: ${info}`)
  }
  return shader
}

function getProgram(gl: GL): WebGLProgram {
  const cached = programCache.get(gl)
  if (cached) {
    return cached
  }

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
  const program = gl.createProgram()
  if (!program) {
    throw new Error('Unable to create a WebGL program.')
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) ?? 'unknown error'
    gl.deleteProgram(program)
    throw new Error(`Failed to link WebGL program: ${info}`)
  }

  programCache.set(gl, program)
  return program
}

function getTexture(gl: GL, atlas: TextAtlas): WebGLTexture {
  const cached = textureCache.get(gl)
  if (cached) {
    return cached
  }

  const texture = gl.createTexture()
  if (!texture) {
    throw new Error('Unable to create a WebGL texture.')
  }

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas.canvas as TexImageSource)

  textureCache.set(gl, texture)
  return texture
}

export async function renderTextWebGL(
  gl: GL,
  text: string,
  atlas: TextAtlas,
  position: WebGLTextPosition,
  scale = 1,
): Promise<void> {
  let entry = atlas.getUV(text)
  let sourceAtlas = atlas
  if (!entry) {
    sourceAtlas = await createTextAtlas([text], atlas.font, {
      maxWidth: atlas.maxWidth,
      padding: atlas.padding,
      atlasSize: atlas.atlasSize,
    })
    entry = sourceAtlas.getUV(text)
  }

  if (!entry) {
    throw new Error(`Text "${text}" could not be resolved in the atlas.`)
  }

  const program = getProgram(gl)
  const texture = getTexture(gl, sourceAtlas)
  gl.useProgram(program)

  const positionBuffer = gl.createBuffer()
  const uvBuffer = gl.createBuffer()
  if (!positionBuffer || !uvBuffer) {
    throw new Error('Unable to create WebGL buffers.')
  }

  const x = position.x
  const y = position.y
  const width = entry.width * scale
  const height = entry.height * scale

  const positions = new Float32Array([
    x, y,
    x + width, y,
    x, y + height,
    x, y + height,
    x + width, y,
    x + width, y + height,
  ])

  const uvs = new Float32Array([
    entry.uv.u0, entry.uv.v0,
    entry.uv.u1, entry.uv.v0,
    entry.uv.u0, entry.uv.v1,
    entry.uv.u0, entry.uv.v1,
    entry.uv.u1, entry.uv.v0,
    entry.uv.u1, entry.uv.v1,
  ])

  const positionLocation = gl.getAttribLocation(program, 'a_position')
  const uvLocation = gl.getAttribLocation(program, 'a_uv')
  const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
  const textureLocation = gl.getUniformLocation(program, 'u_texture')
  const positionUniform = gl.getUniformLocation(program, 'u_position')
  const sizeUniform = gl.getUniformLocation(program, 'u_size')
  const scaleUniform = gl.getUniformLocation(program, 'u_scale')

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(uvLocation)
  gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0)

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.activeTexture(gl.TEXTURE0)
  if (textureLocation) {
    gl.uniform1i(textureLocation, 0)
  }
  if (resolutionLocation) {
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height)
  }
  if (positionUniform) {
    gl.uniform2f(positionUniform, x, y)
  }
  if (sizeUniform) {
    gl.uniform2f(sizeUniform, entry.width, entry.height)
  }
  if (scaleUniform) {
    gl.uniform1f(scaleUniform, scale)
  }

  gl.drawArrays(gl.TRIANGLES, 0, 6)
}
