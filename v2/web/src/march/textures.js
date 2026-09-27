import * as THREE from 'three'
import { RISO_INKS, createRng } from '@manifiest/shared'
import { unitMarkup } from '../components/unitMarkup.js'
import { canvas, toTexture, grain, cutout, fitText, wrapLines, screenText, INK, PAPER, KRAFT, INKS } from './paper.js'

export const FIG_W = 176
export const FIG_H = 230
export const FIG_ASPECT = FIG_W / FIG_H

const PLACARD_STYLES = {
  placard_carton: { bg: '#D9B98A', fg: INK, edge: '#A57E48' },
  placard_riso: { bg: RISO_INKS.fluoPink, fg: '#fff', edge: RISO_INKS.blue },
  placard_neon: { bg: '#1D1B2F', fg: '#7DF9FF', edge: RISO_INKS.fluoPink },
  placard_bordado: { bg: '#FFF3E0', fg: RISO_INKS.red, edge: RISO_INKS.red },
  placard_serigrafia: { bg: RISO_INKS.yellow, fg: INK, edge: INK },
  placard_collage: { bg: '#fff', fg: INK, edge: RISO_INKS.mint },
  placard_linograbado: { bg: INK, fg: '#F4EFE6', edge: '#F4EFE6' }
}

class LruCache {
  constructor(max) { this.max = max; this.map = new Map() }
  get(key) {
    const v = this.map.get(key)
    if (v) { this.map.delete(key); this.map.set(key, v) }
    return v
  }
  set(key, value) {
    this.map.set(key, value)
    while (this.map.size > this.max) {
      const [k, old] = this.map.entries().next().value
      this.map.delete(k)
      old.dispose?.()
    }
  }
}

function svgToImage(svg) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })
}

export class FigureTextures {
  constructor(max = 900) {
    this.cache = new LruCache(max)
    this.queue = []
    this.pending = new Map()
    this.active = 0
    this.concurrency = 6
  }

  request(fig, onReady) {
    const hit = this.cache.get(fig.key)
    if (hit) return hit
    if (this.pending.has(fig.key)) {
      this.pending.get(fig.key).push(onReady)
      return null
    }
    this.pending.set(fig.key, [onReady])
    this.queue.push(fig)
    return null
  }

  prioritize(keyOrder) {
    const rank = new Map(keyOrder.map((k, i) => [k, i]))
    this.queue.sort((a, b) => (rank.get(a.key) ?? 1e9) - (rank.get(b.key) ?? 1e9))
  }

  pump() {
    while (this.active < this.concurrency && this.queue.length) {
      const fig = this.queue.shift()
      this.active++
      const svg = unitMarkup({ genome: fig.genome, loadout: fig.loadout, rank: fig.rank, size: 132, grain: false })
      svgToImage(svg).then(img => {
        const [c, ctx] = canvas(FIG_W, FIG_H)
        ctx.drawImage(img, 0, 0, FIG_W, FIG_H)
        const tex = toTexture(c)
        this.cache.set(fig.key, tex)
        for (const cb of this.pending.get(fig.key) ?? []) cb?.(tex)
      }).catch(() => {}).finally(() => {
        this.pending.delete(fig.key)
        this.active--
      })
    }
  }
}

