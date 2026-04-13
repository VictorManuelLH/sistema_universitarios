import config from './src/config/env.js';
import connectDB from './src/config/db.js';
import app from './src/app.js';

// Conectar a MongoDB
connectDB();

// Iniciar servidor
app.listen(config.port, () => {
  console.log(`Servidor corriendo en puerto ${config.port}`);
});
