// Reel request validation schema
const Joi = require('joi');

const reelSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(''),
  url: Joi.string().uri(),
  tags: Joi.array().items(Joi.string()),
});

module.exports = { reelSchema };
