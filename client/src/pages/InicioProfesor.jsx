import { useState, useEffect } from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import { BookOpen, Users, CheckCircle, XCircle, Clock, ClipboardList, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const InicioProfesor = () => {
  const [materias, setMaterias] = useState([]);
  const [resumenHoy, setResumenHoy] = useState({ presentes: 0, faltas: 0, retardos: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const materiasData = await api.get('/materias/profesor/mis-materias');
        setMaterias(materiasData);

        // Obtener asistencias de hoy para todas las materias en paralelo
        const hoy = new Date().toISOString().split('T')[0];

        const resultados = await Promise.all(
          materiasData.map(materia =>
            api.get(`/asistencias/materia/${materia._id}?fecha=${hoy}`).catch(() => [])
          )
        );

        const todas = resultados.flat();
        setResumenHoy({
          presentes: todas.filter(a => a.estado === 'presente').length,
          faltas: todas.filter(a => a.estado === 'falta').length,
          retardos: todas.filter(a => a.estado === 'retardo').length
        });
      } catch (err) {
        console.error('Error cargando datos:', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <h2 className="page-title">Panel del Profesor</h2>
      <p className="page-subtitle">
        Bienvenido al sistema de control academico. Aqui puedes gestionar la asistencia de tus grupos.
      </p>

      {/* Resumen de asistencias del dia */}
      <h5 className="fw-bold mb-3">Resumen de Hoy</h5>
      <Row className="mb-4">
        <Col sm={4} className="mb-3">
          <div className="total-card">
            <div className="d-flex align-items-center justify-content-center gap-2">
              <CheckCircle size={24} className="text-success" />
              <div>
                <span className="total-value success" style={{ fontSize: '1.5rem' }}>{resumenHoy.presentes}</span>
                <span className="total-label" style={{ marginBottom: 0 }}>Presentes</span>
              </div>
            </div>
          </div>
        </Col>
        <Col sm={4} className="mb-3">
          <div className="total-card">
            <div className="d-flex align-items-center justify-content-center gap-2">
              <XCircle size={24} className="text-danger" />
              <div>
                <span className="total-value danger" style={{ fontSize: '1.5rem' }}>{resumenHoy.faltas}</span>
                <span className="total-label" style={{ marginBottom: 0 }}>Faltas</span>
              </div>
            </div>
          </div>
        </Col>
        <Col sm={4} className="mb-3">
          <div className="total-card">
            <div className="d-flex align-items-center justify-content-center gap-2">
              <Clock size={24} style={{ color: '#e6a817' }} />
              <div>
                <span className="total-value warning" style={{ fontSize: '1.5rem' }}>{resumenHoy.retardos}</span>
                <span className="total-label" style={{ marginBottom: 0 }}>Retardos</span>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Acceso rapido */}
      <div className="d-flex gap-3 mb-4 flex-wrap">
        <Button variant="primary" onClick={() => navigate('/gestion-asistencias')}>
          <ClipboardList size={18} className="me-2" />
          Gestionar Asistencias
        </Button>
        <Button variant="outline-primary" onClick={() => navigate('/historial-asistencias')}>
          <History size={18} className="me-2" />
          Historial de Asistencias
        </Button>
      </div>

      {/* Cards de materias */}
      <h5 className="fw-bold mb-3">Mis Materias</h5>
      <Row>
        {materias.map((materia) => (
          <Col key={materia._id} lg={4} md={6} className="mb-4">
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
