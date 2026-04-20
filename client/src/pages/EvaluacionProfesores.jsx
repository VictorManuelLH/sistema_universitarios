import { useState, useEffect } from 'react';
import { Row, Col, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Star, CheckCircle } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const EvaluacionProfesores = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const cargar = async () => {
      // Materias donde está inscrito el alumno
      const materiasSnap = await getDocs(
        query(collection(db, 'materias'), where('alumnos', 'array-contains', user.uid))
      );
      const materias = materiasSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Evaluaciones ya realizadas por este alumno
      const evalsSnap = await getDocs(
        query(collection(db, 'evaluaciones'), where('alumno', '==', user.uid))
      );
      const evaluadas = new Set(evalsSnap.docs.map(d => `${d.data().profesor}_${d.data().materia}`));

      // UIDs únicos de profesores
      const profUids = [...new Set(materias.map(m => m.profesor).filter(Boolean))];

      // Nombres de profesores
      const nombresMap = {};
      await Promise.all(profUids.map(async (uid) => {
        const snap = await getDocs(query(collection(db, 'users'), where('__name__', '==', uid)));
        if (!snap.empty) nombresMap[uid] = snap.docs[0].data().name;
      }));

      const lista = materias
        .filter(m => m.profesor)
        .map(m => ({
          uid: m.profesor,
          nombre: nombresMap[m.profesor] || 'Profesor',
          materia: m.nombre,
          materiaId: m.id,
          evaluado: evaluadas.has(`${m.profesor}_${m.id}`)
        }));

      setProfesores(lista);
      setLoading(false);
    };
    cargar();
  }, [user?.uid]);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  return (
    <div>
      <h2 className="page-title">Evaluación de Profesores</h2>
      <p className="page-subtitle">
        Evalúa el desempeño de tus profesores para contribuir a la mejora continua de la calidad educativa.
      </p>

      <Row>
        {profesores.map((profesor) => (
          <Col key={`${profesor.uid}-${profesor.materiaId}`} md={6} className="mb-4">
            <div className="profesor-card">
              <div className="profesor-card-header">
                <div>
                  <div className="profesor-nombre">{profesor.nombre}</div>
                  <div className="profesor-materia">{profesor.materia}</div>
                </div>
                {profesor.evaluado && <CheckCircle size={24} className="text-success" />}
              </div>
              {profesor.evaluado ? (
                <div className="evaluacion-completada">Evaluación completada</div>
              ) : (
                <Button
                  variant="success"
                  className="btn-evaluar"
                  onClick={() => navigate(`/evaluacion-profesores/${profesor.uid}?materia=${profesor.materiaId}`)}
                >
                  Evaluar Profesor
                </Button>
              )}
            </div>
          </Col>
        ))}
      </Row>

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
