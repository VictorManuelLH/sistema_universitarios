import { Router } from 'express';
import {
  getAsistenciasAlumno,
  registrarAsistencia,
  getAsistenciasPorMateria,
  actualizarEstadoAlumno,
  registrarGrupo
} from '../controllers/asistencias.controller.js';
import auth from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';

const router = Router();

// Alumno
router.get('/mis-asistencias', auth, roleCheck('alumno'), getAsistenciasAlumno);
router.post('/registrar', auth, roleCheck('alumno'), registrarAsistencia);

// Profesor
router.get('/materia/:materiaId', auth, roleCheck('profesor'), getAsistenciasPorMateria);
router.put('/estado/:id', auth, roleCheck('profesor'), actualizarEstadoAlumno);
router.post('/registrar-grupo', auth, roleCheck('profesor'), registrarGrupo);

export default router;
