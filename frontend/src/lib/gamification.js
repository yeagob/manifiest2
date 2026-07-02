// Capa de gamificación de Manifiest2 — TODO derivado del backend existente
// (stats, causas, historial): sin cambios de API ni migraciones. 1 paso = 1 XP.

// --- Niveles: curva suave, títulos de activista ---
export const TITULOS = [
  { nivel: 1, titulo: 'Curioso/a', icono: '👀' },
  { nivel: 2, titulo: 'Simpatizante', icono: '✌️' },
  { nivel: 3, titulo: 'Manifestante', icono: '✊' },
  { nivel: 5, titulo: 'Activista', icono: '📢' },
  { nivel: 7, titulo: 'Organizador/a', icono: '📋' },
  { nivel: 10, titulo: 'Portavoz', icono: '🎤' },
  { nivel: 13, titulo: 'Agitador/a pacífico/a', icono: '🔥' },
  { nivel: 16, titulo: 'Líder del movimiento', icono: '🚩' },
  { nivel: 20, titulo: 'Leyenda de la marcha', icono: '🏆' },
  { nivel: 25, titulo: 'El cambio andante', icono: '🌍' },
];

// XP total necesaria para ALCANZAR el nivel n (nivel 1 = 0)
export function xpParaNivel(n) {
  if (n <= 1) return 0;
  return Math.round(500 * Math.pow(n - 1, 1.6));
}

export function nivelDesdeXp(xp) {
  let nivel = 1;
  while (xpParaNivel(nivel + 1) <= xp) nivel++;
  const base = xpParaNivel(nivel);
  const siguiente = xpParaNivel(nivel + 1);
  const t = [...TITULOS].reverse().find(t => nivel >= t.nivel) || TITULOS[0];
  return {
    nivel,
    titulo: t.titulo,
    icono: t.icono,
    xp,
    xpEnNivel: xp - base,
    xpParaSubir: siguiente - base,
    progreso: Math.min(1, (xp - base) / (siguiente - base)),
  };
}

// --- Racha: días seguidos con pasos, a partir del historial de steps ---
// history: [{date|createdAt|timestamp, steps|count}]
export function calcularRacha(history) {
  const dias = new Set(
    (history || [])
      .filter(h => (h.steps ?? h.count ?? 0) > 0)
      .map(h => String(h.date || h.createdAt || h.timestamp || '').slice(0, 10))
      .filter(Boolean)
  );
  if (dias.size === 0) return { actual: 0, mejor: 0, hoyHecho: false };

  const unDia = 24 * 60 * 60 * 1000;
  const clave = (d) => d.toISOString().slice(0, 10);
  const hoy = new Date();
  const hoyHecho = dias.has(clave(hoy));

  // racha actual: cuenta hacia atrás desde hoy (o desde ayer si hoy aún no)
  let actual = 0;
  let cursor = hoyHecho ? hoy : new Date(hoy.getTime() - unDia);
  while (dias.has(clave(cursor))) {
    actual++;
    cursor = new Date(cursor.getTime() - unDia);
  }

  // mejor racha histórica
  const ordenados = [...dias].sort();
  let mejor = 0, run = 0, prev = null;
  for (const d of ordenados) {
    run = prev && (new Date(d) - new Date(prev) === unDia) ? run + 1 : 1;
    mejor = Math.max(mejor, run);
    prev = d;
  }
  return { actual, mejor, hoyHecho };
}

// --- Logros: catálogo declarativo, todos comprobables con datos que ya hay ---
// ctx: { stats, misCausas, causasCreadas, racha, historia }
export const LOGROS = [
  { id: 'primer_paso', icono: '👟', nombre: 'Primer paso', desc: 'Registra tus primeros pasos', check: c => (c.stats?.totalSteps || 0) > 0 },
  { id: 'primera_causa', icono: '❤️', nombre: 'Comprometido/a', desc: 'Apoya tu primera causa', check: c => (c.misCausas?.length || 0) >= 1 },
  { id: 'fundador', icono: '🌱', nombre: 'Fundador/a', desc: 'Crea una causa', check: c => (c.causasCreadas?.length || 0) >= 1 },
  { id: 'mil', icono: '🥉', nombre: 'Kilómetro cero', desc: '1.000 pasos por tus causas', check: c => (c.stats?.totalSteps || 0) >= 1000 },
  { id: 'diezmil', icono: '🥈', nombre: 'Maratonista social', desc: '10.000 pasos acumulados', check: c => (c.stats?.totalSteps || 0) >= 10000 },
  { id: 'cienmil', icono: '🥇', nombre: 'Imparable', desc: '100.000 pasos acumulados', check: c => (c.stats?.totalSteps || 0) >= 100000 },
  { id: 'multicausa', icono: '🐙', nombre: 'Multicausa', desc: 'Apoya 3 causas a la vez', check: c => (c.misCausas?.length || 0) >= 3 },
  { id: 'racha3', icono: '🔥', nombre: 'En racha', desc: '3 días seguidos marchando', check: c => (c.racha?.actual || 0) >= 3 || (c.racha?.mejor || 0) >= 3 },
  { id: 'racha7', icono: '⚡', nombre: 'Semana de lucha', desc: '7 días seguidos marchando', check: c => (c.racha?.actual || 0) >= 7 || (c.racha?.mejor || 0) >= 7 },
  { id: 'racha30', icono: '💎', nombre: 'Compromiso de hierro', desc: '30 días seguidos', check: c => (c.racha?.mejor || 0) >= 30 },
  { id: 'madrugador', icono: '🌅', nombre: 'La calle es de quien madruga', desc: 'Registra pasos antes de las 8:00', check: c => (c.historia || []).some(h => { const d = new Date(h.createdAt || h.timestamp || h.date); return !isNaN(d) && d.getHours() < 8 && (h.steps ?? h.count ?? 0) > 0; }) },
  { id: 'dia5k', icono: '🚀', nombre: 'Día grande', desc: '5.000 pasos en un solo día', check: c => { const porDia = {}; for (const h of c.historia || []) { const k = String(h.date || h.createdAt || '').slice(0, 10); porDia[k] = (porDia[k] || 0) + (h.steps ?? h.count ?? 0); } return Object.values(porDia).some(v => v >= 5000); } },
];

export function evaluarLogros(ctx) {
  return LOGROS.map(l => ({ ...l, conseguido: !!safeCheck(l, ctx) }));
}

function safeCheck(logro, ctx) {
  try { return logro.check(ctx); } catch { return false; }
}

// Logros recién desbloqueados desde la última visita (para el toast + confetti)
const LS_LOGROS = 'manifiest2_logros_vistos';
export function logrosNuevos(logros) {
  let vistos = [];
  try { vistos = JSON.parse(localStorage.getItem(LS_LOGROS) || '[]'); } catch { /* nada */ }
  const conseguidos = logros.filter(l => l.conseguido).map(l => l.id);
  const nuevos = conseguidos.filter(id => !vistos.includes(id));
  try { localStorage.setItem(LS_LOGROS, JSON.stringify(conseguidos)); } catch { /* nada */ }
  return logros.filter(l => nuevos.includes(l.id));
}

// Nivel visto (para celebrar subidas de nivel)
const LS_NIVEL = 'manifiest2_nivel_visto';
export function nivelSubido(nivelActual) {
  let visto = 0;
  try { visto = parseInt(localStorage.getItem(LS_NIVEL) || '0', 10); } catch { /* nada */ }
  try { localStorage.setItem(LS_NIVEL, String(nivelActual)); } catch { /* nada */ }
  return visto > 0 && nivelActual > visto;
}