const quickCache = new LruCache(1500)
export function quickFigureTexture(fig) {
  const hit = quickCache.get(fig.key)
  if (hit) return hit
  const W = 88
  const H = 115
  const [c, ctx] = canvas(W, H)
  const k = W / 132
  ctx.scale(k, k)
  ctx.translate(6, 8)
  const g = fig.genome
  ctx.fillStyle = 'rgba(29,27,47,.18)'
  ctx.beginPath(); ctx.ellipse(60, 150, 30, 5, 0, 0, Math.PI * 2); ctx.fill()
  cutout(ctx, p => {
    p.beginPath()
    p.arc(60, 54, 25, 0, Math.PI * 2)
    p.moveTo(34, 150); p.lineTo(34, 110); p.quadraticCurveTo(34, 84, 60, 82); p.quadraticCurveTo(86, 84, 86, 110); p.lineTo(86, 150); p.closePath()
  }, { fill: '#fff', border: 7, shadow: true })
  ctx.fillStyle = fig.colors.secondary
  ctx.fillRect(45, 126, 11, 22); ctx.fillRect(64, 126, 11, 22)
  ctx.fillStyle = fig.colors.primary
  ctx.beginPath(); ctx.moveTo(36, 136); ctx.quadraticCurveTo(32, 92, 60, 84); ctx.quadraticCurveTo(88, 92, 84, 136); ctx.closePath(); ctx.fill()
  ctx.fillStyle = g.skin
  ctx.beginPath(); ctx.arc(60, 54, 23, 0, Math.PI * 2); ctx.fill()
  if (g.hair !== 'bald') {
    ctx.fillStyle = g.hairColor
    ctx.beginPath(); ctx.arc(60, 48, 24, Math.PI * 1.05, Math.PI * 1.95); ctx.quadraticCurveTo(60, 36, 36, 50); ctx.fill()
  }
  ctx.fillStyle = INK
  ctx.beginPath(); ctx.arc(51, 57, 2.6, 0, Math.PI * 2); ctx.arc(69, 57, 2.6, 0, Math.PI * 2); ctx.fill()
  if (['sign', 'flag', 'bigflag', 'lantern', 'pole', 'card', 'megaphone'].includes(g.heldItem)) {
    ctx.fillStyle = '#8B5A2B'
    ctx.fillRect(94, 14, 4, 84)
    ctx.fillStyle = g.heldItem === 'sign' ? PAPER : fig.colors.secondary
    ctx.fillRect(78, 8, 38, 26)
  }
  const tex = toTexture(c)
  quickCache.set(fig.key, tex)
  return tex
}

let placeholder
export function placeholderTexture() {
  if (placeholder) return placeholder
  const [c, ctx] = canvas(FIG_W, FIG_H)
  const s = FIG_W / 132
  ctx.scale(s, s)
  ctx.translate(6, 8)
  cutout(ctx, g => {
    g.beginPath()
    g.arc(60, 54, 24, 0, Math.PI * 2)
    g.moveTo(34, 146)
    g.quadraticCurveTo(30, 96, 60, 82)
    g.quadraticCurveTo(90, 96, 86, 146)
    g.closePath()
  }, { fill: '#ffffff', border: 7 })
  placeholder = toTexture(c)
  return placeholder
}

