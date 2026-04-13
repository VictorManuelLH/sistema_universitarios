import { Router } from 'express';
import { getReportes, crearReporte, actualizarEstadoReporte } from '../controllers/reportes.controller.js';
import auth from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';

const router = Router();

router.get('/', auth, getReportes);
router.post('/', auth, roleCheck('alumno'), crearReporte);
router.put('/:id/estado', auth, roleCheck('profesor'), actualizarEstadoReporte);

export default router;
