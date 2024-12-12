const db = require("../helper/database/index");
const masterBukuModel = require("../models/masterBukuModel");
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const getAll = async (req, res) => {
  const { page = 1, limit = 1000 } = req.query;

  // Get total count of active records
  const countSql = `
    SELECT COUNT(*) as total 
    FROM master_buku mb 
    WHERE mb.deleted_at IS NULL
  `;
  const countResult = await db.query(countSql);
  const totalData = parseInt(countResult.rows[0].total);

  // Get paginated data with stok_buku information
  let sql = `
    SELECT 
      mb.*,
      sb.jumlah_stok,
      sb.lokasi as rak
    FROM master_buku mb
    LEFT JOIN stok_buku sb ON mb.id_buku = sb.id_buku
    WHERE mb.deleted_at IS NULL
    ORDER BY mb.id_buku DESC
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

  const sql = `
    SELECT 
      mb.*,
      sb.jumlah_stok,
      sb.lokasi as rak
    FROM master_buku mb
    LEFT JOIN stok_buku sb ON mb.id_buku = sb.id_buku
    WHERE mb.id_buku = $1
  `;
  const data = await db.query(sql, [id]);

  if (data.rows.length === 0) {
    return res.status(404).json({
      status: 1,
      message: "Data tidak ditemukan",
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
  const { judul_buku, pengarang, penerbit, tahun_terbit, harga, stok, rak } =
    req.body;

  // Validate body data
  const { error, value } = masterBukuModel.masterBukuPost.validate(
    req.body,
    { abortEarly: false } // Get all validate error
  );

  if (error) {
    // Collect all error messages
    const errorMessages = error.details.map((err) => err.message);

    return res.status(400).json({
      status: 102,
      message: errorMessages,
    });
  }

  try {
    // Start transaction
    await db.query("BEGIN");

    // Insert into master_buku
    const bukuSql = `
      INSERT INTO master_buku (judul_buku, pengarang, penerbit, tahun_terbit, harga, stok)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const bukuResult = await db.query(bukuSql, [
      judul_buku,
      pengarang,
      penerbit,
      tahun_terbit,
      harga,
      stok,
    ]);

    // Insert into stok_buku
    const stokSql = `
      INSERT INTO stok_buku (id_buku, jumlah_stok, lokasi)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const stokResult = await db.query(stokSql, [
      bukuResult.rows[0].id_buku,
      stok,
      rak,
    ]);

    // Commit transaction
    await db.query("COMMIT");

    // Combine the results
    const result = {
      ...bukuResult.rows[0],
      rak: stokResult.rows[0].lokasi,
      jumlah_stok: stokResult.rows[0].jumlah_stok,
    };

    return res.status(201).json({
      status: 0,
      message: "Data berhasil ditambahkan",
      data: result,
    });
  } catch (error) {
    // Rollback in case of error
    await db.query("ROLLBACK");
    throw error;
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const { judul_buku, pengarang, penerbit, tahun_terbit, harga, stok, rak } =
    req.body;

  // Validate body data
  const { error, value } = masterBukuModel.masterBukuPost.validate(
    req.body,
    { abortEarly: false } // Get all validate error
  );

  if (error) {
    // Collect all error messages
    const errorMessages = error.details.map((err) => err.message);

    return res.status(400).json({
      status: 102,
      message: errorMessages,
    });
  }

  try {
    // Start transaction
    await db.query("BEGIN");

    // Check if book exists
    const checkSql =
      "SELECT * FROM master_buku WHERE id_buku = $1 AND deleted_at IS NULL";
    const checkData = await db.query(checkSql, [id]);

    if (checkData.rows.length === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({
        status: 1,
        message: "Data tidak ditemukan",
        data: null,
      });
    }

    // Update master_buku
    const bukuSql = `
      UPDATE master_buku 
      SET judul_buku = $1, pengarang = $2, penerbit = $3, 
          tahun_terbit = $4, harga = $5, stok = $6
      WHERE id_buku = $7
      RETURNING *
    `;
    const bukuResult = await db.query(bukuSql, [
      judul_buku,
      pengarang,
      penerbit,
      tahun_terbit,
      harga,
      stok,
      id,
    ]);

    // Update stok_buku
    const stokSql = `
      UPDATE stok_buku 
      SET jumlah_stok = $1, lokasi = $2
      WHERE id_buku = $3
      RETURNING *
    `;
    const stokResult = await db.query(stokSql, [stok, rak, id]);

    // Commit transaction
    await db.query("COMMIT");

    // Combine the results
    const result = {
      ...bukuResult.rows[0],
      rak: stokResult.rows[0].lokasi,
      jumlah_stok: stokResult.rows[0].jumlah_stok,
    };

    return res.json({
      status: 0,
      message: "Data berhasil diupdate",
      data: result,
    });
  } catch (error) {
    // Rollback in case of error
    await db.query("ROLLBACK");
    throw error;
  }
};

const del = async (req, res) => {
  const { id } = req.params;

  try {
    // Start transaction
    await db.query("BEGIN");

    // Check if book exists and not already deleted
    const checkSql =
      "SELECT * FROM master_buku WHERE id_buku = $1 AND deleted_at IS NULL";
    const checkData = await db.query(checkSql, [id]);

    if (checkData.rows.length === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({
        status: 1,
        message: "Data tidak ditemukan",
        data: null,
      });
    }

    // Soft delete master_buku
    const bukuSql = `
      UPDATE master_buku 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id_buku = $1 
      RETURNING *
    `;
    const bukuResult = await db.query(bukuSql, [id]);

    // Get stok_buku data before deletion
    const stokData = await db.query(
      "SELECT * FROM stok_buku WHERE id_buku = $1",
      [id]
    );

    // Delete from stok_buku
    await db.query("DELETE FROM stok_buku WHERE id_buku = $1", [id]);

    // Commit transaction
    await db.query("COMMIT");

    // Combine the results
    const result = {
      ...bukuResult.rows[0],
      rak: stokData.rows[0].lokasi,
      jumlah_stok: stokData.rows[0].jumlah_stok,
    };

    return res.json({
      status: 0,
      message: "Data berhasil dihapus",
      data: result,
    });
  } catch (error) {
    // Rollback in case of error
    await db.query("ROLLBACK");
    throw error;
  }
};

module.exports = {
  getAll,
  getSingle,
  post,
  update,
  del,
};
