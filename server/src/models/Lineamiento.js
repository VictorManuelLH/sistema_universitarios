import mongoose from 'mongoose';

const lineamientoSchema = new mongoose.Schema({
  categoria: {
    type: String,
    enum: ['asistencias', 'calificaciones'],
    required: true
  },
  tipo: {
    type: String,
    enum: ['success', 'warning', 'danger'],
    default: 'success'
  },
  titulo: {
    type: String,
    required: true
  },
  descripcion: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Lineamiento', lineamientoSchema);
