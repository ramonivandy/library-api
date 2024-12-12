const db = require("../helper/database/index");
const { differenceInDays, parse } = require("date-fns");

const getAll = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    nim,
    nama_mahasiswa,
    id_buku,
    judul_buku,
    tanggal_peminjaman,
    tanggal_kembali,
  } = req.query;

  try {
    // Build WHERE clause dynamically
    let whereConditions = [];
    let params = [];
    let paramCount = 1;

    if (nim) {
      whereConditions.push(`m.nim ILIKE $${paramCount}`);
      params.push(`%${nim}%`);
      paramCount++;
    }

    if (nama_mahasiswa) {
      whereConditions.push(`m.nama_mahasiswa ILIKE $${paramCount}`);
      params.push(`%${nama_mahasiswa}%`);
      paramCount++;
    }

    if (id_buku) {
      whereConditions.push(`b.id_buku = $${paramCount}`);
      params.push(id_buku);
      paramCount++;
    }

    if (judul_buku) {
      whereConditions.push(`b.judul_buku ILIKE $${paramCount}`);
      params.push(`%${judul_buku}%`);
      paramCount++;
    }

    if (tanggal_peminjaman) {
      whereConditions.push(`DATE(t.tanggal_peminjaman) = $${paramCount}`);
      params.push(tanggal_peminjaman);
      paramCount++;
    }

    if (tanggal_kembali) {
      whereConditions.push(`DATE(t.tanggal_kembali) = $${paramCount}`);
      params.push(tanggal_kembali);
      paramCount++;
    }

    const whereClause =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";

    // Get total count
    const countSql = `
      SELECT COUNT(DISTINCT h.id_history) as total 
      FROM history_peminjaman h
      JOIN transaksi t ON h.id_transaksi = t.id_transaksi
      JOIN master_mahasiswa m ON t.id_mahasiswa = m.id_mahasiswa
      JOIN transaksi_detail td ON t.id_transaksi = td.id_transaksi
      JOIN master_buku b ON td.id_buku = b.id_buku
      ${whereClause}
    `;

    const countResult = await db.query(countSql, params);
    const totalData = parseInt(countResult.rows[0].total);

    // Get paginated data with all required information
    const sql = `
      SELECT 
        h.id_history,
        m.nim,
        m.nama_mahasiswa,
        t.tanggal_peminjaman,
        t.tanggal_kembali,
        json_agg(
          json_build_object(
            'id_buku', b.id_buku,
            'judul_buku', b.judul_buku,
            'status_pengembalian', td.status_pengembalian,
            'lama_pinjam', 
              CASE 
                WHEN t.tanggal_kembali IS NOT NULL 
                THEN DATE_PART('day', t.tanggal_kembali::timestamp - t.tanggal_peminjaman::timestamp)
                ELSE DATE_PART('day', CURRENT_DATE::timestamp - t.tanggal_peminjaman::timestamp)
              END
          )
        ) as books
      FROM history_peminjaman h
      JOIN transaksi t ON h.id_transaksi = t.id_transaksi
      JOIN master_mahasiswa m ON t.id_mahasiswa = m.id_mahasiswa
      JOIN transaksi_detail td ON t.id_transaksi = td.id_transaksi
      JOIN master_buku b ON td.id_buku = b.id_buku
      ${whereClause}
      GROUP BY h.id_history, m.nim, m.nama_mahasiswa, t.tanggal_peminjaman, t.tanggal_kembali
      ORDER BY h.id_history DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    // Add pagination parameters
    params.push(limit, (page - 1) * limit);

    const data = await db.query(sql, params);

    // Format the data
    const formattedData = data.rows.map((row) => ({
      ...row,
      books: row.books.map((book) => ({
        ...book,
        lama_pinjam: `${Math.floor(book.lama_pinjam)} hari`,
      })),
    }));

    return res.json({
      status: 0,
      message: "Sukses",
      data: formattedData,
      metadata: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalData: totalData,
        totalPage: Math.ceil(totalData / limit),
      },
    });
  } catch (error) {
    console.error("Error in history getAll:", error);
    return res.status(500).json({
      status: 1,
      message: "Terjadi kesalahan dalam mengambil data history",
      error: error.message,
    });
  }
};

const getSingle = async (req, res) => {
  const { id } = req.params;

  try {
    const sql = `
      SELECT 
        h.id_history,
        m.nim,
        m.nama_mahasiswa,
        t.tanggal_peminjaman,
        t.tanggal_kembali,
        json_agg(
          json_build_object(
            'id_buku', b.id_buku,
            'judul_buku', b.judul_buku,
            'status_pengembalian', td.status_pengembalian,
            'lama_pinjam', 
              CASE 
                WHEN t.tanggal_kembali IS NOT NULL 
                THEN DATE_PART('day', t.tanggal_kembali::timestamp - t.tanggal_peminjaman::timestamp)
                ELSE DATE_PART('day', CURRENT_DATE::timestamp - t.tanggal_peminjaman::timestamp)
              END
          )
        ) as books
      FROM history_peminjaman h
      JOIN transaksi t ON h.id_transaksi = t.id_transaksi
      JOIN master_mahasiswa m ON t.id_mahasiswa = m.id_mahasiswa
      JOIN transaksi_detail td ON t.id_transaksi = td.id_transaksi
      JOIN master_buku b ON td.id_buku = b.id_buku
      WHERE h.id_history = $1
      GROUP BY h.id_history, m.nim, m.nama_mahasiswa, t.tanggal_peminjaman, t.tanggal_kembali
    `;

    const data = await db.query(sql, [id]);

    if (data.rows.length === 0) {
      return res.status(404).json({
        status: 1,
        message: "Data history tidak ditemukan",
        data: null,
      });
    }

    // Format the data
    const formattedData = {
      ...data.rows[0],
      books: data.rows[0].books.map((book) => ({
        ...book,
        lama_pinjam: `${Math.floor(book.lama_pinjam)} hari`,
      })),
    };

    return res.json({
      status: 0,
      message: "Sukses",
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in history getSingle:", error);
    return res.status(500).json({
      status: 1,
      message: "Terjadi kesalahan dalam mengambil detail history",
      error: error.message,
    });
  }
};

module.exports = {
  getAll,
  getSingle,
};
