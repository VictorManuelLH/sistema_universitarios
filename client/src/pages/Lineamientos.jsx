import { useState, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import { CheckCircle, AlertTriangle, ClipboardCheck, BookOpen } from 'lucide-react';
import api from '../utils/api';

const Lineamientos = () => {
  const [lineamientos, setLineamientos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/lineamientos')
      .then(setLineamientos)
      .finally(() => setLoading(false));
  }, []);

  const lineamientosAsistencias = lineamientos.filter(l => l.categoria === 'asistencias');
  const lineamientosCalificaciones = lineamientos.filter(l => l.categoria === 'calificaciones');

  // Renderizar ícono según tipo de lineamiento
  const renderIcon = (tipo) => {
    if (tipo === 'warning') {
      return <AlertTriangle size={20} className="warning" />;
    }
    return <CheckCircle size={20} className="success" />;
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  return (
    <div>
      <h2 className="page-title">Lineamientos Académicos</h2>
      <p className="page-subtitle">
        Consulta las normas y lineamientos del sistema académico universitario.
      </p>

      {/* Sección: Lineamientos de Asistencias */}
      <div className="lineamiento-section">
        <div className="lineamiento-section-title">
          <ClipboardCheck size={24} className="text-success" />
          Lineamientos de Asistencias
        </div>
        {lineamientosAsistencias.map((item) => (
          <div key={item._id} className="lineamiento-item">
            {renderIcon(item.tipo)}
            <div>
              <strong>{item.titulo}</strong> {item.descripcion}
            </div>
          </div>
        ))}
      </div>

      {/* Sección: Lineamientos de Calificaciones */}
      <div className="lineamiento-section">
        <div className="lineamiento-section-title">
          <BookOpen size={24} className="text-success" />
          Lineamientos de Calificaciones
        </div>
        {lineamientosCalificaciones.map((item) => (
          <div key={item._id} className="lineamiento-item">
            {renderIcon(item.tipo)}
            <div>
              <strong>{item.titulo}</strong> {item.descripcion}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Lineamientos;
