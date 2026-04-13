import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El correo es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'La contrasena es obligatoria'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['alumno', 'profesor', 'admin'],
    required: true
  },
  // Campos de alumno
  matricula: {
    type: String,
    sparse: true,
    unique: true
  },
  carrera: String,
  semestre: String,
  // Campos de profesor
  numEmpleado: {
    type: String,
    sparse: true,
    unique: true
  },
  departamento: String
}, {
  timestamps: true
});

// Hash de password antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export default mongoose.model('User', userSchema);
