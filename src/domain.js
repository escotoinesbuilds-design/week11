export const DEMO_HOUSEHOLDS = [
  { id: 'hogar-a', label: 'Hogar demostración A', zone: 'Centro', reserve: 55, storage: true, phone: true },
  { id: 'hogar-b', label: 'Hogar demostración B', zone: 'Norte', reserve: null, storage: false, phone: false },
];

export const INITIAL_INCIDENTS = [
  {
    id: 'incidente-sim-01',
    zone: 'Centro',
    source: 'Reporte de ejercicio vecinal',
    owner: 'Mesa de revisión simulada',
    description: 'Posible interrupción programada reportada para ejercicio.',
    status: 'pending',
    nextUpdate: 'Hoy, 16:00 (simulado)',
    escalation: 'Pendiente de revisión por persona autorizada.',
    correction: '',
    updates: ['Reporte recibido — SIMULADO; no es un aviso oficial.'],
  },
  {
    id: 'incidente-sim-02',
    zone: 'Norte',
    source: 'Ejercicio de continuidad del servicio',
    owner: 'Revisión de servicio simulada',
    description: 'Ejercicio de revisión de suministro en zona Norte.',
    status: 'verified',
    nextUpdate: 'Hoy, 18:00 (simulado)',
    escalation: 'Escalación simulada registrada por la persona revisora.',
    correction: '',
    updates: ['Aviso de demostración confirmado por persona autorizada — SIMULADO.'],
  },
];

const TRAINING_EXAMPLES = [
  { features: [0.9, 0.05], label: 'plausible' },
  { features: [0.75, -0.08], label: 'plausible' },
  { features: [0.6, -0.12], label: 'plausible' },
  { features: [0.45, -0.1], label: 'plausible' },
  { features: [0.25, -0.14], label: 'plausible' },
  { features: [0.1, -0.08], label: 'plausible' },
  { features: [0.35, 0.06], label: 'plausible' },
  { features: [0.55, 0.02], label: 'plausible' },
  { features: [0.98, -0.9], label: 'implausible' },
  { features: [0.05, -0.85], label: 'implausible' },
  { features: [0.1, -0.75], label: 'implausible' },
  { features: [0.2, -0.7], label: 'implausible' },
  { features: [0.02, 0.9], label: 'implausible' },
  { features: [0.5, 0.8], label: 'implausible' },
  { features: [0.5, -0.8], label: 'implausible' },
];

export function validateReserveInput(rawValue) {
  if (typeof rawValue !== 'string' || rawValue.length > 6) {
    return { valid: false, error: 'Escribe un porcentaje entre 0 y 100.' };
  }
  const trimmed = rawValue.trim();
  if (!trimmed || !/^\d{1,3}$/.test(trimmed)) {
    return { valid: false, error: 'Usa un número entero entre 0 y 100.' };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    return { valid: false, error: 'El porcentaje debe estar entre 0 y 100.' };
  }
  return { valid: true, value };
}

export function detectImplausibleReserve(current, previous = current) {
  if (
    !Number.isFinite(current) || !Number.isFinite(previous) ||
    current < 0 || current > 100 || previous < 0 || previous > 100
  ) {
    return { review: true, label: 'implausible', reason: 'Lectura fuera de rango; requiere revisión humana.' };
  }
  const point = [current / 100, (current - previous) / 100];
  const neighbors = TRAINING_EXAMPLES
    .map((example) => ({
      label: example.label,
      distance: Math.hypot(point[0] - example.features[0], point[1] - example.features[1]),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);
  const votes = neighbors.reduce((counts, neighbor) => {
    counts[neighbor.label] += 1;
    return counts;
  }, { plausible: 0, implausible: 0 });
  const label = votes.implausible > votes.plausible ? 'implausible' : 'plausible';
  return {
    review: label === 'implausible',
    label,
    neighbors: neighbors.length,
    reason: label === 'implausible'
      ? 'El modelo local detectó un patrón inusual; una persona debe revisarlo.'
      : 'El modelo local no detectó un patrón inusual.',
  };
}

export function reviewIncident(incident, action, actorRole, note = '') {
  if (actorRole !== 'authorized-utility-reviewer') {
    return { ok: false, error: 'Solo la persona revisora autorizada puede cambiar el estado.' };
  }
  if (!incident || incident.status !== 'pending') {
    return { ok: false, error: 'Solo se pueden revisar reportes pendientes.' };
  }
  if (!['approve', 'correct', 'reject'].includes(action)) {
    return { ok: false, error: 'Acción de revisión no válida.' };
  }
  if (typeof note !== 'string' || note.length > 240) {
    return { ok: false, error: 'La nota debe tener 240 caracteres o menos.' };
  }
  const cleanNote = note.trim();
  if (action === 'correct' && !cleanNote) {
    return { ok: false, error: 'Agrega una nota de corrección.' };
  }
  const status = action === 'approve' ? 'verified' : action === 'reject' ? 'rejected' : 'corrected';
  const activity = action === 'approve'
    ? 'Confirmado por persona revisora autorizada — SIMULADO.'
    : action === 'reject'
      ? `Reporte rechazado — SIMULADO.${cleanNote ? ` Motivo: ${cleanNote}` : ''}`
      : `Corrección registrada — SIMULADO: ${cleanNote}`;
  return {
    ok: true,
    incident: {
      ...incident,
      status,
      correction: action === 'correct' ? cleanNote : incident.correction,
      escalation: status === 'verified'
        ? 'Escalación simulada registrada por la persona revisora.'
        : `Revisión simulada: ${status}.`,
      updates: [...incident.updates, activity],
    },
  };
}

export function getVerifiedNoticesForZone(incidents, zone) {
  return incidents.filter((incident) => incident.status === 'verified' && incident.zone === zone);
}

export function authorizeRepairRequest(_request, _actorRole) {
  return { authorized: false, error: 'La demostración no autoriza reparaciones ni gastos.' };
}
