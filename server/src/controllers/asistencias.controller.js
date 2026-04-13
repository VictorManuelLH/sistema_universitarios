import Asistencia from '../models/Asistencia.js';
import Materia from '../models/Materia.js';

// Parsear horario tipo "Lun-Mie 8:00-10:00" o "Vie 14:00-18:00"
const parseHorario = (horario) => {
  const diasMap = { 'Lun': 1, 'Mar': 2, 'Mie': 3, 'Jue': 4, 'Vie': 5, 'Sab': 6, 'Dom': 0 };
  const parts = horario.split(' ');
  const daysPart = parts[0];
  const timePart = parts[1];

  let dias = [];
  if (daysPart.includes('-')) {
    const [d1, d2] = daysPart.split('-');
    const start = diasMap[d1];
    const end = diasMap[d2];
    // Si la diferencia es 2, son dias alternos (Lun-Mie=1,3 o Mar-Jue=2,4)
    if (end - start === 2) {
      dias = [start, end];
    } else {
      // Rango completo (Lun-Vie = 1,2,3,4,5)
      for (let i = start; i <= end; i++) dias.push(i);
    }
  } else {
    dias = [diasMap[daysPart]];
  }

  const [horaInicio, horaFin] = timePart.split('-');
  const [hi, mi] = horaInicio.split(':').map(Number);
  const [hf, mf] = horaFin.split(':').map(Number);

  return { dias, inicioMin: hi * 60 + (mi || 0), finMin: hf * 60 + (mf || 0) };
};

const estaEnHorario = (horario) => {
  const { dias, inicioMin, finMin } = parseHorario(horario);
  const now = new Date();
  const diaActual = now.getDay();
  const minActual = now.getHours() * 60 + now.getMinutes();
  return dias.includes(diaActual) && minActual >= inicioMin && minActual <= finMin;
};

export const getAsistenciasAlumno = async (req, res, next) => {
  try {
    const { materiaId } = req.query;
    const filter = { alumno: req.user._id };
    if (materiaId) filter.materia = materiaId;

    const asistencias = await Asistencia.find(filter)
      .populate('materia', 'nombre grupo')
      .sort({ fecha: -1 });
    res.json(asistencias);
  } catch (error) {
    next(error);
  }
};

export const registrarAsistencia = async (req, res, next) => {
  try {
    const materia = await Materia.findById(req.body.materiaId);
    if (!materia) {
      return res.status(404).json({ message: 'Materia no encontrada.' });
    }

    if (!estaEnHorario(materia.horario)) {
      return res.status(400).json({ message: 'Fuera del horario de clase. Solo puedes registrar asistencia durante el horario de la materia.' });
    }

    const asistencia = await Asistencia.create({
      alumno: req.user._id,
      materia: req.body.materiaId,
      fecha: new Date(),
      estado: 'presente'
    });
    res.status(201).json(asistencia);
  } catch (error) {
    next(error);
  }
};

export const getAsistenciasPorMateria = async (req, res, next) => {
  try {
    const { fecha } = req.query;
    const filter = { materia: req.params.materiaId };
    if (fecha) {
      const start = new Date(fecha);
      const end = new Date(fecha);
      end.setDate(end.getDate() + 1);
      filter.fecha = { $gte: start, $lt: end };
    }

    const asistencias = await Asistencia.find(filter)
      .populate('alumno', 'name matricula')
      .sort({ fecha: -1 });
    res.json(asistencias);
  } catch (error) {
    next(error);
  }
};

export const registrarGrupo = async (req, res, next) => {
  try {
    const { registros } = req.body; // [{ alumno, materia, estado }]
    if (!registros || !Array.isArray(registros) || registros.length === 0) {
      return res.status(400).json({ message: 'Se requiere un array de registros.' });
    }

    // Normalizar fecha a inicio del dia
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const resultados = [];
    for (const reg of registros) {
      if (reg.estado === 'sin_registro') continue;

      const existente = await Asistencia.findOne({
        alumno: reg.alumno,
        materia: reg.materia,
        fecha: hoy
      });

      if (existente) {
        existente.estado = reg.estado;
        await existente.save();
        resultados.push(existente);
      } else {
        const nueva = await Asistencia.create({
          alumno: reg.alumno,
          materia: reg.materia,
          fecha: hoy,
          estado: reg.estado
        });
        resultados.push(nueva);
      }
    }

    res.status(201).json({ message: `${resultados.length} registros guardados.`, registros: resultados });
  } catch (error) {
    next(error);
  }
};

export const actualizarEstadoAlumno = async (req, res, next) => {
  try {
    const { estado, observaciones } = req.body;
    const asistencia = await Asistencia.findByIdAndUpdate(
      req.params.id,
      { estado, observaciones },
      { new: true }
    );
    if (!asistencia) {
      return res.status(404).json({ message: 'Registro no encontrado.' });
    }
    res.json(asistencia);
  } catch (error) {
    next(error);
  }
};
