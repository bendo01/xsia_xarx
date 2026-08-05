--
-- PostgreSQL database dump
--

\restrict gzIeY7eZuZ7jVdycr4lwndXTyousWlfvDJWeCmGt39FO0sCrUQWFtjkmjufsNTy

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
-- Name: institution_reference; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA institution_reference;


ALTER SCHEMA institution_reference OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: institution_reference; Owner: bendo01
--

CREATE TABLE institution_reference.categories (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) with time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    sync_at timestamp without time zone
);


ALTER TABLE institution_reference.categories OWNER TO bendo01;

--
-- Name: position_types; Type: TABLE; Schema: institution_reference; Owner: bendo01
--

CREATE TABLE institution_reference.position_types (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) with time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    sync_at timestamp without time zone
);


ALTER TABLE institution_reference.position_types OWNER TO bendo01;

--
-- Name: unit_types; Type: TABLE; Schema: institution_reference; Owner: bendo01
--

CREATE TABLE institution_reference.unit_types (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) with time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    sync_at timestamp without time zone
);


ALTER TABLE institution_reference.unit_types OWNER TO bendo01;

--
-- Name: varieties; Type: TABLE; Schema: institution_reference; Owner: bendo01
--

CREATE TABLE institution_reference.varieties (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) with time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    sync_at timestamp without time zone
);


ALTER TABLE institution_reference.varieties OWNER TO bendo01;

--
-- Name: categories ir_categories_pkey; Type: CONSTRAINT; Schema: institution_reference; Owner: bendo01
--

ALTER TABLE ONLY institution_reference.categories
    ADD CONSTRAINT ir_categories_pkey PRIMARY KEY (id);


--
-- Name: position_types ir_position_types_pkey; Type: CONSTRAINT; Schema: institution_reference; Owner: bendo01
--

ALTER TABLE ONLY institution_reference.position_types
    ADD CONSTRAINT ir_position_types_pkey PRIMARY KEY (id);


--
-- Name: unit_types ir_unit_types_pkey; Type: CONSTRAINT; Schema: institution_reference; Owner: bendo01
--

ALTER TABLE ONLY institution_reference.unit_types
    ADD CONSTRAINT ir_unit_types_pkey PRIMARY KEY (id);


--
-- Name: varieties ir_varieties_pkey; Type: CONSTRAINT; Schema: institution_reference; Owner: bendo01
--

ALTER TABLE ONLY institution_reference.varieties
    ADD CONSTRAINT ir_varieties_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict gzIeY7eZuZ7jVdycr4lwndXTyousWlfvDJWeCmGt39FO0sCrUQWFtjkmjufsNTy

