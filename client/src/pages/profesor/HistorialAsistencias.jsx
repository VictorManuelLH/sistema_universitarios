import { useState, useEffect } from 'react';
import { Row, Col, Form, Table, Badge, Button, Alert, Spinner, Pagination } from 'react-bootstrap';
import { Search, CalendarDays, FileSpreadsheet, Pencil, Check, X } from 'lucide-react';
import api from '../../utils/api';

const POR_PAGINA = 10;

const HistorialAsistencias = () => {
  const [materias, setMaterias] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [fechaInicial, setFechaInicial] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  });
  const [fechaFinal, setFechaFinal] = useState(() => new Date().toISOString().split('T')[0]);
  const [materiaFiltro, setMateriaFiltro] = useState('');
  const [busquedaAlumno, setBusquedaAlumno] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [editandoEstado, setEditandoEstado] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    api.get('/materias/profesor/mis-materias').then(setMaterias);
  }, []);

  // Cargar historial de todas las materias del profesor en paralelo
  useEffect(() => {
    if (materias.length === 0) return;
    const fetchHistorial = async () => {
      setLoading(true);
      try {
        const resultados = await Promise.all(
          materias.map(materia =>
            api.get(`/asistencias/materia/${materia._id}`)
              .then(records => records.map(r => ({ ...r, materiaNombre: materia.nombre })))
              .catch(() => [])
          )
        );
        setHistorial(resultados.flat());
      } finally {
        setLoading(false);
      }
    };
    fetchHistorial();
  }, [materias]);

  // Reiniciar paginación al cambiar filtros
  useEffect(() => {
    setPagina(1);
  }, [fechaInicial, fechaFinal, materiaFiltro, busquedaAlumno]);

  // Filtrar registros
  const registrosFiltrados = historial.filter(r => {
    const fecha = new Date(r.fecha).toISOString().split('T')[0];
    if (fechaInicial && fecha < fechaInicial) return false;
    if (fechaFinal && fecha > fechaFinal) return false;
    if (materiaFiltro && r.materia !== materiaFiltro) return false;
    if (busquedaAlumno) {
      const busq = busquedaAlumno.toLowerCase();
      const nombre = r.alumno?.name?.toLowerCase() || '';
      const matricula = r.alumno?.matricula || '';
      return nombre.includes(busq) || matricula.includes(busq);
    }
    return true;
  });

  // Guardar edicion de estado
  const guardarEdicion = async (id) => {
    try {
      await api.put(`/asistencias/estado/${id}`, { estado: editandoEstado });
      setHistorial(prev => prev.map(r => r._id === id ? { ...r, estado: editandoEstado } : r));
      setEditandoId(null);
      setMensaje({ tipo: 'success', texto: 'Estado actualizado correctamente.' });
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message || 'Error al actualizar.' });
    }
  };

  // Exportar a CSV
  const exportarCSV = () => {
    const encabezados = ['Fecha', 'Matricula', 'Alumno', 'Materia', 'Estado'];
    const filas = registrosFiltrados.map(r => [
      new Date(r.fecha).toLocaleDateString('es-MX'),
      r.alumno?.matricula || '',
      r.alumno?.name || '',
      r.materiaNombre || '',
      r.estado
    ]);
    const csv = [encabezados, ...filas].map(f => f.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asistencias_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const renderEstadoBadge = (estado) => {
    switch (estado) {
      case 'presente':
        return <Badge bg="success" className="badge-asistencia">Presente</Badge>;
      case 'falta':
        return <Badge bg="danger" className="badge-asistencia">Falta</Badge>;
      case 'retardo':
        return <Badge bg="warning" text="dark" className="badge-asistencia">Retardo</Badge>;
      default:
        return <Badge bg="secondary" className="badge-asistencia">{estado}</Badge>;
    }
  };

  const totalPaginas = Math.ceil(registrosFiltrados.length / POR_PAGINA);
  const registrosPaginados = registrosFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  return (
    <div>
      <h2 className="page-title">Historial de Asistencias</h2>
      <p className="page-subtitle">
        Consulta y edita el historial de asistencias de tus alumnos.
      </p>

      {mensaje && (
        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje(null)}>
          {mensaje.texto}
        </Alert>
      )}

      {/* Filtros de búsqueda */}
      <div className="filtros-card">
        <div className="filtros-title">
          <Search size={22} />
          Filtros de Búsqueda
        </div>

        <Row className="align-items-end">
          <Col md={3} className="mb-3">
            <Form.Group>
              <Form.Label className="fw-semibold">Fecha Inicial</Form.Label>
              <Form.Control
                type="date"
                value={fechaInicial}
                onChange={(e) => setFechaInicial(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3} className="mb-3">
            <Form.Group>
              <Form.Label className="fw-semibold">Fecha Final</Form.Label>
              <Form.Control
                type="date"
                value={fechaFinal}
                onChange={(e) => setFechaFinal(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3} className="mb-3">
            <Form.Group>
              <Form.Label className="fw-semibold">Materia</Form.Label>
              <Form.Select
                value={materiaFiltro}
                onChange={(e) => setMateriaFiltro(e.target.value)}
              >
                <option value="">Todas las materias</option>
                {materias.map((m) => (
                  <option key={m._id} value={m._id}>{m.nombre}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3} className="mb-3">
            <Form.Group>
              <Form.Label className="fw-semibold">Buscar Alumno</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type="text"
                  placeholder="Nombre o matrícula"
                  value={busquedaAlumno}
                  onChange={(e) => setBusquedaAlumno(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                />
                <Search size={16} className="position-absolute text-muted" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </Form.Group>
          </Col>
        </Row>
      </div>

      {/* Tabla de registros */}
      <div className="tabla-asistencia mt-4">
        <div className="p-3 pb-0 d-flex justify-content-between align-items-center">
          <div className="filtros-title mb-0">
            <CalendarDays size={22} />
            Registros de Asistencia
          </div>
          <Button variant="outline-secondary" size="sm" className="d-flex align-items-center gap-2" onClick={exportarCSV}>
            <FileSpreadsheet size={16} />
            Exportar CSV
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <Table responsive hover>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Matrícula</th>
                <th>Alumno</th>
                <th>Estado</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registrosPaginados.map((registro) => (
                <tr key={registro._id}>
                  <td>{formatFecha(registro.fecha)}</td>
                  <td className="fw-semibold">{registro.alumno?.matricula}</td>
                  <td>{registro.alumno?.name}</td>
                  <td>
                    {editandoId === registro._id ? (
                      <Form.Select
                        size="sm"
                        value={editandoEstado}
                        onChange={(e) => setEditandoEstado(e.target.value)}
                        style={{ width: '140px', display: 'inline-block' }}
                      >
                        <option value="presente">Presente</option>
                        <option value="falta">Falta</option>
                        <option value="retardo">Retardo</option>
                      </Form.Select>
                    ) : (
                      renderEstadoBadge(registro.estado)
                    )}
                  </td>
                  <td className="text-end">
                    {editandoId === registro._id ? (
                      <div className="d-flex gap-2 justify-content-end">
                        <Button variant="success" size="sm" onClick={() => guardarEdicion(registro._id)}>
                          <Check size={14} />
                        </Button>
                        <Button variant="outline-secondary" size="sm" onClick={() => setEditandoId(null)}>
                          <X size={14} />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="d-flex align-items-center gap-1 ms-auto"
                        onClick={() => { setEditandoId(registro._id); setEditandoEstado(registro.estado); }}
                      >
                        <Pencil size={14} />
                        Editar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {registrosPaginados.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">No hay registros.</td>
                </tr>
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
              <Pagination.Item key={i + 1} active={pagina === i + 1} onClick={() => setPagina(i + 1)}>
                {i + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next disabled={pagina === totalPaginas} onClick={() => setPagina(p => p + 1)} />
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default HistorialAsistencias;
