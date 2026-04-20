import { useState, useEffect } from 'react';
import { Row, Col, Form, Table, Badge, Button, Spinner, Pagination } from 'react-bootstrap';
import { CalendarDays, Search } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const POR_PAGINA = 10;

const Asistencia = () => {
  const { user } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagina, setPagina] = useState(1);
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
    </div>
  );
};

export default Asistencia;
