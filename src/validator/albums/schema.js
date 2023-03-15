const Joi = require('joi');

const AlbumPayloadSchema = Joi.object({
  name: Joi.string().required(),
  year: Joi.number().integer().min(1970).max(new Date().getFullYear())
    .required(),
});

const ImageHeaderSchema = Joi.object({
  'content-disposition': Joi.string().required(),
  'content-type': Joi.string().valid('image/apng', 'image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/svg+xml', 'image/webp').required(),
});

module.exports = { AlbumPayloadSchema, ImageHeaderSchema };
