--
-- PostgreSQL database dump
--

\restrict 0aLhbgFnjB6ocGsIgRzq0XfrX9z4NO3qgVGhks9nmDxJdPS2CeSNAjXe5whkaQO

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
-- Name: academic_student_final_assignment_reference; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA academic_student_final_assignment_reference;


ALTER SCHEMA academic_student_final_assignment_reference OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: adviser_categories; Type: TABLE; Schema: academic_student_final_assignment_reference; Owner: bendo01
--

CREATE TABLE academic_student_final_assignment_reference.adviser_categories (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_student_final_assignment_reference.adviser_categories OWNER TO bendo01;

--
-- Name: approval_types; Type: TABLE; Schema: academic_student_final_assignment_reference; Owner: bendo01
--

CREATE TABLE academic_student_final_assignment_reference.approval_types (
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


ALTER TABLE academic_student_final_assignment_reference.approval_types OWNER TO bendo01;

--
-- Name: categories; Type: TABLE; Schema: academic_student_final_assignment_reference; Owner: bendo01
--

CREATE TABLE academic_student_final_assignment_reference.categories (
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


ALTER TABLE academic_student_final_assignment_reference.categories OWNER TO bendo01;

--
-- Name: requirements; Type: TABLE; Schema: academic_student_final_assignment_reference; Owner: bendo01
--

CREATE TABLE academic_student_final_assignment_reference.requirements (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    stage_id uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_student_final_assignment_reference.requirements OWNER TO bendo01;

--
-- Name: stages; Type: TABLE; Schema: academic_student_final_assignment_reference; Owner: bendo01
--

CREATE TABLE academic_student_final_assignment_reference.stages (
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


ALTER TABLE academic_student_final_assignment_reference.stages OWNER TO bendo01;

--
-- Name: varieties; Type: TABLE; Schema: academic_student_final_assignment_reference; Owner: bendo01
--

CREATE TABLE academic_student_final_assignment_reference.varieties (
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


ALTER TABLE academic_student_final_assignment_reference.varieties OWNER TO bendo01;

--
-- Name: adviser_categories academic_student_final_assignment_reference_adviser_categories_; Type: CONSTRAINT; Schema: academic_student_final_assignment_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_student_final_assignment_reference.adviser_categories
    ADD CONSTRAINT academic_student_final_assignment_reference_adviser_categories_ PRIMARY KEY (id);


--
-- Name: approval_types academic_student_final_assignment_reference_approval_types_pkey; Type: CONSTRAINT; Schema: academic_student_final_assignment_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_student_final_assignment_reference.approval_types
    ADD CONSTRAINT academic_student_final_assignment_reference_approval_types_pkey PRIMARY KEY (id);


--
-- Name: categories academic_student_final_assignment_reference_categories_pkey; Type: CONSTRAINT; Schema: academic_student_final_assignment_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_student_final_assignment_reference.categories
    ADD CONSTRAINT academic_student_final_assignment_reference_categories_pkey PRIMARY KEY (id);


--
-- Name: requirements academic_student_final_assignment_reference_requirements_pkey; Type: CONSTRAINT; Schema: academic_student_final_assignment_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_student_final_assignment_reference.requirements
    ADD CONSTRAINT academic_student_final_assignment_reference_requirements_pkey PRIMARY KEY (id);


--
-- Name: stages academic_student_final_assignment_reference_stages_pkey; Type: CONSTRAINT; Schema: academic_student_final_assignment_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_student_final_assignment_reference.stages
    ADD CONSTRAINT academic_student_final_assignment_reference_stages_pkey PRIMARY KEY (id);


--
-- Name: varieties academic_student_final_assignment_reference_varieties_pkey; Type: CONSTRAINT; Schema: academic_student_final_assignment_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_student_final_assignment_reference.varieties
    ADD CONSTRAINT academic_student_final_assignment_reference_varieties_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict 0aLhbgFnjB6ocGsIgRzq0XfrX9z4NO3qgVGhks9nmDxJdPS2CeSNAjXe5whkaQO

