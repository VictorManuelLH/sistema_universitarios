import { useState, useEffect, useRef } from 'react';
import { Row, Col, Form, Button, Badge, Alert } from 'react-bootstrap';
import { FileText, CheckCircle, Paperclip, Download } from 'lucide-react';
import api from '../utils/api';

const ReporteLectura = () => {
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [resumen, setResumen] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [reportesLectura, setReportesLectura] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    api.get('/reportes-lectura').then(setReportesLectura);
  }, []);

  const wordCount = resumen.trim() ? resumen.trim().split(/\s+/).length : 0;

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);

    if (!titulo.trim()) {
      setMensaje({ tipo: 'danger', texto: 'El título del libro es obligatorio.' });
      return;
    }
    if (!autor.trim()) {
      setMensaje({ tipo: 'danger', texto: 'El nombre del autor es obligatorio.' });
      return;
    }
    if (wordCount < 200) {
      setMensaje({ tipo: 'danger', texto: `El resumen debe tener al menos 200 palabras. Actualmente tiene ${wordCount}.` });
      return;
    }

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append('titulo', titulo);
      formData.append('autor', autor);
      formData.append('contenido', resumen);
      formData.append('palabras', wordCount);
      if (archivo) formData.append('archivo', archivo);

      await api.post('/reportes-lectura', formData);
      setTitulo('');
      setAutor('');
      setResumen('');
      setArchivo(null);
      if (fileRef.current) fileRef.current.value = '';
      setMensaje({ tipo: 'success', texto: 'Reporte de lectura enviado correctamente.' });
      const updated = await api.get('/reportes-lectura');
      setReportesLectura(updated);
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message || 'Error al enviar el reporte.' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <h2 className="page-title">Reporte de Lectura</h2>
      <p className="page-subtitle">
        Sube tu reporte de lectura completando la siguiente información.
      </p>

      <Row>
        {/* Formulario principal */}
        <Col lg={8} className="mb-4">
          <div className="lectura-form-card">
            <div className="lectura-form-title">
              <FileText size={22} className="text-success" />
              Nuevo Reporte de Lectura
            </div>

            {mensaje && (
              <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje(null)}>
                {mensaje.texto}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Título del libro</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ingrese el título"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Autor</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Nombre del autor"
                      value={autor}
                      onChange={(e) => setAutor(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-2">
                <Form.Label className="fw-semibold">Resumen y análisis</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  placeholder="Escribe tu resumen y análisis del libro (mínimo 200 palabras)"
                  value={resumen}
                  onChange={(e) => setResumen(e.target.value)}
                />
              </Form.Group>
              <p className={`word-count ${wordCount >= 200 ? 'valid' : ''}`}>
                Palabras: {wordCount} {wordCount > 0 && wordCount < 200 && `(faltan ${200 - wordCount})`}
              </p>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold d-flex align-items-center gap-1">
                  <Paperclip size={15} /> Adjuntar PDF <span className="text-muted fw-normal">(opcional, máx. 5 MB)</span>
                </Form.Label>
                <Form.Control
                  type="file"
                  accept=".pdf"
                  ref={fileRef}
                  onChange={e => setArchivo(e.target.files[0] || null)}
                />
              </Form.Group>

              <Button
                variant="success"
                type="submit"
                className="w-100 py-2 fw-semibold"
                disabled={enviando}
              >
                {enviando ? 'Enviando...' : 'Enviar Reporte de Lectura'}
              </Button>
            </Form>
          </div>
        </Col>

        {/* Panel lateral */}
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
            {reportesLectura.map((reporte) => (
              <div
                key={reporte._id}
                className="d-flex justify-content-between align-items-center py-2"
                style={{ borderBottom: '1px solid #eee', fontSize: '0.85rem' }}
              >
                <div>
                  <div className="fw-semibold">{reporte.titulo}</div>
                  <small className="text-muted">{formatFecha(reporte.fecha)}</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {reporte.archivo && (
                    <a
                      href={`/uploads/${reporte.archivo}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Descargar PDF"
                      style={{ color: '#6c757d' }}
                    >
                      <Download size={14} />
                    </a>
                  )}
                  <Badge
                    bg={reporte.estado === 'aprobado' ? 'success' : reporte.estado === 'rechazado' ? 'danger' : 'warning'}
                    text={reporte.estado === 'aprobado' || reporte.estado === 'rechazado' ? 'white' : 'dark'}
                    style={{ fontSize: '0.72rem' }}
                  >
                    {reporte.estado === 'aprobado' ? 'Aprobado' : reporte.estado === 'rechazado' ? 'Rechazado' : 'Pendiente'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ReporteLectura;
