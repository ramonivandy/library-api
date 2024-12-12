-- DROP SCHEMA public;

CREATE SCHEMA public AUTHORIZATION pg_database_owner;

COMMENT ON SCHEMA public IS 'standard public schema';

-- DROP SEQUENCE history_peminjaman_id_history_seq;

CREATE SEQUENCE history_peminjaman_id_history_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE history_peminjaman_id_history_seq1;

CREATE SEQUENCE history_peminjaman_id_history_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE master_buku_id_buku_seq;

CREATE SEQUENCE master_buku_id_buku_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE master_mahasiswa_id_mahasiswa_seq;

CREATE SEQUENCE master_mahasiswa_id_mahasiswa_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE stok_buku_id_stok_seq;

CREATE SEQUENCE stok_buku_id_stok_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE transaksi_detail_id_transaksi_detail_seq;

CREATE SEQUENCE transaksi_detail_id_transaksi_detail_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE transaksi_id_transaksi_seq;

CREATE SEQUENCE transaksi_id_transaksi_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;-- public.master_buku definition

-- Drop table

-- DROP TABLE master_buku;

CREATE TABLE master_buku (
	id_buku serial4 NOT NULL,
	judul_buku varchar(100) NOT NULL,
	pengarang varchar(50) NOT NULL,
	penerbit varchar(50) NOT NULL,
	tahun_terbit int2 NOT NULL,
	harga numeric(10, 2) NOT NULL,
	stok int4 NOT NULL,
	deleted_at timestamp NULL,
	CONSTRAINT master_buku_pkey PRIMARY KEY (id_buku)
);


-- public.master_mahasiswa definition

-- Drop table

-- DROP TABLE master_mahasiswa;

CREATE TABLE master_mahasiswa (
	id_mahasiswa serial4 NOT NULL,
	nama_mahasiswa varchar(100) NOT NULL,
	nim varchar(20) NOT NULL,
	angkatan int2 NOT NULL,
	status bool DEFAULT true NOT NULL,
	CONSTRAINT master_mahasiswa_pkey PRIMARY KEY (id_mahasiswa)
);


-- public.stok_buku definition

-- Drop table

-- DROP TABLE stok_buku;

CREATE TABLE stok_buku (
	id_stok serial4 NOT NULL,
	id_buku int4 NOT NULL,
	jumlah_stok int4 NOT NULL,
	lokasi varchar(50) NOT NULL,
	CONSTRAINT stok_buku_pkey PRIMARY KEY (id_stok),
	CONSTRAINT stok_buku_id_buku_fkey FOREIGN KEY (id_buku) REFERENCES master_buku(id_buku)
);


-- public.transaksi definition

-- Drop table

-- DROP TABLE transaksi;

CREATE TABLE transaksi (
	id_transaksi serial4 NOT NULL,
	id_mahasiswa int4 NOT NULL,
	tanggal_peminjaman date NOT NULL,
	tanggal_kembali date NULL,
	CONSTRAINT transaksi_pkey PRIMARY KEY (id_transaksi),
	CONSTRAINT transaksi_id_mahasiswa_fkey FOREIGN KEY (id_mahasiswa) REFERENCES master_mahasiswa(id_mahasiswa)
);


-- public.transaksi_detail definition

-- Drop table

-- DROP TABLE transaksi_detail;

CREATE TABLE transaksi_detail (
	id_transaksi_detail serial4 NOT NULL,
	id_transaksi int4 NULL,
	id_buku int4 NULL,
	status_pengembalian bool DEFAULT false NULL,
	CONSTRAINT transaksi_detail_pkey PRIMARY KEY (id_transaksi_detail),
	CONSTRAINT transaksi_detail_id_buku_fkey FOREIGN KEY (id_buku) REFERENCES master_buku(id_buku),
	CONSTRAINT transaksi_detail_id_transaksi_fkey FOREIGN KEY (id_transaksi) REFERENCES transaksi(id_transaksi)
);


-- public.history_peminjaman definition

-- Drop table

-- DROP TABLE history_peminjaman;

CREATE TABLE history_peminjaman (
	id_history serial4 NOT NULL,
	id_transaksi int4 NOT NULL,
	tanggal_peminjaman date NOT NULL,
	tanggal_kembali date NULL,
	status_pengembalian bool NOT NULL,
	CONSTRAINT history_peminjaman_pkey PRIMARY KEY (id_history),
	CONSTRAINT history_peminjaman_id_transaksi_fkey FOREIGN KEY (id_transaksi) REFERENCES transaksi(id_transaksi)
);