/**
 * M2Popup — tarjeta/popup reutilizable con la estética "cartel de protesta"
 * de Manifiest2: neobrutalista, bordes marcados, sombra dura desplazada,
 * esquinas amables. Reutilizable en onboarding, avisos, confirmaciones…
 *
 * Mismo espíritu que el MysticPopup de Tarot, pero con la voz de este proyecto.
 */
export function M2Popup({ children, icon, title, onClose, overlay = true, size = 'md' }) {
  const anchos = { sm: 380, md: 460, lg: 560 }
  const card = (
    <div className="m2-pop" style={{ maxWidth: anchos[size] }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
      {onClose && <button className="m2-pop-close" onClick={onClose} aria-label="Cerrar">✕</button>}
      {icon && <div className="m2-pop-icon">{icon}</div>}
      {title && <h2 className="m2-pop-title">{title}</h2>}
      {children}
    </div>
  )
  if (!overlay) return card
  return (
    <div className="m2-pop-overlay" onClick={onClose}>{card}</div>
  )
}

export default M2Popup
