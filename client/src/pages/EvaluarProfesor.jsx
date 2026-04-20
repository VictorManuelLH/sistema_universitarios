import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Star } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

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
  const { id: profesorUid } = useParams();
  const [searchParams] = useSearchParams();
  const materiaId = searchParams.get('materia');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profesor, setProfesor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [ratings, setRatings] = useState(Object.fromEntries(criterios.map(c => [c.key, 0])));
  const [comentarios, setComentarios] = useState('');

  useEffect(() => {
    if (!profesorUid || !materiaId) return;
    const cargar = async () => {
      try {
        const [profSnap, materiaSnap] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('__name__', '==', profesorUid))),
          getDocs(query(collection(db, 'materias'), where('__name__', '==', materiaId)))
        ]);
        if (profSnap.empty || materiaSnap.empty) { setNoEncontrado(true); return; }
        setProfesor({
          nombre: profSnap.docs[0].data().name,
          materia: materiaSnap.docs[0].data().nombre
        });
      } catch {
        setNoEncontrado(true);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [profesorUid, materiaId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje(null);
    try {
      await addDoc(collection(db, 'evaluaciones'), {
        alumno: user.uid,
        profesor: profesorUid,
        materia: materiaId,
        respuestas: ratings,
        comentarios,
        createdAt: serverTimestamp()
      });
      navigate('/evaluacion-profesores');
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message || 'Error al enviar la evaluación.' });
      setEnviando(false);
    }
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  if (noEncontrado) {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-start mb-1">
          <h2 className="page-title">Evaluación de Profesor</h2>
          <Button variant="outline-secondary" onClick={() => navigate('/evaluacion-profesores')}>Volver</Button>
        </div>
        <Alert variant="warning" className="mt-3">
          No se encontró el profesor o ya fue evaluado. Por favor regresa a la lista.
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-1">
        <h2 className="page-title">Evaluación de Profesor</h2>
        <Button variant="outline-secondary" onClick={() => navigate('/evaluacion-profesores')}>Volver</Button>
      </div>
      <p className="page-subtitle">{profesor.nombre} - {profesor.materia}</p>

      {mensaje && (
        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje(null)}>{mensaje.texto}</Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <div className="evaluacion-criterios-card">
          <h5 className="fw-bold mb-4">Califica cada criterio</h5>
          {criterios.map((criterio) => (
            <div key={criterio.key} className="criterio-row">
              <span className="criterio-label">{criterio.label}</span>
              <StarRating value={ratings[criterio.key]} onChange={(val) => setRatings(prev => ({ ...prev, [criterio.key]: val }))} />
            </div>
          ))}
        </div>

        <Form.Group className="mt-4">
          <Form.Label className="fw-semibold">Comentarios adicionales (opcional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            placeholder="Comparte tu experiencia con este profesor..."
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
          />
        </Form.Group>

        <Button variant="success" type="submit" className="w-100 py-2 fw-semibold mt-4" disabled={enviando}>
          {enviando ? 'Enviando...' : 'Enviar Evaluación'}
        </Button>
      </Form>
    </div>
  );
};

export default EvaluarProfesor;
