const { errorResponse } = require('../utils/apiResponse');

const validate = (schema, property = 'body') => (req, res, next) => {
  const { error } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
  if (!error) return next();

  const errors = error.details.map(d => ({ field: d.path.join('.'), message: d.message.replace(/"/g, '') }));
  return errorResponse(res, 422, 'Validation failed', errors);
};

module.exports = validate;
