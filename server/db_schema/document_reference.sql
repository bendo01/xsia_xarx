--
-- PostgreSQL database dump
--

\restrict Gx67glsyOPBhoolHGCljAqQfhlEqkHpPO773hCaKCsD7Ugpo3p99jcLKhr6ob4z

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
-- Name: document_reference; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA document_reference;


ALTER SCHEMA document_reference OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: archive_types; Type: TABLE; Schema: document_reference; Owner: bendo01
--

CREATE TABLE document_reference.archive_types (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) with time zone,
    sync_at timestamp without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE document_reference.archive_types OWNER TO bendo01;

--
-- Name: archive_types document_reference_archive_types_pkey; Type: CONSTRAINT; Schema: document_reference; Owner: bendo01
--

ALTER TABLE ONLY document_reference.archive_types
    ADD CONSTRAINT document_reference_archive_types_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict Gx67glsyOPBhoolHGCljAqQfhlEqkHpPO773hCaKCsD7Ugpo3p99jcLKhr6ob4z

