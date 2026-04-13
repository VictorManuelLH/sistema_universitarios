import { Router } from 'express';
import { getReportesLectura, crearReporteLectura, actualizarEstadoReporteLectura } from '../controllers/reportesLectura.controller.js';
import auth from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';
import upload from '../middleware/upload.js';

const router = Router();

router.get('/', auth, getReportesLectura);
router.post('/', auth, roleCheck('alumno'), upload.single('archivo'), crearReporteLectura);
router.put('/:id/estado', auth, roleCheck('profesor'), actualizarEstadoReporteLectura);

export default router;
