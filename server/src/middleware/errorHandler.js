const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: 'Error de validacion', errors: messages });
  }

  if (err.code === 11000) {
    return res.status(400).json({ message: 'Ya existe un registro con esos datos.' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'ID invalido.' });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || 'Error interno del servidor.'
  });
};

export default errorHandler;
