--
-- PostgreSQL database dump
--

\restrict 0ijZLrygky9X2od0a9Aa9RkRUNWnlnVA9dqm8Sc24TnAlJaEdovh99tuUlrahqC

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: feeder_referensi; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA feeder_referensi;


ALTER SCHEMA feeder_referensi OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agama; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.agama (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_agama integer DEFAULT 0,
    nama_agama character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.agama OWNER TO bendo01;

--
-- Name: alat_transportasi; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.alat_transportasi (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_alat_transportasi character varying(255),
    nama_alat_transportasi character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.alat_transportasi OWNER TO bendo01;

--
-- Name: bentuk_pendidikan; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.bentuk_pendidikan (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_bentuk_pendidikan character varying(255),
    nama_bentuk_pendidikan character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.bentuk_pendidikan OWNER TO bendo01;

--
-- Name: ikatan_kerja_sumber_daya_manusia; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.ikatan_kerja_sumber_daya_manusia (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_ikatan_kerja character varying(255),
    nama_ikatan_kerja character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.ikatan_kerja_sumber_daya_manusia OWNER TO bendo01;

--
-- Name: jabatan_fungsional; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.jabatan_fungsional (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_jabatan_fungsional character varying(255),
    nama_jabatan_fungsional character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.jabatan_fungsional OWNER TO bendo01;

--
-- Name: jalur_masuk; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.jalur_masuk (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_jalur_masuk character varying(255),
    nama_jalur_masuk character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.jalur_masuk OWNER TO bendo01;

--
-- Name: jenis_aktifitas_mahasiswa; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.jenis_aktifitas_mahasiswa (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_jenis_aktivitas_mahasiswa character varying(255),
    nama_jenis_aktivitas_mahasiswa character varying(255),
    untuk_kampus_merdeka character varying(255),
    jenis_aktivitas_mahasiswa character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.jenis_aktifitas_mahasiswa OWNER TO bendo01;

--
-- Name: jenis_evaluasi; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.jenis_evaluasi (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_jenis_evaluasi integer,
    nama_jenis_evaluasi character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.jenis_evaluasi OWNER TO bendo01;

--
-- Name: jenis_keluar; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.jenis_keluar (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_jenis_keluar character varying(255),
    jenis_keluar character varying(255),
    apa_mahasiswa character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.jenis_keluar OWNER TO bendo01;

--
-- Name: jenis_pendaftaran; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.jenis_pendaftaran (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_jenis_daftar character varying(255),
    nama_jenis_daftar character varying(255),
    untuk_daftar_sekolah character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.jenis_pendaftaran OWNER TO bendo01;

--
-- Name: jenis_prestasi; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.jenis_prestasi (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_jenis_prestasi integer,
    nama_jenis_prestasi character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.jenis_prestasi OWNER TO bendo01;

--
-- Name: jenis_satuan_manajemen_sumberdaya; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.jenis_satuan_manajemen_sumberdaya (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_jenis_sms character varying(255),
    nama_jenis_sms character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.jenis_satuan_manajemen_sumberdaya OWNER TO bendo01;

--
-- Name: jenis_sertifikasi; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.jenis_sertifikasi (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_jenis_sertifikasi character varying(255),
    nama_jenis_sertifikasi character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.jenis_sertifikasi OWNER TO bendo01;

--
-- Name: jenis_substansi; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.jenis_substansi (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_jenis_substansi character varying(255),
    nama_jenis_substansi character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.jenis_substansi OWNER TO bendo01;

--
-- Name: jenis_tinggal; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.jenis_tinggal (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_jenis_tinggal character varying(255),
    nama_jenis_tinggal character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.jenis_tinggal OWNER TO bendo01;

--
-- Name: jenjang_pendidikan; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.jenjang_pendidikan (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_jenjang_didik character varying(255),
    nama_jenjang_didik character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.jenjang_pendidikan OWNER TO bendo01;

--
-- Name: kategori_kegiatan; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.kategori_kegiatan (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_kategori_kegiatan integer,
    nama_kategori_kegiatan text,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.kategori_kegiatan OWNER TO bendo01;

--
-- Name: kebutuhan_khusus; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.kebutuhan_khusus (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_kebutuhan_khusus character varying(255),
    nama_kebutuhan_khusus character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.kebutuhan_khusus OWNER TO bendo01;

--
-- Name: lembaga_pengangkat; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.lembaga_pengangkat (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_lembaga_angkat character varying(255),
    nama_lembaga_angkat character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.lembaga_pengangkat OWNER TO bendo01;

--
-- Name: level_wilayah; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.level_wilayah (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_level_wilayah character varying(255),
    nama_level_wilayah character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.level_wilayah OWNER TO bendo01;

--
-- Name: negara; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.negara (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_negara character varying(255),
    nama_negara character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.negara OWNER TO bendo01;

--
-- Name: pangkat_golongan; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.pangkat_golongan (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_pangkat_golongan character varying(255),
    kode_golongan character varying(255),
    nama_pangkat character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.pangkat_golongan OWNER TO bendo01;

--
-- Name: pekerjaan; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.pekerjaan (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_pekerjaan integer,
    nama_pekerjaan character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.pekerjaan OWNER TO bendo01;

--
-- Name: pembiayaan; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.pembiayaan (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_pembiayaan character varying(255),
    nama_pembiayaan character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.pembiayaan OWNER TO bendo01;

--
-- Name: penghasilan; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.penghasilan (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_penghasilan integer,
    nama_penghasilan character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.penghasilan OWNER TO bendo01;

--
-- Name: periode_lampau; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.periode_lampau (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_program_studi character varying(255),
    program_studi character varying(255),
    id_semester character varying(255),
    semester character varying(255),
    tanggal_mulai_perkuliahan date,
    tanggal_selesai_perkuliahan date,
    tipe_periode character varying(255),
    sync_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) with time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.periode_lampau OWNER TO bendo01;

--
-- Name: semester; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.semester (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_semester character varying(255),
    id_tahun_ajaran character varying(255),
    nama_semester character varying(255),
    semester character varying(255),
    a_periode_aktif character varying(255),
    tanggal_mulai date,
    tanggal_selesai date,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.semester OWNER TO bendo01;

--
-- Name: status_keaktifan_pegawai; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.status_keaktifan_pegawai (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_status_aktif character varying(255),
    nama_status_aktif character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.status_keaktifan_pegawai OWNER TO bendo01;

--
-- Name: status_kepegawaian; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.status_kepegawaian (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    nama_status_pegawai character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    id_status_pegawai integer
);


ALTER TABLE feeder_referensi.status_kepegawaian OWNER TO bendo01;

--
-- Name: status_mahasiswa; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.status_mahasiswa (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_status_mahasiswa character varying(255),
    nama_status_mahasiswa character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.status_mahasiswa OWNER TO bendo01;

--
-- Name: tahun_ajaran; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.tahun_ajaran (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_tahun_ajaran character varying(255),
    nama_tahun_ajaran character varying(255),
    a_periode_aktif character varying(255),
    tanggal_mulai date,
    tanggal_selesai date,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.tahun_ajaran OWNER TO bendo01;

--
-- Name: tingkat_prestasi; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.tingkat_prestasi (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_tingkat_prestasi integer,
    nama_tingkat_prestasi character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.tingkat_prestasi OWNER TO bendo01;

--
-- Name: wilayah; Type: TABLE; Schema: feeder_referensi; Owner: bendo01
--

CREATE TABLE feeder_referensi.wilayah (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_level_wilayah integer,
    id_wilayah character varying(255),
    id_negara character varying(255),
    nama_wilayah character varying(255),
    id_induk_wilayah character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_referensi.wilayah OWNER TO bendo01;

--
-- Name: agama feeder_referensi_agama_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.agama
    ADD CONSTRAINT feeder_referensi_agama_pkey PRIMARY KEY (id);


--
-- Name: alat_transportasi feeder_referensi_alat_transportasi_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.alat_transportasi
    ADD CONSTRAINT feeder_referensi_alat_transportasi_pkey PRIMARY KEY (id);


--
-- Name: bentuk_pendidikan feeder_referensi_bentuk_pendidikan_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.bentuk_pendidikan
    ADD CONSTRAINT feeder_referensi_bentuk_pendidikan_pkey PRIMARY KEY (id);


--
-- Name: ikatan_kerja_sumber_daya_manusia feeder_referensi_ikatan_kerja_sumber_daya_manusia_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.ikatan_kerja_sumber_daya_manusia
    ADD CONSTRAINT feeder_referensi_ikatan_kerja_sumber_daya_manusia_pkey PRIMARY KEY (id);


--
-- Name: jabatan_fungsional feeder_referensi_jabatan_fungsional_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.jabatan_fungsional
    ADD CONSTRAINT feeder_referensi_jabatan_fungsional_pkey PRIMARY KEY (id);


--
-- Name: jalur_masuk feeder_referensi_jalur_masuk_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.jalur_masuk
    ADD CONSTRAINT feeder_referensi_jalur_masuk_pkey PRIMARY KEY (id);


--
-- Name: jenis_aktifitas_mahasiswa feeder_referensi_jenis_aktifitas_mahasiswa_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.jenis_aktifitas_mahasiswa
    ADD CONSTRAINT feeder_referensi_jenis_aktifitas_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: jenis_evaluasi feeder_referensi_jenis_evaluasi_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.jenis_evaluasi
    ADD CONSTRAINT feeder_referensi_jenis_evaluasi_pkey PRIMARY KEY (id);


--
-- Name: jenis_keluar feeder_referensi_jenis_keluar_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.jenis_keluar
    ADD CONSTRAINT feeder_referensi_jenis_keluar_pkey PRIMARY KEY (id);


--
-- Name: jenis_pendaftaran feeder_referensi_jenis_pendaftaran_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.jenis_pendaftaran
    ADD CONSTRAINT feeder_referensi_jenis_pendaftaran_pkey PRIMARY KEY (id);


--
-- Name: jenis_prestasi feeder_referensi_jenis_prestasi_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.jenis_prestasi
    ADD CONSTRAINT feeder_referensi_jenis_prestasi_pkey PRIMARY KEY (id);


--
-- Name: jenis_satuan_manajemen_sumberdaya feeder_referensi_jenis_satuan_manajemen_sumberdaya_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.jenis_satuan_manajemen_sumberdaya
    ADD CONSTRAINT feeder_referensi_jenis_satuan_manajemen_sumberdaya_pkey PRIMARY KEY (id);


--
-- Name: jenis_sertifikasi feeder_referensi_jenis_sertifikasi_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.jenis_sertifikasi
    ADD CONSTRAINT feeder_referensi_jenis_sertifikasi_pkey PRIMARY KEY (id);


--
-- Name: jenis_substansi feeder_referensi_jenis_substansi_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.jenis_substansi
    ADD CONSTRAINT feeder_referensi_jenis_substansi_pkey PRIMARY KEY (id);


--
-- Name: jenis_tinggal feeder_referensi_jenis_tinggal_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.jenis_tinggal
    ADD CONSTRAINT feeder_referensi_jenis_tinggal_pkey PRIMARY KEY (id);


--
-- Name: jenjang_pendidikan feeder_referensi_jenjang_pendidikan_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.jenjang_pendidikan
    ADD CONSTRAINT feeder_referensi_jenjang_pendidikan_pkey PRIMARY KEY (id);


--
-- Name: kategori_kegiatan feeder_referensi_kategori_kegiatan_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.kategori_kegiatan
    ADD CONSTRAINT feeder_referensi_kategori_kegiatan_pkey PRIMARY KEY (id);


--
-- Name: kebutuhan_khusus feeder_referensi_kebutuhan_khusus_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.kebutuhan_khusus
    ADD CONSTRAINT feeder_referensi_kebutuhan_khusus_pkey PRIMARY KEY (id);


--
-- Name: lembaga_pengangkat feeder_referensi_lembaga_pengangkat_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.lembaga_pengangkat
    ADD CONSTRAINT feeder_referensi_lembaga_pengangkat_pkey PRIMARY KEY (id);


--
-- Name: level_wilayah feeder_referensi_level_wilayah_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.level_wilayah
    ADD CONSTRAINT feeder_referensi_level_wilayah_pkey PRIMARY KEY (id);


--
-- Name: negara feeder_referensi_negara_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.negara
    ADD CONSTRAINT feeder_referensi_negara_pkey PRIMARY KEY (id);


--
-- Name: pangkat_golongan feeder_referensi_pangkat_golongan_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.pangkat_golongan
    ADD CONSTRAINT feeder_referensi_pangkat_golongan_pkey PRIMARY KEY (id);


--
-- Name: pekerjaan feeder_referensi_pekerjaan_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.pekerjaan
    ADD CONSTRAINT feeder_referensi_pekerjaan_pkey PRIMARY KEY (id);


--
-- Name: pembiayaan feeder_referensi_pembiayaan_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.pembiayaan
    ADD CONSTRAINT feeder_referensi_pembiayaan_pkey PRIMARY KEY (id);


--
-- Name: penghasilan feeder_referensi_penghasilan_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.penghasilan
    ADD CONSTRAINT feeder_referensi_penghasilan_pkey PRIMARY KEY (id);


--
-- Name: periode_lampau feeder_referensi_periode_lampau_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.periode_lampau
    ADD CONSTRAINT feeder_referensi_periode_lampau_pkey PRIMARY KEY (id);


--
-- Name: semester feeder_referensi_semester_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.semester
    ADD CONSTRAINT feeder_referensi_semester_pkey PRIMARY KEY (id);


--
-- Name: status_keaktifan_pegawai feeder_referensi_status_keaktifan_pegawai_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.status_keaktifan_pegawai
    ADD CONSTRAINT feeder_referensi_status_keaktifan_pegawai_pkey PRIMARY KEY (id);


--
-- Name: status_kepegawaian feeder_referensi_status_kepegawaian_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.status_kepegawaian
    ADD CONSTRAINT feeder_referensi_status_kepegawaian_pkey PRIMARY KEY (id);


--
-- Name: status_mahasiswa feeder_referensi_status_mahasiswa_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.status_mahasiswa
    ADD CONSTRAINT feeder_referensi_status_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: tahun_ajaran feeder_referensi_tahun_ajaran_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.tahun_ajaran
    ADD CONSTRAINT feeder_referensi_tahun_ajaran_pkey PRIMARY KEY (id);


--
-- Name: tingkat_prestasi feeder_referensi_tingkat_prestasi_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.tingkat_prestasi
    ADD CONSTRAINT feeder_referensi_tingkat_prestasi_pkey PRIMARY KEY (id);


--
-- Name: wilayah feeder_referensi_wilayah_pkey; Type: CONSTRAINT; Schema: feeder_referensi; Owner: bendo01
--

ALTER TABLE ONLY feeder_referensi.wilayah
    ADD CONSTRAINT feeder_referensi_wilayah_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict 0ijZLrygky9X2od0a9Aa9RkRUNWnlnVA9dqm8Sc24TnAlJaEdovh99tuUlrahqC

