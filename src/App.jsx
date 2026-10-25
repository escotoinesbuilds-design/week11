import React, { useMemo, useState } from 'react';
import {
  authorizeRepairRequest,
  DEMO_HOUSEHOLDS,
  detectImplausibleReserve,
  getVerifiedNoticesForZone,
  INITIAL_INCIDENTS,
  reviewIncident,
  validateReserveInput,
} from './domain.js';

const VIEWS = [
  { id: 'home', label: 'Mi hogar', number: '01' },
  { id: 'register', label: 'Registro de avisos', number: '02' },
  { id: 'adversarial', label: 'Pruebas adversariales', number: '03' },
];

const statusLabels = {
  pending: 'Pendiente de revisión',
  verified: 'Confirmado por persona autorizada',
  rejected: 'Rechazado',
  corrected: 'Corregido; no es aviso confirmado',
};

function App() {
  const [activeView, setActiveView] = useState('home');
  const [selectedId, setSelectedId] = useState(DEMO_HOUSEHOLDS[0].id);
  const [households, setHouseholds] = useState(DEMO_HOUSEHOLDS);
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [readingInput, setReadingInput] = useState('');
  const [readingLabels, setReadingLabels] = useState({});
  const [readingError, setReadingError] = useState('');
  const [pendingReadings, setPendingReadings] = useState({});
  const [reviewNote, setReviewNote] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [preparation, setPreparation] = useState('');
  const [scenarioMessage, setScenarioMessage] = useState('');

  const household = households.find((item) => item.id === selectedId) ?? households[0];
  const readingLabel = readingLabels[household.id] ?? 'estimate';
  const pendingReading = pendingReadings[household.id] ?? null;
  const notices = useMemo(
    () => getVerifiedNoticesForZone(incidents, household.zone),
    [incidents, household.zone],
  );

  function updateHousehold(update) {
    setHouseholds((current) => current.map((item) => (
      item.id === household.id ? { ...item, ...update } : item
    )));
  }

  function saveReading(value, label) {
    const previous = household.reserve ?? value;
    const result = detectImplausibleReserve(value, previous);
    setReadingError('');
    if (result.review) {
      setPendingReadings((current) => ({ ...current, [household.id]: { value, label, result } }));
      setScenarioMessage('Lectura marcada para revisión humana; no cambió el registro del hogar.');
      return;
    }
    updateHousehold({ reserve: value });
    setReadingLabels((current) => ({ ...current, [household.id]: label }));
    setReadingInput('');
    setPendingReadings((current) => {
      const next = { ...current };
      delete next[household.id];
      return next;
    });
    setScenarioMessage('Lectura guardada en esta sesión. No se envió a ningún servicio.');
  }

  function submitManualReading(event) {
    event.preventDefault();
    const validation = validateReserveInput(readingInput);
    if (!validation.valid) {
      setReadingError(validation.error);
      return;
    }
    saveReading(validation.value, 'estimate');
  }

  function simulateSensorReading() {
    const value = household.reserve === null ? 42 : Math.max(0, household.reserve - 6);
    saveReading(value, 'simulated');
  }

  function skipReading() {
    updateHousehold({ reserve: null });
    setReadingLabels((current) => ({ ...current, [household.id]: 'missing' }));
    setReadingInput('');
    setPendingReadings((current) => {
      const next = { ...current };
      delete next[household.id];
      return next;
    });
    setReadingError('');
    setScenarioMessage('Sin lectura registrada. No hay penalización ni se bloquean los avisos.');
  }

  function acceptReviewedReading() {
    if (!pendingReading) return;
    const householdId = household.id;
    setHouseholds((current) => current.map((item) => (
      item.id === householdId ? { ...item, reserve: pendingReading.value } : item
    )));
    setReadingLabels((current) => ({ ...current, [householdId]: pendingReading.label }));
    setScenarioMessage('Una persona revisora aceptó el valor para este hogar ficticio — SIMULADO.');
    setPendingReadings((current) => {
      const next = { ...current };
      delete next[householdId];
      return next;
    });
    setReadingInput('');
  }

  function addFalseAlert() {
    if (incidents.some((incident) => incident.id === 'incidente-prueba-falso')) {
      setScenarioMessage('El reporte falso ya está en el registro como pendiente.');
      return;
    }
    setIncidents((current) => [{
      id: 'incidente-prueba-falso',
      zone: household.zone,
      source: 'Mensaje sin verificar (prueba)',
      owner: 'Sin responsable autorizado',
      description: 'Afirmación de interrupción creada para probar una alerta falsa.',
      status: 'pending',
      nextUpdate: 'Después de revisión humana — SIMULADO',
      escalation: 'No escalado; falta verificación de la persona autorizada.',
      correction: '',
      updates: ['Reporte no verificado creado para prueba adversarial — SIMULADO.'],
    }, ...current]);
    setScenarioMessage('Reporte falso agregado como pendiente; no aparece como aviso confirmado.');
  }

  function updateIncident(id, action) {
    const target = incidents.find((incident) => incident.id === id);
    const result = reviewIncident(target, action, 'authorized-utility-reviewer', reviewNote);
    if (!result.ok) {
      setReviewMessage(result.error);
      return;
    }
    setIncidents((current) => current.map((incident) => (
      incident.id === id ? result.incident : incident
    )));
    setReviewMessage(`${statusLabels[result.incident.status]} — SIMULADO.`);
    setReviewNote('');
  }

  function requestRepair() {
    const result = authorizeRepairRequest({ scope: 'public-network' }, 'resident');
    setScenarioMessage(result.error);
  }

  function testSuspiciousReading() {
    const result = detectImplausibleReserve(5, 90);
    setPendingReadings((current) => ({ ...current, [household.id]: { value: 5, label: 'simulated', result } }));
    setScenarioMessage(`${result.reason} No se creó un aviso de suministro.`);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegación principal">
        <a className="brand" href="#inicio" onClick={() => setActiveView('home')}>
          <span className="brand-mark" aria-hidden="true">a<span>·</span></span>
          <span>agua<span className="brand-light"> a tiempo</span><small>MÉXICO · DEMOSTRACIÓN</small></span>
        </a>
        <div className="side-caption">ESPACIO DE DEMOSTRACIÓN</div>
        <nav className="main-nav">
          {VIEWS.map((view) => (
            <button
              className={`nav-item ${activeView === view.id ? 'active' : ''}`}
              key={view.id}
              onClick={() => setActiveView(view.id)}
              aria-current={activeView === view.id ? 'page' : undefined}
            >
              <span className="nav-number">{view.number}</span>{view.label}
              {view.id === 'adversarial' && <span className="nav-arrow" aria-hidden="true">↗</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="offline-indicator"><span aria-hidden="true">●</span> Sin conexión a servicios reales</div>
          <p>Hogares, avisos y lecturas ficticios. Todo queda en esta sesión.</p>
          <div className="mini-privacy"><span aria-hidden="true">◈</span> Privado por diseño</div>
        </div>
      </aside>

      <main className="main-content" id="inicio">
        <header className="topbar">
          <div className="breadcrumb">PILOTO DEMOSTRATIVO <span>/</span> {VIEWS.find((view) => view.id === activeView)?.label.toUpperCase()}</div>
          <div className="topbar-right"><span className="demo-chip"><i /> MODO SIMULACIÓN</span><span className="avatar" aria-label="Hogar ficticio">H</span></div>
        </header>
        <div className="demo-banner">
          <span className="banner-icon" aria-hidden="true">i</span>
          <p><strong>Demostración, no información oficial.</strong> Incidentes, revisiones y lecturas son simulados. Solo una revisión humana autorizada puede confirmar un aviso.</p>
          <span className="banner-tag">DATOS FICTICIOS</span>
        </div>

        {activeView === 'home' && (
          <HomeView
            household={household}
            households={households}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            readingInput={readingInput}
            setReadingInput={setReadingInput}
            readingLabel={readingLabel}
            readingError={readingError}
            pendingReading={pendingReading}
            scenarioMessage={scenarioMessage}
            notices={notices}
            preparation={preparation}
            setPreparation={setPreparation}
            submitManualReading={submitManualReading}
            simulateSensorReading={simulateSensorReading}
            skipReading={skipReading}
            acceptReviewedReading={acceptReviewedReading}
          />
        )}
        {activeView === 'register' && (
          <RegisterView
            incidents={incidents}
            reviewNote={reviewNote}
            setReviewNote={setReviewNote}
            reviewMessage={reviewMessage}
            updateIncident={updateIncident}
          />
        )}
        {activeView === 'adversarial' && (
          <AdversarialView
            household={household}
            households={households}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            addFalseAlert={addFalseAlert}
            skipReading={skipReading}
            requestRepair={requestRepair}
            testSuspiciousReading={testSuspiciousReading}
            scenarioMessage={scenarioMessage}
          />
        )}
        <footer className="page-footer"><span>AGUA A TIEMPO MX · PROTOTIPO DE APRENDIZAJE</span><span>Sin cuotas · Sin mapa de hogares · Sin datos reales</span></footer>
      </main>
    </div>
  );
}

function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>
      {action}
    </div>
  );
}

function HomeView(props) {
  const {
    household, households, selectedId, setSelectedId, readingInput, setReadingInput,
    readingLabel, readingError, pendingReading, scenarioMessage, notices, preparation,
    setPreparation, submitManualReading, simulateSensorReading, skipReading, acceptReviewedReading,
  } = props;
  const options = household.storage
    ? ['Guardar agua para beber', 'Llenar recipientes limpios', 'Revisar aviso con mi familia']
    : ['Identificar un punto comunitario de abastecimiento', 'Acordar apoyo con una persona de confianza', 'Consultar el próximo aviso'];

  return (
    <>
      <PageHeading
        eyebrow="PANEL DEL HOGAR · SESIÓN PRIVADA"
        title="Tu agua, a tu ritmo."
        description="Consulta tu reserva y prepárate con información clara. Compartir una lectura es opcional."
        action={<div className="zone-pill"><span className="zone-pin">⌖</span><span><small>ZONA DE SERVICIO</small><strong>{household.zone}</strong></span></div>}
      />
      <div className="household-select">
        <label htmlFor="household">Perfil ficticio de demostración</label>
        <select id="household" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
          {households.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
        </select>
        <span>Solo se muestra el hogar seleccionado.</span>
      </div>

      <div className="dashboard-grid">
        <section className="card reserve-card" aria-labelledby="reserve-title">
          <div className="card-topline"><div><div className="eyebrow">RESERVA EN CASA</div><h2 id="reserve-title">Tu estimación</h2></div><span className={`status-pill ${household.reserve === null ? 'muted' : 'green'}`}><i />{household.reserve === null ? 'Sin lectura' : readingLabel === 'simulated' ? 'SIMULADO' : 'ESTIMACIÓN'}</span></div>
          <div className="reserve-visual">
            <div className="water-drop" aria-hidden="true"><div className="water-fill" style={{ height: `${household.reserve ?? 0}%` }} /></div>
            <div className="reserve-number">{household.reserve === null ? '—' : household.reserve}<span>{household.reserve === null ? '' : '%'}</span><small>{household.reserve === null ? 'Reserva desconocida' : 'del almacenamiento disponible'}</small></div>
          </div>
          {household.reserve !== null && <div className="meter"><span style={{ width: `${household.reserve}%` }} /></div>}
          <p className="quiet-note">{readingLabel === 'simulated' ? 'Lectura de nivel SIMULADA · no hay sensor conectado.' : 'Estimación personal, no medición oficial. No se comparte.'}</p>
          <form className="reading-form" onSubmit={submitManualReading} noValidate>
            <label htmlFor="reserve-input">Actualizar mi estimación (%)</label>
            <div className="input-row"><input id="reserve-input" inputMode="numeric" autoComplete="off" maxLength={6} value={readingInput} onChange={(event) => setReadingInput(event.target.value)} placeholder="Ej. 60" aria-describedby={readingError ? 'reading-error' : 'reading-help'} /><button className="button button-dark" type="submit">Guardar</button></div>
            <div id={readingError ? 'reading-error' : 'reading-help'} className={readingError ? 'field-error' : 'field-hint'} role={readingError ? 'alert' : undefined}>{readingError || 'Número entero de 0 a 100. Opcional.'}</div>
          </form>
          <div className="button-row"><button className="button button-outline" onClick={simulateSensorReading}>◌ Simular sensor</button><button className="text-button" onClick={skipReading}>No registrar lectura</button></div>
          {pendingReading && (
            <div className="review-callout" role="status"><strong>Requiere revisión humana</strong><p>{pendingReading.result.reason} Candidata: {pendingReading.value}% ({pendingReading.label === 'simulated' ? 'SIMULADO' : 'estimación'}).</p><button className="button button-outline" onClick={acceptReviewedReading}>Aceptar lectura revisada · SIMULADO</button></div>
          )}
          {scenarioMessage && <p className="inline-feedback" role="status">{scenarioMessage}</p>}
        </section>

        <section className="card incident-card" aria-labelledby="incident-title">
          <div className="card-topline"><div><div className="eyebrow">RED PÚBLICA · {household.zone.toUpperCase()}</div><h2 id="incident-title">Avisos en tu zona</h2></div><span className="verified-stamp">✓ REVISADO</span></div>
          {notices.length ? notices.map((notice) => (
            <article className="notice" key={notice.id}>
              <div className="notice-title"><span className="notice-dot" /><strong>Ejercicio de suministro confirmado</strong></div>
              <p>{notice.description}</p>
              <div className="notice-details"><span>Estado<strong>Confirmado · SIMULADO</strong></span><span>Próxima actualización<strong>{notice.nextUpdate}</strong></span></div>
              <p className="notice-caveat">Aviso ficticio confirmado por revisión simulada; no es información gubernamental. Sin estimación de restablecimiento ni afirmación de calidad del agua.</p>
            </article>
          )) : (
            <div className="empty-notice"><span className="empty-icon">✓</span><strong>No hay avisos confirmados para esta zona.</strong><p>Los reportes sin verificar no aparecen aquí. Próxima revisión solo si se recibe información nueva.</p></div>
          )}
          <div className="notice-footer"><span>COBERTURA POR ZONA GENERAL</span><span>⌖ {household.zone}</span></div>
          <div className="contact-preview">
            <div className="contact-icon" aria-hidden="true">↗</div>
            <div><strong>{household.phone ? 'Vista previa SMS' : 'Ruta sin teléfono'}</strong><p>{household.phone ? '“Agua a Tiempo: revisa el aviso SIMULADO para tu zona. Próxima actualización: hoy a las 18:00.”' : 'Una persona de contacto puede compartir el aviso acordado. No requiere teléfono inteligente.'}</p><small>VISTA PREVIA · NO SE ENVÍA</small></div>
          </div>
        </section>

        <section className="card prep-card" aria-labelledby="prep-title">
          <div className="card-topline"><div><div className="eyebrow">PEQUEÑOS PASOS, A TU ALCANCE</div><h2 id="prep-title">¿Cómo quieres prepararte?</h2></div><span className="optional-label">OPCIONAL</span></div>
          <p>Elige una acción que tenga sentido para ti. No hay una respuesta incorrecta.</p>
          {!household.storage && <div className="no-storage"><span aria-hidden="true">✳</span><div><strong>¿No tienes dónde almacenar agua?</strong><p>Está bien. Estas opciones no requieren tener un depósito.</p></div></div>}
          <div className="action-options">
            {options.map((option, index) => (
              <button className={`action-option ${preparation === option ? 'chosen' : ''}`} key={option} onClick={() => setPreparation(option)} aria-pressed={preparation === option}>
                <span className="action-index">0{index + 1}</span><span>{option}</span><span className="option-check">{preparation === option ? '✓' : '＋'}</span>
              </button>
            ))}
          </div>
          <div className="no-penalty"><span>♡</span> No tener almacenamiento o no registrar lecturas nunca te excluye.</div>
        </section>
      </div>
      <PrivacyNote />
    </>
  );
}

function RegisterView({ incidents, reviewNote, setReviewNote, reviewMessage, updateIncident }) {
  return (
    <>
      <PageHeading eyebrow="TRANSPARENCIA Y SEGUIMIENTO" title="Registro de avisos" description="Cada reporte tiene fuente, responsable y estado. Una alerta no es oficial hasta que una persona autorizada la confirma." />
      <div className="review-banner"><span>◈</span><p><strong>Panel de revisión simulada.</strong> Usa los controles para practicar aprobación, corrección o rechazo. Ninguna acción contacta a una autoridad real.</p><span className="demo-chip">SOLO PRÁCTICA</span></div>
      <div className="register-list">
        {incidents.map((incident) => (
          <article className="card register-card" key={incident.id}>
            <div className="register-header"><div><span className={`status-pill ${incident.status === 'verified' ? 'green' : incident.status === 'pending' ? 'amber' : 'muted'}`}><i />{statusLabels[incident.status]}</span><h2>{incident.description}</h2></div><span className="zone-chip">⌖ {incident.zone}</span></div>
            <div className="register-meta"><div><small>FUENTE</small><strong>{incident.source}</strong></div><div><small>RESPONSABLE</small><strong>{incident.owner}</strong></div><div><small>PRÓXIMA ACTUALIZACIÓN</small><strong>{incident.nextUpdate}</strong></div></div>
            {incident.correction && <div className="correction-note"><strong>Corrección — SIMULADO:</strong> {incident.correction}</div>}
            <div className="escalation"><span>ESCALACIÓN</span>{incident.escalation}</div>
            <details className="updates-details"><summary>Ver historial de actualizaciones ({incident.updates.length})</summary><ul>{incident.updates.map((update, index) => <li key={`${incident.id}-${index}`}>{update}</li>)}</ul></details>
            {incident.status === 'pending' && (
              <div className="review-controls">
                <label htmlFor={`review-note-${incident.id}`}>Nota para corrección o rechazo (máximo 240 caracteres)</label>
                <input id={`review-note-${incident.id}`} maxLength={240} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Opcional para aprobar; requerida para corregir" />
                <div className="button-row"><button className="button button-green" onClick={() => updateIncident(incident.id, 'approve')}>✓ Confirmar como revisora autorizada</button><button className="button button-outline" onClick={() => updateIncident(incident.id, 'correct')}>Corregir</button><button className="button button-danger" onClick={() => updateIncident(incident.id, 'reject')}>Rechazar</button></div>
                <small className="sim-label">ACCIONES DE REVISIÓN SIMULADAS · SOLO ESTA SESIÓN</small>
              </div>
            )}
          </article>
        ))}
      </div>
      {reviewMessage && <p className="inline-feedback" role="status">{reviewMessage}</p>}
      <div className="authority-rule"><span>!</span><p><strong>Regla de autoridad:</strong> solo una persona revisora autorizada puede confirmar un incidente. La confirmación de este prototipo sigue siendo simulada y no constituye un aviso oficial.</p></div>
    </>
  );
}

function AdversarialView({ household, households, selectedId, setSelectedId, addFalseAlert, skipReading, requestRepair, testSuspiciousReading, scenarioMessage }) {
  const checks = [
    { id: 'false', title: 'Alerta falsa o sin verificar', detail: 'Un reporte sin fuente autorizada no debe parecer un aviso oficial.', action: 'Crear reporte falso pendiente', run: addFalseAlert, pass: 'Solo pendiente; fuera de avisos confirmados.' },
    { id: 'missing', title: 'Lectura ausente', detail: 'Saltar una lectura no debe bloquear el servicio ni generar penalización.', action: 'Simular lectura ausente', run: skipReading, pass: 'Reserva desconocida; sin penalidad ni bloqueo.' },
    { id: 'suspicious', title: 'Lectura sospechosa', detail: 'El kNN local usa ejemplos ficticios y solo señala valores para revisión humana.', action: 'Simular salto sospechoso', run: testSuspiciousReading, pass: 'Marcada para revisión; no produce alerta oficial.' },
    { id: 'phone', title: 'Hogar sin teléfono inteligente', detail: 'El contacto offline debe poder compartir información básica.', pass: 'Ruta offline y vista previa; sin app obligatoria.' },
    { id: 'storage', title: 'Hogar sin almacenamiento', detail: 'La preparación debe incluir opciones que no requieran depósito.', pass: 'Acciones alternativas; no se marca como incumplimiento.' },
    { id: 'repair', title: 'Reparación no autorizada', detail: 'Nadie puede autorizar reparaciones ni gastos desde el prototipo.', action: 'Intentar solicitud de reparación', run: requestRepair, pass: 'Denegada; no hay despacho ni gasto.' },
    { id: 'privacy', title: 'Privacidad y exclusión', detail: 'No mostrar hogares ajenos, ubicación precisa ni castigar datos faltantes.', pass: 'Solo perfil seleccionado; datos de sesión y zonas generales.' },
  ];
  return (
    <>
      <PageHeading eyebrow="REVISIÓN ADVERSARIAL · TODO SIMULADO" title="¿Qué podría salir mal?" description="Prueba límites deliberadamente. Cada salvaguarda debe seguir funcionando cuando faltan datos o alguien intenta saltarse la verificación." />
      <section className="card persona-card">
        <div><div className="eyebrow">PERFIL ACTIVO</div><strong>{household.label} · Zona {household.zone}</strong><p>{household.phone ? 'Con teléfono' : 'Sin teléfono'} · {household.storage ? 'Con almacenamiento' : 'Sin almacenamiento'} · Solo datos ficticios</p></div>
        <label htmlFor="adversarial-household">Cambiar hogar de prueba
          <select id="adversarial-household" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{households.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select>
        </label>
      </section>
      <div className="adversarial-list">
        {checks.map((check, index) => (
          <article className="card adversarial-card" key={check.id}>
            <div className="test-number">0{index + 1}</div>
            <div className="test-copy"><h2>{check.title}</h2><p>{check.detail}</p><div className="test-result"><span>✓</span>{check.pass}</div></div>
            {check.action && <button className="button button-outline test-action" onClick={check.run}>{check.action}</button>}
          </article>
        ))}
      </div>
      {scenarioMessage && <p className="inline-feedback" role="status">{scenarioMessage}</p>}
      <div className="repair-boundary"><div className="repair-icon">⊘</div><div><strong>Separación de responsabilidades</strong><p>Plomería privada del hogar y red pública son asuntos distintos. El prototipo no diagnostica, autoriza, despacha ni paga reparaciones. Cualquier gasto futuro requiere verificación y escalación aceptadas por la empresa de agua.</p></div></div>
      <PrivacyNote />
    </>
  );
}

function PrivacyNote() {
  return <div className="privacy-note"><span aria-hidden="true">◈</span><span><strong>Tus datos son privados por defecto.</strong> Esta demostración usa hogares inventados y solo guarda cambios durante la sesión actual. No hay mapa público ni penalización por faltar datos.</span></div>;
}

export default App;
