import Evaluacion from '../models/Evaluacion.js';
import Materia from '../models/Materia.js';

export const getProfesoresParaEvaluar = async (req, res, next) => {
  try {
    const materias = await Materia.find({ alumnos: req.user._id }).populate('profesor', 'name');
    const evaluacionesHechas = await Evaluacion.find({ alumno: req.user._id }).select('profesor materia');

    const profesores = materias.map(m => ({
      _id: m.profesor._id,
      nombre: m.profesor.name,
      materia: m.nombre,
      materiaId: m._id,
      evaluado: evaluacionesHechas.some(
        e => e.profesor.toString() === m.profesor._id.toString() && e.materia.toString() === m._id.toString()
      )
    }));

    res.json(profesores);
  } catch (error) {
    next(error);
  }
};

export const getEvaluaciones = async (req, res, next) => {
  try {
    const evaluaciones = await Evaluacion.find()
      .populate('alumno', 'name')
      .populate('profesor', 'name')
      .populate('materia', 'nombre');
    res.json(evaluaciones);
  } catch (error) {
    next(error);
  }
};

export const crearEvaluacion = async (req, res, next) => {
  try {
    const { profesorId, materiaId, respuestas, comentarios } = req.body;

    const existente = await Evaluacion.findOne({
      alumno: req.user._id,
      profesor: profesorId,
      materia: materiaId
    });
    if (existente) {
      return res.status(400).json({ message: 'Ya evaluaste a este profesor en esta materia.' });
    }

    const evaluacion = await Evaluacion.create({
      alumno: req.user._id,
      profesor: profesorId,
      materia: materiaId,
      respuestas,
      comentarios
    });
    res.status(201).json(evaluacion);
  } catch (error) {
    next(error);
  }
};
