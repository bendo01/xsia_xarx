--
-- PostgreSQL database dump
--

\restrict 7LewlUXxkSiZb470Ih94TGlhQciIa1TBN0d7pwVwL3xx7RW6kZk0JdmDD8ky2JD

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
-- Name: document_transaction; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA document_transaction;


ALTER SCHEMA document_transaction OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: archives; Type: TABLE; Schema: document_transaction; Owner: bendo01
--

CREATE TABLE document_transaction.archives (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    name character varying(255) NOT NULL,
    dir character varying(255) NOT NULL,
    mimetype character varying(255) NOT NULL,
    size integer DEFAULT 0,
    archiveable_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    archiveable_type character varying(255),
    archive_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) with time zone,
    sync_at timestamp without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    description text,
    is_knowledge boolean DEFAULT false NOT NULL
);


ALTER TABLE document_transaction.archives OWNER TO bendo01;

--
-- Name: archives document_transaction_archives_pkey; Type: CONSTRAINT; Schema: document_transaction; Owner: bendo01
--

ALTER TABLE ONLY document_transaction.archives
    ADD CONSTRAINT document_transaction_archives_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict 7LewlUXxkSiZb470Ih94TGlhQciIa1TBN0d7pwVwL3xx7RW6kZk0JdmDD8ky2JD

