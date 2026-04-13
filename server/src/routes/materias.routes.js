import { Router } from 'express';
import { getMaterias, getMateriaById, getMateriasAlumno, getMateriasProfesor, crearMateria, updateMateria, deleteMateria } from '../controllers/materias.controller.js';
import auth from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';

const router = Router();

// Rutas específicas ANTES de la ruta con :id
router.get('/alumno/mis-materias', auth, getMateriasAlumno);
router.get('/profesor/mis-materias', auth, getMateriasProfesor);
router.get('/', auth, getMaterias);
router.post('/', auth, roleCheck('admin'), crearMateria);
router.get('/:id', auth, getMateriaById);
router.put('/:id', auth, roleCheck('admin'), updateMateria);
router.delete('/:id', auth, roleCheck('admin'), deleteMateria);

export default router;