const panelCache = new LruCache(400)
export function blockPanelTexture(block) {
  const key = `panel:${block.key}:${block.figures.length}`
  const hit = panelCache.get(key)
  if (hit) return hit
  const W = 512
  const H = 224
  const [c, ctx] = canvas(W, H)
  const rng = createRng(block.key)
  const shown = block.figures.slice(0, 27)
  const perRow = Math.ceil(shown.length / 3) || 1
  for (let row = 0; row < 3; row++) {
    const items = shown.slice(row * perRow, (row + 1) * perRow)
    items.forEach((f, i) => {
      const x = 40 + ((i + 0.5 + (row % 2) * 0.35) / perRow) * (W - 80)
      const y = 92 + row * 38 + (rng() - 0.5) * 6
      const sc = 0.9 + rng() * 0.2 + (f.scale > 1 ? 0.5 : 0)
      cutout(ctx, g => {
        g.beginPath()
        g.arc(x, y - 30 * sc, 13 * sc, 0, Math.PI * 2)
        g.moveTo(x - 17 * sc, y + 22 * sc)
        g.quadraticCurveTo(x - 18 * sc, y - 12 * sc, x, y - 16 * sc)
        g.quadraticCurveTo(x + 18 * sc, y - 12 * sc, x + 17 * sc, y + 22 * sc)
        g.closePath()
      }, { fill: f.colors.primary, border: 6, shadow: row === 2 })
      ctx.fillStyle = f.genome.skin
      ctx.beginPath()
      ctx.arc(x, y - 30 * sc, 11 * sc, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = f.genome.hairColor
      ctx.beginPath()
      ctx.arc(x, y - 34 * sc, 11 * sc, Math.PI, 0)
      ctx.fill()
      if (rng() < 0.35) {
        ctx.fillStyle = f.colors.secondary
        ctx.fillRect(x + 8 * sc, y - 70 * sc, 26 * sc, 18 * sc)
        ctx.fillStyle = '#8B5A2B'
        ctx.fillRect(x + 20 * sc, y - 52 * sc, 2.5 * sc, 30 * sc)
      }
    })
  }
  cutout(ctx, g => { g.beginPath(); g.rect(10, H - 30, W - 20, 20) }, { fill: KRAFT, border: 6 })
  grain(ctx, W, H, 0.06, block.key)
  const tex = toTexture(c)
  panelCache.set(key, tex)
  return tex
}

const carpetCache = new LruCache(400)
export function carpetTexture(block) {
  const key = `carpet:${block.key}:${block.figures.length}`
  const hit = carpetCache.get(key)
  if (hit) return hit
  const width = 10
  const length = block.z1 - block.z0
  const PX = 24
  const W = Math.round(width * PX)
  const H = Math.max(32, Math.round(length * PX))
  const [c, ctx] = canvas(W, H)
  for (const f of block.figures) {
    const x = (f.x + width / 2) * PX
    const y = (f.z - block.z0) * PX
    const r = 11 * f.scale
    ctx.fillStyle = PAPER
    ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = f.colors.primary
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = f.genome.hair === 'bald' ? f.genome.skin : f.genome.hairColor
    ctx.beginPath(); ctx.arc(x, y - 1, r * 0.55, 0, Math.PI * 2); ctx.fill()
    if (['sign', 'flag', 'bigflag', 'card'].includes(f.genome.heldItem)) {
      ctx.fillStyle = f.genome.heldItem === 'sign' ? PAPER : f.colors.secondary
      ctx.fillRect(x + r * 0.4, y - r * 1.6, r * 1.3, r * 0.9)
    }
  }
  const tex = toTexture(c)
  carpetCache.set(key, tex)
  return tex
}

const signCache = new LruCache(300)
export function signTexture(block, cause) {
  const key = `sign:${block.key}:${block.placard?.text ?? ''}`
  const hit = signCache.get(key)
  if (hit) return hit
  const W = 768
  const H = 330
  const [c, ctx] = canvas(W, H)
  const style = PLACARD_STYLES[block.placard?.style] ?? PLACARD_STYLES.placard_carton
  const rng = createRng(key)
  const jag = () => (rng() - 0.5) * 10
  cutout(ctx, g => {
    g.beginPath()
    g.moveTo(24 + jag(), 22 + jag())
    for (let x = 60; x <= W - 24; x += 48) g.lineTo(x + jag(), 20 + jag())
    for (let y = 60; y <= H - 70; y += 48) g.lineTo(W - 22 + jag(), y + jag())
    for (let x = W - 60; x >= 24; x -= 48) g.lineTo(x + jag(), H - 64 + jag())
    for (let y = H - 100; y >= 30; y -= 48) g.lineTo(22 + jag(), y + jag())
    g.closePath()
  }, { fill: style.bg, border: 12 })
  if (block.placard?.style === 'placard_collage') {
    ;['#FFE800', '#82D8D5', '#FF48B0'].forEach((col, i) => { ctx.fillStyle = col; ctx.globalAlpha = 0.5; ctx.fillRect(60 + i * 200, 40, 160, 190); ctx.globalAlpha = 1 })
  }
  ctx.fillStyle = 'rgba(255, 236, 170, .75)'
  ctx.save(); ctx.translate(W / 2, 22); ctx.rotate(-0.04); ctx.fillRect(-60, -14, 120, 30); ctx.restore()
  const text = (block.placard?.text ?? (block.type === 'citizens' ? cause.title : block.title)).toUpperCase()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const size = fitText(ctx, text, W - 110, 96)
  const lines = size < 54 ? (ctx.font = '60px Anton, Impact, sans-serif', wrapLines(ctx, text, W - 110, 2)) : [text]
  const lineSize = lines.length > 1 ? 60 : size
  ctx.font = `${lineSize}px Anton, Impact, sans-serif`
  ctx.fillStyle = style.fg
  if (block.placard?.style === 'placard_neon') { ctx.shadowColor = '#7DF9FF'; ctx.shadowBlur = 18 }
  lines.forEach((l, i) => ctx.fillText(l, W / 2, 132 + (i - (lines.length - 1) / 2) * (lineSize + 6)))
  ctx.shadowBlur = 0
  ctx.font = '600 26px "Bricolage Grotesque", sans-serif'
  ctx.fillStyle = style.fg
  ctx.globalAlpha = 0.85
  const credit = block.owner ? `BLOQUE DE ${block.owner.displayName.toUpperCase()} · NV ${block.owner.level}` : `BLOQUE CIUDADANO · ${block.people} PERSONAS`
  ctx.fillText(credit, W / 2, H - 100)
  ctx.globalAlpha = 1
  ctx.fillStyle = '#8B5A2B'
  ctx.fillRect(120, H - 62, 14, 62)
  ctx.fillRect(W - 134, H - 62, 14, 62)
  grain(ctx, W, H, 0.07, key)
  const tex = toTexture(c)
  signCache.set(key, tex)
  return tex
}

const specialCache = new Map()
function memo(key, make) {
  if (!specialCache.has(key)) specialCache.set(key, make())
  return specialCache.get(key)
}

export function headBannerTexture(cause) {
  return memo(`head:${cause.id}:${cause.title}`, () => {
    const W = 2048
    const H = 420
    const [c, ctx] = canvas(W, H)
    cutout(ctx, g => { g.beginPath(); g.moveTo(30, 40); g.lineTo(W - 30, 26); g.lineTo(W - 40, H - 40); g.lineTo(40, H - 26); g.closePath() }, { fill: PAPER, border: 18, ink: 6 })
    ctx.fillStyle = cause.color
    ctx.fillRect(40, H - 120, W - 80, 70)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const title = cause.title.toUpperCase()
    const size = fitText(ctx, title, W - 180, 190)
    ctx.font = `${size}px Anton, Impact, sans-serif`
    screenText(ctx, title, W / 2, 160, { fill: INK, shadow: RISO_INKS.fluoPink, stroke: PAPER, width: 4, offset: 8 })
    ctx.font = '600 44px "Bricolage Grotesque", sans-serif'
    ctx.fillStyle = '#fff'
    const demand = `EXIGIMOS: ${cause.demand.toUpperCase()}`
    fitText(ctx, demand, W - 160, 44, '"Bricolage Grotesque"')
    ctx.fillText(demand, W / 2, H - 85)
    grain(ctx, W, H, 0.06, 'head')
    return toTexture(c)
  })
}

export function bannerTexture(text, colors) {
  return memo(`banner:${text}:${colors.primary}`, () => {
    const W = 1400
    const H = 240
    const [c, ctx] = canvas(W, H)
    cutout(ctx, g => { g.beginPath(); g.moveTo(20, 30); g.quadraticCurveTo(W / 2, 50, W - 20, 30); g.lineTo(W - 20, H - 30); g.quadraticCurveTo(W / 2, H - 10, 20, H - 30); g.closePath() }, { fill: PAPER, border: 14 })
    ctx.fillStyle = colors.secondary
    ctx.fillRect(40, 40, 22, H - 80)
    ctx.fillRect(W - 62, 40, 22, H - 80)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const t = text.toUpperCase()
    const size = fitText(ctx, t, W - 200, 150)
    ctx.font = `${size}px Anton, Impact, sans-serif`
    ctx.fillStyle = colors.primary
    ctx.fillText(t, W / 2, H / 2 + 6)
    grain(ctx, W, H, 0.06, t)
    return toTexture(c)
  })
}

export function whaleTexture(colors) {
  return memo(`whale:${colors.primary}`, () => {
    const W = 768
    const H = 320
    const [c, ctx] = canvas(W, H)
    const body = g => {
      g.beginPath()
      g.moveTo(60, 170)
      g.bezierCurveTo(90, 60, 420, 40, 560, 130)
      g.bezierCurveTo(610, 150, 640, 120, 690, 70)
      g.bezierCurveTo(700, 120, 720, 150, 740, 170)
      g.bezierCurveTo(700, 175, 660, 190, 610, 190)
      g.bezierCurveTo(500, 270, 160, 280, 60, 170)
      g.closePath()
    }
    cutout(ctx, body, { fill: RISO_INKS.blue, border: 12, ink: 4 })
    ctx.save()
    body(ctx)
    ctx.clip()
    ctx.fillStyle = RISO_INKS.mint
    ctx.beginPath()
    ctx.ellipse(300, 250, 280, 80, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(29,27,47,.4)'
    ctx.lineWidth = 3
    for (let x = 140; x < 480; x += 26) { ctx.beginPath(); ctx.moveTo(x, 205); ctx.lineTo(x + 10, 250); ctx.stroke() }
    ctx.restore()
    ctx.fillStyle = INK
    ctx.beginPath(); ctx.arc(150, 150, 9, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = PAPER
    ctx.beginPath(); ctx.arc(147, 147, 3, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = RISO_INKS.fluoPink
    ctx.globalAlpha = 0.5
    ctx.beginPath(); ctx.arc(120, 180, 12, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 1
    grain(ctx, W, H, 0.07, 'whale')
    return toTexture(c)
  })
}

export function dragonTextures(colors) {
  return memo(`dragon:${colors.primary}`, () => {
    const [hc, h] = canvas(384, 320)
    cutout(h, g => {
      g.beginPath()
      g.moveTo(40, 200); g.lineTo(90, 90); g.lineTo(130, 130); g.lineTo(170, 40); g.lineTo(210, 120); g.lineTo(260, 60); g.lineTo(290, 150)
      g.lineTo(350, 170); g.lineTo(340, 230); g.lineTo(260, 290); g.lineTo(120, 290); g.closePath()
    }, { fill: RISO_INKS.red, border: 12, ink: 4 })
    h.fillStyle = RISO_INKS.sunflower
    h.beginPath(); h.moveTo(120, 290); h.lineTo(260, 290); h.lineTo(300, 240); h.lineTo(90, 240); h.closePath(); h.fill()
    h.fillStyle = PAPER
    h.beginPath(); h.arc(160, 170, 28, 0, Math.PI * 2); h.arc(250, 170, 28, 0, Math.PI * 2); h.fill()
    h.fillStyle = INK
    h.beginPath(); h.arc(165, 172, 12, 0, Math.PI * 2); h.arc(245, 172, 12, 0, Math.PI * 2); h.fill()
    h.strokeStyle = PAPER; h.lineWidth = 6
    for (let x = 120; x < 280; x += 22) { h.beginPath(); h.moveTo(x, 250); h.lineTo(x + 8, 275); h.stroke() }
    h.strokeStyle = RISO_INKS.sunflower; h.lineWidth = 5
    h.beginPath(); h.moveTo(330, 200); h.quadraticCurveTo(380, 180, 370, 120); h.stroke()
    grain(h, 384, 320, 0.07, 'dh')
    const [sc, s] = canvas(256, 200)
    cutout(s, g => {
      g.beginPath()
      g.moveTo(20, 60); g.quadraticCurveTo(128, 10, 236, 60); g.lineTo(236, 150); g.quadraticCurveTo(128, 190, 20, 150); g.closePath()
    }, { fill: RISO_INKS.red, border: 10, ink: 3 })
    s.fillStyle = RISO_INKS.sunflower
    for (let x = 40; x < 220; x += 34) { s.beginPath(); s.moveTo(x, 50); s.lineTo(x + 17, 20); s.lineTo(x + 34, 50); s.fill() }
    s.fillStyle = colors.secondary
    s.globalAlpha = 0.85
    for (let x = 40; x < 220; x += 44) { s.beginPath(); s.arc(x + 10, 105, 16, 0, Math.PI * 2); s.fill() }
    s.globalAlpha = 1
    grain(s, 256, 200, 0.07, 'ds')
    return { head: toTexture(hc), segment: toTexture(sc) }
  })
}

export function doveTexture() {
  return memo('dove', () => {
    const [c, ctx] = canvas(128, 96)
    cutout(ctx, g => {
      g.beginPath()
      g.moveTo(10, 50); g.quadraticCurveTo(40, 10, 70, 44); g.quadraticCurveTo(90, 10, 122, 20)
      g.quadraticCurveTo(100, 50, 84, 62); g.quadraticCurveTo(60, 90, 30, 70); g.closePath()
    }, { fill: '#fff', border: 6, ink: 2.5 })
    ctx.fillStyle = RISO_INKS.orange
    ctx.beginPath(); ctx.moveTo(10, 50); ctx.lineTo(0, 54); ctx.lineTo(12, 56); ctx.fill()
    return toTexture(c)
  })
}

export function lanternTexture() {
  return memo('lantern', () => {
    const [c, ctx] = canvas(96, 128)
    cutout(ctx, g => { g.beginPath(); g.ellipse(48, 64, 36, 44, 0, 0, Math.PI * 2) }, { fill: RISO_INKS.red, border: 6, ink: 2 })
    ctx.strokeStyle = RISO_INKS.sunflower
    ctx.lineWidth = 3
    for (const dx of [-18, 0, 18]) { ctx.beginPath(); ctx.ellipse(48 + dx * 0.2, 64, Math.abs(dx) + 4, 42, 0, 0, Math.PI * 2); ctx.stroke() }
    ctx.fillStyle = INK
    ctx.fillRect(34, 16, 28, 8)
    ctx.fillRect(34, 104, 28, 8)
    return toTexture(c)
  })
}

export function rainbowTexture() {
  return memo('rainbow', () => {
    const [c, ctx] = canvas(1024, 160)
    const colors = ['#E40303', '#FF8C00', '#FFED00', '#008026', '#004DFF', '#750787']
    cutout(ctx, g => {
      g.beginPath()
      g.moveTo(10, 20)
      for (let x = 0; x <= 1004; x += 40) g.lineTo(10 + x, 20 + Math.sin(x / 90) * 8)
      g.lineTo(1014, 140)
      for (let x = 1004; x >= 0; x -= 40) g.lineTo(10 + x, 140 + Math.sin(x / 90) * 8)
      g.closePath()
    }, { fill: PAPER, border: 10 })
    colors.forEach((col, i) => {
      ctx.fillStyle = col
      ctx.beginPath()
      const y0 = 24 + i * 19.5
      ctx.moveTo(14, y0)
      for (let x = 0; x <= 1000; x += 40) ctx.lineTo(14 + x, y0 + Math.sin(x / 90) * 8)
      for (let x = 1000; x >= 0; x -= 40) ctx.lineTo(14 + x, y0 + 19.5 + Math.sin(x / 90) * 8)
      ctx.fill()
    })
    grain(ctx, 1024, 160, 0.06, 'rb')
    return toTexture(c)
  })
}

export function mosaicTexture(icon, color) {
  return memo(`mosaic:${icon}:${color}`, () => {
    const cols = 16
    const rows = 12
    const [src, sctx] = canvas(cols * 8, rows * 8)
    sctx.fillStyle = color
    sctx.fillRect(0, 0, cols * 8, rows * 8)
    sctx.font = `${rows * 7}px sans-serif`
    sctx.textAlign = 'center'
    sctx.textBaseline = 'middle'
    sctx.fillText(icon, cols * 4, rows * 4 + 4)
    const data = sctx.getImageData(0, 0, cols * 8, rows * 8).data
    const cell = 48
    const [c, ctx] = canvas(cols * cell, rows * cell)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = ((y * 8 + 4) * cols * 8 + (x * 8 + 4)) * 4
        ctx.fillStyle = `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`
        ctx.fillRect(x * cell + 3, y * cell + 3, cell - 6, cell - 6)
        ctx.fillStyle = 'rgba(255,255,255,.18)'
        ctx.fillRect(x * cell + 3, y * cell + 3, cell - 6, 6)
      }
    }
    return toTexture(c)
  })
}

export function glowTexture(color = '#FFB511') {
  return memo(`glow:${color}`, () => {
    const [c, ctx] = canvas(128, 128)
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64)
    g.addColorStop(0, color)
    g.addColorStop(0.35, `${color}aa`)
    g.addColorStop(1, `${color}00`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    return toTexture(c, { mipmaps: false })
  })
}

export function puffTexture() {
  return memo('puff', () => {
    const [c, ctx] = canvas(128, 128)
    const rng = createRng('puff')
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(40 + rng() * 48, 40 + rng() * 48, 22 + rng() * 14, 0, Math.PI * 2)
      ctx.fill()
    }
    return toTexture(c)
  })
}

export function roadTexture() {
  return memo('road', () => {
    const [c, ctx] = canvas(512, 512)
    ctx.fillStyle = '#5A5670'
    ctx.fillRect(0, 0, 512, 512)
    const rng = createRng('road')
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = rng() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.07)'
      ctx.fillRect(rng() * 512, rng() * 512, 2 + rng() * 6, 1 + rng() * 3)
    }
    ctx.fillStyle = '#F4EFE6'
    ctx.fillRect(248, 30, 16, 190)
    ctx.fillRect(248, 286, 16, 190)
    ctx.fillStyle = '#C9A26B'
    ctx.fillRect(0, 0, 18, 512)
    ctx.fillRect(494, 0, 18, 512)
    grain(ctx, 512, 512, 0.08, 'road')
    return toTexture(c, { repeat: true })
  })
}

