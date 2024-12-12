const db = require("../helper/database/index");
const masterMahasiswaModel = require("../models/masterMahasiswaModel");

const getAll = async (req, res) => {
  const { page, limit } = req.query;

  // Get total count of active students
  const countSql = `SELECT COUNT(*) as total FROM master_mahasiswa WHERE status = TRUE`;
  const countResult = await db.query(countSql);
  const totalData = parseInt(countResult.rows[0].total);

  // Get paginated data of active students
  let sql = `
    SELECT * from master_mahasiswa 
    WHERE status = TRUE 
    LIMIT ${limit} OFFSET ${(page - 1) * limit}
  `;
  const data = await db.query(sql);

  return res.json({
    status: 0,
    message: "Sukses",
    data: data.rows,
    metadata: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalData: totalData,
      totalPage: Math.ceil(totalData / limit),
    },
  });
};

const getSingle = async (req, res) => {
  const { id } = req.params;

  const sql = "SELECT * FROM master_mahasiswa WHERE id_mahasiswa = $1";
  const data = await db.query(sql, [id]);

  if (data.rows.length === 0) {
    return res.status(404).json({
      status: 1,
      message: "Data mahasiswa tidak ditemukan",
      data: null,
    });
  }

  return res.json({
    status: 0,
    message: "Sukses",
    data: data.rows[0],
  });
};

const post = async (req, res) => {
  const { nama_mahasiswa, nim, angkatan } = req.body;

  const { error, value } = masterMahasiswaModel.masterMahasiswaPost.validate(
    req.body,
    { abortEarly: false }
  );

  if (error) {
    const errorMessages = error.details.map((err) => err.message);
    return res.status(400).json({
      status: 102,
      message: errorMessages,
    });
  }

  // Check if NIM already exists
  const checkNimSql = "SELECT * FROM master_mahasiswa WHERE nim = $1";
  const nimCheck = await db.query(checkNimSql, [nim]);

  if (nimCheck.rows.length > 0) {
    return res.status(400).json({
      status: 1,
      message: "NIM sudah terdaftar",
      data: null,
    });
  }

  const sql = `
    INSERT INTO master_mahasiswa (nama_mahasiswa, nim, angkatan, status)
    VALUES ($1, $2, $3, TRUE)
    RETURNING *
  `;

  const data = await db.query(sql, [nama_mahasiswa, nim, angkatan]);

  return res.status(201).json({
    status: 0,
    message: "Data mahasiswa berhasil ditambahkan",
    data: data.rows[0],
  });
};

const update = async (req, res) => {
  const { id } = req.params;
  const { nama_mahasiswa, nim, angkatan } = req.body;

  // Check if student exists
  const checkSql = "SELECT * FROM master_mahasiswa WHERE id_mahasiswa = $1";
  const checkData = await db.query(checkSql, [id]);

  if (checkData.rows.length === 0) {
    return res.status(404).json({
      status: 1,
      message: "Data mahasiswa tidak ditemukan",
      data: null,
    });
  }

  // Check if new NIM already exists (excluding current student)
  const checkNimSql =
    "SELECT * FROM master_mahasiswa WHERE nim = $1 AND id_mahasiswa != $2";
  const nimCheck = await db.query(checkNimSql, [nim, id]);

  if (nimCheck.rows.length > 0) {
    return res.status(400).json({
      status: 1,
      message: "NIM sudah terdaftar",
      data: null,
    });
  }

  const sql = `
    UPDATE master_mahasiswa 
    SET nama_mahasiswa = $1, nim = $2, angkatan = $3
    WHERE id_mahasiswa = $4
    RETURNING *
  `;

  const data = await db.query(sql, [nama_mahasiswa, nim, angkatan, id]);

  return res.json({
    status: 0,
    message: "Data mahasiswa berhasil diupdate",
    data: data.rows[0],
  });
};

const del = async (req, res) => {
  const { id } = req.params;

  // Check if student exists and is active
  const checkSql =
    "SELECT * FROM master_mahasiswa WHERE id_mahasiswa = $1 AND status = TRUE";
  const checkData = await db.query(checkSql, [id]);

  if (checkData.rows.length === 0) {
    return res.status(404).json({
      status: 1,
      message: "Data mahasiswa tidak ditemukan",
      data: null,
    });
  }

  // Soft delete by setting status to false
  const sql = `
    UPDATE master_mahasiswa 
    SET status = FALSE 
    WHERE id_mahasiswa = $1 
    RETURNING *
  `;
  const data = await db.query(sql, [id]);

  return res.json({
    status: 0,
    message: "Data mahasiswa berhasil dihapus",
    data: data.rows[0],
  });
};

module.exports = {
  getAll,
  getSingle,
  post,
  update,
  del,
};
