import mongoose from 'mongoose';

const materiaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la materia es obligatorio'],
    trim: true
  },
  grupo: {
    type: String,
    required: [true, 'El grupo es obligatorio']
  },
  profesor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  alumnos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  horario: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Materia', materiaSchema);
