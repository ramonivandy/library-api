const Joi = require("joi");

const masterMahasiswaPost = Joi.object({
  nama_mahasiswa: Joi.string().required(),
  nim: Joi.string().required(),
  angkatan: Joi.number().required(),
  status: Joi.boolean().valid(true, false).default(true),
});

module.exports = {
  masterMahasiswaPost,
};
