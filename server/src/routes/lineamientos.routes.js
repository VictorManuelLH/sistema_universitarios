import { Router } from 'express';
import { getLineamientos } from '../controllers/lineamientos.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

router.get('/', auth, getLineamientos);

export default router;
