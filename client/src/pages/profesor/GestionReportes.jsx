import { useState, useEffect } from 'react';
import { Badge, Button, Alert, Table, Spinner, Pagination } from 'react-bootstrap';
import { FileText, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import api from '../../utils/api';

const POR_PAGINA = 10;

const GestionReportes = () => {
  const [reportes, setReportes] = useState([]);
  const [reportesLectura, setReportesLectura] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [tab, setTab] = useState('reportes');
  const [loading, setLoading] = useState(true);
  const [paginaReportes, setPaginaReportes] = useState(1);
  const [paginaLectura, setPaginaLectura] = useState(1);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [rep, repLec] = await Promise.all([
        api.get('/reportes'),
        api.get('/reportes-lectura')
      ]);
      setReportes(rep);
      setReportesLectura(repLec);
    } catch (err) {
      console.error('Error cargando reportes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Reiniciar paginación al cambiar de tab
  useEffect(() => {
    setPaginaReportes(1);
    setPaginaLectura(1);
  }, [tab]);

  const actualizarEstado = async (tipo, id, estado) => {
    try {
      const endpoint = tipo === 'reporte'
        ? `/reportes/${id}/estado`
        : `/reportes-lectura/${id}/estado`;
      await api.put(endpoint, { estado });
      setMensaje({ tipo: 'success', texto: `Reporte ${estado === 'aprobado' ? 'aprobado' : 'rechazado'} correctamente.` });
      cargarDatos();
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message || 'Error al actualizar estado.' });
    }
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const renderEstadoBadge = (estado) => {
    switch (estado) {
      case 'aprobado':
        return <Badge bg="success">Aprobado</Badge>;
      case 'rechazado':
        return <Badge bg="danger">Rechazado</Badge>;
      default:
        return <Badge bg="warning" text="dark">Pendiente</Badge>;
    }
  };

  const totalPaginasReportes = Math.ceil(reportes.length / POR_PAGINA);
  const reportesPaginados = reportes.slice((paginaReportes - 1) * POR_PAGINA, paginaReportes * POR_PAGINA);

  const totalPaginasLectura = Math.ceil(reportesLectura.length / POR_PAGINA);
  const lecturasPaginadas = reportesLectura.slice((paginaLectura - 1) * POR_PAGINA, paginaLectura * POR_PAGINA);

  return (
    <div>
      <h2 className="page-title">Gestion de Reportes</h2>
      <p className="page-subtitle">
        Revisa y aprueba o rechaza los reportes y justificantes de tus alumnos.
      </p>

      {mensaje && (
        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje(null)}>
          {mensaje.texto}
        </Alert>
      )}

      {/* Tabs */}
      <div className="materia-pills mb-4">
        <button
          className={`materia-pill ${tab === 'reportes' ? 'active' : ''}`}
          onClick={() => setTab('reportes')}
        >
          <FileText size={16} className="me-1" />
          Reportes / Justificantes
        </button>
        <button
          className={`materia-pill ${tab === 'lectura' ? 'active' : ''}`}
          onClick={() => setTab('lectura')}
        >
          <BookOpen size={16} className="me-1" />
          Reportes de Lectura
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          {/* Tabla de reportes/justificantes */}
          {tab === 'reportes' && (
            <>
              <div className="tabla-asistencia">
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Alumno</th>
                      <th>Titulo</th>
                      <th>Descripcion</th>
                      <th>Estado</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportesPaginados.map((r) => (
                      <tr key={r._id}>
                        <td>{formatFecha(r.fechaSolicitud)}</td>
                        <td className="fw-semibold">{r.alumno?.name || 'N/A'}</td>
                        <td>{r.titulo}</td>
                        <td className="text-muted" style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.descripcion}
                        </td>
                        <td>{renderEstadoBadge(r.estado)}</td>
                        <td className="text-end">
                          {r.estado === 'pendiente' ? (
                            <div className="d-flex gap-2 justify-content-end">
                              <Button variant="success" size="sm" onClick={() => actualizarEstado('reporte', r._id, 'aprobado')}>
                                <CheckCircle size={14} className="me-1" />
                                Aprobar
                              </Button>
                              <Button variant="outline-danger" size="sm" onClick={() => actualizarEstado('reporte', r._id, 'rechazado')}>
                                <XCircle size={14} className="me-1" />
                                Rechazar
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {reportesPaginados.length === 0 && (
                      <tr><td colSpan="6" className="text-center text-muted py-4">No hay reportes</td></tr>
                    )}
                  </tbody>
                </Table>
              </div>
              {totalPaginasReportes > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <Pagination size="sm">
                    <Pagination.Prev disabled={paginaReportes === 1} onClick={() => setPaginaReportes(p => p - 1)} />
                    {Array.from({ length: totalPaginasReportes }, (_, i) => (
                      <Pagination.Item key={i + 1} active={paginaReportes === i + 1} onClick={() => setPaginaReportes(i + 1)}>
                        {i + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next disabled={paginaReportes === totalPaginasReportes} onClick={() => setPaginaReportes(p => p + 1)} />
                  </Pagination>
                </div>
              )}
            </>
          )}

          {/* Tabla de reportes de lectura */}
          {tab === 'lectura' && (
            <>
              <div className="tabla-asistencia">
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Alumno</th>
                      <th>Libro</th>
                      <th>Autor</th>
                      <th>Palabras</th>
                      <th>Estado</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lecturasPaginadas.map((r) => (
                      <tr key={r._id}>
                        <td>{formatFecha(r.fecha)}</td>
                        <td className="fw-semibold">{r.alumno?.name || 'N/A'}</td>
                        <td>{r.titulo}</td>
                        <td>{r.autor}</td>
                        <td>{r.palabras}</td>
                        <td>{renderEstadoBadge(r.estado)}</td>
                        <td className="text-end">
                          {r.estado === 'pendiente' ? (
                            <div className="d-flex gap-2 justify-content-end">
                              <Button variant="success" size="sm" onClick={() => actualizarEstado('lectura', r._id, 'aprobado')}>
                                <CheckCircle size={14} className="me-1" />
                                Aprobar
                              </Button>
                              <Button variant="outline-danger" size="sm" onClick={() => actualizarEstado('lectura', r._id, 'rechazado')}>
                                <XCircle size={14} className="me-1" />
                                Rechazar
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {lecturasPaginadas.length === 0 && (
                      <tr><td colSpan="7" className="text-center text-muted py-4">No hay reportes de lectura</td></tr>
                    )}
                  </tbody>
                </Table>
              </div>
              {totalPaginasLectura > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <Pagination size="sm">
                    <Pagination.Prev disabled={paginaLectura === 1} onClick={() => setPaginaLectura(p => p - 1)} />
                    {Array.from({ length: totalPaginasLectura }, (_, i) => (
                      <Pagination.Item key={i + 1} active={paginaLectura === i + 1} onClick={() => setPaginaLectura(i + 1)}>
                        {i + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next disabled={paginaLectura === totalPaginasLectura} onClick={() => setPaginaLectura(p => p + 1)} />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default GestionReportes;
