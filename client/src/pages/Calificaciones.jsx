import { useState, useEffect } from 'react';
import { Row, Col, Spinner } from 'react-bootstrap';
import { GraduationCap, BookOpen } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const Campo = ({ label, valor }) => {
  const color = valor === null || valor === undefined ? '#6c757d' : valor >= 6 ? '#2d6a4f' : '#dc3545';
  return (
    <div className="text-center px-2">
      <div style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color }}>
        {valor !== null && valor !== undefined ? Number(valor).toFixed(1) : '—'}
      </div>
    </div>
  );
};

const Calificaciones = () => {
  const { user } = useAuth();
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const cargar = async () => {
      try {
        const [materiasSnap, califSnap, usersSnap] = await Promise.all([
          getDocs(query(collection(db, 'materias'), where('alumnos', 'array-contains', user.uid))),
          getDocs(query(collection(db, 'calificaciones'), where('alumno', '==', user.uid))),
          getDocs(collection(db, 'users'))
        ]);

        const califMap = {};
        califSnap.docs.forEach(d => { califMap[d.data().materia] = d.data(); });

        const usersMap = {};
        usersSnap.docs.forEach(d => { usersMap[d.id] = d.data().name; });

        setDatos(
          materiasSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .map(m => ({
              ...m,
              profesorNombre: usersMap[m.profesor] || '',
              calificacion: califMap[m.id] || null
            }))
        );
      } catch (err) {
        console.error('Error cargando calificaciones:', err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [user?.uid]);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  return (
    <div>
      <h2 className="page-title">Mis Calificaciones</h2>
      <p className="page-subtitle">Consulta tus calificaciones parciales y promedio por materia.</p>

      {datos.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <GraduationCap size={48} className="mb-3 opacity-25" />
          <p className="mb-0">No tienes materias inscritas.</p>
        </div>
      ) : (
        <Row>
          {datos.map(materia => {
            const c = materia.calificacion;
            const promedio = c?.promedio;
            const tienePromedio = promedio !== null && promedio !== undefined;
            const aprobado = tienePromedio && promedio >= 6;

            return (
              <Col key={materia.id} lg={6} className="mb-4">
                <div className="card shadow-sm h-100" style={{ borderRadius: 12, overflow: 'hidden', border: 'none' }}>
                  <div className="card-header d-flex justify-content-between align-items-center py-3 px-4"
                    style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', border: 'none' }}>
                    <div>
                      <div className="fw-bold text-white" style={{ fontSize: '1rem' }}>{materia.nombre}</div>
                      <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)' }}>
                        Grupo {materia.grupo} · {materia.profesorNombre}
                      </div>
                    </div>
                    <BookOpen size={24} color="rgba(255,255,255,0.6)" />
                  </div>

                  <div className="card-body px-4 py-3">
                    {!c ? (
                      <p className="text-center text-muted py-3 mb-0" style={{ fontSize: '0.9rem' }}>
                        Sin calificaciones registradas
                      </p>
                    ) : (
                      <>
                        <div className="d-flex justify-content-around py-3">
                          <Campo label="Parcial 1" valor={c.parcial1} />
                          <Campo label="Parcial 2" valor={c.parcial2} />
                          <Campo label="Parcial 3" valor={c.parcial3} />
                          <Campo label="Final"     valor={c.final} />
                        </div>
                        <hr className="my-2" />
                        <div className="d-flex justify-content-between align-items-center py-1">
                          <span className="fw-semibold" style={{ fontSize: '0.9rem', color: '#374151' }}>Promedio final</span>
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: tienePromedio ? (aprobado ? '#2d6a4f' : '#dc3545') : '#6c757d' }}>
                              {tienePromedio ? Number(promedio).toFixed(1) : '—'}
                            </span>
                            {tienePromedio && (
                              <span className={`badge ${aprobado ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '0.75rem' }}>
                                {aprobado ? 'Aprobado' : 'Reprobado'}
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
};

export default Calificaciones;
