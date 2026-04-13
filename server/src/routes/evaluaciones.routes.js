import { Router } from 'express';
import { getEvaluaciones, crearEvaluacion, getProfesoresParaEvaluar } from '../controllers/evaluaciones.controller.js';
import auth from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';

const router = Router();

router.get('/profesores', auth, roleCheck('alumno'), getProfesoresParaEvaluar);
router.get('/', auth, getEvaluaciones);
router.post('/', auth, roleCheck('alumno'), crearEvaluacion);

export default router;
