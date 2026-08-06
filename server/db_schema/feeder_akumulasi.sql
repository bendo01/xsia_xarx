--
-- PostgreSQL database dump
--

\restrict bAipxiWIZW8NEVlE0DmpymvozWIG8vVYIZ1h7igTrJE39zCi4awRx2A9HqqC1l4

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
-- Name: feeder_akumulasi; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA feeder_akumulasi;


ALTER SCHEMA feeder_akumulasi OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: estimasi; Type: TABLE; Schema: feeder_akumulasi; Owner: bendo01
--

CREATE TABLE feeder_akumulasi.estimasi (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    name character varying(255) NOT NULL,
    institution_id uuid NOT NULL,
    total_data_per_request integer DEFAULT 0,
    last_offset integer DEFAULT 0,
    total_data integer DEFAULT 0,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_akumulasi.estimasi OWNER TO bendo01;

--
-- Name: jumlah_data; Type: TABLE; Schema: feeder_akumulasi; Owner: bendo01
--

CREATE TABLE feeder_akumulasi.jumlah_data (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    name character varying(255) NOT NULL,
    total_app integer DEFAULT 0,
    total_feeder integer DEFAULT 0,
    institution_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_akumulasi.jumlah_data OWNER TO bendo01;

--
-- Name: estimasi feeder_akumulasi_estimasi_pkey; Type: CONSTRAINT; Schema: feeder_akumulasi; Owner: bendo01
--

ALTER TABLE ONLY feeder_akumulasi.estimasi
    ADD CONSTRAINT feeder_akumulasi_estimasi_pkey PRIMARY KEY (id);


--
-- Name: jumlah_data feeder_akumulasi_jumlah_data_pkey; Type: CONSTRAINT; Schema: feeder_akumulasi; Owner: bendo01
--

ALTER TABLE ONLY feeder_akumulasi.jumlah_data
    ADD CONSTRAINT feeder_akumulasi_jumlah_data_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict bAipxiWIZW8NEVlE0DmpymvozWIG8vVYIZ1h7igTrJE39zCi4awRx2A9HqqC1l4

