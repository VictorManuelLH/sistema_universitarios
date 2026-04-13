import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import errorHandler from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import materiasRoutes from './routes/materias.routes.js';
import asistenciasRoutes from './routes/asistencias.routes.js';
import reportesRoutes from './routes/reportes.routes.js';
import reportesLecturaRoutes from './routes/reportesLectura.routes.js';
import evaluacionesRoutes from './routes/evaluaciones.routes.js';
import lineamientosRoutes from './routes/lineamientos.routes.js';
import notificacionesRoutes from './routes/notificaciones.routes.js';

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/materias', materiasRoutes);
app.use('/api/asistencias', asistenciasRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/reportes-lectura', reportesLecturaRoutes);
app.use('/api/evaluaciones', evaluacionesRoutes);
app.use('/api/lineamientos', lineamientosRoutes);
app.use('/api/notificaciones', notificacionesRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Manejo de errores
app.use(errorHandler);

export default app;
