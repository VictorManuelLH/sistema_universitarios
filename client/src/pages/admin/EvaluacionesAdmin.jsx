import { useState, useEffect } from 'react';
import { Table, Badge, Modal, Row, Col, Form, Spinner } from 'react-bootstrap';
import { Star } from 'lucide-react';
import api from '../../utils/api';

const criteriosLabels = {
  dominio_tema: 'Dominio del tema',
  claridad: 'Claridad en la exposición',
  puntualidad: 'Puntualidad',
  disponibilidad: 'Disponibilidad para atender dudas',
  material_didactico: 'Calidad del material didáctico'
};

const calcularPromedio = (respuestas) => {
  if (!respuestas) return 0;
  const valores = Object.values(respuestas);
  if (!valores.length) return 0;
  return (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(1);
};

const renderEstrellas = (valor) =>
  Array.from({ length: 5 }, (_, i) => (
    <Star key={i} size={14} fill={i < Math.round(valor) ? '#ffc107' : 'none'} color="#ffc107" />
  ));

const variantPromedio = (promedio) => {
  const n = parseFloat(promedio);
  if (n >= 4) return 'success';
  if (n >= 3) return 'warning';
  return 'danger';
};

const EvaluacionesAdmin = () => {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroProfesor, setFiltroProfesor] = useState('');
  const [detalle, setDetalle] = useState(null);

  useEffect(() => {
    api.get('/evaluaciones')
      .then(setEvaluaciones)
      .finally(() => setLoading(false));
  }, []);

  const profesores = [...new Map(
    evaluaciones
      .filter(e => e.profesor)
      .map(e => [e.profesor._id, e.profesor])
  ).values()];

  const evaluacionesFiltradas = evaluaciones.filter(e =>
    filtroProfesor ? e.profesor?._id === filtroProfesor : true
  );

  const promedioGeneral = evaluaciones.length > 0
    ? (evaluaciones.reduce((acc, e) => acc + parseFloat(calcularPromedio(e.respuestas)), 0) / evaluaciones.length).toFixed(1)
    : '0.0';

  const formatFecha = (fecha) =>
    new Date(fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  return (
    <div>
      <h2 className="page-title">Resultados de Evaluaciones</h2>
      <p className="page-subtitle">Consulta cómo los alumnos evaluaron a los profesores.</p>

      {/* Estadísticas */}
      <Row className="mb-4">
        <Col sm={4} className="mb-3">
          <div className="total-card">
            <span className="total-label">Total evaluaciones</span>
            <span className="total-value" style={{ color: '#4361ee' }}>{evaluaciones.length}</span>
          </div>
        </Col>
        <Col sm={4} className="mb-3">
          <div className="total-card">
            <span className="total-label">Profesores evaluados</span>
            <span className="total-value" style={{ color: '#2d6a4f' }}>{profesores.length}</span>
          </div>
        </Col>
        <Col sm={4} className="mb-3">
          <div className="total-card">
            <span className="total-label">Promedio general</span>
            <span className="total-value" style={{ color: '#e6a817' }}>
              {promedioGeneral} / 5
            </span>
          </div>
        </Col>
      </Row>

      {/* Filtro por profesor */}
      <div className="filtros-card mb-4">
        <Row className="align-items-end g-3">
          <Col md={4}>
            <Form.Label className="fw-semibold">Filtrar por profesor</Form.Label>
            <Form.Select value={filtroProfesor} onChange={e => setFiltroProfesor(e.target.value)}>
              <option value="">Todos los profesores</option>
              {profesores.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </Form.Select>
          </Col>
        </Row>
      </div>

      {/* Tabla */}
      <div className="tabla-asistencia">
        <Table responsive hover>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Alumno</th>
              <th>Profesor</th>
              <th>Materia</th>
              <th>Promedio</th>
              <th className="text-end">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {evaluacionesFiltradas.map(e => {
              const promedio = calcularPromedio(e.respuestas);
              return (
                <tr key={e._id}>
                  <td>{formatFecha(e.createdAt)}</td>
                  <td className="fw-semibold">{e.alumno?.name || '—'}</td>
                  <td>{e.profesor?.name || '—'}</td>
                  <td>{e.materia?.nombre || '—'}</td>
                  <td>
                    <Badge bg={variantPromedio(promedio)} className="badge-asistencia">
                      {promedio} / 5
                    </Badge>
                  </td>
                  <td className="text-end">
                    <button
                      className="action-btn action-btn-warning"
                      title="Ver detalle"
                      onClick={() => setDetalle(e)}
                    >
                      <Star size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {evaluacionesFiltradas.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4">
                  No hay evaluaciones registradas.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Modal de detalle */}
      <Modal show={!!detalle} onHide={() => setDetalle(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Detalle de evaluación</Modal.Title>
        </Modal.Header>
        {detalle && (
          <Modal.Body>
            <p className="mb-1">
              <strong>Profesor:</strong> {detalle.profesor?.name}
            </p>
            <p className="mb-1">
              <strong>Materia:</strong> {detalle.materia?.nombre}
            </p>
            <p className="mb-3">
              <strong>Alumno:</strong> {detalle.alumno?.name}
            </p>

            <h6 className="fw-bold mb-3">Criterios</h6>
            {Object.entries(criteriosLabels).map(([key, label]) => {
              const valor = detalle.respuestas?.[key] ?? 0;
              return (
                <div key={key} className="d-flex justify-content-between align-items-center mb-2">
                  <span style={{ fontSize: '0.9rem' }}>{label}</span>
                  <div className="d-flex align-items-center gap-2">
                    <div className="d-flex">{renderEstrellas(valor)}</div>
                    <span style={{ fontSize: '0.85rem', color: '#6c757d', minWidth: '30px' }}>
                      {valor}/5
                    </span>
                  </div>
                </div>
              );
            })}

            <hr />
            <div className="d-flex justify-content-between align-items-center fw-bold">
              <span>Promedio general</span>
              <Badge bg={variantPromedio(calcularPromedio(detalle.respuestas))} style={{ fontSize: '0.9rem' }}>
                {calcularPromedio(detalle.respuestas)} / 5
              </Badge>
            </div>

            {detalle.comentarios && (
              <>
                <hr />
                <h6 className="fw-bold mb-2">Comentarios</h6>
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>{detalle.comentarios}</p>
              </>
            )}
          </Modal.Body>
        )}
      </Modal>
    </div>
  );
};

export default EvaluacionesAdmin;
