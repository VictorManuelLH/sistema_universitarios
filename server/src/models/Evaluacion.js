import mongoose from 'mongoose';

const evaluacionSchema = new mongoose.Schema({
  alumno: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  profesor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  materia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Materia',
    required: true
  },
  respuestas: {
    type: Map,
    of: Number
  },
  comentarios: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Un alumno solo puede evaluar a un profesor una vez por materia
evaluacionSchema.index({ alumno: 1, profesor: 1, materia: 1 }, { unique: true });

export default mongoose.model('Evaluacion', evaluacionSchema);