export function groundTexture() {
  return memo('ground', () => {
    const [c, ctx] = canvas(512, 512)
    ctx.fillStyle = '#E4D6BC'
    ctx.fillRect(0, 0, 512, 512)
    ctx.strokeStyle = 'rgba(165,126,72,.35)'
    ctx.lineWidth = 3
    for (let y = 0; y <= 512; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke() }
    for (let y = 0; y < 512; y += 64) for (let x = (y / 64) % 2 ? 32 : 0; x <= 512; x += 64) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 64); ctx.stroke() }
    grain(ctx, 512, 512, 0.1, 'ground')
    return toTexture(c, { repeat: true })
  })
}

const SHOPS = ['BAR', 'FARMACIA', 'LIBRERÍA', 'PANADERÍA', 'KIOSCO', 'ULTRAMARINOS', 'TALLER', 'CAFÉ', 'MERCADO', 'IMPRENTA']
export function buildingTexture(seed) {
  return memo(`bld:${seed}`, () => {
    const rng = createRng(`bld:${seed}`)
    const floors = 3 + Math.floor(rng() * 4)
    const W = 320
    const H = 90 + floors * 70
    const [c, ctx] = canvas(W, H + 30)
    const body = INKS[Math.floor(rng() * INKS.length)]
    const trim = INKS[Math.floor(rng() * INKS.length)]
    const roof = rng()
    cutout(ctx, g => {
      g.beginPath()
      g.moveTo(16, H + 14)
      g.lineTo(16, 40)
      if (roof < 0.33) { g.lineTo(W / 2, 8); g.lineTo(W - 16, 40) } else if (roof < 0.66) { g.lineTo(40, 22); g.lineTo(W - 40, 22); g.lineTo(W - 16, 40) } else g.lineTo(W - 16, 40)
      g.lineTo(W - 16, H + 14)
      g.closePath()
    }, { fill: body, border: 10 })
    ctx.fillStyle = 'rgba(255,255,255,.18)'
    ctx.fillRect(16, 40, W - 32, 10)
    for (let f = 0; f < floors; f++) {
      const y = 62 + f * 70
      for (let i = 0; i < 3; i++) {
        const x = 40 + i * 88
        ctx.fillStyle = PAPER
        ctx.fillRect(x - 4, y - 4, 60, 52)
        ctx.fillStyle = rng() < 0.25 ? '#FFE9A8' : '#3D5588'
        ctx.fillRect(x, y, 52, 44)
        ctx.fillStyle = trim
        ctx.fillRect(x - 6, y + 44, 64, 7)
        if (rng() < 0.2) { ctx.fillStyle = INKS[Math.floor(rng() * INKS.length)]; ctx.fillRect(x + 6, y + 10, 40, 26) }
      }
    }
    const shop = SHOPS[Math.floor(rng() * SHOPS.length)]
    ctx.fillStyle = trim
    ctx.fillRect(22, H - 44, W - 44, 30)
    for (let x = 22; x < W - 22; x += 24) { ctx.fillStyle = x / 24 % 2 ? PAPER : trim; ctx.beginPath(); ctx.moveTo(x, H - 14); ctx.lineTo(x + 12, H - 2); ctx.lineTo(x + 24, H - 14); ctx.fill() }
    ctx.fillStyle = INK
    ctx.textAlign = 'center'
    ctx.font = '26px Anton, Impact, sans-serif'
    ctx.fillText(shop, W / 2, H - 20)
    grain(ctx, W, H + 30, 0.07, `bld:${seed}`)
    return { texture: toTexture(c), aspect: W / (H + 30) }
  })
}

