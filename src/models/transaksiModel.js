const JoiBase = require("joi");
const JoiDate = require("@joi/date");

const Joi = JoiBase.extend(JoiDate); // extend Joi with Joi Date

// const { id_mahasiswa, books, tanggal_peminjaman, tanggal_kembali } = req.body;
const transaksiPost = Joi.object({
  id_mahasiswa: Joi.number().required(),
  books: Joi.array().min(1).required(),
  tanggal_peminjaman: Joi.date().format(["YYYY-MM-DD"]).required(),
  tanggal_kembali: Joi.date().format(["YYYY-MM-DD"]).required(),
});

module.exports = {
  transaksiPost,
};
