import mongoose from 'mongoose';

const reporteSchema = new mongoose.Schema({
  alumno: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  titulo: {
    type: String,
    required: [true, 'El titulo es obligatorio'],
    trim: true
  },
  descripcion: {
    type: String,
    required: [true, 'La descripcion es obligatoria']
  },
  fechaSolicitud: {
    type: Date,
    default: Date.now
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aprobado', 'rechazado'],
    default: 'pendiente'
  }
}, {
  timestamps: true
});

export default mongoose.model('Reporte', reporteSchema);