export function treeTexture(seed) {
  return memo(`tree:${seed % 3}`, () => {
    const rng = createRng(`tree:${seed % 3}`)
    const [c, ctx] = canvas(192, 288)
    cutout(ctx, g => { g.beginPath(); g.rect(86, 170, 20, 110) }, { fill: '#8B5A2B', border: 7 })
    cutout(ctx, g => {
      g.beginPath()
      for (let i = 0; i < 7; i++) g.arc(96 + Math.cos(i) * 44 * rng(), 110 + Math.sin(i * 1.7) * 44 * rng(), 44, 0, Math.PI * 2)
    }, { fill: seed % 2 ? RISO_INKS.green : '#00873F', border: 8 })
    grain(ctx, 192, 288, 0.07, `tree${seed}`)
    return toTexture(c)
  })
}

export function lampTexture() {
  return memo('lamp', () => {
    const [c, ctx] = canvas(96, 320)
    cutout(ctx, g => { g.beginPath(); g.rect(42, 60, 12, 250); g.moveTo(20, 60); g.lineTo(76, 60); g.lineTo(62, 26); g.lineTo(34, 26); g.closePath() }, { fill: INK, border: 6 })
    ctx.fillStyle = '#FFE9A8'
    ctx.fillRect(36, 52, 24, 10)
    return toTexture(c)
  })
}

