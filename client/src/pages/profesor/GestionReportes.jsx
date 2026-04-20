import { useState, useEffect } from 'react';
import { Badge, Button, Alert, Table, Spinner, Pagination } from 'react-bootstrap';
import { FileText, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
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
      await updateDoc(doc(db, coleccion, id), { estado });
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
                    <tr><th>Fecha</th><th>Alumno</th><th>Titulo</th><th>Descripcion</th><th>Estado</th><th className="text-end">Acciones</th></tr>
                  </thead>
                  <tbody>
                    {reportesPaginados.map(r => (
                      <tr key={r.id}>
                        <td>{formatFecha(r.fechaSolicitud)}</td>
                        <td className="fw-semibold">{r.alumnoNombre}</td>
                        <td>{r.titulo}</td>
                        <td className="text-muted" style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.descripcion}</td>
                        <td>{renderEstadoBadge(r.estado)}</td>
                        <td className="text-end">
                          {r.estado === 'pendiente' ? (
                            <div className="d-flex gap-2 justify-content-end">
                              <Button variant="success" size="sm" onClick={() => actualizarEstado('reportes', r.id, 'aprobado')}>
                                <CheckCircle size={14} className="me-1" />Aprobar
                              </Button>
                              <Button variant="outline-danger" size="sm" onClick={() => actualizarEstado('reportes', r.id, 'rechazado')}>
                                <XCircle size={14} className="me-1" />Rechazar
                              </Button>
                            </div>
                          ) : <span className="text-muted">-</span>}
                        </td>
                      </tr>
                    ))}
                    {reportesPaginados.length === 0 && <tr><td colSpan="6" className="text-center text-muted py-4">No hay reportes</td></tr>}
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
                    <tr><th>Fecha</th><th>Alumno</th><th>Libro</th><th>Autor</th><th>Palabras</th><th>Estado</th><th className="text-end">Acciones</th></tr>
                  </thead>
                  <tbody>
                    {lecturasPaginadas.map(r => (
                      <tr key={r.id}>
                        <td>{formatFecha(r.fecha)}</td>
                        <td className="fw-semibold">{r.alumnoNombre}</td>
                        <td>{r.titulo}</td>
                        <td>{r.autor}</td>
                        <td>{r.palabras}</td>
                        <td>{renderEstadoBadge(r.estado)}</td>
                        <td className="text-end">
                          {r.estado === 'pendiente' ? (
                            <div className="d-flex gap-2 justify-content-end">
                              <Button variant="success" size="sm" onClick={() => actualizarEstado('reportesLectura', r.id, 'aprobado')}>
                                <CheckCircle size={14} className="me-1" />Aprobar
                              </Button>
                              <Button variant="outline-danger" size="sm" onClick={() => actualizarEstado('reportesLectura', r.id, 'rechazado')}>
                                <XCircle size={14} className="me-1" />Rechazar
                              </Button>
                            </div>
                          ) : <span className="text-muted">-</span>}
                        </td>
                      </tr>
                    ))}
                    {lecturasPaginadas.length === 0 && <tr><td colSpan="7" className="text-center text-muted py-4">No hay reportes de lectura</td></tr>}
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
    </div>
  );
};

export default GestionReportes;
