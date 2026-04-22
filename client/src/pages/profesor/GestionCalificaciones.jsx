import { useState, useEffect } from 'react';
import { Table, Button, Alert, Spinner, Form } from 'react-bootstrap';
import { BookOpen, Save } from 'lucide-react';
import { collection, query, where, getDocs, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

const calcularPromedio = (califs) => {
  const valores = [califs.parcial1, califs.parcial2, califs.parcial3, califs.final]
    .filter(v => v !== '' && v !== null && v !== undefined && !isNaN(parseFloat(v)));
  if (!valores.length) return null;
  return parseFloat((valores.reduce((a, b) => a + parseFloat(b), 0) / valores.length).toFixed(2));
};

const CeldaCalif = ({ value, onChange }) => (
  <Form.Control
    type="number"
    min="0"
    max="10"
    step="0.1"
    style={{ width: '80px', fontSize: '0.9rem' }}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder="—"
  />
);

const GestionCalificaciones = () => {
  const { user } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [calificaciones, setCalificaciones] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const cargar = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'materias'), where('profesor', '==', user.uid)));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMaterias(data);
        if (data.length > 0) setMateriaSeleccionada(data[0].id);
      } catch (err) {
        console.error('Error cargando materias:', err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [user?.uid]);

  useEffect(() => {
    if (!materiaSeleccionada) return;
    const materia = materias.find(m => m.id === materiaSeleccionada);
    if (!materia?.alumnos?.length) { setAlumnos([]); setCalificaciones({}); return; }

    const cargarDatos = async () => {
      setLoadingAlumnos(true);
      try {
        const [usersSnap, califSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(query(collection(db, 'calificaciones'), where('materia', '==', materiaSeleccionada)))
        ]);

        const usersMap = {};
        usersSnap.docs.forEach(d => { usersMap[d.id] = d.data(); });

        const califMap = {};
        califSnap.docs.forEach(d => { califMap[d.data().alumno] = d.data(); });

        setAlumnos(materia.alumnos.map(uid => ({
          uid,
          matricula: usersMap[uid]?.matricula || '',
          nombre: usersMap[uid]?.name || uid,
        })));

        const initCalifs = {};
        materia.alumnos.forEach(uid => {
          const ex = califMap[uid];
          initCalifs[uid] = {
            parcial1: ex?.parcial1 ?? '',
            parcial2: ex?.parcial2 ?? '',
            parcial3: ex?.parcial3 ?? '',
            final:    ex?.final    ?? '',
          };
        });
        setCalificaciones(initCalifs);
      } catch (err) {
        console.error('Error cargando calificaciones:', err);
      } finally {
        setLoadingAlumnos(false);
      }
    };
    cargarDatos();
  }, [materiaSeleccionada, materias]);

  const handleChange = (uid, campo, valor) => {
    if (valor !== '' && (parseFloat(valor) < 0 || parseFloat(valor) > 10)) return;
    setCalificaciones(prev => ({ ...prev, [uid]: { ...prev[uid], [campo]: valor } }));
  };

  const guardarCalificaciones = async () => {
    setGuardando(true);
    setMensaje(null);
    try {
      await Promise.all(
        alumnos.map(alumno => {
          const c = calificaciones[alumno.uid] || {};
          const promedio = calcularPromedio(c);
          return setDoc(doc(db, 'calificaciones', `${alumno.uid}_${materiaSeleccionada}`), {
            alumno: alumno.uid,
            materia: materiaSeleccionada,
            parcial1: c.parcial1 !== '' && c.parcial1 !== undefined ? parseFloat(c.parcial1) : null,
            parcial2: c.parcial2 !== '' && c.parcial2 !== undefined ? parseFloat(c.parcial2) : null,
            parcial3: c.parcial3 !== '' && c.parcial3 !== undefined ? parseFloat(c.parcial3) : null,
            final:    c.final    !== '' && c.final    !== undefined ? parseFloat(c.final)    : null,
            promedio,
            updatedAt: serverTimestamp()
          }, { merge: true });
        })
      );

      const nombreMateria = materiaActual?.nombre || 'una materia';
      await Promise.all(
        alumnos.map(alumno =>
          addDoc(collection(db, 'notificaciones'), {
            usuario: alumno.uid,
            mensaje: `Se han actualizado tus calificaciones de ${nombreMateria}.`,
            tipo: 'info',
            leida: false,
            link: '/calificaciones',
            createdAt: serverTimestamp()
          })
        )
      );

      setMensaje({ tipo: 'success', texto: 'Calificaciones guardadas correctamente.' });
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message || 'Error al guardar calificaciones.' });
    } finally {
      setGuardando(false);
    }
  };

  const renderPromedio = (uid) => {
    const c = calificaciones[uid];
    if (!c) return <span className="text-muted">—</span>;
    const p = calcularPromedio(c);
    if (p === null) return <span className="text-muted">—</span>;
    return <span style={{ fontWeight: 700, color: p >= 6 ? '#2d6a4f' : '#dc3545' }}>{p.toFixed(1)}</span>;
  };

  const materiaActual = materias.find(m => m.id === materiaSeleccionada);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  return (
    <div>
      <h2 className="page-title">Gestión de Calificaciones</h2>
      <p className="page-subtitle">Registra y actualiza las calificaciones de tus alumnos por materia.</p>

      {mensaje && <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje(null)}>{mensaje.texto}</Alert>}

      <div className="materia-pills mb-4">
        {materias.map(m => (
          <button key={m.id} className={`materia-pill ${materiaSeleccionada === m.id ? 'active' : ''}`} onClick={() => setMateriaSeleccionada(m.id)}>
            <BookOpen size={16} className="me-1" />{m.nombre} - Grupo {m.grupo}
          </button>
        ))}
      </div>

      <div className="tabla-asistencia">
        <div className="p-3 pb-0">
          <h5 className="fw-bold mb-3">{materiaActual?.nombre} - Grupo {materiaActual?.grupo}</h5>
        </div>

        {loadingAlumnos ? (
          <div className="text-center py-5"><Spinner animation="border" /></div>
        ) : (
          <Table responsive hover>
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Nombre</th>
                <th>Parcial 1</th>
                <th>Parcial 2</th>
                <th>Parcial 3</th>
                <th>Final</th>
                <th>Promedio</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map(alumno => (
                <tr key={alumno.uid}>
                  <td className="fw-semibold">{alumno.matricula}</td>
                  <td>{alumno.nombre}</td>
                  {['parcial1', 'parcial2', 'parcial3', 'final'].map(campo => (
                    <td key={campo}>
                      <CeldaCalif
                        value={calificaciones[alumno.uid]?.[campo] ?? ''}
                        onChange={val => handleChange(alumno.uid, campo, val)}
                      />
                    </td>
                  ))}
                  <td style={{ verticalAlign: 'middle' }}>{renderPromedio(alumno.uid)}</td>
                </tr>
              ))}
              {alumnos.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted py-4">Esta materia no tiene alumnos inscritos.</td></tr>
              )}
            </tbody>
          </Table>
        )}
      </div>

      {alumnos.length > 0 && (
        <div className="d-flex justify-content-end mt-4">
          <Button variant="success" size="lg" onClick={guardarCalificaciones} disabled={guardando}>
            <Save size={18} className="me-2" />{guardando ? 'Guardando...' : 'Guardar Calificaciones'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default GestionCalificaciones;
