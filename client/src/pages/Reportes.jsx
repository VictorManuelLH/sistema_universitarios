import { useState, useEffect } from 'react';
import { Button, Alert, Spinner } from 'react-bootstrap';
import { FileText, CheckCircle, Clock, XCircle, Plus, ChevronUp } from 'lucide-react';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const Reportes = () => {
  const { user } = useAuth();
  const [reportes, setReportes] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargarReportes = async () => {
    const snap = await getDocs(
      query(collection(db, 'reportes'), where('alumno', '==', user.uid), orderBy('fechaSolicitud', 'desc'))
    );
    setReportes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { if (user?.uid) cargarReportes(); }, [user?.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !descripcion.trim()) {
      setMensaje({ tipo: 'warning', texto: 'Completa el título y la descripción antes de enviar.' });
      return;
    }
    setEnviando(true);
    setMensaje(null);
    try {
      await addDoc(collection(db, 'reportes'), {
        alumno: user.uid,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        estado: 'pendiente',
        fechaSolicitud: serverTimestamp(),
        createdAt: serverTimestamp()
      });
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
    const d = fecha?.toDate ? fecha.toDate() : new Date(fecha);
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const renderEstadoBadge = (estado) => {
    switch (estado) {
      case 'aprobado': return <span className="badge-estado aprobado"><CheckCircle size={14} />Aprobado</span>;
      case 'pendiente': return <span className="badge-estado pendiente"><Clock size={14} />Pendiente</span>;
      case 'rechazado': return <span className="badge-estado rechazado"><XCircle size={14} />Rechazado</span>;
      default: return null;
    }
  };

  return (
    <div>
      <h2 className="page-title">Mis Reportes</h2>
      <p className="page-subtitle">Consulta el estado de tus reportes y justificantes enviados.</p>

      <Button variant={mostrarForm ? 'outline-secondary' : 'primary'} className="mb-3" onClick={() => setMostrarForm(!mostrarForm)}>
        {mostrarForm ? <><ChevronUp size={16} className="me-2" />Cancelar</> : <><Plus size={16} className="me-2" />Nuevo Reporte</>}
      </Button>

      {mostrarForm && (
        <div className="filtros-card mb-4">
          <h5 className="fw-bold mb-3">Crear Reporte</h5>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Titulo</label>
              <input type="text" className="form-control" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej: Justificante de inasistencia" required />
            </div>
            <div className="mb-3">
              <label className="form-label">Descripcion</label>
              <textarea className="form-control" rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Describe el motivo del reporte o justificante..." required />
            </div>
            <Button type="submit" variant="primary" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar Reporte'}
            </Button>
          </form>
        </div>
      )}

      {mensaje && <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje(null)}>{mensaje.texto}</Alert>}

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : reportes.map((reporte) => (
        <div key={reporte.id} className="reporte-item">
          <div className="reporte-item-header">
            <div className="reporte-item-left">
              <div className="reporte-icon"><FileText size={20} /></div>
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
