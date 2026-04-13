import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from '../config/env.js';

const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
};

export const register = async (req, res, next) => {
  try {
    // Si es un array, registrar varios usuarios
    if (Array.isArray(req.body)) {
      const resultados = [];
      for (const userData of req.body) {
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          resultados.push({ email: userData.email, error: 'El correo ya esta registrado.' });
          continue;
        }
        const user = await User.create(userData);
        resultados.push({ _id: user._id, name: user.name, email: user.email, role: user.role });
      }
      return res.status(201).json(resultados);
    }

    // Usuario individual
    const { name, email, password, role, matricula, carrera, semestre, numEmpleado, departamento } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El correo ya esta registrado.' });
    }

    const user = await User.create({
      name, email, password, role,
      matricula, carrera, semestre,
      numEmpleado, departamento
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales invalidas.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales invalidas.' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res) => {
  res.json(req.user);
};

export const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'carrera', 'semestre', 'departamento'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    next(error);
  }
};
