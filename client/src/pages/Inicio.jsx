import { useState, useEffect } from 'react';
import { Row, Col, Button, Alert } from 'react-bootstrap';
import { BookOpen, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import InicioProfesor from './InicioProfesor';
import InicioAdmin from './admin/InicioAdmin';

const Inicio = () => {
  const { userRole } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [registrando, setRegistrando] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    if (userRole !== 'alumno') return;
    const fetchData = async () => {
      try {
        const [materiasData, asistenciasData] = await Promise.all([
          api.get('/materias/alumno/mis-materias'),
          api.get('/asistencias/mis-asistencias')
        ]);
        setMaterias(materiasData);
        setAsistencias(asistenciasData);
      } catch (err) {
        console.error('Error cargando datos:', err);
      }
    };
    fetchData();
  }, [userRole]);

  if (userRole === 'profesor') return <InicioProfesor />;
  if (userRole === 'admin') return <InicioAdmin />;

  // Calcular contadores por materia
  const getStats = (materiaId) => {
    const registros = asistencias.filter(a => a.materia?._id === materiaId || a.materia === materiaId);
    return {
      asistencias: registros.filter(a => a.estado === 'presente').length,
      faltas: registros.filter(a => a.estado === 'falta').length,
      retardos: registros.filter(a => a.estado === 'retardo').length
    };
  };

  // Parsear horario y verificar si estamos dentro
  const estaEnHorario = (horario) => {
    const diasMap = { 'Lun': 1, 'Mar': 2, 'Mie': 3, 'Jue': 4, 'Vie': 5, 'Sab': 6, 'Dom': 0 };
    const parts = horario.split(' ');
    const daysPart = parts[0];
    const timePart = parts[1];

    let dias = [];
    if (daysPart.includes('-')) {
      const [d1, d2] = daysPart.split('-');
      const start = diasMap[d1];
      const end = diasMap[d2];
      if (end - start === 2) {
        dias = [start, end];
      } else {
        for (let i = start; i <= end; i++) dias.push(i);
      }
    } else {
      dias = [diasMap[daysPart]];
    }

    const [horaInicio, horaFin] = timePart.split('-');
    const [hi, mi] = horaInicio.split(':').map(Number);
    const [hf, mf] = horaFin.split(':').map(Number);
    const inicioMin = hi * 60 + (mi || 0);
    const finMin = hf * 60 + (mf || 0);

    const now = new Date();
    const diaActual = now.getDay();
    const minActual = now.getHours() * 60 + now.getMinutes();
    return dias.includes(diaActual) && minActual >= inicioMin && minActual <= finMin;
  };

  // Verificar si ya se registro asistencia hoy para una materia
  const getAsistenciaHoy = (materiaId) => {
    const hoy = new Date().toISOString().split('T')[0];
    return asistencias.find(a => {
      const fechaRegistro = new Date(a.fecha).toISOString().split('T')[0];
      const idMateria = a.materia?._id || a.materia;
      return idMateria === materiaId && fechaRegistro === hoy;
    });
  };

  // Registrar asistencia para una materia
  const registrarAsistencia = async (materiaId) => {
    setRegistrando(materiaId);
    setMensaje(null);
    try {
      const nueva = await api.post('/asistencias/registrar', { materiaId });
      setAsistencias(prev => [...prev, nueva]);
      setMensaje({ tipo: 'success', texto: 'Asistencia registrada correctamente.' });
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message || 'Error al registrar asistencia.' });
    } finally {
      setRegistrando(null);
    }
  };

  // Renderizar badge de estado del día
  const renderEstadoBadge = (materiaId) => {
    const registro = getAsistenciaHoy(materiaId);
    if (!registro) return <span className="estado-badge fuera">Sin registrar</span>;
    switch (registro.estado) {
      case 'presente':
        return <span className="estado-badge presente">Presente</span>;
      case 'retardo':
        return <span className="estado-badge retardo">Retardo</span>;
      case 'falta':
        return <span className="estado-badge falta">Falta</span>;
      default:
        return null;
    }
  };

  return (
    <div>
      <h2 className="page-title">Panel de Inicio</h2>
      <p className="page-subtitle">
        Bienvenido al sistema de control academico. Aqui puedes ver tus materias y registrar tu asistencia.
      </p>

      {mensaje && (
        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje(null)}>
          {mensaje.texto}
        </Alert>
      )}

      <Row>
        {materias.map((materia) => {
          const stats = getStats(materia._id);
          const yaRegistrada = getAsistenciaHoy(materia._id);
          return (
            <Col key={materia._id} lg={4} md={6} className="mb-4">
              <div className="materia-card">
                {/* Encabezado con nombre e icono */}
                <div className="materia-card-header">
                  <div>
                    <h5>{materia.nombre}</h5>
                    <p className="materia-card-info">Grupo: {materia.grupo}</p>
                    <p className="materia-card-info">{materia.profesor?.name}</p>
                    <p className="materia-card-schedule">{materia.horario}</p>
                  </div>
                  <BookOpen size={28} className="materia-card-icon" />
                </div>

                {/* Contadores de asistencia */}
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

                {/* Estado del dia */}
                <div className="estado-hoy">
                  <span>Estado de hoy:</span>
                  {renderEstadoBadge(materia._id)}
                </div>

                {/* Boton de accion */}
                {yaRegistrada ? (
                  <Button className="btn-asistencia" variant="outline-success" disabled>
                    <CheckCircle size={16} className="me-2" />
                    Ya registrada
                  </Button>
                ) : estaEnHorario(materia.horario) ? (
                  <Button
                    className="btn-asistencia"
                    variant="success"
                    disabled={registrando === materia._id}
                    onClick={() => registrarAsistencia(materia._id)}
                  >
                    {registrando === materia._id ? 'Registrando...' : 'Registrar Asistencia'}
                  </Button>
                ) : (
                  <Button className="btn-asistencia" variant="secondary" disabled>
                    Fuera de horario
                  </Button>
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
