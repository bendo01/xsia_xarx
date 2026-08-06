--
-- PostgreSQL database dump
--

\restrict RCMfiBiCYFWonqMKhYzMHb9L5zPopFErVUQwF7rvPFIhtd9OqZfb5lhQKhCwfaW

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
-- Name: feeder_master; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA feeder_master;


ALTER SCHEMA feeder_master OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: aktifitas_kuliah_mahasiswa; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.aktifitas_kuliah_mahasiswa (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_registrasi_mahasiswa uuid,
    id_mahasiswa uuid,
    id_semester character varying(255),
    nama_semester character varying(255),
    nim character varying(255),
    nama_mahasiswa character varying(255),
    angkatan character varying(255),
    id_prodi uuid,
    nama_program_studi character varying(255),
    id_status_mahasiswa character varying(255),
    nama_status_mahasiswa character varying(255),
    ips real,
    ipk real,
    sks_semester real,
    sks_total real,
    biaya_kuliah_smt real,
    status_sync character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.aktifitas_kuliah_mahasiswa OWNER TO bendo01;

--
-- Name: aktifitas_mahasiswa; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.aktifitas_mahasiswa (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    asal_data character varying(255),
    nm_asaldata character varying(255),
    id_aktivitas uuid,
    jenis_anggota character varying(255),
    nama_jenis_anggota character varying(255),
    id_jenis_aktivitas uuid,
    nama_jenis_aktivitas character varying(255),
    id_prodi uuid,
    nama_prodi character varying(255),
    id_semester uuid,
    nama_semester character varying(255),
    judul character varying(255),
    keterangan character varying(255),
    lokasi character varying(255),
    sk_tugas character varying(255),
    tanggal_sk_tugas date,
    untuk_kampus_merdeka integer DEFAULT 0,
    tanggal_mulai date,
    tanggal_selesai date,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.aktifitas_mahasiswa OWNER TO bendo01;

--
-- Name: aktifitas_mengajar_dosen; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.aktifitas_mengajar_dosen (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_registrasi_dosen uuid,
    id_dosen uuid,
    nama_dosen character varying(255),
    id_periode character varying(255),
    nama_periode character varying(255),
    id_prodi uuid,
    nama_program_studi character varying(255),
    id_matkul uuid,
    nama_mata_kuliah character varying(255),
    id_kelas uuid,
    nama_kelas_kuliah character varying(255),
    rencana_minggu_pertemuan integer,
    realisasi_minggu_pertemuan integer,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.aktifitas_mengajar_dosen OWNER TO bendo01;

--
-- Name: anggota_aktifitas_mahasiswa; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.anggota_aktifitas_mahasiswa (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_aktivitas uuid,
    judul character varying(255),
    id_anggota uuid,
    id_registrasi_mahasiswa uuid,
    nim character varying(255),
    nama_mahasiswa character varying(255),
    jenis_peran character varying(255),
    nama_jenis_peran character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.anggota_aktifitas_mahasiswa OWNER TO bendo01;

--
-- Name: bidang_minat_perguruan_tinggi; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.bidang_minat_perguruan_tinggi (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_bidang_minat uuid,
    nm_bidang_minat character varying(255),
    id_prodi uuid,
    nama_program_studi character varying(255),
    smt_dimulai integer,
    sk_bidang_minat integer,
    tamat_sk_bidang_minat integer,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.bidang_minat_perguruan_tinggi OWNER TO bendo01;

--
-- Name: bimbing_mahasiswa; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.bimbing_mahasiswa (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_aktivitas uuid,
    judul character varying(255),
    id_bimbing_mahasiswa uuid,
    id_kategori_kegiatan uuid,
    nama_kategori_kegiatan character varying(255),
    id_dosen uuid,
    nidn character varying(255),
    nama_dosen character varying(255),
    pembimbing_ke integer,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.bimbing_mahasiswa OWNER TO bendo01;

--
-- Name: biodata_dosen; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.biodata_dosen (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_dosen character varying(255),
    nama_dosen character varying(255),
    tempat_lahir character varying(255),
    tanggal_lahir date,
    jenis_kelamin character varying(255),
    id_agama character varying(255),
    nama_agama character varying(255),
    id_status_aktif character varying(255),
    nama_status_aktif character varying(255),
    nidn character varying(255),
    nama_ibu_kandung character varying(255),
    nik character varying(255),
    nip character varying(255),
    npwp character varying(255),
    id_jenis_sdm character varying(255),
    nama_jenis_sdm character varying(255),
    no_sk_cpns character varying(255),
    tanggal_sk_cpns date,
    no_sk_pengangkatan character varying(255),
    mulai_sk_pengangkatan character varying(255),
    id_lembaga_pengangkatan character varying(255),
    nama_lembaga_pengangkatan character varying(255),
    id_pangkat_golongan character varying(255),
    nama_pangkat_golongan character varying(255),
    id_sumber_gaji character varying(255),
    nama_sumber_gaji character varying(255),
    jalan character varying(255),
    dusun character varying(255),
    rt character varying(255),
    rw character varying(255),
    ds_kel character varying(255),
    kode_pos character varying(255),
    id_wilayah character varying(255),
    nama_wilayah character varying(255),
    telepon character varying(255),
    handphone character varying(255),
    email character varying(255),
    status_pernikahan character varying(255),
    nama_suami_istri character varying(255),
    nip_suami_istri character varying(255),
    tanggal_mulai_pns date,
    nama_pekerjaan_suami_istri character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    id_pekerjaan_suami_istri integer DEFAULT 0
);


ALTER TABLE feeder_master.biodata_dosen OWNER TO bendo01;

--
-- Name: biodata_mahasiswa; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.biodata_mahasiswa (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    nama_mahasiswa character varying(255),
    jenis_kelamin character varying(255),
    tempat_lahir character varying(255),
    tanggal_lahir date,
    id_mahasiswa uuid,
    id_agama integer,
    nama_agama character varying(255),
    nik character varying(255),
    nisn character varying(255),
    npwp character varying(255),
    id_negara character varying(255),
    kewarganegaraan character varying(255),
    jalan character varying(255),
    dusun character varying(255),
    rt integer,
    rw integer,
    kelurahan character varying(255),
    kode_pos character varying(255),
    id_wilayah character varying(255),
    nama_wilayah character varying(255),
    id_jenis_tinggal character varying(255),
    nama_jenis_tinggal character varying(255),
    id_alat_transportasi character varying(255),
    nama_alat_transportasi character varying(255),
    telepon character varying(255),
    handphone character varying(255),
    email character varying(255),
    penerima_kps boolean,
    nomor_kps character varying(255),
    nik_ayah character varying(255),
    nama_ayah character varying(255),
    tanggal_lahir_ayah date,
    id_pendidikan_ayah integer,
    nama_pendidikan_ayah character varying(255),
    id_pekerjaan_ayah integer,
    nama_pekerjaan_ayah character varying(255),
    id_penghasilan_ayah integer,
    nama_penghasilan_ayah character varying(255),
    nik_ibu character varying(255),
    nama_ibu_kandung character varying(255),
    tanggal_lahir_ibu date,
    id_pendidikan_ibu integer,
    nama_pendidikan_ibu character varying(255),
    id_pekerjaan_ibu integer,
    nama_pekerjaan_ibu character varying(255),
    id_penghasilan_ibu integer,
    nama_penghasilan_ibu character varying(255),
    nama_wali character varying(255),
    tanggal_lahir_wali date,
    id_pendidikan_wali integer,
    nama_pendidikan_wali character varying(255),
    id_pekerjaan_wali integer,
    nama_pekerjaan_wali character varying(255),
    id_penghasilan_wali integer,
    nama_penghasilan_wali character varying(255),
    id_kebutuhan_khusus_mahasiswa integer,
    nama_kebutuhan_khusus_mahasiswa character varying(255),
    id_kebutuhan_khusus_ayah integer,
    nama_kebutuhan_khusus_ayah character varying(255),
    id_kebutuhan_khusus_ibu integer,
    nama_kebutuhan_khusus_ibu character varying(255),
    status_sync character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.biodata_mahasiswa OWNER TO bendo01;

--
-- Name: detail_nilai_perkuliahan_kelas; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.detail_nilai_perkuliahan_kelas (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    id_prodi uuid,
    nama_program_studi character varying(255),
    id_semester character varying(255),
    nama_semester character varying(255),
    id_matkul uuid,
    kode_mata_kuliah character varying(255),
    nama_mata_kuliah character varying(255),
    sks_mata_kuliah real,
    id_kelas_kuliah uuid,
    nama_kelas_kuliah character varying(255),
    id_registrasi_mahasiswa uuid,
    id_mahasiswa uuid,
    nim character varying(255),
    nama_mahasiswa character varying(255),
    jurusan character varying(255),
    angkatan character varying(255),
    nilai_angka real,
    nilai_indeks real,
    nilai_huruf character varying(255)
);


ALTER TABLE feeder_master.detail_nilai_perkuliahan_kelas OWNER TO bendo01;

--
-- Name: dosen; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.dosen (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_dosen uuid,
    nama_dosen character varying(255),
    nidn character varying(255),
    nip character varying(255),
    jenis_kelamin character varying(255),
    id_agama integer,
    nama_agama character varying(255),
    tanggal_lahir date,
    id_status_aktif character varying(255),
    nama_status_aktif character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    nuptk character varying(255)
);


ALTER TABLE feeder_master.dosen OWNER TO bendo01;

--
-- Name: dosen_pembimbing; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.dosen_pembimbing (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_registrasi_mahasiswa uuid,
    nama_mahasiswa character varying(255),
    nim character varying(255),
    id_dosen uuid,
    nidn character varying(255),
    nama_dosen character varying(255),
    pembimbing_ke integer,
    jenis_aktivitas character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.dosen_pembimbing OWNER TO bendo01;

--
-- Name: dosen_pengajar_kelas_kuliah; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.dosen_pengajar_kelas_kuliah (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_aktivitas_mengajar uuid,
    id_registrasi_dosen uuid,
    id_dosen uuid,
    nidn character varying(255),
    nuptk character varying(255),
    nama_dosen character varying(255),
    id_kelas_kuliah uuid,
    nama_kelas_kuliah character varying(255),
    id_substansi uuid,
    sks_substansi_total real,
    rencana_minggu_pertemuan integer,
    realisasi_minggu_pertemuan integer,
    id_jenis_evaluasi character varying(255),
    nama_jenis_evaluasi character varying(255),
    id_prodi uuid,
    id_semester character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.dosen_pengajar_kelas_kuliah OWNER TO bendo01;

--
-- Name: fakultas; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.fakultas (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_fakultas uuid,
    nama_fakultas character varying(255),
    status character varying(255),
    id_jenjang_pendidikan uuid,
    nama_jenjang_pendidikan character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.fakultas OWNER TO bendo01;

--
-- Name: hitung_transkrip_angkatan_mahasiswa; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.hitung_transkrip_angkatan_mahasiswa (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    angkatan integer,
    id_prodi uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.hitung_transkrip_angkatan_mahasiswa OWNER TO bendo01;

--
-- Name: kartu_rencana_studi_mahasiswa; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.kartu_rencana_studi_mahasiswa (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_registrasi_mahasiswa uuid,
    id_periode character varying(255),
    id_prodi uuid,
    nama_program_studi character varying(255),
    id_matkul uuid,
    kode_mata_kuliah character varying(255),
    nama_mata_kuliah character varying(255),
    id_kelas uuid,
    nama_kelas_kuliah character varying(255),
    sks_mata_kuliah real,
    nim character varying(255),
    nama_mahasiswa character varying(255),
    angkatan character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.kartu_rencana_studi_mahasiswa OWNER TO bendo01;

--
-- Name: kelas_kuliah; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.kelas_kuliah (
    id uuid DEFAULT public.uuid_generate_v7(),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    id_kelas_kuliah uuid NOT NULL,
    id_prodi uuid,
    nama_program_studi character varying(255),
    id_semester character varying(255),
    nama_semester character varying(255),
    id_matkul uuid,
    kode_mata_kuliah character varying(255),
    nama_mata_kuliah character varying(255),
    nama_kelas_kuliah character varying(255),
    sks_mk real,
    sks_tm real,
    sks_prak real,
    sks_prak_lap real,
    sks_sim real,
    bahasan text,
    tanggal_mulai_efektif date,
    tanggal_akhir_efektif date,
    kapasitas integer,
    tanggal_tutup_daftar date,
    prodi_penyelenggara character varying(255),
    perguruan_tinggi_penyelenggara character varying(255),
    sks real,
    id_dosen character varying(255),
    nama_dosen text,
    jumlah_mahasiswa integer,
    apa_untuk_pditt boolean
);


ALTER TABLE feeder_master.kelas_kuliah OWNER TO bendo01;

--
-- Name: komponen_evaluasi_kelas; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.komponen_evaluasi_kelas (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_komponen_evaluasi uuid,
    id_kelas_kuliah uuid,
    id_jenis_evaluasi integer,
    nama character varying(255),
    nama_inggris character varying(255),
    nomor_urut integer DEFAULT 0,
    bobot_evaluasi character varying(255),
    last_update date,
    tgl_create date,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.komponen_evaluasi_kelas OWNER TO bendo01;

--
-- Name: konsistensi_data; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.konsistensi_data (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    name character varying(255) NOT NULL,
    total integer NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.konsistensi_data OWNER TO bendo01;

--
-- Name: konversi_kampus_merdeka; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.konversi_kampus_merdeka (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_semester uuid,
    nama_semester character varying(255),
    id_konversi_aktivitas uuid,
    id_matkul uuid,
    nama_mata_kuliah character varying(255),
    id_aktivitas uuid,
    judul character varying(255),
    id_anggota uuid,
    nama_mahasiswa character varying(255),
    nim character varying(255),
    sks_mata_kuliah real,
    nilai_angka real,
    nilai_indeks real,
    nilai_huruf character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.konversi_kampus_merdeka OWNER TO bendo01;

--
-- Name: kurikulum; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.kurikulum (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    id_kurikulum uuid,
    nama_kurikulum character varying(255),
    id_prodi uuid,
    nama_program_studi character varying(255),
    id_jenj_didik integer,
    jml_sem_normal integer,
    id_semester character varying(255),
    semester_mulai_berlaku character varying(50),
    jumlah_sks_lulus real,
    jumlah_sks_wajib real,
    jumlah_sks_pilihan real,
    jumlah_sks_mata_kuliah_wajib real,
    jumlah_sks_mata_kuliah_pilihan real,
    status_sync character varying(255)
);


ALTER TABLE feeder_master.kurikulum OWNER TO bendo01;

--
-- Name: mahasiswa; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.mahasiswa (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    nama_mahasiswa character varying(255),
    jenis_kelamin character varying(255),
    tanggal_lahir date,
    id_perguruan_tinggi uuid,
    nipd character varying(255),
    ipk real,
    total_sks real,
    id_sms uuid,
    id_mahasiswa uuid,
    id_agama integer,
    nama_agama character varying(255),
    nama_program_studi character varying(255),
    id_status_mahasiswa integer,
    nama_status_mahasiswa character varying(255),
    nim character varying(255),
    id_periode character varying(255),
    nama_periode_masuk character varying(255),
    id_registrasi_mahasiswa uuid,
    id_periode_keluar character varying(255),
    tanggal_keluar date,
    last_update date,
    tgl_create date,
    status_sync character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    id_prodi uuid
);


ALTER TABLE feeder_master.mahasiswa OWNER TO bendo01;

--
-- Name: mahasiswa_bimbingan_dosen; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.mahasiswa_bimbingan_dosen (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_aktivitas uuid,
    judul character varying(255),
    id_bimbing_mahasiswa uuid,
    id_kategori_kegiatan uuid,
    nama_kategori_kegiatan character varying(255),
    id_dosen uuid,
    nidn character varying(255),
    nama_dosen character varying(255),
    pembimbing_ke integer,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.mahasiswa_bimbingan_dosen OWNER TO bendo01;

--
-- Name: mahasiswa_lulusan_dropout; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.mahasiswa_lulusan_dropout (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    id_registrasi_mahasiswa uuid,
    id_mahasiswa uuid,
    id_perguruan_tinggi uuid,
    id_prodi uuid,
    nama_program_studi character varying(255),
    nim character varying(255),
    nama_mahasiswa character varying(255),
    angkatan character varying(255),
    tgl_masuk_sp date,
    tgl_create date,
    tgl_keluar date,
    tanggal_keluar date,
    id_jenis_keluar character varying(255) NOT NULL,
    nama_jenis_keluar character varying(255) NOT NULL,
    id_periode_keluar character varying(255) NOT NULL,
    keterangan text,
    nomor_sk_yudisium character varying(255),
    tanggal_sk_yudisium date,
    ipk real DEFAULT 0,
    nomor_ijazah character varying(255),
    asal_ijazah character varying(10) NOT NULL,
    no_sertifikat_profesi character varying(255),
    tanggal_terbit_ijazah date,
    jalur_skripsi character varying(255),
    judul_skripsi text,
    bulan_awal_bimbingan character varying(255),
    bulan_akhir_bimbingan character varying(255),
    id_dosen uuid,
    nidn character varying(255),
    nuptk character varying(255),
    nama_dosen character varying(255),
    pembimbing_ke integer,
    skhun character varying(255),
    no_peserta_ujian character varying(255),
    sks_diakui character varying(255),
    id_jns_daftar character varying(255),
    nm_jns_daftar character varying(255),
    id_jalur_masuk character varying(255),
    id_pembiayaan character varying(255),
    biaya_masuk_kuliah character varying(255),
    id_minat_bidang character varying(255),
    bidang_mayor character varying(255),
    bidang_minor character varying(255),
    a_pindah_mhs_asing character varying(255),
    id_pt_asal uuid,
    id_prodi_asal uuid,
    nm_pt_asal character varying(255),
    nm_prodi_asal character varying(255),
    namapt character varying(255),
    id_jur character varying(255),
    nm_smt character varying(255),
    status_sync character varying(255)
);


ALTER TABLE feeder_master.mahasiswa_lulusan_dropout OWNER TO bendo01;

--
-- Name: matakuliah; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.matakuliah (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    id_matkul uuid,
    kode_mata_kuliah character varying(255),
    nama_mata_kuliah character varying(255),
    id_prodi uuid,
    nama_program_studi character varying(255),
    id_jenis_mata_kuliah character varying(255),
    nama_jenis_mata_kuliah character varying(255),
    id_kelompok_mata_kuliah character varying(255),
    nama_kelompok_mata_kuliah character varying(255),
    sks_mata_kuliah real,
    sks_tatap_muka real,
    sks_praktek real,
    sks_praktek_lapangan real,
    sks_simulasi real,
    metode_kuliah character varying(255),
    ada_sap boolean DEFAULT false,
    ada_silabus boolean DEFAULT false,
    ada_bahan_ajar boolean DEFAULT false,
    ada_acara_praktek boolean DEFAULT false,
    ada_diktat boolean DEFAULT false,
    tanggal_mulai_efektif timestamp(0) without time zone,
    tanggal_selesai_efektif timestamp(0) without time zone,
    id_jenj_didik character varying(5),
    tgl_create timestamp(0) without time zone,
    status_sync character varying(255)
);


ALTER TABLE feeder_master.matakuliah OWNER TO bendo01;

--
-- Name: matakuliah_kurikulum; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.matakuliah_kurikulum (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    tgl_create date,
    id_kurikulum uuid,
    nama_kurikulum character varying(255),
    id_matkul uuid,
    kode_mata_kuliah character varying(255),
    nama_mata_kuliah character varying(255),
    id_prodi uuid,
    nama_program_studi character varying(255),
    id_semester character varying(255),
    semester_mulai_berlaku character varying(255),
    sks_mata_kuliah real DEFAULT 0,
    sks_tatap_muka real DEFAULT 0,
    sks_praktek real DEFAULT 0,
    sks_praktek_lapangan real DEFAULT 0,
    sks_simulasi real DEFAULT 0,
    apakah_wajib boolean DEFAULT false,
    status_sync character varying(255),
    sync_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    semester integer DEFAULT 0
);


ALTER TABLE feeder_master.matakuliah_kurikulum OWNER TO bendo01;

--
-- Name: nilai_perkuliahan_kelas; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.nilai_perkuliahan_kelas (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    id_matkul uuid,
    kode_mata_kuliah text,
    nama_mata_kuliah text,
    id_kelas_kuliah uuid,
    nama_kelas_kuliah text,
    sks_mata_kuliah real DEFAULT 0,
    jumlah_mahasiswa_krs integer,
    jumlah_mahasiswa_dapat_nilai integer,
    sks_tm real DEFAULT 0,
    sks_prak real DEFAULT 0,
    sks_prak_lap real DEFAULT 0,
    sks_sim real DEFAULT 0,
    bahasan_case text,
    a_selenggara_pditt integer DEFAULT 0,
    a_pengguna_pditt integer DEFAULT 0,
    kuota_pditt integer DEFAULT 0,
    tgl_mulai_koas date,
    tgl_selesai_koas date,
    id_mou uuid,
    id_kls_pditt uuid,
    id_sms uuid,
    id_smt text,
    tgl_create date,
    lingkup_kelas integer,
    mode_kuliah text,
    nm_smt text,
    nama_prodi text,
    status_sync text
);


ALTER TABLE feeder_master.nilai_perkuliahan_kelas OWNER TO bendo01;

--
-- Name: nilai_transfer_pendidikan_mahasiswa; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.nilai_transfer_pendidikan_mahasiswa (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_transfer uuid,
    id_registrasi_mahasiswa uuid,
    nim character varying(255),
    nama_mahasiswa character varying(255),
    id_prodi uuid,
    nama_program_studi character varying(255),
    id_periode_masuk character varying(255),
    kode_mata_kuliah_asal character varying(255),
    nama_mata_kuliah_asal character varying(255),
    sks_mata_kuliah_asal real,
    nilai_huruf_asal character varying(255),
    id_matkul uuid,
    kode_matkul_diakui character varying(255),
    nama_mata_kuliah_diakui character varying(255),
    sks_mata_kuliah_diakui real,
    nilai_huruf_diakui character varying(255),
    nilai_angka_diakui real,
    id_perguruan_tinggi uuid,
    id_aktivitas character varying(255),
    judul text,
    id_jenis_aktivitas character varying(255),
    nama_jenis_aktivitas character varying(255),
    id_semester character varying(255),
    nama_semester character varying(255),
    status_sync character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.nilai_transfer_pendidikan_mahasiswa OWNER TO bendo01;

--
-- Name: penugasan_dosen; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.penugasan_dosen (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    id_registrasi_dosen uuid,
    id_dosen uuid,
    nama_dosen character varying(255),
    jenis_kelamin character varying(255),
    nidn character varying(255),
    nuptk character varying(255),
    id_tahun_ajaran character varying(255),
    nama_tahun_ajaran character varying(255),
    id_perguruan_tinggi uuid,
    nama_perguruan_tinggi character varying(255),
    id_prodi uuid,
    nama_program_studi character varying(255),
    nomor_surat_tugas character varying(255),
    tanggal_surat_tugas character varying(255),
    mulai_surat_tugas character varying(255),
    tgl_create character varying(255),
    tgl_ptk_keluar character varying(255),
    id_stat_pegawai integer,
    id_jns_keluar integer,
    id_ikatan_kerja character varying(255),
    apakah_homebase boolean
);


ALTER TABLE feeder_master.penugasan_dosen OWNER TO bendo01;

--
-- Name: perguruan_tinggi; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.perguruan_tinggi (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_perguruan_tinggi uuid,
    kode_perguruan_tinggi character varying(255),
    nama_perguruan_tinggi character varying(255),
    nama_singkat character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.perguruan_tinggi OWNER TO bendo01;

--
-- Name: periode_aktif; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.periode_aktif (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_prodi uuid,
    kode_prodi character varying(255),
    nama_program_studi character varying(255),
    status_prodi character varying(255),
    jenjang_pendidikan character varying(255),
    periode_pelaporan character varying(255),
    tipe_periode character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.periode_aktif OWNER TO bendo01;

--
-- Name: periode_perkuliahan; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.periode_perkuliahan (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    id_prodi uuid,
    nama_program_studi character varying(255),
    id_semester character varying(10),
    nama_semester character varying(50),
    jumlah_target_mahasiswa_baru integer,
    jumlah_pendaftar_ikut_seleksi integer,
    jumlah_pendaftar_lulus_seleksi integer,
    jumlah_daftar_ulang integer,
    jumlah_mengundurkan_diri integer,
    tanggal_awal_perkuliahan date,
    tanggal_akhir_perkuliahan date,
    jumlah_minggu_pertemuan integer,
    metode_kul character varying(100),
    metode_kul_eks character varying(100),
    tgl_create date,
    last_update date,
    status_sync character varying(50)
);


ALTER TABLE feeder_master.periode_perkuliahan OWNER TO bendo01;

--
-- Name: TABLE periode_perkuliahan; Type: COMMENT; Schema: feeder_master; Owner: bendo01
--

COMMENT ON TABLE feeder_master.periode_perkuliahan IS 'Periode perkuliahan data from feeder - combines GetListPeriodePerkuliahan and GetDetailPeriodePerkuliahan';


--
-- Name: COLUMN periode_perkuliahan.id_prodi; Type: COMMENT; Schema: feeder_master; Owner: bendo01
--

COMMENT ON COLUMN feeder_master.periode_perkuliahan.id_prodi IS 'ID program studi (UUID)';


--
-- Name: COLUMN periode_perkuliahan.id_semester; Type: COMMENT; Schema: feeder_master; Owner: bendo01
--

COMMENT ON COLUMN feeder_master.periode_perkuliahan.id_semester IS 'ID semester format YYYYS (e.g., 20201 = 2020/2021 Ganjil)';


--
-- Name: COLUMN periode_perkuliahan.jumlah_pendaftar_ikut_seleksi; Type: COMMENT; Schema: feeder_master; Owner: bendo01
--

COMMENT ON COLUMN feeder_master.periode_perkuliahan.jumlah_pendaftar_ikut_seleksi IS 'Jumlah calon mahasiswa yang ikut seleksi';


--
-- Name: COLUMN periode_perkuliahan.jumlah_pendaftar_lulus_seleksi; Type: COMMENT; Schema: feeder_master; Owner: bendo01
--

COMMENT ON COLUMN feeder_master.periode_perkuliahan.jumlah_pendaftar_lulus_seleksi IS 'Jumlah calon mahasiswa yang lulus seleksi';


--
-- Name: COLUMN periode_perkuliahan.jumlah_daftar_ulang; Type: COMMENT; Schema: feeder_master; Owner: bendo01
--

COMMENT ON COLUMN feeder_master.periode_perkuliahan.jumlah_daftar_ulang IS 'Jumlah mahasiswa yang daftar ulang';


--
-- Name: COLUMN periode_perkuliahan.jumlah_mengundurkan_diri; Type: COMMENT; Schema: feeder_master; Owner: bendo01
--

COMMENT ON COLUMN feeder_master.periode_perkuliahan.jumlah_mengundurkan_diri IS 'Jumlah mahasiswa yang mengundurkan diri';


--
-- Name: perkuliahan_mahasiswa; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.perkuliahan_mahasiswa (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    id_registrasi_mahasiswa uuid,
    nim character varying(255),
    nama_mahasiswa character varying(255),
    angkatan character varying(255),
    id_prodi uuid,
    nama_program_studi character varying(255),
    id_periode_masuk character varying(255),
    id_semester character varying(255),
    nama_semester character varying(255),
    id_status_mahasiswa character varying(255),
    nama_status_mahasiswa character varying(255),
    ips real DEFAULT 0,
    ipk real DEFAULT 0,
    sks_semester real DEFAULT 0,
    sks_total real DEFAULT 0,
    biaya_kuliah_smt real DEFAULT 0,
    id_pembiayaan character varying(255),
    status_sync character varying(255)
);


ALTER TABLE feeder_master.perkuliahan_mahasiswa OWNER TO bendo01;

--
-- Name: peserta_kelas_kuliah; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.peserta_kelas_kuliah (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_kelas_kuliah uuid,
    nama_kelas_kuliah character varying(255),
    id_registrasi_mahasiswa uuid,
    id_mahasiswa uuid,
    nim character varying(255),
    nama_mahasiswa character varying(255),
    id_matkul uuid,
    kode_mata_kuliah character varying(255),
    nama_mata_kuliah character varying(255),
    id_prodi uuid,
    nama_program_studi character varying(255),
    angkatan character varying(255),
    status_sync character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.peserta_kelas_kuliah OWNER TO bendo01;

--
-- Name: prestasi_mahasiswa; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.prestasi_mahasiswa (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_prestasi uuid,
    id_mahasiswa uuid,
    nama_mahasiswa character varying(255),
    id_jenis_prestasi uuid,
    nama_jenis_prestasi character varying(255),
    id_tingkat_prestasi uuid,
    nama_tingkat_prestasi character varying(255),
    nama_prestasi character varying(255),
    tahun_prestasi integer,
    penyelenggara character varying(255),
    peringkat integer,
    id_aktivitas uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.prestasi_mahasiswa OWNER TO bendo01;

--
-- Name: profil_perguruan_tinggi; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.profil_perguruan_tinggi (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_perguruan_tinggi uuid,
    kode_perguruan_tinggi character varying(255),
    nama_perguruan_tinggi character varying(255),
    telepon character varying(255),
    faximile character varying(255),
    email character varying(255),
    website character varying(255),
    jalan character varying(255),
    dusun character varying(255),
    kelurahan character varying(255),
    kode_pos character varying(255),
    id_wilayah character varying(255),
    nama_wilayah character varying(255),
    lintang_bujur character varying(255),
    bank character varying(255),
    unit_cabang character varying(255),
    nomor_rekening character varying(255),
    mbs character varying(255),
    luas_tanah_milik character varying(255),
    luas_tanah_bukan_milik character varying(255),
    sk_pendirian character varying(255),
    id_status_milik character varying(255),
    nama_status_milik character varying(255),
    status_perguruan_tinggi character varying(255),
    sk_izin_operasional character varying(255),
    tanggal_izin_operasional date,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    nama_singkat character varying(255),
    rt_rw character varying(255),
    tanggal_sk_pendirian timestamp without time zone
);


ALTER TABLE feeder_master.profil_perguruan_tinggi OWNER TO bendo01;

--
-- Name: program_studi; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.program_studi (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_perguruan_tinggi uuid,
    kode_perguruan_tinggi character varying(255),
    nama_perguruan_tinggi character varying(255),
    id_prodi uuid,
    kode_program_studi character varying(255),
    nama_program_studi character varying(255),
    status character varying(255),
    id_jenjang_pendidikan character varying(255),
    nama_jenjang_pendidikan character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.program_studi OWNER TO bendo01;

--
-- Name: rencana_evaluasi; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.rencana_evaluasi (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_jenis_evaluasi character varying(255),
    id_rencana_evaluasi uuid,
    jenis_evaluasi character varying(255),
    id_matkul uuid,
    nama_mata_kuliah character varying(255),
    kode_mata_kuliah character varying(255),
    sks_mata_kuliah character varying(255),
    id_prodi uuid,
    nama_program_studi character varying(255),
    nama_evaluasi character varying(255),
    deskripsi_indonesia text,
    deskrips_inggris text,
    nomor_urut character varying(255),
    bobot_evaluasi character varying(255),
    status_sync character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.rencana_evaluasi OWNER TO bendo01;

--
-- Name: rencana_pembelajaran; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.rencana_pembelajaran (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_rencana_ajar uuid,
    id_matkul uuid,
    nama_mata_kuliah character varying,
    kode_mata_kuliah character varying,
    sks_mata_kuliah real,
    id_prodi uuid,
    nama_program_studi character varying,
    pertemuan integer,
    materi_indonesia text,
    materi_inggris text,
    status_sync character varying,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.rencana_pembelajaran OWNER TO bendo01;

--
-- Name: riwayat_fungsional_dosen; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.riwayat_fungsional_dosen (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_dosen uuid,
    nidn character varying(255),
    nama_dosen character varying(255),
    id_jabatan_fungsional uuid,
    nama_jabatan_fungsional character varying(255),
    sk_jabatan_fungsional character varying(255),
    mulai_sk_jabatan date,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    nuptk character varying(255)
);


ALTER TABLE feeder_master.riwayat_fungsional_dosen OWNER TO bendo01;

--
-- Name: riwayat_nilai_mahasiswa; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.riwayat_nilai_mahasiswa (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_registrasi_mahasiswa uuid,
    id_prodi uuid,
    nama_program_studi character varying(255),
    id_periode character varying(255),
    id_matkul uuid,
    nama_mata_kuliah character varying(255),
    id_kelas uuid,
    nama_kelas_kuliah character varying(255),
    sks_mata_kuliah real,
    nilai_angka real,
    nilai_huruf character varying(255),
    nilai_indeks real,
    nim character varying(255),
    nama_mahasiswa character varying(255),
    angkatan character varying(255),
    status_sync character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.riwayat_nilai_mahasiswa OWNER TO bendo01;

--
-- Name: riwayat_pangkat_dosen; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.riwayat_pangkat_dosen (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_dosen uuid,
    nidn character varying(255),
    nama_dosen character varying(255),
    id_pangkat_golongan uuid,
    nama_pangkat_golongan character varying(255),
    sk_pangkat character varying(255),
    tanggal_sk_pangkat date,
    mulai_sk_pangkat date,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    nuptk character varying(255),
    masa_kerja_dalam_tahun integer DEFAULT 0,
    masa_kerja_dalam_bulan integer DEFAULT 0
);


ALTER TABLE feeder_master.riwayat_pangkat_dosen OWNER TO bendo01;

--
-- Name: riwayat_pendidikan_dosen; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.riwayat_pendidikan_dosen (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_dosen uuid,
    nidn character varying(255),
    nama_dosen character varying(255),
    id_bidang_studi character varying(255),
    nama_bidang_studi character varying(255),
    id_jenjang_pendidikan character varying(255),
    nama_jenjang_pendidikan character varying(255),
    id_gelar_akademik character varying(255),
    nama_gelar_akademik character varying(255),
    id_perguruan_tinggi uuid,
    nama_perguruan_tinggi character varying(255),
    fakultas character varying(255),
    tahun_lulus character varying(255),
    sks_lulus real,
    ipk real,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    nuptk character varying(255)
);


ALTER TABLE feeder_master.riwayat_pendidikan_dosen OWNER TO bendo01;

--
-- Name: riwayat_pendidikan_mahasiswa; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.riwayat_pendidikan_mahasiswa (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_registrasi_mahasiswa uuid,
    id_mahasiswa uuid,
    nim character varying(255),
    nama_mahasiswa character varying(255),
    id_jenis_daftar integer,
    nama_jenis_daftar character varying(255),
    id_jalur_daftar integer,
    id_periode_masuk character varying(255),
    nama_periode_masuk character varying(255),
    id_jenis_keluar integer,
    keterangan_keluar character varying(255),
    id_perguruan_tinggi uuid,
    nama_perguruan_tinggi character varying(255),
    id_prodi uuid,
    nama_program_studi character varying(255),
    sks_diakui real,
    id_perguruan_tinggi_asal uuid,
    nama_perguruan_tinggi_asal character varying(255),
    id_prodi_asal uuid,
    nama_program_studi_asal character varying(255),
    jenis_kelamin character varying(255),
    tanggal_daftar date,
    nama_ibu_kandung character varying(255),
    id_pembiayaan integer,
    biaya_masuk integer,
    id_bidang_minat character varying(255),
    nm_bidang_minat character varying(255),
    id_periode_keluar character varying(255),
    tanggal_keluar date,
    last_update date,
    tgl_create date,
    status_sync character varying(255),
    nama_pembiayaan_awal character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.riwayat_pendidikan_mahasiswa OWNER TO bendo01;

--
-- Name: riwayat_penelitian_dosen; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.riwayat_penelitian_dosen (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_dosen uuid,
    nidn character varying(255),
    nama_dosen character varying(255),
    id_penelitian uuid,
    judul_penelitian text,
    id_kelompok_bidang uuid,
    kode_kelompok_bidang character varying(255),
    nama_kelompok_bidang character varying(255),
    id_lembaga_iptek uuid,
    nama_lembaga_iptek character varying(255),
    tahun_kegiatan character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    nuptk character varying(255)
);


ALTER TABLE feeder_master.riwayat_penelitian_dosen OWNER TO bendo01;

--
-- Name: riwayat_sertifikasi_dosen; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.riwayat_sertifikasi_dosen (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_dosen uuid,
    nidn character varying(255),
    nama_dosen character varying(255),
    nomor_peserta character varying(255),
    id_bidang_studi character varying(255),
    nama_bidang_studi character varying(255),
    id_jenis_sertifikasi character varying(255),
    nama_jenis_sertifikasi character varying(255),
    tahun_sertifikasi character varying(255),
    sk_sertifikasi character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    nuptk character varying(255)
);


ALTER TABLE feeder_master.riwayat_sertifikasi_dosen OWNER TO bendo01;

--
-- Name: skala_nilai_program_studi; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.skala_nilai_program_studi (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    tgl_create date,
    id_bobot_nilai uuid,
    id_prodi uuid,
    nama_program_studi character varying(255),
    nilai_huruf character varying(255),
    nilai_indeks real,
    bobot_minimum real,
    bobot_maksimum real,
    tanggal_mulai_efektif date,
    tanggal_akhir_efektif date,
    status_sync character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.skala_nilai_program_studi OWNER TO bendo01;

--
-- Name: substansi_matakuliah; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.substansi_matakuliah (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_substansi uuid,
    id_prodi uuid,
    nama_program_studi character varying(255),
    nama_substansi character varying(255),
    sks_mata_kuliah real,
    sks_tatap_muka real,
    sks_praktek real,
    sks_praktek_lapangan real,
    sks_simulasi real,
    id_jenis_substansi uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.substansi_matakuliah OWNER TO bendo01;

--
-- Name: transkrip_mahasiswa; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.transkrip_mahasiswa (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_registrasi_mahasiswa uuid,
    id_matkul uuid,
    id_kelas_kuliah uuid,
    id_nilai_transfer character varying(255),
    id_konversi_aktivitas character varying(255),
    smt_diambil character varying(255),
    kode_mata_kuliah character varying(255),
    nama_mata_kuliah character varying(255),
    sks_mata_kuliah real,
    nilai_angka real,
    nilai_huruf character varying(255),
    nilai_indeks real,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.transkrip_mahasiswa OWNER TO bendo01;

--
-- Name: uji_mahasiswa; Type: TABLE; Schema: feeder_master; Owner: bendo01
--

CREATE TABLE feeder_master.uji_mahasiswa (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_aktivitas uuid,
    judul character varying(255),
    id_uji uuid,
    id_kategori_kegiatan uuid,
    nama_kategori_kegiatan character varying(255),
    id_dosen uuid,
    nidn character varying(255),
    nama_dosen character varying(255),
    penguji_ke integer,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_master.uji_mahasiswa OWNER TO bendo01;

--
-- Name: aktifitas_kuliah_mahasiswa feeder_master_aktifitas_kuliah_mahasiswa_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.aktifitas_kuliah_mahasiswa
    ADD CONSTRAINT feeder_master_aktifitas_kuliah_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: aktifitas_mahasiswa feeder_master_aktifitas_mahasiswa_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.aktifitas_mahasiswa
    ADD CONSTRAINT feeder_master_aktifitas_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: aktifitas_mengajar_dosen feeder_master_aktifitas_mengajar_dosen_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.aktifitas_mengajar_dosen
    ADD CONSTRAINT feeder_master_aktifitas_mengajar_dosen_pkey PRIMARY KEY (id);


--
-- Name: anggota_aktifitas_mahasiswa feeder_master_anggota_aktifitas_mahasiswa_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.anggota_aktifitas_mahasiswa
    ADD CONSTRAINT feeder_master_anggota_aktifitas_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: bidang_minat_perguruan_tinggi feeder_master_bidang_minat_perguruan_tinggi_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.bidang_minat_perguruan_tinggi
    ADD CONSTRAINT feeder_master_bidang_minat_perguruan_tinggi_pkey PRIMARY KEY (id);


--
-- Name: bimbing_mahasiswa feeder_master_bimbing_mahasiswa_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.bimbing_mahasiswa
    ADD CONSTRAINT feeder_master_bimbing_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: biodata_dosen feeder_master_biodata_dosen_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.biodata_dosen
    ADD CONSTRAINT feeder_master_biodata_dosen_pkey PRIMARY KEY (id);


--
-- Name: biodata_mahasiswa feeder_master_biodata_mahasiswa_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.biodata_mahasiswa
    ADD CONSTRAINT feeder_master_biodata_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: detail_nilai_perkuliahan_kelas feeder_master_detail_nilai_perkuliahan_kelas_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.detail_nilai_perkuliahan_kelas
    ADD CONSTRAINT feeder_master_detail_nilai_perkuliahan_kelas_pkey PRIMARY KEY (id);


--
-- Name: dosen_pembimbing feeder_master_dosen_pembimbing_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.dosen_pembimbing
    ADD CONSTRAINT feeder_master_dosen_pembimbing_pkey PRIMARY KEY (id);


--
-- Name: dosen feeder_master_dosen_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.dosen
    ADD CONSTRAINT feeder_master_dosen_pkey PRIMARY KEY (id);


--
-- Name: fakultas feeder_master_fakultas_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.fakultas
    ADD CONSTRAINT feeder_master_fakultas_pkey PRIMARY KEY (id);


--
-- Name: hitung_transkrip_angkatan_mahasiswa feeder_master_hitung_transkrip_angkatan_mahasiswa_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.hitung_transkrip_angkatan_mahasiswa
    ADD CONSTRAINT feeder_master_hitung_transkrip_angkatan_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: kartu_rencana_studi_mahasiswa feeder_master_kartu_rencana_studi_mahasiswa_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.kartu_rencana_studi_mahasiswa
    ADD CONSTRAINT feeder_master_kartu_rencana_studi_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: kelas_kuliah feeder_master_kelas_kuliah_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.kelas_kuliah
    ADD CONSTRAINT feeder_master_kelas_kuliah_pkey PRIMARY KEY (id_kelas_kuliah);


--
-- Name: komponen_evaluasi_kelas feeder_master_komponen_evaluasi_kelas_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.komponen_evaluasi_kelas
    ADD CONSTRAINT feeder_master_komponen_evaluasi_kelas_pkey PRIMARY KEY (id);


--
-- Name: konsistensi_data feeder_master_konsistensi_data_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.konsistensi_data
    ADD CONSTRAINT feeder_master_konsistensi_data_pkey PRIMARY KEY (id);


--
-- Name: konversi_kampus_merdeka feeder_master_konversi_kampus_merdeka_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.konversi_kampus_merdeka
    ADD CONSTRAINT feeder_master_konversi_kampus_merdeka_pkey PRIMARY KEY (id);


--
-- Name: kurikulum feeder_master_kurikulum_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.kurikulum
    ADD CONSTRAINT feeder_master_kurikulum_pkey PRIMARY KEY (id);


--
-- Name: mahasiswa_bimbingan_dosen feeder_master_mahasiswa_bimbingan_dosen_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.mahasiswa_bimbingan_dosen
    ADD CONSTRAINT feeder_master_mahasiswa_bimbingan_dosen_pkey PRIMARY KEY (id);


--
-- Name: mahasiswa_lulusan_dropout feeder_master_mahasiswa_lulusan_dropout_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.mahasiswa_lulusan_dropout
    ADD CONSTRAINT feeder_master_mahasiswa_lulusan_dropout_pkey PRIMARY KEY (id);


--
-- Name: mahasiswa feeder_master_mahasiswa_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.mahasiswa
    ADD CONSTRAINT feeder_master_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: matakuliah_kurikulum feeder_master_matakuliah_kurikulum_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.matakuliah_kurikulum
    ADD CONSTRAINT feeder_master_matakuliah_kurikulum_pkey PRIMARY KEY (id);


--
-- Name: matakuliah feeder_master_matakuliah_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.matakuliah
    ADD CONSTRAINT feeder_master_matakuliah_pkey PRIMARY KEY (id);


--
-- Name: nilai_perkuliahan_kelas feeder_master_nilai_perkuliahan_kelas_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.nilai_perkuliahan_kelas
    ADD CONSTRAINT feeder_master_nilai_perkuliahan_kelas_pkey PRIMARY KEY (id);


--
-- Name: nilai_transfer_pendidikan_mahasiswa feeder_master_nilai_transfer_pendidikan_mahasiswa_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.nilai_transfer_pendidikan_mahasiswa
    ADD CONSTRAINT feeder_master_nilai_transfer_pendidikan_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: penugasan_dosen feeder_master_penugasan_dosen_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.penugasan_dosen
    ADD CONSTRAINT feeder_master_penugasan_dosen_pkey PRIMARY KEY (id);


--
-- Name: perguruan_tinggi feeder_master_perguruan_tinggi_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.perguruan_tinggi
    ADD CONSTRAINT feeder_master_perguruan_tinggi_pkey PRIMARY KEY (id);


--
-- Name: periode_aktif feeder_master_periode_aktif_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.periode_aktif
    ADD CONSTRAINT feeder_master_periode_aktif_pkey PRIMARY KEY (id);


--
-- Name: periode_perkuliahan feeder_master_periode_perkuliahan_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.periode_perkuliahan
    ADD CONSTRAINT feeder_master_periode_perkuliahan_pkey PRIMARY KEY (id);


--
-- Name: periode_perkuliahan feeder_master_periode_perkuliahan_unique_prodi_semester; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.periode_perkuliahan
    ADD CONSTRAINT feeder_master_periode_perkuliahan_unique_prodi_semester UNIQUE (id_prodi, id_semester);


--
-- Name: perkuliahan_mahasiswa feeder_master_perkuliahan_mahasiswa_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.perkuliahan_mahasiswa
    ADD CONSTRAINT feeder_master_perkuliahan_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: peserta_kelas_kuliah feeder_master_peserta_kelas_kuliah_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.peserta_kelas_kuliah
    ADD CONSTRAINT feeder_master_peserta_kelas_kuliah_pkey PRIMARY KEY (id);


--
-- Name: prestasi_mahasiswa feeder_master_prestasi_mahasiswa_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.prestasi_mahasiswa
    ADD CONSTRAINT feeder_master_prestasi_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: profil_perguruan_tinggi feeder_master_profil_perguruan_tinggi_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.profil_perguruan_tinggi
    ADD CONSTRAINT feeder_master_profil_perguruan_tinggi_pkey PRIMARY KEY (id);


--
-- Name: program_studi feeder_master_program_studi_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.program_studi
    ADD CONSTRAINT feeder_master_program_studi_pkey PRIMARY KEY (id);


--
-- Name: rencana_evaluasi feeder_master_rencana_evaluasi_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.rencana_evaluasi
    ADD CONSTRAINT feeder_master_rencana_evaluasi_pkey PRIMARY KEY (id);


--
-- Name: rencana_pembelajaran feeder_master_rencana_pembelajaran_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.rencana_pembelajaran
    ADD CONSTRAINT feeder_master_rencana_pembelajaran_pkey PRIMARY KEY (id);


--
-- Name: riwayat_fungsional_dosen feeder_master_riwayat_fungsional_dosen_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.riwayat_fungsional_dosen
    ADD CONSTRAINT feeder_master_riwayat_fungsional_dosen_pkey PRIMARY KEY (id);


--
-- Name: riwayat_nilai_mahasiswa feeder_master_riwayat_nilai_mahasiswa_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.riwayat_nilai_mahasiswa
    ADD CONSTRAINT feeder_master_riwayat_nilai_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: riwayat_pangkat_dosen feeder_master_riwayat_pangkat_dosen_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.riwayat_pangkat_dosen
    ADD CONSTRAINT feeder_master_riwayat_pangkat_dosen_pkey PRIMARY KEY (id);


--
-- Name: riwayat_pendidikan_dosen feeder_master_riwayat_pendidikan_dosen_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.riwayat_pendidikan_dosen
    ADD CONSTRAINT feeder_master_riwayat_pendidikan_dosen_pkey PRIMARY KEY (id);


--
-- Name: riwayat_pendidikan_mahasiswa feeder_master_riwayat_pendidikan_mahasiswa_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.riwayat_pendidikan_mahasiswa
    ADD CONSTRAINT feeder_master_riwayat_pendidikan_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: riwayat_penelitian_dosen feeder_master_riwayat_penelitian_dosen_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.riwayat_penelitian_dosen
    ADD CONSTRAINT feeder_master_riwayat_penelitian_dosen_pkey PRIMARY KEY (id);


--
-- Name: riwayat_sertifikasi_dosen feeder_master_riwayat_sertifikasi_dosen_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.riwayat_sertifikasi_dosen
    ADD CONSTRAINT feeder_master_riwayat_sertifikasi_dosen_pkey PRIMARY KEY (id);


--
-- Name: skala_nilai_program_studi feeder_master_skala_nilai_program_studi_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.skala_nilai_program_studi
    ADD CONSTRAINT feeder_master_skala_nilai_program_studi_pkey PRIMARY KEY (id);


--
-- Name: substansi_matakuliah feeder_master_substansi_matakuliah_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.substansi_matakuliah
    ADD CONSTRAINT feeder_master_substansi_matakuliah_pkey PRIMARY KEY (id);


--
-- Name: transkrip_mahasiswa feeder_master_transkrip_mahasiswa_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.transkrip_mahasiswa
    ADD CONSTRAINT feeder_master_transkrip_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: uji_mahasiswa feeder_master_uji_mahasiswa_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.uji_mahasiswa
    ADD CONSTRAINT feeder_master_uji_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: dosen_pengajar_kelas_kuliah pfeeder_master_dosen_pengajar_kelas_kuliah_pkey; Type: CONSTRAINT; Schema: feeder_master; Owner: bendo01
--

ALTER TABLE ONLY feeder_master.dosen_pengajar_kelas_kuliah
    ADD CONSTRAINT pfeeder_master_dosen_pengajar_kelas_kuliah_pkey PRIMARY KEY (id);


--
-- Name: idx_feeder_master_periode_perkuliahan_id_prodi; Type: INDEX; Schema: feeder_master; Owner: bendo01
--

CREATE INDEX idx_feeder_master_periode_perkuliahan_id_prodi ON feeder_master.periode_perkuliahan USING btree (id_prodi);


--
-- Name: idx_feeder_master_periode_perkuliahan_id_semester; Type: INDEX; Schema: feeder_master; Owner: bendo01
--

CREATE INDEX idx_feeder_master_periode_perkuliahan_id_semester ON feeder_master.periode_perkuliahan USING btree (id_semester);


--
-- Name: idx_feeder_master_periode_perkuliahan_status_sync; Type: INDEX; Schema: feeder_master; Owner: bendo01
--

CREATE INDEX idx_feeder_master_periode_perkuliahan_status_sync ON feeder_master.periode_perkuliahan USING btree (status_sync);


--
-- Name: idx_feeder_master_periode_perkuliahan_tanggal_awal; Type: INDEX; Schema: feeder_master; Owner: bendo01
--

CREATE INDEX idx_feeder_master_periode_perkuliahan_tanggal_awal ON feeder_master.periode_perkuliahan USING btree (tanggal_awal_perkuliahan);


--
-- PostgreSQL database dump complete
--

\unrestrict RCMfiBiCYFWonqMKhYzMHb9L5zPopFErVUQwF7rvPFIhtd9OqZfb5lhQKhCwfaW

