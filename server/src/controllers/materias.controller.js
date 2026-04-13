import Materia from '../models/Materia.js';

export const crearMateria = async (req, res, next) => {
  try {
    if (Array.isArray(req.body)) {
      const materias = await Materia.insertMany(req.body);
      return res.status(201).json(materias);
    }
    const { nombre, grupo, profesor, alumnos, horario } = req.body;
    const materia = await Materia.create({ nombre, grupo, profesor, alumnos: alumnos || [], horario });
    res.status(201).json(materia);
  } catch (error) {
    next(error);
  }
};

export const getMaterias = async (req, res, next) => {
  try {
    const materias = await Materia.find().populate('profesor', 'name').populate('alumnos', 'name matricula');
    res.json(materias);
  } catch (error) {
    next(error);
  }
};

export const getMateriaById = async (req, res, next) => {
  try {
    const materia = await Materia.findById(req.params.id).populate('profesor', 'name').populate('alumnos', 'name matricula');
    if (!materia) {
      return res.status(404).json({ message: 'Materia no encontrada.' });
    }
    res.json(materia);
  } catch (error) {
    next(error);
  }
};

export const getMateriasAlumno = async (req, res, next) => {
  try {
    const materias = await Materia.find({ alumnos: req.user._id }).populate('profesor', 'name');
    res.json(materias);
  } catch (error) {
    next(error);
  }
};

export const getMateriasProfesor = async (req, res, next) => {
  try {
    const materias = await Materia.find({ profesor: req.user._id }).populate('alumnos', 'name matricula');
    res.json(materias);
  } catch (error) {
    next(error);
  }
};

export const updateMateria = async (req, res, next) => {
  try {
    const { nombre, grupo, profesor, alumnos, horario } = req.body;
    const materia = await Materia.findByIdAndUpdate(
      req.params.id,
      { nombre, grupo, profesor, alumnos, horario },
      { new: true, runValidators: true }
    ).populate('profesor', 'name').populate('alumnos', 'name matricula');
    if (!materia) {
      return res.status(404).json({ message: 'Materia no encontrada.' });
    }
    res.json(materia);
  } catch (error) {
    next(error);
  }
};

export const deleteMateria = async (req, res, next) => {
  try {
    const materia = await Materia.findByIdAndDelete(req.params.id);
    if (!materia) {
      return res.status(404).json({ message: 'Materia no encontrada.' });
    }
    res.json({ message: 'Materia eliminada correctamente.' });
  } catch (error) {
    next(error);
  }
};
