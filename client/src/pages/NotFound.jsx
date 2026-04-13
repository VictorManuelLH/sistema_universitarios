import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { Home, AlertCircle } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ minHeight: '60vh' }}>
      <AlertCircle size={56} className="text-muted mb-3" />
      <h1 className="fw-bold" style={{ fontSize: '5rem', lineHeight: 1, color: '#dee2e6' }}>404</h1>
      <h4 className="fw-bold mb-2">Página no encontrada</h4>
      <p className="text-muted mb-4">La ruta que buscas no existe o no tienes permiso para acceder.</p>
      <Button variant="primary" onClick={() => navigate('/')}>
        <Home size={18} className="me-2" />
        Volver al inicio
      </Button>
    </div>
  );
};

export default NotFound;
