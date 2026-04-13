import mongoose from 'mongoose';

const reporteLecturaSchema = new mongoose.Schema({
  alumno: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  titulo: {
    type: String,
    required: [true, 'El titulo del libro es obligatorio'],
    trim: true
  },
  autor: {
    type: String,
    required: [true, 'El autor es obligatorio'],
    trim: true
  },
  contenido: {
    type: String,
    required: [true, 'El contenido del reporte es obligatorio']
  },
  palabras: {
    type: Number,
    default: 0
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aprobado', 'rechazado'],
    default: 'pendiente'
  },
  archivo: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('ReporteLectura', reporteLecturaSchema);
