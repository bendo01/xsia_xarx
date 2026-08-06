--
-- PostgreSQL database dump
--

\restrict eMxGgUe1j7ZCMdLZ27QGPV6lHvj8OJl5VTuw67sW3JieKw6IFWj4YhXsenHKNXy

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
-- Name: feeder_rekapitulasi; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA feeder_rekapitulasi;


ALTER SCHEMA feeder_rekapitulasi OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: indeks_prestasi_sementara_mahasiswa; Type: TABLE; Schema: feeder_rekapitulasi; Owner: bendo01
--

CREATE TABLE feeder_rekapitulasi.indeks_prestasi_sementara_mahasiswa (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_prodi uuid,
    aktif character varying(255),
    cuti character varying(255),
    non_aktif character varying(255),
    sedang_double_degree boolean,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_rekapitulasi.indeks_prestasi_sementara_mahasiswa OWNER TO bendo01;

--
-- Name: jumlah_dosen; Type: TABLE; Schema: feeder_rekapitulasi; Owner: bendo01
--

CREATE TABLE feeder_rekapitulasi.jumlah_dosen (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_prodi uuid,
    id_periode uuid,
    nama_periode character varying(255),
    nama_prodi character varying(255),
    jumlah_dosen_homebase integer,
    is_homebase boolean,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_rekapitulasi.jumlah_dosen OWNER TO bendo01;

--
-- Name: jumlah_mahasiswa; Type: TABLE; Schema: feeder_rekapitulasi; Owner: bendo01
--

CREATE TABLE feeder_rekapitulasi.jumlah_mahasiswa (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_prodi uuid,
    aktif character varying(255),
    cuti character varying(255),
    non_aktif character varying(255),
    sedang_double_degree boolean,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_rekapitulasi.jumlah_mahasiswa OWNER TO bendo01;

--
-- Name: kartu_hasil_studi_mahasiswa; Type: TABLE; Schema: feeder_rekapitulasi; Owner: bendo01
--

CREATE TABLE feeder_rekapitulasi.kartu_hasil_studi_mahasiswa (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_registrasi_mahasiswa uuid,
    nim integer,
    nama_mahasiswa character varying(255),
    id_periode uuid,
    nama_periode character varying(255),
    id_matkul uuid,
    nama_mata_kuliah character varying(255),
    sks_mata_kuliah integer,
    nilai_angka integer,
    nilai_huruf character varying(255),
    nilai_indeks integer,
    sks_x_indeks integer,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_rekapitulasi.kartu_hasil_studi_mahasiswa OWNER TO bendo01;

--
-- Name: kartu_rencana_studi_mahasiswa; Type: TABLE; Schema: feeder_rekapitulasi; Owner: bendo01
--

CREATE TABLE feeder_rekapitulasi.kartu_rencana_studi_mahasiswa (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_registrasi_mahasiswa uuid,
    nim integer,
    nama_mahasiswa character varying(255),
    id_matkul uuid,
    id_semester uuid,
    kode_mata_kuliah character varying(255),
    nama_mata_kuliah character varying(255),
    sks_mata_kuliah integer,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_rekapitulasi.kartu_rencana_studi_mahasiswa OWNER TO bendo01;

--
-- Name: laporan; Type: TABLE; Schema: feeder_rekapitulasi; Owner: bendo01
--

CREATE TABLE feeder_rekapitulasi.laporan (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    id_prodi uuid,
    nama_program_studi character varying(255),
    id_semester uuid,
    nama_semester character varying(255),
    jumlah_target_mahasiswa_baru integer,
    tanggal_awal_perkuliahan date,
    tanggal_akhir_perkuliahan date,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_rekapitulasi.laporan OWNER TO bendo01;

--
-- Name: indeks_prestasi_sementara_mahasiswa feeder_rekapitulasi_indeks_prestasi_sementara_mahasiswa_pkey; Type: CONSTRAINT; Schema: feeder_rekapitulasi; Owner: bendo01
--

ALTER TABLE ONLY feeder_rekapitulasi.indeks_prestasi_sementara_mahasiswa
    ADD CONSTRAINT feeder_rekapitulasi_indeks_prestasi_sementara_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: jumlah_dosen feeder_rekapitulasi_jumlah_dosen_pkey; Type: CONSTRAINT; Schema: feeder_rekapitulasi; Owner: bendo01
--

ALTER TABLE ONLY feeder_rekapitulasi.jumlah_dosen
    ADD CONSTRAINT feeder_rekapitulasi_jumlah_dosen_pkey PRIMARY KEY (id);


--
-- Name: jumlah_mahasiswa feeder_rekapitulasi_jumlah_mahasiswa_pkey; Type: CONSTRAINT; Schema: feeder_rekapitulasi; Owner: bendo01
--

ALTER TABLE ONLY feeder_rekapitulasi.jumlah_mahasiswa
    ADD CONSTRAINT feeder_rekapitulasi_jumlah_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: kartu_hasil_studi_mahasiswa feeder_rekapitulasi_kartu_hasil_studi_mahasiswa_pkey; Type: CONSTRAINT; Schema: feeder_rekapitulasi; Owner: bendo01
--

ALTER TABLE ONLY feeder_rekapitulasi.kartu_hasil_studi_mahasiswa
    ADD CONSTRAINT feeder_rekapitulasi_kartu_hasil_studi_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: kartu_rencana_studi_mahasiswa feeder_rekapitulasi_kartu_rencana_studi_mahasiswa_pkey; Type: CONSTRAINT; Schema: feeder_rekapitulasi; Owner: bendo01
--

ALTER TABLE ONLY feeder_rekapitulasi.kartu_rencana_studi_mahasiswa
    ADD CONSTRAINT feeder_rekapitulasi_kartu_rencana_studi_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: laporan feeder_rekapitulasi_laporans_pkey; Type: CONSTRAINT; Schema: feeder_rekapitulasi; Owner: bendo01
--

ALTER TABLE ONLY feeder_rekapitulasi.laporan
    ADD CONSTRAINT feeder_rekapitulasi_laporans_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict eMxGgUe1j7ZCMdLZ27QGPV6lHvj8OJl5VTuw67sW3JieKw6IFWj4YhXsenHKNXy

