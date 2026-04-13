import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import { Eye, EyeOff, LogIn, CheckCircle, GraduationCap, UserCog } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('alumno');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    try {
      const data = await login(email, password);
      // Verificar que el rol coincida
      if (data.role !== role) {
        setError(`Las credenciales no corresponden a un ${role}.`);
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Credenciales invalidas.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Panel izquierdo decorativo */}
        <div className="login-banner">
          <div className="login-banner-content">
            <div className="login-banner-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1>Sistema Universitario</h1>
            <p>Control de Asistencias y Calificaciones</p>
            <div className="login-banner-features">
              <div className="login-feature-item">
                <span className="login-feature-dot" />
                Registro de asistencia en tiempo real
              </div>
              <div className="login-feature-item">
                <span className="login-feature-dot" />
                Consulta de calificaciones
              </div>
              <div className="login-feature-item">
                <span className="login-feature-dot" />
                Reportes y justificantes
              </div>
              <div className="login-feature-item">
                <span className="login-feature-dot" />
                Evaluación docente
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho con formulario */}
        <div className="login-form-panel">
          <div className="login-form-wrapper">
            {success ? (
              /* Animación de éxito */
              <div className="login-success">
                <div className="login-success-icon">
                  <CheckCircle size={56} />
                </div>
                <h3>Inicio de sesión exitoso</h3>
                <p>Redirigiendo al sistema...</p>
              </div>
            ) : (
              <>
                <h2 className="login-title">Iniciar Sesión</h2>
                <p className="login-subtitle">
                  Ingresa tus credenciales para acceder al sistema
                </p>

                {error && (
                  <Alert variant="danger" className="py-2" style={{ fontSize: '0.85rem' }}>
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Correo electrónico</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Ej. alumno@universidad.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      size="lg"
                    />
                  </Form.Group>

                  {/* Selector de rol */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Tipo de usuario</Form.Label>
                    <div className="role-selector">
                      <button
                        type="button"
                        className={`role-option ${role === 'alumno' ? 'active' : ''}`}
                        onClick={() => setRole('alumno')}
                      >
                        <GraduationCap size={20} />
                        Alumno
                      </button>
                      <button
                        type="button"
                        className={`role-option ${role === 'profesor' ? 'active' : ''}`}
                        onClick={() => setRole('profesor')}
                      >
                        <UserCog size={20} />
                        Profesor
                      </button>
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Contraseña</Form.Label>
                    <div className="password-input-group">
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Ingresa tu contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        size="lg"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </Form.Group>

                  <Button
                    variant="success"
                    type="submit"
                    className="w-100 py-2 fw-semibold login-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      'Ingresando...'
                    ) : (
                      <>
                        <LogIn size={18} className="me-2" />
                        Ingresar
                      </>
                    )}
                  </Button>
                </Form>

                <div className="login-footer">
                  <small className="text-muted">
                    Si olvidaste tu contraseña, contacta al administrador del sistema.
                  </small>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
