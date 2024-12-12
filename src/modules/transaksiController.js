const db = require("../helper/database/index");
const { addDays, differenceInDays, parse, format } = require("date-fns"); // Make sure to install date-fns

const getAll = async (req, res) => {
  const { page, limit } = req.query;

  // Get total count
  const countSql = `SELECT COUNT(DISTINCT t.id_transaksi) as total FROM transaksi t`;
  const countResult = await db.query(countSql);
  const totalData = parseInt(countResult.rows[0].total);

  // Get paginated data with related information
  const sql = `
    SELECT 
      t.id_transaksi,
      t.tanggal_peminjaman,
      t.tanggal_kembali,
      m.nama_mahasiswa,
      m.nim,
      json_agg(json_build_object(
        'id_buku', b.id_buku,
        'judul_buku', b.judul_buku,
        'pengarang', b.pengarang,
        'status_pengembalian', td.status_pengembalian
      )) as books
    FROM transaksi t
    JOIN master_mahasiswa m ON t.id_mahasiswa = m.id_mahasiswa
    JOIN transaksi_detail td ON t.id_transaksi = td.id_transaksi
    JOIN master_buku b ON td.id_buku = b.id_buku
    GROUP BY t.id_transaksi, m.nama_mahasiswa, m.nim
    ORDER BY t.tanggal_peminjaman DESC
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
      t.id_transaksi,
      t.tanggal_peminjaman,
      t.tanggal_kembali,
      m.nama_mahasiswa,
      m.nim,
      json_agg(json_build_object(
        'id_buku', b.id_buku,
        'judul_buku', b.judul_buku,
        'pengarang', b.pengarang,
        'status_pengembalian', td.status_pengembalian
      )) as books
    FROM transaksi t
    JOIN master_mahasiswa m ON t.id_mahasiswa = m.id_mahasiswa
    JOIN transaksi_detail td ON t.id_transaksi = td.id_transaksi
    JOIN master_buku b ON td.id_buku = b.id_buku
    WHERE t.id_transaksi = $1
    GROUP BY t.id_transaksi, m.nama_mahasiswa, m.nim
  `;

  const data = await db.query(sql, [id]);

  if (data.rows.length === 0) {
    return res.status(404).json({
      status: 1,
      message: "Transaksi tidak ditemukan",
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
  const { id_mahasiswa, books, tanggal_peminjaman, tanggal_kembali } = req.body;

  try {
    // Parse dates from DD-MM-YYYY format
    const parsedTanggalPeminjaman = parse(
      tanggal_peminjaman,
      "dd-MM-yyyy",
      new Date()
    );
    const parsedTanggalKembali = parse(
      tanggal_kembali,
      "dd-MM-yyyy",
      new Date()
    );

    // Validate date difference
    const daysDifference = differenceInDays(
      parsedTanggalKembali,
      parsedTanggalPeminjaman
    );

    if (daysDifference > 14) {
      return res.status(400).json({
        status: 1,
        message: "Maksimal peminjaman adalah 14 hari",
      });
    }

    if (daysDifference < 0) {
      return res.status(400).json({
        status: 1,
        message: "Tanggal kembali tidak boleh kurang dari tanggal peminjaman",
      });
    }

    // Start transaction
    await db.query("BEGIN");

    // Check if mahasiswa is active
    const mahasiswaCheck = await db.query(
      "SELECT * FROM master_mahasiswa WHERE id_mahasiswa = $1 AND status = true",
      [id_mahasiswa]
    );

    if (mahasiswaCheck.rows.length === 0) {
      await db.query("ROLLBACK");
      return res.status(400).json({
        status: 1,
        message: "Mahasiswa tidak aktif atau tidak ditemukan",
      });
    }

    // Check if all books are available
    for (const id_buku of books) {
      const bookCheck = await db.query(
        "SELECT * FROM master_buku WHERE id_buku = $1 AND deleted_at IS NULL",
        [id_buku]
      );

      if (bookCheck.rows.length === 0) {
        await db.query("ROLLBACK");
        return res.status(400).json({
          status: 1,
          message: `Buku dengan ID ${id_buku} tidak tersedia`,
        });
      }

      // Check book stock
      const stockCheck = await db.query(
        "SELECT jumlah_stok FROM stok_buku WHERE id_buku = $1",
        [id_buku]
      );

      if (!stockCheck.rows.length || stockCheck.rows[0].jumlah_stok <= 0) {
        await db.query("ROLLBACK");
        return res.status(400).json({
          status: 1,
          message: `Stok buku dengan ID ${id_buku} habis`,
        });
      }
    }

    // Create main transaction first
    const transactionSql = `
      INSERT INTO transaksi 
      (id_mahasiswa, tanggal_peminjaman, tanggal_kembali)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const mainTransaction = await db.query(transactionSql, [
      id_mahasiswa,
      format(parsedTanggalPeminjaman, "yyyy-MM-dd"),
      format(parsedTanggalKembali, "yyyy-MM-dd"),
    ]);

    const id_transaksi = mainTransaction.rows[0].id_transaksi;

    // Now create transaction details and update stocks
    const bookDetails = [];
    for (const id_buku of books) {
      // Insert transaction detail
      const detailSql = `
        INSERT INTO transaksi_detail 
        (id_transaksi, id_buku, status_pengembalian)
        VALUES ($1, $2, false)
        RETURNING *
      `;

      const detail = await db.query(detailSql, [id_transaksi, id_buku]);
      bookDetails.push(detail.rows[0]);

      // Update book stock
      await db.query(
        "UPDATE stok_buku SET jumlah_stok = jumlah_stok - 1 WHERE id_buku = $1",
        [id_buku]
      );
    }

    // Commit transaction
    await db.query("COMMIT");

    // Get complete transaction data
    const result = {
      ...mainTransaction.rows[0],
      books: bookDetails,
    };

    return res.status(201).json({
      status: 0,
      message: "Transaksi berhasil dibuat",
      data: result,
    });
  } catch (error) {
    await db.query("ROLLBACK");
    if (error instanceof Error && error.message.includes("Invalid")) {
      return res.status(400).json({
        status: 1,
        message: "Format tanggal tidak valid. Gunakan format DD-MM-YYYY",
      });
    }
    throw error;
  }
};

const returnBooks = async (req, res) => {
  const { id_transaksi } = req.params;
  const { book_ids } = req.body;

  try {
    await db.query("BEGIN");

    // Check if transaction exists
    const transactionCheck = await db.query(
      "SELECT * FROM transaksi WHERE id_transaksi = $1",
      [id_transaksi]
    );

    if (transactionCheck.rows.length === 0) {
      await db.query("ROLLBACK");
      return res.status(400).json({
        status: 1,
        message: "Transaksi tidak ditemukan",
      });
    }

    // Update transaction details status
    for (const id_buku of book_ids) {
      // Check if book is part of this transaction and not already returned
      const detailCheck = await db.query(
        `SELECT * FROM transaksi_detail 
         WHERE id_transaksi = $1 AND id_buku = $2 AND status_pengembalian = false`,
        [id_transaksi, id_buku]
      );

      if (detailCheck.rows.length === 0) {
        await db.query("ROLLBACK");
        return res.status(400).json({
          status: 1,
          message: `Buku dengan ID ${id_buku} tidak ditemukan dalam transaksi ini atau sudah dikembalikan`,
        });
      }

      // Update transaction detail status
      await db.query(
        `UPDATE transaksi_detail 
         SET status_pengembalian = true
         WHERE id_transaksi = $1 AND id_buku = $2`,
        [id_transaksi, id_buku]
      );

      // Update book stock
      await db.query(
        "UPDATE stok_buku SET jumlah_stok = jumlah_stok + 1 WHERE id_buku = $1",
        [id_buku]
      );
    }

    // Check if all books in this transaction are returned
    const remainingBooks = await db.query(
      `SELECT COUNT(*) as count 
       FROM transaksi_detail 
       WHERE id_transaksi = $1 AND status_pengembalian = false`,
      [id_transaksi]
    );

    // If all books are returned, update the transaction's return date
    if (remainingBooks.rows[0].count === 0) {
      const currentDate = format(new Date(), "yyyy-MM-dd");
      await db.query(
        `UPDATE transaksi 
         SET tanggal_kembali = $1 
         WHERE id_transaksi = $2`,
        [currentDate, id_transaksi]
      );
    }

    // Create history record
    const transaction = transactionCheck.rows[0];
    await db.query(
      `INSERT INTO history_peminjaman 
       (id_transaksi, tanggal_peminjaman, tanggal_kembali, status_pengembalian)
       VALUES ($1, $2, $3, true)`,
      [
        id_transaksi,
        transaction.tanggal_peminjaman,
        format(new Date(), "yyyy-MM-dd"),
      ]
    );

    await db.query("COMMIT");

    // Get updated transaction data
    const sql = `
      SELECT 
        t.id_transaksi,
        t.tanggal_peminjaman,
        t.tanggal_kembali,
        m.nama_mahasiswa,
        m.nim,
        json_agg(json_build_object(
          'id_buku', b.id_buku,
          'judul_buku', b.judul_buku,
          'pengarang', b.pengarang,
          'status_pengembalian', td.status_pengembalian
        )) as books
      FROM transaksi t
      JOIN master_mahasiswa m ON t.id_mahasiswa = m.id_mahasiswa
      JOIN transaksi_detail td ON t.id_transaksi = td.id_transaksi
      JOIN master_buku b ON td.id_buku = b.id_buku
      WHERE t.id_transaksi = $1
      GROUP BY t.id_transaksi, m.nama_mahasiswa, m.nim
    `;

    const updatedData = await db.query(sql, [id_transaksi]);

    return res.json({
      status: 0,
      message: "Buku berhasil dikembalikan",
      data: updatedData.rows[0],
    });
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
};

module.exports = {
  getAll,
  getSingle,
  post,
  returnBooks,
};
