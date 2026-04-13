import { Router } from 'express';
import { getMisNotificaciones, marcarLeida, marcarTodasLeidas } from '../controllers/notificaciones.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

router.get('/', auth, getMisNotificaciones);
router.put('/leer-todas', auth, marcarTodasLeidas);
router.put('/:id/leer', auth, marcarLeida);

export default router;
