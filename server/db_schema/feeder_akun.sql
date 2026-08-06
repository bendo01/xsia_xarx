--
-- PostgreSQL database dump
--

\restrict bph0Xjh9OC5oklsCgi47KPtcYLVfaqM2ajKjycDykFCqqu1Wn350hEjRxEKXzoH

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
-- Name: feeder_akun; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA feeder_akun;


ALTER SCHEMA feeder_akun OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: kredential; Type: TABLE; Schema: feeder_akun; Owner: bendo01
--

CREATE TABLE feeder_akun.kredential (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    username character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    institution_id uuid NOT NULL,
    service_url text NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE feeder_akun.kredential OWNER TO bendo01;

--
-- Name: kredential feeder_akun_kredential_pkey; Type: CONSTRAINT; Schema: feeder_akun; Owner: bendo01
--

ALTER TABLE ONLY feeder_akun.kredential
    ADD CONSTRAINT feeder_akun_kredential_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict bph0Xjh9OC5oklsCgi47KPtcYLVfaqM2ajKjycDykFCqqu1Wn350hEjRxEKXzoH

