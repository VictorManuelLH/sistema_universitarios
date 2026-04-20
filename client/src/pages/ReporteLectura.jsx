import { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Badge, Alert } from 'react-bootstrap';
import { FileText, CheckCircle } from 'lucide-react';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const ReporteLectura = () => {
  const { user } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [resumen, setResumen] = useState('');
  const [reportesLectura, setReportesLectura] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cargarReportes = async () => {
    const snap = await getDocs(
      query(collection(db, 'reportesLectura'), where('alumno', '==', user.uid), orderBy('fecha', 'desc'))
    );
    setReportesLectura(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { if (user?.uid) cargarReportes(); }, [user?.uid]);

  const wordCount = resumen.trim() ? resumen.trim().split(/\s+/).length : 0;

  const formatFecha = (fecha) => {
    const d = fecha?.toDate ? fecha.toDate() : new Date(fecha);
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);
    if (!titulo.trim()) return setMensaje({ tipo: 'danger', texto: 'El título del libro es obligatorio.' });
    if (!autor.trim()) return setMensaje({ tipo: 'danger', texto: 'El nombre del autor es obligatorio.' });
    if (wordCount < 200) return setMensaje({ tipo: 'danger', texto: `El resumen debe tener al menos 200 palabras. Actualmente tiene ${wordCount}.` });

    setEnviando(true);
    try {
      await addDoc(collection(db, 'reportesLectura'), {
        alumno: user.uid,
        titulo: titulo.trim(),
        autor: autor.trim(),
        contenido: resumen.trim(),
        palabras: wordCount,
        estado: 'pendiente',
        archivo: null,
        fecha: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      setTitulo('');
      setAutor('');
      setResumen('');
      setMensaje({ tipo: 'success', texto: 'Reporte de lectura enviado correctamente.' });
      cargarReportes();
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message || 'Error al enviar el reporte.' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <h2 className="page-title">Reporte de Lectura</h2>
      <p className="page-subtitle">Sube tu reporte de lectura completando la siguiente información.</p>

      <Row>
        <Col lg={8} className="mb-4">
          <div className="lectura-form-card">
            <div className="lectura-form-title">
              <FileText size={22} className="text-success" />
              Nuevo Reporte de Lectura
            </div>

            {mensaje && <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje(null)}>{mensaje.texto}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Título del libro</Form.Label>
                    <Form.Control type="text" placeholder="Ingrese el título" value={titulo} onChange={e => setTitulo(e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Autor</Form.Label>
                    <Form.Control type="text" placeholder="Nombre del autor" value={autor} onChange={e => setAutor(e.target.value)} />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-2">
                <Form.Label className="fw-semibold">Resumen y análisis</Form.Label>
                <Form.Control as="textarea" rows={5} placeholder="Escribe tu resumen y análisis del libro (mínimo 200 palabras)" value={resumen} onChange={e => setResumen(e.target.value)} />
              </Form.Group>
              <p className={`word-count ${wordCount >= 200 ? 'valid' : ''}`}>
                Palabras: {wordCount} {wordCount > 0 && wordCount < 200 && `(faltan ${200 - wordCount})`}
              </p>

              <Button variant="success" type="submit" className="w-100 py-2 fw-semibold" disabled={enviando}>
                {enviando ? 'Enviando...' : 'Enviar Reporte de Lectura'}
              </Button>
            </Form>
          </div>
        </Col>

        <Col lg={4}>
          <div className="instrucciones-card">
            <h6>Instrucciones</h6>
            {[
              'El reporte debe contener al menos 200 palabras',
              'Incluye titulo y autor del libro leido',
              'Redacta un analisis critico y reflexivo',
              'Los reportes son revisados en 3-5 dias habiles'
            ].map((instruccion, i) => (
              <div key={i} className="instruccion-item">
                <CheckCircle size={18} />
                <span>{instruccion}</span>
              </div>
            ))}
          </div>

          <div className="reportes-enviados-card">
            <h6>Reportes Enviados</h6>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              Has enviado {reportesLectura.length} reportes este semestre
            </p>
            {reportesLectura.map(reporte => (
              <div key={reporte.id} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: '1px solid #eee', fontSize: '0.85rem' }}>
                <div>
                  <div className="fw-semibold">{reporte.titulo}</div>
                  <small className="text-muted">{formatFecha(reporte.fecha)}</small>
                </div>
                <Badge
                  bg={reporte.estado === 'aprobado' ? 'success' : reporte.estado === 'rechazado' ? 'danger' : 'warning'}
                  text={reporte.estado === 'pendiente' ? 'dark' : 'white'}
                  style={{ fontSize: '0.72rem' }}
                >
                  {reporte.estado === 'aprobado' ? 'Aprobado' : reporte.estado === 'rechazado' ? 'Rechazado' : 'Pendiente'}
                </Badge>
              </div>
            ))}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ReporteLectura;
