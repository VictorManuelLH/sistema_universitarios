import { Router } from 'express';
import { getUsers, getUserById, updateUser, deleteUser, changePassword } from '../controllers/users.controller.js';
import auth from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';

const router = Router();

router.get('/', auth, roleCheck('admin'), getUsers);
router.get('/:id', auth, getUserById);
router.put('/change-password/:id', auth, changePassword);
router.put('/:id', auth, roleCheck('admin'), updateUser);
router.delete('/:id', auth, roleCheck('admin'), deleteUser);

export default router;
