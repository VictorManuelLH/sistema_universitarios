import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Save } from 'lucide-react';

const Perfil = () => {
  const { user, userRole, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    carrera: user?.carrera || '',
    semestre: user?.semestre || '',
    departamento: user?.departamento || ''
  });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    try {
      const allowed = ['name', 'carrera', 'semestre', 'departamento'];
      const updates = {};
      allowed.forEach(k => { if (form[k] !== undefined) updates[k] = form[k]; });
      await updateDoc(doc(db, 'users', user.uid), updates);
      updateUser(updates);
      setMensaje({ tipo: 'success', texto: 'Perfil actualizado correctamente.' });
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message });
    } finally {
      setGuardando(false);
    }
  };

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
          <div className="mb-4">
            <p className="text-muted mb-1" style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Correo</p>
            <p className="mb-0">{user?.email}</p>
          </div>
          {userRole === 'alumno' && user?.matricula && (
            <div className="mb-4">
              <p className="text-muted mb-1" style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Matrícula</p>
              <p className="mb-0">{user.matricula}</p>
            </div>
          )}
          {userRole === 'profesor' && user?.numEmpleado && (
            <div className="mb-4">
              <p className="text-muted mb-1" style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Número de Empleado</p>
              <p className="mb-0">{user.numEmpleado}</p>
            </div>
          )}
          <hr />
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Nombre completo</label>
              <input type="text" className="form-control" name="name" value={form.name} onChange={handleChange} required />
            </div>
            {userRole === 'alumno' && (
              <>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Carrera</label>
                  <input type="text" className="form-control" name="carrera" value={form.carrera} onChange={handleChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Semestre</label>
                  <input type="text" className="form-control" name="semestre" value={form.semestre} onChange={handleChange} />
                </div>
              </>
            )}
            {userRole === 'profesor' && (
              <div className="mb-3">
                <label className="form-label fw-semibold">Departamento</label>
                <input type="text" className="form-control" name="departamento" value={form.departamento} onChange={handleChange} />
              </div>
            )}
            {mensaje && <div className={`alert alert-${mensaje.tipo} py-2`}>{mensaje.texto}</div>}
            <button type="submit" className="btn btn-primary w-100" disabled={guardando}>
              <Save size={16} className="me-2" />{guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
