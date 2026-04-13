import Notificacion from '../models/Notificacion.js';

export const getMisNotificaciones = async (req, res, next) => {
  try {
    const notificaciones = await Notificacion.find({ usuario: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notificaciones);
  } catch (error) {
    next(error);
  }
};

export const marcarLeida = async (req, res, next) => {
  try {
    const notificacion = await Notificacion.findOneAndUpdate(
      { _id: req.params.id, usuario: req.user._id },
      { leida: true },
      { new: true }
    );
    if (!notificacion) {
      return res.status(404).json({ message: 'Notificación no encontrada.' });
    }
    res.json(notificacion);
  } catch (error) {
    next(error);
  }
};

export const marcarTodasLeidas = async (req, res, next) => {
  try {
    await Notificacion.updateMany({ usuario: req.user._id, leida: false }, { leida: true });
    res.json({ message: 'Todas las notificaciones marcadas como leídas.' });
  } catch (error) {
    next(error);
  }
};
