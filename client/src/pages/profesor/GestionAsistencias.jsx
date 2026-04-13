import { useState, useEffect } from 'react';
import { Row, Col, Table, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { BookOpen, CheckCircle, XCircle, Clock, HelpCircle, CheckCheck, UserX, Save } from 'lucide-react';
import api from '../../utils/api';

const GestionAsistencias = () => {
  const [materias, setMaterias] = useState([]);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/materias/profesor/mis-materias')
      .then(data => {
        setMaterias(data);
        if (data.length > 0) setMateriaSeleccionada(data[0]._id);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!materiaSeleccionada) return;
    const materia = materias.find(m => m._id === materiaSeleccionada);
    if (materia) {
      setAlumnos(materia.alumnos.map(a => ({
        _id: a._id,
        matricula: a.matricula,
        nombre: a.name,
        estado: 'sin_registro'
      })));
    }
  }, [materiaSeleccionada, materias]);

  const materiaActual = materias.find(m => m._id === materiaSeleccionada);

  // Contadores
  const presentes = alumnos.filter(a => a.estado === 'presente').length;
  const faltas = alumnos.filter(a => a.estado === 'falta').length;
  const retardos = alumnos.filter(a => a.estado === 'retardo').length;
  const sinRegistro = alumnos.filter(a => a.estado === 'sin_registro').length;

  // Cambiar estado de un alumno
  const cambiarEstado = (id, nuevoEstado) => {
    setAlumnos(prev => prev.map(a =>
      a._id === id ? { ...a, estado: nuevoEstado } : a
    ));
  };

  // Acciones rápidas
  const marcarTodos = (estado) => {
    setAlumnos(prev => prev.map(a => ({ ...a, estado })));
  };

  // Guardar asistencias en BD
  const guardarAsistencias = async () => {
    const registros = alumnos
      .filter(a => a.estado !== 'sin_registro')
      .map(a => ({
        alumno: a._id,
        materia: materiaSeleccionada,
        estado: a.estado
      }));

    if (registros.length === 0) {
      setMensaje({ tipo: 'warning', texto: 'No hay asistencias marcadas para guardar.' });
      return;
    }

    setGuardando(true);
    setMensaje(null);
    try {
      const res = await api.post('/asistencias/registrar-grupo', { registros });
      setMensaje({ tipo: 'success', texto: res.message });
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message || 'Error al guardar asistencias.' });
    } finally {
      setGuardando(false);
    }
  };

  // Renderizar badge de estado
  const renderEstadoBadge = (estado) => {
    switch (estado) {
      case 'presente':
        return <Badge bg="success" className="badge-asistencia">Presente</Badge>;
      case 'falta':
        return <Badge bg="danger" className="badge-asistencia">Falta</Badge>;
      case 'retardo':
        return <Badge bg="warning" text="dark" className="badge-asistencia">Retardo</Badge>;
      default:
        return <Badge bg="light" text="dark" className="badge-asistencia" style={{ border: '1px solid #dee2e6' }}>Sin registro</Badge>;
    }
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  return (
    <div>
      <h2 className="page-title">Gestión de Asistencias</h2>
      <p className="page-subtitle">
        Registra y modifica la asistencia de tus alumnos en tiempo real.
      </p>

      {mensaje && (
        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje(null)}>
          {mensaje.texto}
        </Alert>
      )}

      {/* Pills de materias */}
      <div className="materia-pills mb-4">
        {materias.map((materia) => (
          <button
            key={materia._id}
            className={`materia-pill ${materiaSeleccionada === materia._id ? 'active' : ''}`}
            onClick={() => setMateriaSeleccionada(materia._id)}
          >
            <BookOpen size={16} className="me-1" />
            {materia.nombre} - Grupo {materia.grupo}
          </button>
        ))}
      </div>

      {/* Cards de resumen */}
      <Row className="mb-4">
        <Col sm={6} lg={3} className="mb-3">
          <div className="total-card">
            <div className="d-flex align-items-center justify-content-center gap-2">
              <CheckCircle size={24} className="text-success" />
              <div>
                <span className="total-value success" style={{ fontSize: '1.5rem' }}>{presentes}</span>
                <span className="total-label" style={{ marginBottom: 0 }}>Presentes</span>
              </div>
            </div>
          </div>
        </Col>
        <Col sm={6} lg={3} className="mb-3">
          <div className="total-card">
            <div className="d-flex align-items-center justify-content-center gap-2">
              <XCircle size={24} className="text-danger" />
              <div>
                <span className="total-value danger" style={{ fontSize: '1.5rem' }}>{faltas}</span>
                <span className="total-label" style={{ marginBottom: 0 }}>Faltas</span>
              </div>
            </div>
          </div>
        </Col>
        <Col sm={6} lg={3} className="mb-3">
          <div className="total-card">
            <div className="d-flex align-items-center justify-content-center gap-2">
              <Clock size={24} style={{ color: '#e6a817' }} />
              <div>
                <span className="total-value warning" style={{ fontSize: '1.5rem' }}>{retardos}</span>
                <span className="total-label" style={{ marginBottom: 0 }}>Retardos</span>
              </div>
            </div>
          </div>
        </Col>
        <Col sm={6} lg={3} className="mb-3">
          <div className="total-card">
            <div className="d-flex align-items-center justify-content-center gap-2">
              <HelpCircle size={24} className="text-secondary" />
              <div>
                <span className="total-value" style={{ fontSize: '1.5rem', color: '#6c757d' }}>{sinRegistro}</span>
                <span className="total-label" style={{ marginBottom: 0 }}>Sin registro</span>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Acciones rápidas */}
      <div className="filtros-card mb-4">
        <h5 className="fw-bold mb-3">Acciones Rápidas</h5>
        <div className="d-flex gap-3 flex-wrap">
          <Button variant="outline-success" onClick={() => marcarTodos('presente')}>
            <CheckCheck size={18} className="me-2" />
            Marcar todos presentes
          </Button>
          <Button variant="outline-danger" onClick={() => marcarTodos('falta')}>
            <UserX size={18} className="me-2" />
            Marcar todos ausentes
          </Button>
        </div>
      </div>

      {/* Tabla de alumnos */}
      <div className="tabla-asistencia">
        <div className="p-3 pb-0">
          <h5 className="fw-bold mb-3">{materiaActual?.nombre} - Grupo {materiaActual?.grupo}</h5>
        </div>
        <Table responsive hover>
          <thead>
            <tr>
              <th>Matrícula</th>
              <th>Nombre del Alumno</th>
              <th>Estado</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((alumno) => (
              <tr key={alumno._id}>
                <td className="fw-semibold">{alumno.matricula}</td>
                <td>{alumno.nombre}</td>
                <td>{renderEstadoBadge(alumno.estado)}</td>
                <td className="text-end">
                  <div className="d-flex gap-2 justify-content-end">
                    <button
                      className={`action-btn action-btn-success ${alumno.estado === 'presente' ? 'active' : ''}`}
                      onClick={() => cambiarEstado(alumno._id, 'presente')}
                      title="Presente"
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button
                      className={`action-btn action-btn-warning ${alumno.estado === 'retardo' ? 'active' : ''}`}
                      onClick={() => cambiarEstado(alumno._id, 'retardo')}
                      title="Retardo"
                    >
                      <Clock size={20} />
                    </button>
                    <button
                      className={`action-btn action-btn-danger ${alumno.estado === 'falta' ? 'active' : ''}`}
                      onClick={() => cambiarEstado(alumno._id, 'falta')}
                      title="Falta"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Boton guardar asistencias */}
      <div className="d-flex justify-content-end mt-4">
        <Button
          variant="success"
          size="lg"
          onClick={guardarAsistencias}
          disabled={guardando}
        >
          <Save size={18} className="me-2" />
          {guardando ? 'Guardando...' : 'Guardar Asistencias'}
        </Button>
      </div>
    </div>
  );
};

export default GestionAsistencias;
