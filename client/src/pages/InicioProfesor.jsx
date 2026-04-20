import { useState, useEffect } from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import { BookOpen, Users, CheckCircle, XCircle, Clock, ClipboardList, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const InicioProfesor = () => {
  const { user } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [resumenHoy, setResumenHoy] = useState({ presentes: 0, faltas: 0, retardos: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid) return;
    const fetchData = async () => {
      const materiasSnap = await getDocs(query(collection(db, 'materias'), where('profesor', '==', user.uid)));
      const mats = materiasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMaterias(mats);

      if (mats.length === 0) return;

      const materiaIds = mats.map(m => m.id);
      const asistSnap = await getDocs(query(collection(db, 'asistencias'), where('materia', 'in', materiaIds)));

      const hoy = new Date().toISOString().split('T')[0];
      const toDate = (v) => v?.toDate ? v.toDate() : new Date(v);

      const hoyRegistros = asistSnap.docs
        .map(d => d.data())
        .filter(a => toDate(a.fecha).toISOString().split('T')[0] === hoy);

      setResumenHoy({
        presentes: hoyRegistros.filter(a => a.estado === 'presente').length,
        faltas: hoyRegistros.filter(a => a.estado === 'falta').length,
        retardos: hoyRegistros.filter(a => a.estado === 'retardo').length
      });
    };
    fetchData();
  }, [user?.uid]);

  return (
    <div>
      <h2 className="page-title">Panel del Profesor</h2>
      <p className="page-subtitle">Bienvenido al sistema de control academico. Aqui puedes gestionar la asistencia de tus grupos.</p>

      <h5 className="fw-bold mb-3">Resumen de Hoy</h5>
      <Row className="mb-4">
        {[
          { icon: CheckCircle, value: resumenHoy.presentes, label: 'Presentes', cls: 'text-success', color: 'success' },
          { icon: XCircle, value: resumenHoy.faltas, label: 'Faltas', cls: 'text-danger', color: 'danger' },
          { icon: Clock, value: resumenHoy.retardos, label: 'Retardos', cls: null, style: { color: '#e6a817' }, color: 'warning' }
        ].map(({ icon: Icon, value, label, cls, style, color }) => (
          <Col sm={4} className="mb-3" key={label}>
            <div className="total-card">
              <div className="d-flex align-items-center justify-content-center gap-2">
                <Icon size={24} className={cls} style={style} />
                <div>
                  <span className={`total-value ${color}`} style={{ fontSize: '1.5rem' }}>{value}</span>
                  <span className="total-label" style={{ marginBottom: 0 }}>{label}</span>
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <div className="d-flex gap-3 mb-4 flex-wrap">
        <Button variant="primary" onClick={() => navigate('/gestion-asistencias')}>
          <ClipboardList size={18} className="me-2" />Gestionar Asistencias
        </Button>
        <Button variant="outline-primary" onClick={() => navigate('/historial-asistencias')}>
          <History size={18} className="me-2" />Historial de Asistencias
        </Button>
      </div>

      <h5 className="fw-bold mb-3">Mis Materias</h5>
      <Row>
        {materias.map(materia => (
          <Col key={materia.id} lg={4} md={6} className="mb-4">
            <div className="materia-card">
              <div className="materia-card-header">
                <div>
                  <h5>{materia.nombre}</h5>
                  <p className="materia-card-info">Grupo: {materia.grupo}</p>
                  <p className="materia-card-schedule">{materia.horario}</p>
                </div>
                <BookOpen size={28} className="materia-card-icon" />
              </div>
              <div className="stats-row">
                <div className="stat-item">
                  <Users className="stat-icon" style={{ color: '#4361ee' }} />
                  <span className="stat-label">Alumnos</span>
                  <span className="stat-value" style={{ color: '#4361ee' }}>{materia.alumnos?.length || 0}</span>
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default InicioProfesor;
