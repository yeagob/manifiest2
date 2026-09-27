import { RISO_INKS } from '@manifiest/shared'
import { canvas, grain, fitText, wrapLines, screenText, ensureFonts, INK, PAPER } from './paper.js'

export const FORMATS = {
  story: { label: 'Historia 9:16', w: 1080, h: 1920 },
  square: { label: 'Cuadrado 1:1', w: 1080, h: 1080 },
  wide: { label: 'Panorámica 16:9', w: 1920, h: 1080 }
}

export const FILTERS = {
  papel: { label: 'Papel', level: 1 },
  riso: { label: 'Riso', level: 6 },
  serigrafia: { label: 'Serigrafía', level: 12 },
  noche: { label: 'Farolillos', level: 8 }
}

export const TEMPLATES = {
  epica: { label: 'Cifra épica' },
  kilometros: { label: 'Kilómetros' },
  bloque: { label: 'Mi bloque' },
  minimal: { label: 'Mínima' }
}

const nf = new Intl.NumberFormat('es-ES')
const hexToRgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function coverDraw(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height)
  const sw = w / scale
  const sh = h / scale
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h)
}

function applyFilter(ctx, w, h, filter) {
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  if (filter === 'papel') {
    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.min(255, d[i] * 1.04 + 6)
      d[i + 1] = Math.min(255, d[i + 1] * 1.01 + 3)
      d[i + 2] = d[i + 2] * 0.94
    }
    ctx.putImageData(img, 0, 0)
    return
  }
  if (filter === 'noche') {
    for (let i = 0; i < d.length; i += 4) {
      const l = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255
      const glow = Math.max(0, l - 0.6) * 2.4
      d[i] = Math.min(255, d[i] * 0.95 + 255 * glow * 0.7 + 10)
      d[i + 1] = Math.min(255, d[i + 1] * 0.85 + 181 * glow * 0.8)
      d[i + 2] = Math.min(255, d[i + 2] * 0.95 + 30 + 17 * glow)
    }
    ctx.putImageData(img, 0, 0)
    return
  }
  if (filter === 'riso') {
    const pink = hexToRgb(RISO_INKS.fluoPink)
    const blue = hexToRgb(RISO_INKS.blue)
    const paper = hexToRgb('#F4EFE6')
    const lum = new Float32Array(w * h)
    for (let i = 0, p = 0; i < d.length; i += 4, p++) lum[p] = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255
    const off = Math.round(w / 300)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x
        const a = 1 - lum[p]
        const b = 1 - lum[Math.min(w * h - 1, Math.max(0, p + off + off * w))]
        const k = Math.min(1, a * 1.15) * 0.9
        const m = Math.min(1, Math.max(0, b - 0.25) * 1.4) * 0.85
        const i = p * 4
        for (let c = 0; c < 3; c++) {
          let v = paper[c]
          v = v * (1 - m) + v * (blue[c] / 255) * m
          v = v * (1 - k) + v * (pink[c] / 255) * k
          d[i + c] = v
        }
      }
    }
    ctx.putImageData(img, 0, 0)
    return
  }
  if (filter === 'serigrafia') {
    const src = new Uint8ClampedArray(d)
    ctx.fillStyle = '#F4EFE6'
    ctx.fillRect(0, 0, w, h)
    const cell = Math.max(5, Math.round(w / 240))
    for (let y = 0; y < h; y += cell) {
      for (let x = 0; x < w; x += cell) {
        const i = (Math.min(h - 1, y + (cell >> 1)) * w + Math.min(w - 1, x + (cell >> 1))) * 4
        const r = src[i], g = src[i + 1], b = src[i + 2]
        const l = (r * 0.3 + g * 0.59 + b * 0.11) / 255
        const q = v => Math.round(v / 85) * 85
        ctx.fillStyle = `rgb(${q(r)},${q(g)},${q(b)})`
        const radius = (cell / 2) * (0.35 + (1 - l) * 0.95)
        ctx.beginPath()
        ctx.arc(x + cell / 2, y + cell / 2, radius, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}

function tape(ctx, x, y, w, rot) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.fillStyle = 'rgba(255, 236, 170, .82)'
  ctx.fillRect(-w / 2, -22, w, 44)
  ctx.restore()
}

export const DEFAULT_SHOW = { cause: true, date: true, people: true, demand: true, steps: true }

export async function composePoster({ image, format, filter, template, cause, stats, block, date = new Date(), show = DEFAULT_SHOW }) {
  await ensureFonts()
  const { w, h } = FORMATS[format]
  const [c, ctx] = canvas(w, h)
  ctx.fillStyle = '#EFE7D8'
  ctx.fillRect(0, 0, w, h)
  const img = await loadImage(image)
  const portrait = h > w
  const margin = Math.round(w * 0.06)
  const photoW = w - margin * 2
  const photoH = portrait ? Math.round(h * 0.47) : format === 'square' ? Math.round(h * 0.44) : Math.round(h * 0.7)
  const photoX = margin
  const photoY = portrait ? Math.round(h * 0.145) : format === 'square' ? Math.round(h * 0.205) : Math.round(h * 0.08)
  const [pc, pctx] = canvas(photoW, photoH)
  coverDraw(pctx, img, 0, 0, photoW, photoH)
  applyFilter(pctx, photoW, photoH, filter)
  ctx.save()
  ctx.translate(photoX + photoW / 2, photoY + photoH / 2)
  ctx.rotate(-0.012)
  ctx.fillStyle = 'rgba(29,27,47,.25)'
  ctx.fillRect(-photoW / 2 - 10, -photoH / 2 - 4, photoW + 28, photoH + 30)
  ctx.fillStyle = PAPER
  ctx.fillRect(-photoW / 2 - 16, -photoH / 2 - 16, photoW + 32, photoH + 32)
  ctx.drawImage(pc, -photoW / 2, -photoH / 2)
  ctx.restore()
  tape(ctx, photoX + 60, photoY - 6, 170, -0.3)
  tape(ctx, photoX + photoW - 60, photoY + photoH + 6, 170, -0.25)

  const people = stats.uniquePeople
  const km = (stats.totalSteps * 0.762) / 1000
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  const titleSize = fitText(ctx, cause.title.toUpperCase(), w - margin * 2, portrait ? 110 : 96)
  ctx.font = `${titleSize}px Anton, Impact, sans-serif`
  const titleY = portrait ? Math.round(h * 0.07) : format === 'square' ? Math.round(h * 0.1) : Math.round(h * 0.07)
  if (format !== 'wide' && show.cause) {
    ctx.fillStyle = cause.color
    ctx.fillRect(margin - 20, titleY - titleSize * 0.95, ctx.measureText(cause.title.toUpperCase()).width + 40, titleSize * 1.12)
    ctx.fillStyle = '#fff'
    ctx.fillText(cause.title.toUpperCase(), margin, titleY)
  }

  if (format === 'wide' && show.cause) {
    ctx.font = `${Math.min(titleSize, 84)}px Anton, Impact, sans-serif`
    const tw = ctx.measureText(cause.title.toUpperCase()).width
    ctx.save()
    ctx.translate(photoX + 30, photoY + 40)
    ctx.rotate(-0.02)
    ctx.fillStyle = cause.color
    ctx.fillRect(-16, 0, tw + 32, 100)
    ctx.fillStyle = '#fff'
    ctx.fillText(cause.title.toUpperCase(), 0, 80)
    ctx.restore()
  }
  const dateText = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()
  if (show.date) {
    ctx.save()
    ctx.font = `${portrait ? 46 : 34}px Anton, Impact, sans-serif`
    const dw = ctx.measureText(dateText).width
    const dx = format === 'wide' ? photoX + photoW - dw - 40 : margin
    const dy = format === 'wide' ? photoY + 70 : titleY + (portrait ? 74 : 52)
    ctx.fillStyle = INK
    ctx.fillRect(dx - 14, dy - (portrait ? 44 : 33), dw + 28, portrait ? 58 : 44)
    ctx.fillStyle = RISO_INKS.yellow
    ctx.fillText(dateText, dx, dy)
    ctx.restore()
  }
  if (show.people && template !== 'epica') {
    ctx.save()
    const label = `${nf.format(people)} ${people === 1 ? 'PERSONA APOYA' : 'PERSONAS APOYAN'} ESTA CAUSA`
    ctx.font = `${portrait ? 54 : 40}px Anton, Impact, sans-serif`
    const lw = ctx.measureText(label).width
    ctx.translate(format === 'wide' ? photoX + photoW - lw - 50 : margin + 10, format === 'wide' ? photoY + 150 : photoY + photoH - 36)
    ctx.rotate(-0.02)
    ctx.fillStyle = RISO_INKS.fluoPink
    ctx.fillRect(-16, -(portrait ? 50 : 38), lw + 32, portrait ? 66 : 50)
    ctx.fillStyle = '#fff'
    ctx.fillText(label, 0, 0)
    ctx.restore()
  }

  const footerY = h - margin + 6
  let y = photoY + photoH + (portrait ? 60 : 36)
  if (template === 'epica' || template === 'kilometros') {
    const big = template === 'epica' ? nf.format(people) : nf.format(Math.round(km))
    const label = template === 'epica' ? (people === 1 ? 'PERSONA EN LA CALLE' : 'PERSONAS EN LA CALLE') : 'KILÓMETROS CAMINADOS'
    const bigSize = portrait ? 290 : format === 'square' ? 150 : 170
    const labelSize = portrait ? 64 : format === 'square' ? 40 : 46
    ctx.font = `${bigSize}px Anton, Impact, sans-serif`
    if (format === 'wide') {
      const bx = photoX + 40
      const by = photoY + photoH - 90
      screenText(ctx, big, bx, by, { fill: RISO_INKS.yellow, shadow: RISO_INKS.fluoPink, stroke: INK, width: 10, offset: 10 })
      ctx.font = `${labelSize}px Anton, Impact, sans-serif`
      ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.strokeText(label, bx, by + 62)
      ctx.fillStyle = '#fff'; ctx.fillText(label, bx, by + 62)
    } else {
      const by = y + bigSize * 0.8
      screenText(ctx, big, margin, by, { fill: RISO_INKS.yellow, shadow: RISO_INKS.fluoPink, stroke: INK, width: portrait ? 14 : 9, offset: portrait ? 14 : 8 })
      ctx.font = `${labelSize}px Anton, Impact, sans-serif`
      ctx.fillStyle = INK
      ctx.fillText(label, margin, by + labelSize + (portrait ? 26 : 16))
      y = by + labelSize + (portrait ? 26 : 16)
    }
  } else if (template === 'bloque' && block) {
    const size = portrait ? 104 : format === 'square' ? 70 : 80
    ctx.font = `${size}px Anton, Impact, sans-serif`
    const bx = format === 'wide' ? photoX + 40 : margin
    const by = format === 'wide' ? photoY + photoH - 100 : y + size * 0.85
    fitText(ctx, block.title.toUpperCase(), w - margin * 2, size)
    screenText(ctx, block.title.toUpperCase(), bx, by, { fill: '#fff', shadow: cause.color, stroke: INK, width: 10, offset: 8 })
    const sub = portrait ? 42 : 30
    ctx.font = `600 ${sub}px "Bricolage Grotesque", sans-serif`
    ctx.fillStyle = format === 'wide' ? '#fff' : INK
    ctx.fillText(`${block.figures.length} figuras · ${block.owner ? `nivel ${block.owner.level}` : `${block.people} personas`} · una más entre ${nf.format(people)}`, bx, by + sub + 22)
    if (format !== 'wide') y = by + sub + 22
  }

  if (template !== 'minimal' && format !== 'wide' && show.demand) {
    const size = portrait ? 40 : 28
    const lh = size * 1.25
    ctx.font = `600 ${size}px "Bricolage Grotesque", sans-serif`
    ctx.fillStyle = INK
    const room = Math.floor((footerY - size - 24 - (y + (portrait ? 70 : 44))) / lh) + 1
    if (room >= 1) {
      const lines = wrapLines(ctx, `EXIGIMOS: ${cause.demand.toUpperCase()} → ${cause.target.toUpperCase()}`, w - margin * 2, Math.min(room, portrait ? 3 : 2))
      lines.forEach((l, i) => ctx.fillText(l, margin, y + (portrait ? 70 : 44) + i * lh))
    }
  }

  ctx.font = `${portrait ? 40 : 30}px Anton, Impact, sans-serif`
  ctx.fillStyle = INK
  ctx.textAlign = 'left'
  const stamp = [show.steps && `${nf.format(stats.totalSteps)} PASOS REALES`, show.steps && `${nf.format(stats.figures)} FIGURAS`, show.people && `${nf.format(people)} PERSONAS`].filter(Boolean).join(' · ')
  if (stamp) {
    fitText(ctx, stamp, w - margin * 2 - 260, portrait ? 40 : 30)
    ctx.fillText(stamp, margin, h - margin + 6)
  }
  ctx.textAlign = 'right'
  ctx.font = `${portrait ? 56 : 42}px Anton, Impact, sans-serif`
  ctx.fillStyle = RISO_INKS.fluoPink
  ctx.fillText('MANIFIEST', w - margin, h - margin + 6)
  ctx.save()
  ctx.translate(w - margin - 150, format === 'wide' ? photoY + photoH - 70 : portrait ? photoY + 60 : photoY + 50)
  ctx.rotate(0.14)
  ctx.strokeStyle = RISO_INKS.red
  ctx.lineWidth = 6
  ctx.strokeRect(-110, -44, 220, 88)
  ctx.font = '42px Anton, Impact, sans-serif'
  ctx.fillStyle = RISO_INKS.red
  ctx.textAlign = 'center'
  ctx.fillText('CIFRAS REALES', 0, 16)
  ctx.restore()
  grain(ctx, w, h, 0.05, 'poster')
  return c
}

export async function sharePoster(canvasEl, { title, text }) {
  const blob = await new Promise(r => canvasEl.toBlob(r, 'image/png'))
  const file = new File([blob], 'manifiest-mani.png', { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title, text })
    return 'shared'
  }
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: 'manifiest-mani.png' })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return 'downloaded'
}
