import { useState, useEffect } from 'react';
import { Row, Col, Button, Alert } from 'react-bootstrap';
import { BookOpen, CheckCircle, XCircle, Clock } from 'lucide-react';
import { collection, query, where, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import InicioProfesor from './InicioProfesor';
import InicioAdmin from './admin/InicioAdmin';

const estaEnHorario = (horario) => {
  const diasMap = { 'Lun': 1, 'Mar': 2, 'Mie': 3, 'Jue': 4, 'Vie': 5, 'Sab': 6, 'Dom': 0 };
  try {
    const parts = horario.split(' ');
    const daysPart = parts[0];
    const timePart = parts[1];
    let dias = [];
    if (daysPart.includes('-')) {
      const [d1, d2] = daysPart.split('-');
      const start = diasMap[d1], end = diasMap[d2];
      if (end - start === 2) dias = [start, end];
      else for (let i = start; i <= end; i++) dias.push(i);
    } else {
      dias = [diasMap[daysPart]];
    }
    const [horaInicio, horaFin] = timePart.split('-');
    const [hi, mi] = horaInicio.split(':').map(Number);
    const [hf, mf] = horaFin.split(':').map(Number);
    const now = new Date();
    const minActual = now.getHours() * 60 + now.getMinutes();
    return dias.includes(now.getDay()) && minActual >= hi * 60 + (mi || 0) && minActual <= hf * 60 + (mf || 0);
  } catch { return false; }
};

const Inicio = () => {
  const { userRole, user } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [profesoresMap, setProfesoresMap] = useState({});
  const [registrando, setRegistrando] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    if (userRole !== 'alumno' || !user?.uid) return;
    const fetchData = async () => {
      const [materiasSnap, asistSnap, usersSnap] = await Promise.all([
        getDocs(query(collection(db, 'materias'), where('alumnos', 'array-contains', user.uid))),
        getDocs(query(collection(db, 'asistencias'), where('alumno', '==', user.uid))),
        getDocs(collection(db, 'users'))
      ]);
      const mats = materiasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMaterias(mats);
      setAsistencias(asistSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const map = {};
      usersSnap.docs.forEach(d => { map[d.id] = d.data().name; });
      setProfesoresMap(map);
    };
    fetchData();
  }, [userRole, user?.uid]);

  if (userRole === 'profesor') return <InicioProfesor />;
  if (userRole === 'admin') return <InicioAdmin />;

  const toDate = (v) => v?.toDate ? v.toDate() : new Date(v);

  const getStats = (materiaId) => {
    const registros = asistencias.filter(a => a.materia === materiaId);
    return {
      asistencias: registros.filter(a => a.estado === 'presente').length,
      faltas: registros.filter(a => a.estado === 'falta').length,
      retardos: registros.filter(a => a.estado === 'retardo').length
    };
  };

  const getAsistenciaHoy = (materiaId) => {
    const hoy = new Date().toISOString().split('T')[0];
    return asistencias.find(a => {
      const fecha = toDate(a.fecha).toISOString().split('T')[0];
      return a.materia === materiaId && fecha === hoy;
    });
  };

  const registrarAsistencia = async (materiaId) => {
    setRegistrando(materiaId);
    setMensaje(null);
    try {
      const hoy = new Date();
      const fechaStr = hoy.toISOString().split('T')[0];
      const docId = `${user.uid}_${materiaId}_${fechaStr}`;
      const nueva = {
        alumno: user.uid,
        materia: materiaId,
        estado: 'presente',
        fecha: Timestamp.fromDate(hoy),
        observaciones: '',
        createdAt: Timestamp.fromDate(hoy)
      };
      await setDoc(doc(db, 'asistencias', docId), nueva);
      setAsistencias(prev => [...prev, { id: docId, ...nueva }]);
      setMensaje({ tipo: 'success', texto: 'Asistencia registrada correctamente.' });
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message || 'Error al registrar asistencia.' });
    } finally {
      setRegistrando(null);
    }
  };

  const renderEstadoBadge = (materiaId) => {
    const registro = getAsistenciaHoy(materiaId);
    if (!registro) return <span className="estado-badge fuera">Sin registrar</span>;
    switch (registro.estado) {
      case 'presente': return <span className="estado-badge presente">Presente</span>;
      case 'retardo': return <span className="estado-badge retardo">Retardo</span>;
      case 'falta': return <span className="estado-badge falta">Falta</span>;
      default: return null;
    }
  };

  return (
    <div>
      <h2 className="page-title">Panel de Inicio</h2>
      <p className="page-subtitle">Bienvenido al sistema de control academico. Aqui puedes ver tus materias y registrar tu asistencia.</p>

      {mensaje && <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje(null)}>{mensaje.texto}</Alert>}

      <Row>
        {materias.map((materia) => {
          const stats = getStats(materia.id);
          const yaRegistrada = getAsistenciaHoy(materia.id);
          return (
            <Col key={materia.id} lg={4} md={6} className="mb-4">
              <div className="materia-card">
                <div className="materia-card-header">
                  <div>
                    <h5>{materia.nombre}</h5>
                    <p className="materia-card-info">Grupo: {materia.grupo}</p>
                    <p className="materia-card-info">{profesoresMap[materia.profesor] || ''}</p>
                    <p className="materia-card-schedule">{materia.horario}</p>
                  </div>
                  <BookOpen size={28} className="materia-card-icon" />
                </div>

                <div className="stats-row">
                  <div className="stat-item">
                    <CheckCircle className="stat-icon success" />
                    <span className="stat-label">Asistencias</span>
                    <span className="stat-value success">{stats.asistencias}</span>
                  </div>
                  <div className="stat-item">
                    <XCircle className="stat-icon danger" />
                    <span className="stat-label">Faltas</span>
                    <span className="stat-value danger">{stats.faltas}</span>
                  </div>
                  <div className="stat-item">
                    <Clock className="stat-icon warning" />
                    <span className="stat-label">Retardos</span>
                    <span className="stat-value warning">{stats.retardos}</span>
                  </div>
                </div>

                <div className="estado-hoy">
                  <span>Estado de hoy:</span>
                  {renderEstadoBadge(materia.id)}
                </div>

                {yaRegistrada ? (
                  <Button className="btn-asistencia" variant="outline-success" disabled>
                    <CheckCircle size={16} className="me-2" />Ya registrada
                  </Button>
                ) : estaEnHorario(materia.horario) ? (
                  <Button className="btn-asistencia" variant="success" disabled={registrando === materia.id} onClick={() => registrarAsistencia(materia.id)}>
                    {registrando === materia.id ? 'Registrando...' : 'Registrar Asistencia'}
                  </Button>
                ) : (
                  <Button className="btn-asistencia" variant="secondary" disabled>Fuera de horario</Button>
                )}
              </div>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default Inicio;
