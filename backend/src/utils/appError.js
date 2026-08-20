class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const throwError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

module.exports = {
  throwError , AppError
};
