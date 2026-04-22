import { useState } from 'react';
import { Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { KeyRound, Eye, EyeOff, AlertTriangle, Check } from 'lucide-react';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';

const PasswordField = ({ label, value, onChange, show, onToggle }) => (
  <Form.Group className="mb-4">
    <Form.Label className="fw-semibold">{label}</Form.Label>
    <div className="password-input-group">
      <Form.Control type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} />
      <button type="button" className="password-toggle" onClick={onToggle}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </Form.Group>
);

const CambiarPassword = () => {
  const { user } = useAuth();
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const requisitos = [
    { label: 'Mínimo 8 caracteres', valid: passwordNueva.length >= 8 },
    { label: 'Al menos una mayúscula', valid: /[A-Z]/.test(passwordNueva) },
    { label: 'Al menos una minúscula', valid: /[a-z]/.test(passwordNueva) },
    { label: 'Al menos un número', valid: /[0-9]/.test(passwordNueva) },
    { label: 'Al menos un carácter especial', valid: /[!@#$%^&*(),.?":{}|<>]/.test(passwordNueva) }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);
    if (!passwordActual.trim()) return setMensaje({ tipo: 'danger', texto: 'Ingresa tu contraseña actual.' });
    if (!passwordNueva) return setMensaje({ tipo: 'danger', texto: 'Ingresa la nueva contraseña.' });
    if (!requisitos.every(r => r.valid)) return setMensaje({ tipo: 'danger', texto: 'La nueva contraseña no cumple todos los requisitos de seguridad.' });
    if (passwordNueva === passwordActual) return setMensaje({ tipo: 'danger', texto: 'La nueva contraseña no puede ser igual a la actual.' });
    if (passwordNueva !== passwordConfirmar) return setMensaje({ tipo: 'danger', texto: 'Las contraseñas no coinciden.' });

    setGuardando(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, passwordActual);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, passwordNueva);
      setMensaje({ tipo: 'success', texto: 'Contraseña cambiada correctamente.' });
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordConfirmar('');
    } catch (err) {
      const msg = err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'La contraseña actual es incorrecta.'
        : err.message || 'Error al cambiar la contraseña.';
      setMensaje({ tipo: 'danger', texto: msg });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <h2 className="page-title">Cambiar Contraseña</h2>
      <p className="page-subtitle">Actualiza tu contraseña para mantener tu cuenta segura.</p>

      <Row>
        <Col lg={7} className="mb-4">
          <div className="password-form-card">
            <div className="password-form-title">
              <KeyRound size={22} className="text-success" />Nueva Contraseña
            </div>
            {mensaje && <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje(null)}>{mensaje.texto}</Alert>}
            <Form onSubmit={handleSubmit}>
              <PasswordField label="Contraseña actual" value={passwordActual} onChange={setPasswordActual} show={showActual} onToggle={() => setShowActual(v => !v)} />
              <PasswordField label="Nueva contraseña" value={passwordNueva} onChange={setPasswordNueva} show={showNueva} onToggle={() => setShowNueva(v => !v)} />
              <PasswordField label="Confirmar nueva contraseña" value={passwordConfirmar} onChange={setPasswordConfirmar} show={showConfirmar} onToggle={() => setShowConfirmar(v => !v)} />
              <Button variant="success" type="submit" className="w-100 py-2 fw-semibold" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Cambiar Contraseña'}
              </Button>
            </Form>
          </div>
        </Col>

        <Col lg={5}>
          <div className="requisitos-card">
            <h6>Requisitos de Seguridad</h6>
            {requisitos.map((req, i) => (
              <div key={i} className={`requisito-item ${req.valid ? 'valid' : ''}`}>
                <div className="check-circle">{req.valid && <Check size={12} />}</div>
                <span>{req.label}</span>
              </div>
            ))}
          </div>
          <div className="recomendaciones-card">
            <h6><AlertTriangle size={18} className="text-warning" />Recomendaciones</h6>
            <ul>
              <li><strong>No compartas tu contraseña</strong></li>
              <li><strong>Cambia tu contraseña periódicamente</strong></li>
              <li><strong>No uses información personal</strong></li>
            </ul>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default CambiarPassword;
