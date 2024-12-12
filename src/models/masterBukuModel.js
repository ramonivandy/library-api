const Joi = require("joi");

const masterBukuPost = Joi.object({
  judul_buku: Joi.string().required(),
  pengarang: Joi.string().required(),
  penerbit: Joi.string().required(),
  tahun_terbit: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear())
    .required(),
  harga: Joi.number().positive().required(),
  stok: Joi.number().integer().min(0).required(),
  rak: Joi.string().required(),
});

module.exports = {
  masterBukuPost,
};
