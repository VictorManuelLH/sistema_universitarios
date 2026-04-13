import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Star } from 'lucide-react';
import api from '../utils/api';

const criterios = [
  { key: 'dominio_tema', label: 'Dominio del tema' },
  { key: 'claridad', label: 'Claridad en la exposición' },
  { key: 'puntualidad', label: 'Puntualidad' },
  { key: 'disponibilidad', label: 'Disponibilidad para atender dudas' },
  { key: 'material_didactico', label: 'Calidad del material didáctico' }
];

const StarRating = ({ value, onChange }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= (hover || value) ? 'active' : ''}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
        >
          <Star size={28} fill={star <= (hover || value) ? '#ffc107' : 'none'} />
        </button>
      ))}
    </div>
  );
};

const EvaluarProfesor = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const materiaId = searchParams.get('materia');
  const navigate = useNavigate();

  const [profesor, setProfesor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [ratings, setRatings] = useState(
    Object.fromEntries(criterios.map((c) => [c.key, 0]))
  );
  const [comentarios, setComentarios] = useState('');

  useEffect(() => {
    api.get('/evaluaciones/profesores')
      .then(data => {
        const found = data.find(p => p._id === id && p.materiaId === materiaId);
        if (found) {
          setProfesor(found);
        } else {
          setNoEncontrado(true);
        }
      })
      .catch(() => setNoEncontrado(true))
      .finally(() => setLoading(false));
  }, [id, materiaId]);

  const handleRatingChange = (key, value) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje(null);
    try {
      await api.post('/evaluaciones', {
        profesorId: id,
        materiaId,
        respuestas: ratings,
        comentarios
      });
      navigate('/evaluacion-profesores');
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message || 'Error al enviar la evaluación.' });
      setEnviando(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5"><Spinner animation="border" /></div>;
  }

  if (noEncontrado) {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-start mb-1">
          <h2 className="page-title">Evaluación de Profesor</h2>
          <Button variant="outline-secondary" onClick={() => navigate('/evaluacion-profesores')}>
            Volver
          </Button>
        </div>
        <Alert variant="warning" className="mt-3">
          No se encontró el profesor o ya fue evaluado. Por favor regresa a la lista.
        </Alert>
      </div>
    );
  }

  return (
    <div>
      {/* Encabezado con botón volver */}
      <div className="d-flex justify-content-between align-items-start mb-1">
        <h2 className="page-title">Evaluación de Profesor</h2>
        <Button
          variant="outline-secondary"
          onClick={() => navigate('/evaluacion-profesores')}
        >
          Volver
        </Button>
      </div>
      <p className="page-subtitle">
        {profesor.nombre} - {profesor.materia}
      </p>

      {mensaje && (
        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje(null)}>
          {mensaje.texto}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        {/* Card de criterios */}
        <div className="evaluacion-criterios-card">
          <h5 className="fw-bold mb-4">Califica cada criterio</h5>

          {criterios.map((criterio) => (
            <div key={criterio.key} className="criterio-row">
              <span className="criterio-label">{criterio.label}</span>
              <StarRating
                value={ratings[criterio.key]}
                onChange={(val) => handleRatingChange(criterio.key, val)}
              />
            </div>
          ))}
        </div>

        {/* Comentarios */}
        <Form.Group className="mt-4">
          <Form.Label className="fw-semibold">
            Comentarios adicionales (opcional)
          </Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            placeholder="Comparte tu experiencia con este profesor..."
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
          />
        </Form.Group>

        <Button
          variant="success"
          type="submit"
          className="w-100 py-2 fw-semibold mt-4"
          disabled={enviando}
        >
          {enviando ? 'Enviando...' : 'Enviar Evaluación'}
        </Button>
      </Form>
    </div>
  );
};

export default EvaluarProfesor;
