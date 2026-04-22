import { useState, useEffect } from 'react';
import { Row, Col, Form, Table, Badge, Button, Spinner, Pagination } from 'react-bootstrap';
import { CalendarDays, Search } from 'lucide-react';
import { collection, query, where, getDocs, getDoc, setDoc, doc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const POR_PAGINA = 10;

const estaEnHorario = (horario) => {
  if (!horario) return false;
  const diasMap = { 'Lun': 1, 'Mar': 2, 'Mie': 3, 'Jue': 4, 'Vie': 5, 'Sab': 6, 'Dom': 0 };
  try {
    const parts = horario.split(' ');
    const daysPart = parts[0];
    const timePart = parts[1];
    let dias = [];
    if (daysPart.includes('-')) {
      const [d1, d2] = daysPart.split('-');
      const start = diasMap[d1], end = diasMap[d2];
      if (end - start === 2) dias = [start, end];
      else for (let i = start; i <= end; i++) dias.push(i);
    } else {
      dias = [diasMap[daysPart]];
    }
    const [horaInicio, horaFin] = timePart.split('-');
    const [hi, mi] = horaInicio.split(':').map(Number);
    const [hf, mf] = horaFin.split(':').map(Number);
    const now = new Date();
    const minActual = now.getHours() * 60 + now.getMinutes();
    return dias.includes(now.getDay()) && minActual >= hi * 60 + (mi || 0) && minActual <= hf * 60 + (mf || 0);
  } catch { return false; }
};

const Asistencia = () => {
  const { user } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [registroHoy, setRegistroHoy] = useState(null);
  const [registrandoHoy, setRegistrandoHoy] = useState(false);
  const [errorHoy, setErrorHoy] = useState('');
  const [fechaInicial, setFechaInicial] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  });
  const [fechaFinal, setFechaFinal] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!user?.uid) return;
    const cargar = async () => {
      const snap = await getDocs(query(collection(db, 'materias'), where('alumnos', 'array-contains', user.uid)));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMaterias(data);
      if (data.length > 0) setMateriaSeleccionada(data[0].id);
    };
    cargar();
  }, [user?.uid]);

  const cargarAsistencias = async () => {
    if (!materiaSeleccionada || !user?.uid) return;
    setLoading(true);
    const snap = await getDocs(
      query(collection(db, 'asistencias'),
        where('alumno', '==', user.uid),
        where('materia', '==', materiaSeleccionada)
      )
    );
    setAsistencias(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setPagina(1);
    setLoading(false);
  };

  useEffect(() => { cargarAsistencias(); }, [materiaSeleccionada]);

  useEffect(() => {
    if (!materiaSeleccionada || !user?.uid) { setRegistroHoy(null); return; }
    const fechaStr = new Date().toISOString().split('T')[0];
    const docId = `${user.uid}_${materiaSeleccionada}_${fechaStr}`;
    getDoc(doc(db, 'asistencias', docId)).then(snap => {
      setRegistroHoy(snap.exists() ? snap.data() : false);
    });
  }, [materiaSeleccionada, user?.uid]);

  const registrarAsistenciaHoy = async () => {
    if (!materiaSeleccionada || !user?.uid) return;
    setRegistrandoHoy(true);
    setErrorHoy('');
    try {
      const hoy = new Date();
      const fechaStr = hoy.toISOString().split('T')[0];
      const docId = `${user.uid}_${materiaSeleccionada}_${fechaStr}`;
      await setDoc(doc(db, 'asistencias', docId), {
        alumno: user.uid,
        materia: materiaSeleccionada,
        estado: 'presente',
        fecha: Timestamp.fromDate(hoy),
        observaciones: '',
        createdAt: serverTimestamp()
      });
      setRegistroHoy({ estado: 'presente' });
      cargarAsistencias();
    } catch {
      setErrorHoy('No se pudo registrar. El profesor ya tomó tu asistencia o no tienes permisos.');
    } finally {
      setRegistrandoHoy(false);
    }
  };

  const toDate = (v) => v?.toDate ? v.toDate() : new Date(v);

  const asistenciasFiltradas = asistencias.filter(r => {
    const fecha = toDate(r.fecha).toISOString().split('T')[0];
    if (fechaInicial && fecha < fechaInicial) return false;
    if (fechaFinal && fecha > fechaFinal) return false;
    return true;
  });

  const totalAsistencias = asistenciasFiltradas.filter(r => r.estado === 'presente').length;
  const totalFaltas = asistenciasFiltradas.filter(r => r.estado === 'falta').length;
  const totalRetardos = asistenciasFiltradas.filter(r => r.estado === 'retardo').length;
  const totalRegistros = totalAsistencias + totalFaltas + totalRetardos;
  const porcentajeAsistencia = totalRegistros > 0 ? Math.round((totalAsistencias / totalRegistros) * 100) : null;
  const porcentajeFaltas = totalRegistros > 0 ? Math.round((totalFaltas / totalRegistros) * 100) : null;
  const enRiesgo = porcentajeFaltas !== null && porcentajeFaltas >= 25;

  const totalPaginas = Math.ceil(asistenciasFiltradas.length / POR_PAGINA);
  const asistenciasPaginadas = asistenciasFiltradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const formatFecha = (fecha) =>
    toDate(fecha).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const renderEstadoBadge = (estado) => {
    switch (estado) {
      case 'presente': return <Badge bg="success" className="badge-asistencia">Asistencia</Badge>;
      case 'falta': return <Badge bg="danger" className="badge-asistencia">Falta</Badge>;
      case 'retardo': return <Badge bg="warning" text="dark" className="badge-asistencia">Retardo</Badge>;
      default: return <Badge bg="secondary" className="badge-asistencia">{estado}</Badge>;
    }
  };

  const materiaActual = materias.find(m => m.id === materiaSeleccionada);

  return (
    <div>
      <h2 className="page-title">Registro de Asistencias</h2>
      <p className="page-subtitle">Consulta tu historial de asistencias por materia y rango de fechas.</p>

      <div className="filtros-card">
        <div className="filtros-title"><CalendarDays size={22} />Filtros de Búsqueda</div>
        <Row className="align-items-end mb-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label className="fw-semibold">Fecha Inicial</Form.Label>
              <Form.Control type="date" value={fechaInicial} onChange={e => { setFechaInicial(e.target.value); setPagina(1); }} />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label className="fw-semibold">Fecha Final</Form.Label>
              <Form.Control type="date" value={fechaFinal} onChange={e => { setFechaFinal(e.target.value); setPagina(1); }} />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Button className="btn-buscar w-100" onClick={cargarAsistencias}>
              <Search size={18} />Buscar
            </Button>
          </Col>
        </Row>
      </div>

      {registroHoy !== null && (
        <div className="filtros-card mb-3" style={{ borderLeft: `4px solid ${registroHoy === false ? '#6366f1' : registroHoy.estado === 'presente' ? '#16a34a' : registroHoy.estado === 'falta' ? '#dc3545' : '#ca8a04'}` }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <p className="fw-semibold mb-0" style={{ fontSize: '0.9rem' }}>Asistencia de hoy</p>
              <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
                {registroHoy === false
                  ? 'Aún no hay registro de asistencia para hoy en esta materia.'
                  : `Registrada: ${registroHoy.estado === 'presente' ? 'Presente' : registroHoy.estado === 'falta' ? 'Falta' : 'Retardo'}`}
              </p>
              {errorHoy && <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: '#dc3545' }}>{errorHoy}</p>}
            </div>
            {registroHoy === false && (
              estaEnHorario(materiaActual?.horario) ? (
                <Button
                  size="sm"
                  style={{ background: '#6366f1', border: 'none' }}
                  onClick={registrarAsistenciaHoy}
                  disabled={registrandoHoy}
                >
                  {registrandoHoy ? 'Registrando...' : '✓ Registrar mi asistencia'}
                </Button>
              ) : (
                <span style={{ fontSize: '0.78rem', color: '#6c757d', fontStyle: 'italic' }}>Fuera de horario de clase</span>
              )
            )}
          </div>
        </div>
      )}

      <div className="materia-pills">
        <span className="label">Materia seleccionada:</span>
        {materias.map(materia => (
          <button key={materia.id} className={`materia-pill ${materiaSeleccionada === materia.id ? 'active' : ''}`} onClick={() => setMateriaSeleccionada(materia.id)}>
            {materia.nombre}
          </button>
        ))}
      </div>

      <div className="tabla-asistencia">
        <div className="p-3 pb-0"><h5 className="fw-bold mb-3">{materiaActual?.nombre}</h5></div>
        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" /></div>
        ) : (
          <Table responsive hover>
            <thead>
              <tr><th>Fecha</th><th>Estado</th><th className="text-end">Observaciones</th></tr>
            </thead>
            <tbody>
              {asistenciasPaginadas.map(registro => (
                <tr key={registro.id}>
                  <td>{formatFecha(registro.fecha)}</td>
                  <td>{renderEstadoBadge(registro.estado)}</td>
                  <td className="text-end text-muted">{registro.observaciones || '-'}</td>
                </tr>
              ))}
              {asistenciasPaginadas.length === 0 && (
                <tr><td colSpan={3} className="text-center text-muted py-4">Sin registros en este período.</td></tr>
              )}
            </tbody>
          </Table>
        )}
      </div>

      {totalPaginas > 1 && (
        <div className="d-flex justify-content-center mt-3">
          <Pagination size="sm">
            <Pagination.Prev disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} />
            {Array.from({ length: totalPaginas }, (_, i) => (
              <Pagination.Item key={i + 1} active={pagina === i + 1} onClick={() => setPagina(i + 1)}>{i + 1}</Pagination.Item>
            ))}
            <Pagination.Next disabled={pagina === totalPaginas} onClick={() => setPagina(p => p + 1)} />
          </Pagination>
        </div>
      )}

      {enRiesgo && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mt-3" style={{ borderRadius: 10 }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <div>
            <strong>Riesgo de reprobar por faltas.</strong> Tienes un {porcentajeFaltas}% de inasistencias en el período seleccionado. El límite permitido es del 25%.
          </div>
        </div>
      )}

      <Row className="mt-4">
        <Col md={4} className="mb-3">
          <div className="total-card"><span className="total-label">Total Asistencias</span><span className="total-value success">{totalAsistencias}</span></div>
        </Col>
        <Col md={4} className="mb-3">
          <div className="total-card"><span className="total-label">Total Faltas</span><span className="total-value danger">{totalFaltas}</span></div>
        </Col>
        <Col md={4} className="mb-3">
          <div className="total-card"><span className="total-label">Total Retardos</span><span className="total-value warning">{totalRetardos}</span></div>
        </Col>
      </Row>

      {porcentajeAsistencia !== null && (
        <div className="filtros-card mt-2">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>Porcentaje de asistencia</span>
            <span className="fw-bold" style={{ color: enRiesgo ? '#dc3545' : '#2d6a4f', fontSize: '1rem' }}>
              {porcentajeAsistencia}%
            </span>
          </div>
          <div style={{ height: 10, background: '#e9ecef', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${porcentajeAsistencia}%`,
              background: enRiesgo ? '#dc3545' : porcentajeAsistencia >= 80 ? '#2d6a4f' : '#ca8a04',
              borderRadius: 999,
              transition: 'width 0.4s ease'
            }} />
          </div>
          <div className="d-flex justify-content-between mt-1" style={{ fontSize: '0.72rem', color: '#6c757d' }}>
            <span>0%</span>
            <span style={{ color: '#ca8a04' }}>Límite: 75%</span>
            <span>100%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Asistencia;
