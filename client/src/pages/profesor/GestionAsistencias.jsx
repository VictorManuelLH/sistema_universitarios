import { useState, useEffect } from 'react';
import { Row, Col, Table, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { BookOpen, CheckCircle, XCircle, Clock, HelpCircle, CheckCheck, UserX, Save } from 'lucide-react';
import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

const GestionAsistencias = () => {
  const { user } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const cargar = async () => {
      const snap = await getDocs(query(collection(db, 'materias'), where('profesor', '==', user.uid)));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMaterias(data);
      if (data.length > 0) setMateriaSeleccionada(data[0].id);
      setLoading(false);
    };
    cargar();
  }, [user?.uid]);

  useEffect(() => {
    if (!materiaSeleccionada) return;
    const materia = materias.find(m => m.id === materiaSeleccionada);
    if (!materia?.alumnos?.length) { setAlumnos([]); return; }

    const cargarAlumnos = async () => {
      try {
        const fechaStr = new Date().toISOString().split('T')[0];

        const [usersSnap, asistenciasSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(query(
            collection(db, 'asistencias'),
            where('materia', '==', materiaSeleccionada)
          ))
        ]);

        const usersMap = {};
        usersSnap.docs.forEach(d => { usersMap[d.id] = d.data(); });

        const asistenciasMap = {};
        asistenciasSnap.docs.forEach(d => {
          const data = d.data();
          const docFecha = data.fecha?.toDate
            ? data.fecha.toDate().toISOString().split('T')[0]
            : new Date(data.fecha).toISOString().split('T')[0];
          if (docFecha === fechaStr) {
            asistenciasMap[data.alumno] = data.estado;
          }
        });

        setAlumnos(materia.alumnos.map(uid => ({
          uid,
          matricula: usersMap[uid]?.matricula || '',
          nombre: usersMap[uid]?.name || uid,
          estado: asistenciasMap[uid] || 'sin_registro'
        })));
      } catch (err) {
        console.error('Error al cargar alumnos:', err);
      }
    };
    cargarAlumnos();
  }, [materiaSeleccionada, materias]);

  const materiaActual = materias.find(m => m.id === materiaSeleccionada);
  const presentes = alumnos.filter(a => a.estado === 'presente').length;
  const faltas = alumnos.filter(a => a.estado === 'falta').length;
  const retardos = alumnos.filter(a => a.estado === 'retardo').length;
  const sinRegistro = alumnos.filter(a => a.estado === 'sin_registro').length;

  const cambiarEstado = (uid, nuevoEstado) =>
    setAlumnos(prev => prev.map(a => a.uid === uid ? { ...a, estado: nuevoEstado } : a));

  const marcarTodos = (estado) =>
    setAlumnos(prev => prev.map(a => ({ ...a, estado })));

  const guardarAsistencias = async () => {
    const registros = alumnos.filter(a => a.estado !== 'sin_registro');
    if (registros.length === 0) {
      setMensaje({ tipo: 'warning', texto: 'No hay asistencias marcadas para guardar.' });
      return;
    }

    const hoy = new Date();
    const fechaStr = hoy.toISOString().split('T')[0];

    setGuardando(true);
    setMensaje(null);
    try {
      const batch = writeBatch(db);
      registros.forEach(a => {
        // ID determinístico para evitar duplicados por día
        const docId = `${a.uid}_${materiaSeleccionada}_${fechaStr}`;
        const ref = doc(db, 'asistencias', docId);
        batch.set(ref, {
          alumno: a.uid,
          materia: materiaSeleccionada,
          estado: a.estado,
          fecha: Timestamp.fromDate(hoy),
          observaciones: '',
          createdAt: serverTimestamp()
        }, { merge: true });
      });
      await batch.commit();
      setMensaje({ tipo: 'success', texto: `${registros.length} asistencias guardadas correctamente.` });
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message || 'Error al guardar asistencias.' });
    } finally {
      setGuardando(false);
    }
  };

  const renderEstadoBadge = (estado) => {
    switch (estado) {
      case 'presente': return <Badge bg="success" className="badge-asistencia">Presente</Badge>;
      case 'falta': return <Badge bg="danger" className="badge-asistencia">Falta</Badge>;
      case 'retardo': return <Badge bg="warning" text="dark" className="badge-asistencia">Retardo</Badge>;
      default: return <Badge bg="light" text="dark" className="badge-asistencia" style={{ border: '1px solid #dee2e6' }}>Sin registro</Badge>;
    }
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  return (
    <div>
      <h2 className="page-title">Gestión de Asistencias</h2>
      <p className="page-subtitle">Registra y modifica la asistencia de tus alumnos en tiempo real.</p>

      {mensaje && <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje(null)}>{mensaje.texto}</Alert>}

      <div className="materia-pills mb-4">
        {materias.map(materia => (
          <button key={materia.id} className={`materia-pill ${materiaSeleccionada === materia.id ? 'active' : ''}`} onClick={() => setMateriaSeleccionada(materia.id)}>
            <BookOpen size={16} className="me-1" />{materia.nombre} - Grupo {materia.grupo}
          </button>
        ))}
      </div>

      <Row className="mb-4">
        {[
          { label: 'Presentes', value: presentes, color: 'success', icon: <CheckCircle size={24} className="text-success" /> },
          { label: 'Faltas', value: faltas, color: 'danger', icon: <XCircle size={24} className="text-danger" /> },
          { label: 'Retardos', value: retardos, color: 'warning', icon: <Clock size={24} style={{ color: '#e6a817' }} /> },
          { label: 'Sin registro', value: sinRegistro, color: null, icon: <HelpCircle size={24} className="text-secondary" /> }
        ].map(({ label, value, color, icon }) => (
          <Col sm={6} lg={3} className="mb-3" key={label}>
            <div className="total-card">
              <div className="d-flex align-items-center justify-content-center gap-2">
                {icon}
                <div>
                  <span className={`total-value${color ? ` ${color}` : ''}`} style={{ fontSize: '1.5rem', color: color ? undefined : '#6c757d' }}>{value}</span>
                  <span className="total-label" style={{ marginBottom: 0 }}>{label}</span>
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <div className="filtros-card mb-4">
        <h5 className="fw-bold mb-3">Acciones Rápidas</h5>
        <div className="d-flex gap-3 flex-wrap">
          <Button variant="outline-success" onClick={() => marcarTodos('presente')}>
            <CheckCheck size={18} className="me-2" />Marcar todos presentes
          </Button>
          <Button variant="outline-danger" onClick={() => marcarTodos('falta')}>
            <UserX size={18} className="me-2" />Marcar todos ausentes
          </Button>
        </div>
      </div>

      <div className="tabla-asistencia">
        <div className="p-3 pb-0">
          <h5 className="fw-bold mb-3">{materiaActual?.nombre} - Grupo {materiaActual?.grupo}</h5>
        </div>
        <Table responsive hover>
          <thead>
            <tr><th>Matrícula</th><th>Nombre del Alumno</th><th>Estado</th><th className="text-end">Acciones</th></tr>
          </thead>
          <tbody>
            {alumnos.map(alumno => (
              <tr key={alumno.uid}>
                <td className="fw-semibold">{alumno.matricula}</td>
                <td>{alumno.nombre}</td>
                <td>{renderEstadoBadge(alumno.estado)}</td>
                <td className="text-end">
                  <div className="d-flex gap-2 justify-content-end">
                    <button className={`action-btn action-btn-success ${alumno.estado === 'presente' ? 'active' : ''}`} onClick={() => cambiarEstado(alumno.uid, 'presente')} title="Presente">
                      <CheckCircle size={20} />
                    </button>
                    <button className={`action-btn action-btn-warning ${alumno.estado === 'retardo' ? 'active' : ''}`} onClick={() => cambiarEstado(alumno.uid, 'retardo')} title="Retardo">
                      <Clock size={20} />
                    </button>
                    <button className={`action-btn action-btn-danger ${alumno.estado === 'falta' ? 'active' : ''}`} onClick={() => cambiarEstado(alumno.uid, 'falta')} title="Falta">
                      <XCircle size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {alumnos.length === 0 && (
              <tr><td colSpan={4} className="text-center text-muted py-4">Esta materia no tiene alumnos inscritos.</td></tr>
            )}
          </tbody>
        </Table>
      </div>

      <div className="d-flex justify-content-end mt-4">
        <Button variant="success" size="lg" onClick={guardarAsistencias} disabled={guardando}>
          <Save size={18} className="me-2" />{guardando ? 'Guardando...' : 'Guardar Asistencias'}
        </Button>
      </div>
    </div>
  );
};

export default GestionAsistencias;
