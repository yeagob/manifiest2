import * as THREE from 'three'
import { RISO_INKS, createRng } from '@manifiest/shared'

export const INK = RISO_INKS.ink
export const PAPER = '#FFFDF6'
export const KRAFT = '#C9A26B'
export const INKS = [RISO_INKS.fluoPink, RISO_INKS.blue, RISO_INKS.yellow, RISO_INKS.mint, RISO_INKS.orange, RISO_INKS.purple, RISO_INKS.teal, RISO_INKS.green, RISO_INKS.sunflower, RISO_INKS.red]

export function canvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')]
}

export function toTexture(c, { repeat = false, mipmaps = true } = {}) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  t.generateMipmaps = mipmaps
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

export function grain(ctx, w, h, amount = 0.07, seed = 'g') {
  const rng = createRng(seed)
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue
    const n = (rng() - 0.5) * 255 * amount
    d[i] += n; d[i + 1] += n; d[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)
}

export function cutout(ctx, drawPath, { fill, stroke = PAPER, border = 10, shadow = true, ink = 0 }) {
  ctx.save()
  if (shadow) {
    ctx.save()
    ctx.translate(4, 6)
    drawPath(ctx)
    ctx.lineJoin = 'round'
    ctx.lineWidth = border
    ctx.strokeStyle = 'rgba(29,27,47,.28)'
    ctx.fillStyle = 'rgba(29,27,47,.28)'
    ctx.stroke()
    ctx.fill()
    ctx.restore()
  }
  drawPath(ctx)
  ctx.lineJoin = 'round'
  ctx.lineWidth = border
  ctx.strokeStyle = stroke
  ctx.stroke()
  ctx.fillStyle = fill
  ctx.fill()
  if (ink) {
    drawPath(ctx)
    ctx.lineWidth = ink
    ctx.strokeStyle = INK
    ctx.stroke()
  }
  ctx.restore()
}

export function fitText(ctx, text, maxWidth, maxSize, font = 'Anton') {
  let size = maxSize
  do {
    ctx.font = `${size}px ${font}, Impact, sans-serif`
    if (ctx.measureText(text).width <= maxWidth) break
    size -= 2
  } while (size > 12)
  return size
}

export function wrapLines(ctx, text, maxWidth, maxLines = 2) {
  const words = text.split(/\s+/)
  const lines = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else line = test
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    kept[maxLines - 1] = `${kept[maxLines - 1]}…`
    return kept
  }
  return lines
}

export function screenText(ctx, text, x, y, { fill = RISO_INKS.yellow, shadow = RISO_INKS.fluoPink, stroke = INK, width = 8, offset = 6 } = {}) {
  ctx.lineJoin = 'round'
  ctx.fillStyle = shadow
  ctx.fillText(text, x + offset, y + offset)
  ctx.strokeStyle = stroke
  ctx.lineWidth = width
  ctx.strokeText(text, x, y)
  ctx.fillStyle = fill
  ctx.fillText(text, x, y)
}

let fontsReady = null
export function ensureFonts() {
  fontsReady ??= Promise.all([
    document.fonts.load('64px Anton'),
    document.fonts.load('600 32px "Bricolage Grotesque"')
  ]).catch(() => {})
  return fontsReady
}
