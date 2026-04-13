import ReporteLectura from '../models/ReporteLectura.js';
import Notificacion from '../models/Notificacion.js';

export const getReportesLectura = async (req, res, next) => {
  try {
    const filter = req.user.role === 'alumno' ? { alumno: req.user._id } : {};
    const reportes = await ReporteLectura.find(filter)
      .populate('alumno', 'name matricula')
      .sort({ fecha: -1 });
    res.json(reportes);
  } catch (error) {
    next(error);
  }
};

export const crearReporteLectura = async (req, res, next) => {
  try {
    const reporte = await ReporteLectura.create({
      alumno: req.user._id,
      titulo: req.body.titulo,
      autor: req.body.autor,
      contenido: req.body.contenido,
      palabras: req.body.palabras,
      fecha: new Date(),
      archivo: req.file ? req.file.filename : null
    });
    res.status(201).json(reporte);
  } catch (error) {
    next(error);
  }
};

export const actualizarEstadoReporteLectura = async (req, res, next) => {
  try {
    const reporte = await ReporteLectura.findByIdAndUpdate(
      req.params.id,
      { estado: req.body.estado },
      { new: true }
    );
    if (!reporte) {
      return res.status(404).json({ message: 'Reporte de lectura no encontrado.' });
    }

    const estadoLabel = req.body.estado === 'aprobado' ? 'aprobado' : 'rechazado';
    const tipo = req.body.estado === 'aprobado' ? 'success' : 'danger';
    await Notificacion.create({
      usuario: reporte.alumno,
      mensaje: `Tu reporte de lectura "${reporte.titulo}" fue ${estadoLabel}.`,
      tipo,
      link: '/reporte-lectura'
    });

    res.json(reporte);
  } catch (error) {
    next(error);
  }
};
