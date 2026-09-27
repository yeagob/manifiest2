const nf = new Intl.NumberFormat('es-ES')
export const num = n => nf.format(Math.round(n || 0))
export const km = steps => `${nf.format(Math.round((steps || 0) * 0.762 / 100) / 10)} km`
export const ago = iso => {
  if (!iso) return 'nunca'
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const h = Math.round(mins / 60)
  return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} d`
}
