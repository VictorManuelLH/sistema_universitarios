import mongoose from 'mongoose';

const asistenciaSchema = new mongoose.Schema({
  alumno: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  materia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Materia',
    required: true
  },
  fecha: {
    type: Date,
    required: true,
    default: Date.now
  },
  estado: {
    type: String,
    enum: ['presente', 'retardo', 'falta'],
    required: true
  },
  observaciones: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Un alumno solo puede tener un registro de asistencia por materia por dia
asistenciaSchema.index({ alumno: 1, materia: 1, fecha: 1 }, { unique: true });

export default mongoose.model('Asistencia', asistenciaSchema);
