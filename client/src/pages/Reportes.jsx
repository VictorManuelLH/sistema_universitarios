import { useState, useEffect } from 'react';
import { Button, Alert, Spinner } from 'react-bootstrap';
import { FileText, CheckCircle, Clock, XCircle, Plus, ChevronUp } from 'lucide-react';
import api from '../utils/api';

const Reportes = () => {
  const [reportes, setReportes] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargarReportes = () => {
    api.get('/reportes')
      .then(setReportes)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !descripcion.trim()) {
      setMensaje({ tipo: 'warning', texto: 'Completa el título y la descripción antes de enviar.' });
      return;
    }
    setEnviando(true);
    setMensaje(null);
    try {
      await api.post('/reportes', { titulo: titulo.trim(), descripcion: descripcion.trim() });
      setTitulo('');
      setDescripcion('');
      setMostrarForm(false);
      setMensaje({ tipo: 'success', texto: 'Reporte enviado correctamente.' });
      cargarReportes();
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message || 'Error al enviar el reporte.' });
    } finally {
      setEnviando(false);
    }
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  // Renderizar badge de estado del reporte
  const renderEstadoBadge = (estado) => {
    switch (estado) {
      case 'aprobado':
        return (
          <span className="badge-estado aprobado">
            <CheckCircle size={14} />
            Aprobado
          </span>
        );
      case 'pendiente':
        return (
          <span className="badge-estado pendiente">
            <Clock size={14} />
            Pendiente
          </span>
        );
      case 'rechazado':
        return (
          <span className="badge-estado rechazado">
            <XCircle size={14} />
            Rechazado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <h2 className="page-title">Mis Reportes</h2>
      <p className="page-subtitle">
        Consulta el estado de tus reportes y justificantes enviados.
      </p>

      {/* Boton nuevo reporte */}
      <Button
        variant={mostrarForm ? 'outline-secondary' : 'primary'}
        className="mb-3"
        onClick={() => setMostrarForm(!mostrarForm)}
      >
        {mostrarForm ? (
          <><ChevronUp size={16} className="me-2" />Cancelar</>
        ) : (
          <><Plus size={16} className="me-2" />Nuevo Reporte</>
        )}
      </Button>

      {/* Formulario colapsable */}
      {mostrarForm && (
        <div className="filtros-card mb-4">
          <h5 className="fw-bold mb-3">Crear Reporte</h5>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Titulo</label>
              <input
                type="text"
                className="form-control"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Justificante de inasistencia"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Descripcion</label>
              <textarea
                className="form-control"
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe el motivo del reporte o justificante..."
                required
              />
            </div>
            <Button type="submit" variant="primary" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar Reporte'}
            </Button>
          </form>
        </div>
      )}

      {mensaje && (
        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje(null)}>
          {mensaje.texto}
        </Alert>
      )}

      {/* Lista de reportes */}
      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : reportes.map((reporte) => (
        <div key={reporte._id} className="reporte-item">
          <div className="reporte-item-header">
            <div className="reporte-item-left">
              <div className="reporte-icon">
                <FileText size={20} />
              </div>
              <div>
                <div className="reporte-titulo">{reporte.titulo}</div>
                <div className="reporte-desc">{reporte.descripcion}</div>
              </div>
            </div>
            {renderEstadoBadge(reporte.estado)}
          </div>
          <div className="reporte-footer">
            <span>Fecha de solicitud: {formatFecha(reporte.fechaSolicitud)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Reportes;
