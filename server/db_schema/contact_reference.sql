--
-- PostgreSQL database dump
--

\restrict Q44jJdzOFjAf4d88v4xnBI271c10IWyeOom1CbI3pcohEByNahaXcVUOx6XAwmS

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
-- Name: contact_reference; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA contact_reference;


ALTER SCHEMA contact_reference OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: electronic_mail_types; Type: TABLE; Schema: contact_reference; Owner: bendo01
--

CREATE TABLE contact_reference.electronic_mail_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE contact_reference.electronic_mail_types OWNER TO bendo01;

--
-- Name: phone_types; Type: TABLE; Schema: contact_reference; Owner: bendo01
--

CREATE TABLE contact_reference.phone_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE contact_reference.phone_types OWNER TO bendo01;

--
-- Name: residence_types; Type: TABLE; Schema: contact_reference; Owner: bendo01
--

CREATE TABLE contact_reference.residence_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE contact_reference.residence_types OWNER TO bendo01;

--
-- Name: website_types; Type: TABLE; Schema: contact_reference; Owner: bendo01
--

CREATE TABLE contact_reference.website_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE contact_reference.website_types OWNER TO bendo01;

--
-- Name: electronic_mail_types cr_electronic_mail_types_pkey; Type: CONSTRAINT; Schema: contact_reference; Owner: bendo01
--

ALTER TABLE ONLY contact_reference.electronic_mail_types
    ADD CONSTRAINT cr_electronic_mail_types_pkey PRIMARY KEY (id);


--
-- Name: phone_types cr_phone_types_pkey; Type: CONSTRAINT; Schema: contact_reference; Owner: bendo01
--

ALTER TABLE ONLY contact_reference.phone_types
    ADD CONSTRAINT cr_phone_types_pkey PRIMARY KEY (id);


--
-- Name: residence_types cr_residence_types_pkey; Type: CONSTRAINT; Schema: contact_reference; Owner: bendo01
--

ALTER TABLE ONLY contact_reference.residence_types
    ADD CONSTRAINT cr_residence_types_pkey PRIMARY KEY (id);


--
-- Name: website_types cr_website_types_pkey; Type: CONSTRAINT; Schema: contact_reference; Owner: bendo01
--

ALTER TABLE ONLY contact_reference.website_types
    ADD CONSTRAINT cr_website_types_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict Q44jJdzOFjAf4d88v4xnBI271c10IWyeOom1CbI3pcohEByNahaXcVUOx6XAwmS

