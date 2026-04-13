import { Router } from 'express';
import { login, register, getProfile, updateProfile } from '../controllers/auth.controller.js';
import auth from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';

const router = Router();

router.post('/login', login);
router.post('/register', auth, roleCheck('admin'), register);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

export default router;
