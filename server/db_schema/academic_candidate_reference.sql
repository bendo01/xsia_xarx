--
-- PostgreSQL database dump
--

\restrict g9NtRUM0Pcxr1EWIvdb2zZ8kka7eRuqnXkF0XEYcAvMwoO11mCTLsFbJwZKEdnw

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
-- Name: academic_candidate_reference; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA academic_candidate_reference;


ALTER SCHEMA academic_candidate_reference OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: document_types; Type: TABLE; Schema: academic_candidate_reference; Owner: bendo01
--

CREATE TABLE academic_candidate_reference.document_types (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
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


ALTER TABLE academic_candidate_reference.document_types OWNER TO bendo01;

--
-- Name: phases; Type: TABLE; Schema: academic_candidate_reference; Owner: bendo01
--

CREATE TABLE academic_candidate_reference.phases (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
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


ALTER TABLE academic_candidate_reference.phases OWNER TO bendo01;

--
-- Name: registration_categories; Type: TABLE; Schema: academic_candidate_reference; Owner: bendo01
--

CREATE TABLE academic_candidate_reference.registration_categories (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0,
    alphabet_code character varying(255),
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp(6) without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_candidate_reference.registration_categories OWNER TO bendo01;

--
-- Name: registration_types; Type: TABLE; Schema: academic_candidate_reference; Owner: bendo01
--

CREATE TABLE academic_candidate_reference.registration_types (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code integer DEFAULT 0,
    alphabet_code character varying(255),
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp(6) without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    student_registration_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    unit_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    registration_category_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    institution_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_candidate_reference.registration_types OWNER TO bendo01;

--
-- Name: document_types acr_document_types_pkey; Type: CONSTRAINT; Schema: academic_candidate_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_candidate_reference.document_types
    ADD CONSTRAINT acr_document_types_pkey PRIMARY KEY (id);


--
-- Name: phases acr_phases_pkey; Type: CONSTRAINT; Schema: academic_candidate_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_candidate_reference.phases
    ADD CONSTRAINT acr_phases_pkey PRIMARY KEY (id);


--
-- Name: registration_categories acr_registration_categories_pkey; Type: CONSTRAINT; Schema: academic_candidate_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_candidate_reference.registration_categories
    ADD CONSTRAINT acr_registration_categories_pkey PRIMARY KEY (id);


--
-- Name: registration_types registration_types_pkey; Type: CONSTRAINT; Schema: academic_candidate_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_candidate_reference.registration_types
    ADD CONSTRAINT registration_types_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict g9NtRUM0Pcxr1EWIvdb2zZ8kka7eRuqnXkF0XEYcAvMwoO11mCTLsFbJwZKEdnw

