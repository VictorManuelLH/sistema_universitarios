import { useState, useEffect } from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import { Users, BookOpen, UserCheck, GraduationCap, Star, FileText, ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const StatCard = ({ icon: Icon, value, label, color, onClick }) => (
  <div className="total-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.15s', userSelect: 'none' }}
    onMouseEnter={e => { if (onClick) e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    <div className="d-flex align-items-center justify-content-center gap-2">
      <Icon size={24} style={{ color }} />
      <div>
        <span className="total-value" style={{ fontSize: '1.5rem', color }}>{value}</span>
        <span className="total-label" style={{ marginBottom: 0 }}>{label}</span>
      </div>
    </div>
  </div>
);

const InicioAdmin = () => {
  const [stats, setStats] = useState({ alumnos: 0, profesores: 0, materias: 0, reportesPendientes: 0, lecturasPendientes: 0, evaluaciones: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersSnap, materiasSnap, reportesSnap, lecturasSnap, evalsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'materias')),
          getDocs(collection(db, 'reportes')),
          getDocs(collection(db, 'reportesLectura')),
          getDocs(collection(db, 'evaluaciones'))
        ]);
        const users = usersSnap.docs.map(d => d.data());
        const reportes = reportesSnap.docs.map(d => d.data());
        const lecturas = lecturasSnap.docs.map(d => d.data());
        setStats({
          alumnos: users.filter(u => u.role === 'alumno').length,
          profesores: users.filter(u => u.role === 'profesor').length,
          materias: materiasSnap.size,
          reportesPendientes: reportes.filter(r => r.estado === 'pendiente').length,
          lecturasPendientes: lecturas.filter(r => r.estado === 'pendiente').length,
          evaluaciones: evalsSnap.size
        });
      } catch (err) {
        console.error('Error cargando estadísticas:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h2 className="page-title">Panel de Administración</h2>
      <p className="page-subtitle">Gestiona usuarios, materias y configuraciones del sistema universitario.</p>

      {loading ? (
        <div className="text-center py-4"><div className="spinner-border text-primary" role="status" /></div>
      ) : (
        <>
          <p className="text-muted fw-semibold mb-2" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Usuarios y Materias</p>
          <Row className="mb-4">
            <Col sm={4} className="mb-3">
              <StatCard icon={GraduationCap} value={stats.alumnos} label="Alumnos" color="#4361ee" onClick={() => navigate('/admin/usuarios')} />
            </Col>
            <Col sm={4} className="mb-3">
              <StatCard icon={UserCheck} value={stats.profesores} label="Profesores" color="#2d6a4f" onClick={() => navigate('/admin/usuarios')} />
            </Col>
            <Col sm={4} className="mb-3">
              <StatCard icon={BookOpen} value={stats.materias} label="Materias" color="#e76f51" onClick={() => navigate('/admin/materias')} />
            </Col>
          </Row>

          <p className="text-muted fw-semibold mb-2" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Actividad</p>
          <Row className="mb-4">
            <Col sm={4} className="mb-3">
              <StatCard icon={FileText} value={stats.reportesPendientes} label="Reportes pendientes" color={stats.reportesPendientes > 0 ? '#ca8a04' : '#6c757d'} onClick={() => navigate('/admin/reportes')} />
            </Col>
            <Col sm={4} className="mb-3">
              <StatCard icon={ClipboardCheck} value={stats.lecturasPendientes} label="Lecturas pendientes" color={stats.lecturasPendientes > 0 ? '#ca8a04' : '#6c757d'} onClick={() => navigate('/admin/reportes')} />
            </Col>
            <Col sm={4} className="mb-3">
              <StatCard icon={Star} value={stats.evaluaciones} label="Evaluaciones" color="#9333ea" onClick={() => navigate('/admin/evaluaciones')} />
            </Col>
          </Row>
        </>
      )}

      <div className="d-flex gap-3 flex-wrap">
        <Button variant="primary" onClick={() => navigate('/admin/usuarios')}>
          <Users size={18} className="me-2" />Gestionar Usuarios
        </Button>
        <Button variant="outline-primary" onClick={() => navigate('/admin/materias')}>
          <BookOpen size={18} className="me-2" />Gestionar Materias
        </Button>
        <Button variant="outline-warning" onClick={() => navigate('/admin/evaluaciones')}>
          <Star size={18} className="me-2" />Ver Evaluaciones
        </Button>
      </div>
    </div>
  );
};

export default InicioAdmin;
