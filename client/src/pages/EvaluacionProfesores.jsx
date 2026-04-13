import { useState, useEffect } from 'react';
import { Row, Col, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Star, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const EvaluacionProfesores = () => {
  const navigate = useNavigate();
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/evaluaciones/profesores')
      .then(setProfesores)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  return (
    <div>
      <h2 className="page-title">Evaluación de Profesores</h2>
      <p className="page-subtitle">
        Evalúa el desempeño de tus profesores para contribuir a la mejora continua de la calidad educativa.
      </p>

      {/* Grid de profesores */}
      <Row>
        {profesores.map((profesor) => (
          <Col key={`${profesor._id}-${profesor.materiaId}`} md={6} className="mb-4">
            <div className="profesor-card">
              <div className="profesor-card-header">
                <div>
                  <div className="profesor-nombre">{profesor.nombre}</div>
                  <div className="profesor-materia">{profesor.materia}</div>
                </div>
                {profesor.evaluado && (
                  <CheckCircle size={24} className="text-success" />
                )}
              </div>

              {profesor.evaluado ? (
                <div className="evaluacion-completada">
                  Evaluación completada
                </div>
              ) : (
                <Button
                  variant="success"
                  className="btn-evaluar"
                  onClick={() => navigate(`/evaluacion-profesores/${profesor._id}?materia=${profesor.materiaId}`)}
                >
                  Evaluar Profesor
                </Button>
              )}
            </div>
          </Col>
        ))}
      </Row>

      {/* Panel informativo */}
      <div className="importancia-card">
        <div className="importancia-card-title">
          <Star size={22} className="text-warning" />
          Importancia de la evaluación
        </div>
        <p className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>
          Tu evaluación es anónima y confidencial. Los resultados se utilizan para:
        </p>
        <ul className="text-muted" style={{ fontSize: '0.88rem', paddingLeft: '20px' }}>
          <li className="mb-1">Mejorar la calidad de la enseñanza</li>
          <li className="mb-1">Identificar áreas de oportunidad en la docencia</li>
          <li className="mb-1">Reconocer el desempeño destacado de los profesores</li>
          <li>Contribuir al desarrollo profesional del personal académico</li>
        </ul>
      </div>
    </div>
  );
};

export default EvaluacionProfesores;
