import { useAuth } from '../context/AuthContext';
import { User } from 'lucide-react';

const Campo = ({ label, value }) => (
  <div className="mb-4">
    <p className="text-muted mb-1" style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>{label}</p>
    <p className="mb-0">{value || '—'}</p>
  </div>
);

const Perfil = () => {
  const { user, userRole } = useAuth();

  const rolLabel = userRole === 'alumno' ? 'Alumno' : userRole === 'profesor' ? 'Profesor' : 'Administrador';

  return (
    <div className="container py-4" style={{ maxWidth: 640 }}>
      <div className="d-flex align-items-center gap-2 mb-4">
        <User size={24} className="text-primary" />
        <h4 className="mb-0 fw-bold">Mi Perfil</h4>
      </div>

      <div className="card shadow-sm">
        <div className="card-body text-center py-4 border-bottom" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28, color: 'white', fontWeight: 700 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h5 className="mb-1 text-white fw-bold">{user?.name}</h5>
          <span className="badge bg-light text-dark">{rolLabel}</span>
        </div>

        <div className="card-body">
          <Campo label="Nombre completo" value={user?.name} />
          <Campo label="Correo" value={user?.email} />
          {userRole === 'alumno' && (
            <>
              {user?.matricula && <Campo label="Matrícula" value={user.matricula} />}
              {user?.carrera && <Campo label="Carrera" value={user.carrera} />}
              {user?.semestre && <Campo label="Semestre" value={user.semestre} />}
            </>
          )}
          {userRole === 'profesor' && (
            <>
              {user?.numEmpleado && <Campo label="Número de Empleado" value={user.numEmpleado} />}
              {user?.departamento && <Campo label="Departamento" value={user.departamento} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Perfil;
