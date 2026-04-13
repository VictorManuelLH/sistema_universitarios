import Lineamiento from '../models/Lineamiento.js';

export const getLineamientos = async (req, res, next) => {
  try {
    const { categoria } = req.query;
    const filter = categoria ? { categoria } : {};
    const lineamientos = await Lineamiento.find(filter).sort({ categoria: 1 });
    res.json(lineamientos);
  } catch (error) {
    next(error);
  }
};