export function cloudTexture(seed) {
  return memo(`cloud:${seed % 3}`, () => {
    const rng = createRng(`cloud${seed % 3}`)
    const [c, ctx] = canvas(384, 160)
    cutout(ctx, g => {
      g.beginPath()
      for (let i = 0; i < 6; i++) g.arc(60 + i * 52, 90 - rng() * 30, 34 + rng() * 22, 0, Math.PI * 2)
      g.rect(50, 90, 280, 40)
    }, { fill: '#FFFDF6', border: 6, shadow: false })
    return toTexture(c)
  })
}

export function skyTexture(mode) {
  return memo(`sky:${mode}`, () => {
    const [c, ctx] = canvas(16, 256)
    const g = ctx.createLinearGradient(0, 0, 0, 256)
    const stops = {
      day: ['#9FD3E6', '#CFE8F0', '#F4E9D2'],
      dusk: ['#3D5588', '#FF6C2F', '#FFB511'],
      night: ['#0E0C22', '#1D1B2F', '#3D2B55']
    }[mode]
    g.addColorStop(0, stops[0]); g.addColorStop(0.55, stops[1]); g.addColorStop(1, stops[2])
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 16, 256)
    return toTexture(c, { mipmaps: false })
  })
}

export function disposeSpecials() {
  for (const v of specialCache.values()) {
    if (v?.dispose) v.dispose()
    else if (v?.texture) v.texture.dispose()
    else if (v?.head) { v.head.dispose(); v.segment.dispose() }
  }
  specialCache.clear()
}
