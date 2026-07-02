/**
 * M2Choice — elección guiada reutilizable: dos pancartas antagónicas. Elijas la
 * que elijas avanzas (ilusión de elección), pero la narración responde. Mismo
 * concepto que el GuidedChoice de Tarot, con la estética de cartel.
 */
export function M2Choice({ prompt, left, right, onLeft, onRight }) {
  return (
    <>
      {prompt && <p className="m2-pick">{prompt}</p>}
      <div className="m2-banners">
        <button className="m2-banner rojo" onClick={onLeft}>
          <span className="m2-banner-glifo">{left.glifo}</span>
          <span className="m2-banner-nom">{left.texto}</span>
        </button>
        <button className="m2-banner amarillo" onClick={onRight}>
          <span className="m2-banner-glifo">{right.glifo}</span>
          <span className="m2-banner-nom">{right.texto}</span>
        </button>
      </div>
    </>
  )
}

export default M2Choice
