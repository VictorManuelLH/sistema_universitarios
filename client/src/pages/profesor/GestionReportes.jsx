import { useState, useEffect } from 'react';
import { Badge, Button, Alert, Table, Spinner, Pagination, Modal } from 'react-bootstrap';
import { FileText, BookOpen, CheckCircle, XCircle, Eye } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

const POR_PAGINA = 10;

const GestionReportes = () => {
  const [reportes, setReportes] = useState([]);
  const [reportesLectura, setReportesLectura] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [tab, setTab] = useState('reportes');
  const [loading, setLoading] = useState(true);
  const [paginaReportes, setPaginaReportes] = useState(1);
  const [paginaLectura, setPaginaLectura] = useState(1);
  const [reporteVer, setReporteVer] = useState(null);
  const [lecturaVer, setLecturaVer] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const [repSnap, lecSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, 'reportes')),
          getDocs(collection(db, 'reportesLectura')),
          getDocs(collection(db, 'users'))
        ]);

        const usersMap = {};
        usersSnap.docs.forEach(d => { usersMap[d.id] = d.data().name; });

        const toDate = (v) => v?.toDate ? v.toDate() : new Date(v);

        setReportes(
          repSnap.docs
            .map(d => ({ id: d.id, ...d.data(), alumnoNombre: usersMap[d.data().alumno] || 'N/A' }))
            .sort((a, b) => toDate(b.fechaSolicitud) - toDate(a.fechaSolicitud))
        );
        setReportesLectura(
          lecSnap.docs
            .map(d => ({ id: d.id, ...d.data(), alumnoNombre: usersMap[d.data().alumno] || 'N/A' }))
            .sort((a, b) => toDate(b.fecha) - toDate(a.fecha))
        );
      } catch (err) {
        setMensaje({ tipo: 'danger', texto: 'Error al cargar los reportes.' });
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);
  useEffect(() => { setPaginaReportes(1); setPaginaLectura(1); }, [tab]);

  const actualizarEstado = async (coleccion, id, estado) => {
    try {
      const lista = coleccion === 'reportes' ? reportes : reportesLectura;
      const reporte = lista.find(r => r.id === id);

      await updateDoc(doc(db, coleccion, id), { estado });

      if (reporte?.alumno) {
        const esLectura = coleccion === 'reportesLectura';
        const titulo = reporte.titulo || 'Sin título';
        const tipo = estado === 'aprobado' ? 'success' : 'danger';
        const accion = estado === 'aprobado' ? 'aprobado' : 'rechazado';
        const link = esLectura ? '/reporte-lectura' : '/reportes';
        await addDoc(collection(db, 'notificaciones'), {
          usuario: reporte.alumno,
          mensaje: `Tu ${esLectura ? 'reporte de lectura' : 'reporte'} "${titulo}" ha sido ${accion}.`,
          tipo,
          leida: false,
          link,
          createdAt: serverTimestamp()
        });
      }

      setMensaje({ tipo: 'success', texto: `Reporte ${estado === 'aprobado' ? 'aprobado' : 'rechazado'} correctamente.` });
      if (coleccion === 'reportes') {
        setReportes(prev => prev.map(r => r.id === id ? { ...r, estado } : r));
      } else {
        setReportesLectura(prev => prev.map(r => r.id === id ? { ...r, estado } : r));
      }
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message || 'Error al actualizar estado.' });
    }
  };

  const formatFecha = (fecha) => {
    const d = fecha?.toDate ? fecha.toDate() : new Date(fecha);
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const renderEstadoBadge = (estado) => {
    switch (estado) {
      case 'aprobado': return <Badge bg="success">Aprobado</Badge>;
      case 'rechazado': return <Badge bg="danger">Rechazado</Badge>;
      default: return <Badge bg="warning" text="dark">Pendiente</Badge>;
    }
  };

  const totalPaginasReportes = Math.ceil(reportes.length / POR_PAGINA);
  const reportesPaginados = reportes.slice((paginaReportes - 1) * POR_PAGINA, paginaReportes * POR_PAGINA);
  const totalPaginasLectura = Math.ceil(reportesLectura.length / POR_PAGINA);
  const lecturasPaginadas = reportesLectura.slice((paginaLectura - 1) * POR_PAGINA, paginaLectura * POR_PAGINA);

  return (
    <div>
      <h2 className="page-title">Gestion de Reportes</h2>
      <p className="page-subtitle">Revisa y aprueba o rechaza los reportes y justificantes de tus alumnos.</p>

      {mensaje && <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje(null)}>{mensaje.texto}</Alert>}

      <div className="materia-pills mb-4">
        <button className={`materia-pill ${tab === 'reportes' ? 'active' : ''}`} onClick={() => setTab('reportes')}>
          <FileText size={16} className="me-1" />Reportes / Justificantes
        </button>
        <button className={`materia-pill ${tab === 'lectura' ? 'active' : ''}`} onClick={() => setTab('lectura')}>
          <BookOpen size={16} className="me-1" />Reportes de Lectura
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : (
        <>
          {tab === 'reportes' && (
            <>
              <div className="tabla-asistencia">
                <Table responsive hover>
                  <thead>
                    <tr><th>Fecha</th><th>Alumno</th><th>Titulo</th><th>Estado</th><th className="text-end">Acciones</th></tr>
                  </thead>
                  <tbody>
                    {reportesPaginados.map(r => (
                      <tr key={r.id}>
                        <td>{formatFecha(r.fechaSolicitud)}</td>
                        <td className="fw-semibold">{r.alumnoNombre}</td>
                        <td>{r.titulo}</td>
                        <td>{renderEstadoBadge(r.estado)}</td>
                        <td className="text-end">
                          <div className="d-flex gap-2 justify-content-end">
                            <Button variant="outline-secondary" size="sm" onClick={() => setReporteVer(r)}>
                              <Eye size={14} className="me-1" />Ver
                            </Button>
                            {r.estado === 'pendiente' && (
                              <>
                                <Button variant="success" size="sm" onClick={() => actualizarEstado('reportes', r.id, 'aprobado')}>
                                  <CheckCircle size={14} className="me-1" />Aprobar
                                </Button>
                                <Button variant="outline-danger" size="sm" onClick={() => actualizarEstado('reportes', r.id, 'rechazado')}>
                                  <XCircle size={14} className="me-1" />Rechazar
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {reportesPaginados.length === 0 && <tr><td colSpan="5" className="text-center text-muted py-4">No hay reportes</td></tr>}
                  </tbody>
                </Table>
              </div>
              {totalPaginasReportes > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <Pagination size="sm">
                    <Pagination.Prev disabled={paginaReportes === 1} onClick={() => setPaginaReportes(p => p - 1)} />
                    {Array.from({ length: totalPaginasReportes }, (_, i) => (
                      <Pagination.Item key={i + 1} active={paginaReportes === i + 1} onClick={() => setPaginaReportes(i + 1)}>{i + 1}</Pagination.Item>
                    ))}
                    <Pagination.Next disabled={paginaReportes === totalPaginasReportes} onClick={() => setPaginaReportes(p => p + 1)} />
                  </Pagination>
                </div>
              )}
            </>
          )}

          {tab === 'lectura' && (
            <>
              <div className="tabla-asistencia">
                <Table responsive hover>
                  <thead>
                    <tr><th>Fecha</th><th>Alumno</th><th>Libro</th><th>Estado</th><th className="text-end">Acciones</th></tr>
                  </thead>
                  <tbody>
                    {lecturasPaginadas.map(r => (
                      <tr key={r.id}>
                        <td>{formatFecha(r.fecha)}</td>
                        <td className="fw-semibold">{r.alumnoNombre}</td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titulo}</td>
                        <td>{renderEstadoBadge(r.estado)}</td>
                        <td className="text-end">
                          <div className="d-flex gap-2 justify-content-end">
                            <Button variant="outline-secondary" size="sm" onClick={() => setLecturaVer(r)}>
                              <Eye size={14} className="me-1" />Ver
                            </Button>
                            {r.estado === 'pendiente' && (
                              <>
                                <Button variant="success" size="sm" onClick={() => actualizarEstado('reportesLectura', r.id, 'aprobado')}>
                                  <CheckCircle size={14} className="me-1" />Aprobar
                                </Button>
                                <Button variant="outline-danger" size="sm" onClick={() => actualizarEstado('reportesLectura', r.id, 'rechazado')}>
                                  <XCircle size={14} className="me-1" />Rechazar
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {lecturasPaginadas.length === 0 && <tr><td colSpan="5" className="text-center text-muted py-4">No hay reportes de lectura</td></tr>}
                  </tbody>
                </Table>
              </div>
              {totalPaginasLectura > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <Pagination size="sm">
                    <Pagination.Prev disabled={paginaLectura === 1} onClick={() => setPaginaLectura(p => p - 1)} />
                    {Array.from({ length: totalPaginasLectura }, (_, i) => (
                      <Pagination.Item key={i + 1} active={paginaLectura === i + 1} onClick={() => setPaginaLectura(i + 1)}>{i + 1}</Pagination.Item>
                    ))}
                    <Pagination.Next disabled={paginaLectura === totalPaginasLectura} onClick={() => setPaginaLectura(p => p + 1)} />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </>
      )}

      <Modal show={!!lecturaVer} onHide={() => setLecturaVer(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1rem' }}>Detalle del Reporte de Lectura</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {lecturaVer && (
            <div className="d-flex flex-column gap-3">
              <div>
                <p className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Alumno</p>
                <p className="mb-0 fw-semibold">{lecturaVer.alumnoNombre}</p>
              </div>
              <div>
                <p className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Fecha</p>
                <p className="mb-0">{formatFecha(lecturaVer.fecha)}</p>
              </div>
              <div>
                <p className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Libro</p>
                <p className="mb-0">{lecturaVer.titulo}</p>
              </div>
              <div>
                <p className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Autor</p>
                <p className="mb-0">{lecturaVer.autor}</p>
              </div>
              {lecturaVer.palabras && (
                <div>
                  <p className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Palabras en el resumen</p>
                  <p className="mb-0">{lecturaVer.palabras}</p>
                </div>
              )}
              {lecturaVer.contenido && (
                <div>
                  <p className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Resumen</p>
                  <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{lecturaVer.contenido}</p>
                </div>
              )}
              <div>
                <p className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Estado</p>
                {renderEstadoBadge(lecturaVer.estado)}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {lecturaVer?.estado === 'pendiente' && (
            <>
              <Button variant="success" size="sm" onClick={() => { actualizarEstado('reportesLectura', lecturaVer.id, 'aprobado'); setLecturaVer(null); }}>
                <CheckCircle size={14} className="me-1" />Aprobar
              </Button>
              <Button variant="outline-danger" size="sm" onClick={() => { actualizarEstado('reportesLectura', lecturaVer.id, 'rechazado'); setLecturaVer(null); }}>
                <XCircle size={14} className="me-1" />Rechazar
              </Button>
            </>
          )}
          <Button variant="secondary" size="sm" onClick={() => setLecturaVer(null)}>Cerrar</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={!!reporteVer} onHide={() => setReporteVer(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1rem' }}>Detalle del Reporte</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {reporteVer && (
            <div className="d-flex flex-column gap-3">
              <div>
                <p className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Alumno</p>
                <p className="mb-0 fw-semibold">{reporteVer.alumnoNombre}</p>
              </div>
              <div>
                <p className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Fecha</p>
                <p className="mb-0">{formatFecha(reporteVer.fechaSolicitud)}</p>
              </div>
              <div>
                <p className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Título</p>
                <p className="mb-0">{reporteVer.titulo}</p>
              </div>
              <div>
                <p className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Descripción</p>
                <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{reporteVer.descripcion}</p>
              </div>
              <div>
                <p className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Estado</p>
                {renderEstadoBadge(reporteVer.estado)}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {reporteVer?.estado === 'pendiente' && (
            <>
              <Button variant="success" size="sm" onClick={() => { actualizarEstado('reportes', reporteVer.id, 'aprobado'); setReporteVer(null); }}>
                <CheckCircle size={14} className="me-1" />Aprobar
              </Button>
              <Button variant="outline-danger" size="sm" onClick={() => { actualizarEstado('reportes', reporteVer.id, 'rechazado'); setReporteVer(null); }}>
                <XCircle size={14} className="me-1" />Rechazar
              </Button>
            </>
          )}
          <Button variant="secondary" size="sm" onClick={() => setReporteVer(null)}>Cerrar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GestionReportes;
