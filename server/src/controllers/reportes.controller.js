import Reporte from '../models/Reporte.js';
import Notificacion from '../models/Notificacion.js';

export const getReportes = async (req, res, next) => {
  try {
    const filter = req.user.role === 'alumno' ? { alumno: req.user._id } : {};
    const reportes = await Reporte.find(filter)
      .populate('alumno', 'name matricula')
      .sort({ fechaSolicitud: -1 });
    res.json(reportes);
  } catch (error) {
    next(error);
  }
};

export const crearReporte = async (req, res, next) => {
  try {
    const reporte = await Reporte.create({
      alumno: req.user._id,
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      fechaSolicitud: new Date()
    });
    res.status(201).json(reporte);
  } catch (error) {
    next(error);
  }
};

export const actualizarEstadoReporte = async (req, res, next) => {
  try {
    const reporte = await Reporte.findByIdAndUpdate(
      req.params.id,
      { estado: req.body.estado },
      { new: true }
    );
    if (!reporte) {
      return res.status(404).json({ message: 'Reporte no encontrado.' });
    }

    const estadoLabel = req.body.estado === 'aprobado' ? 'aprobado' : 'rechazado';
    const tipo = req.body.estado === 'aprobado' ? 'success' : 'danger';
    await Notificacion.create({
      usuario: reporte.alumno,
      mensaje: `Tu reporte "${reporte.titulo}" fue ${estadoLabel}.`,
      tipo,
      link: '/reportes'
    });

    res.json(reporte);
  } catch (error) {
    next(error);
  }
};
