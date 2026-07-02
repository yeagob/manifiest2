/**
 * M2Onboarding — primer contacto guiado estilo videojuego para Manifiest2.
 *
 * Mismo concepto que el onboarding de Tarot, con la voz de este proyecto:
 * la primera vez, "La Organizadora" te lleva por las features del movimiento
 * mediante elecciones antagónicas (dos pancartas). Cada paso es una ELECCIÓN o
 * una ACCIÓN (sin pantallas genéricas de "Siguiente"). Termina uniéndote al
 * movimiento (login) y con una recompensa que informa tu nivel de partida.
 */
import { useState } from 'react'
import { M2Popup } from './M2Popup'
import { M2Choice } from './M2Choice'

export const M2_ONBOARDING_KEY = 'manifiest2_onboarding_v1'

export function M2Onboarding({ onFinish, onSkip }) {
  const [paso, setPaso] = useState('bienvenida')
  const [ecoCausa, setEcoCausa] = useState(null)
  const [ecoRitmo, setEcoRitmo] = useState(null)

  const pasos = ['bienvenida', 'causa', 'pasos', 'tracker', 'niveles', 'union']
  const idx = pasos.indexOf(paso)

  const Progreso = () => (
    <div className="m2-onb-progress">
      {pasos.map((_, k) => (
        <span key={k} className={`m2-onb-dot${k === idx ? ' on' : ''}${k < idx ? ' done' : ''}`} />
      ))}
    </div>
  )

  return (
    <div className="m2-onb-overlay">
      <button className="m2-onb-skip" onClick={onSkip}>Omitir ✕</button>
      <Progreso />

      {/* 1. Bienvenida + elección de causa (sabor) */}
      {paso === 'bienvenida' && (
        <M2Popup overlay={false} icon="✊" title="¡Bienvenido a la marcha!">
          <p className="m2-onb-text">
            {ecoCausa === null
              ? 'Soy la Organizadora. Aquí tus pasos se convierten en apoyo real a las causas que te importan. Empieza escogiendo tu bandera: no hay causa pequeña.'
              : ecoCausa === 'social'
                ? '✊ La justicia se camina. Tu energía irá a las causas sociales.'
                : '🌍 El planeta te necesita en pie. Tu energía irá a las causas del clima.'}
          </p>
          {ecoCausa === null ? (
            <M2Choice
              prompt="Escoge tu bandera"
              left={{ glifo: '✊', texto: 'Justicia social' }}
              right={{ glifo: '🌍', texto: 'Planeta y clima' }}
              onLeft={() => setEcoCausa('social')}
              onRight={() => setEcoCausa('clima')}
            />
          ) : (
            <button className="m2-onb-next" onClick={() => setPaso('causa')}>A la calle →</button>
          )}
        </M2Popup>
      )}

      {/* 2. Las causas */}
      {paso === 'causa' && (
        <M2Popup overlay={false} icon="❤️" title="Las causas">
          <p className="m2-onb-text">
            Descubre causas que ya existen o crea la tuya. Cada una es una marcha viva: cuanta más gente camina por ella, más fuerte suena. Apoya las que creas.
          </p>
          <button className="m2-onb-next" onClick={() => setPaso('pasos')}>Lo tengo →</button>
        </M2Popup>
      )}

      {/* 3. Pasos = XP */}
      {paso === 'pasos' && (
        <M2Popup overlay={false} icon="👟" title="Cada paso cuenta">
          <p className="m2-onb-text">
            {ecoRitmo === null
              ? 'Cada paso que das es 1 XP que reparten tus causas. Caminas, subes de nivel y arrastras a tu gente. ¿Con qué ritmo marchas?'
              : ecoRitmo === 'calma'
                ? '🚶 Paso firme y constante. La marcha larga se gana caminando.'
                : '🏃 A todo pulmón. Vas a hacer temblar las estadísticas.'}
          </p>
          {ecoRitmo === null ? (
            <M2Choice
              prompt="Tu ritmo"
              left={{ glifo: '🚶', texto: 'Paso firme' }}
              right={{ glifo: '🏃', texto: 'Con fuerza' }}
              onLeft={() => setEcoRitmo('calma')}
              onRight={() => setEcoRitmo('fuerza')}
            />
          ) : (
            <button className="m2-onb-next" onClick={() => setPaso('tracker')}>Seguir →</button>
          )}
        </M2Popup>
      )}

      {/* 4. El tracker (3 modos) */}
      {paso === 'tracker' && (
        <M2Popup overlay={false} icon="🛰️" title="Cuenta tus pasos como quieras">
          <p className="m2-onb-text">
            Marcha con <b>GPS</b> por la calle, deja que el <b>podómetro</b> del móvil los cuente, o trae los pasos de tu <b>reloj o pulsera</b> (Garmin, Fitbit, Mi Band…). Tú eliges cómo sumar.
          </p>
          <button className="m2-onb-next" onClick={() => setPaso('niveles')}>¡Genial! →</button>
        </M2Popup>
      )}

      {/* 5. Niveles y logros */}
      {paso === 'niveles' && (
        <M2Popup overlay={false} icon="🏆" title="Sube en el movimiento">
          <p className="m2-onb-text">
            Empiezas como <b>Curioso/a</b> y, a base de marchar, subes hasta <b>Leyenda de la marcha</b>. Por el camino desbloqueas logros y mantienes tu racha de días. Cada paso te acerca.
          </p>
          <button className="m2-onb-next" onClick={() => setPaso('union')}>¡A por ello! →</button>
        </M2Popup>
      )}

      {/* 6. Únete (login) + recompensa */}
      {paso === 'union' && (
        <M2Popup overlay={false} icon="🚩" title="Únete al movimiento">
          <div className="m2-onb-reward">
            <span className="m2-onb-reward-em">🎉</span>
            <strong>Empiezas como Curioso/a 👀</strong>
            <span>Crea tu cuenta para guardar tu marcha, tus causas y tu progreso en cualquier dispositivo — y con XP de bienvenida por unirte.</span>
          </div>
          <button className="m2-onb-next enter" onClick={onFinish}>✊ Unirme y empezar</button>
        </M2Popup>
      )}
    </div>
  )
}

export default M2Onboarding
