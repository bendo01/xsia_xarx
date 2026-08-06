--
-- PostgreSQL database dump
--

\restrict OxqgGYLykVASrFCkLkIJnCvfrrbPCPYGNKJ14MJ79qPpWFSWqzhzr5eLFNW8B8X

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
-- Name: academic_course_reference; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA academic_course_reference;


ALTER SCHEMA academic_course_reference OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: competences; Type: TABLE; Schema: academic_course_reference; Owner: bendo01
--

CREATE TABLE academic_course_reference.competences (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    start_effective_date date,
    end_effective_date date,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_course_reference.competences OWNER TO bendo01;

--
-- Name: course_evaluation_bases; Type: TABLE; Schema: academic_course_reference; Owner: bendo01
--

CREATE TABLE academic_course_reference.course_evaluation_bases (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    evaluation_base character varying(255) NOT NULL,
    component_evaluation character varying(255) NOT NULL,
    start_effective_date date,
    end_effective_date date,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_course_reference.course_evaluation_bases OWNER TO bendo01;

--
-- Name: curriculum_types; Type: TABLE; Schema: academic_course_reference; Owner: bendo01
--

CREATE TABLE academic_course_reference.curriculum_types (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0,
    alphabet_code character varying(255),
    name character varying(255) NOT NULL,
    start_effective_date date,
    end_effective_date date,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_course_reference.curriculum_types OWNER TO bendo01;

--
-- Name: encounter_types; Type: TABLE; Schema: academic_course_reference; Owner: bendo01
--

CREATE TABLE academic_course_reference.encounter_types (
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


ALTER TABLE academic_course_reference.encounter_types OWNER TO bendo01;

--
-- Name: evaluation_types; Type: TABLE; Schema: academic_course_reference; Owner: bendo01
--

CREATE TABLE academic_course_reference.evaluation_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    english_name character varying(255),
    feeder_id uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_course_reference.evaluation_types OWNER TO bendo01;

--
-- Name: groups; Type: TABLE; Schema: academic_course_reference; Owner: bendo01
--

CREATE TABLE academic_course_reference.groups (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0,
    alphabet_code character varying(255),
    name character varying(255) NOT NULL,
    abbreviation character varying(255),
    start_effective_date date,
    end_effective_date date,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_course_reference.groups OWNER TO bendo01;

--
-- Name: semesters; Type: TABLE; Schema: academic_course_reference; Owner: bendo01
--

CREATE TABLE academic_course_reference.semesters (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0,
    alphabet_code character varying(255),
    name character varying(255) NOT NULL,
    is_odd boolean DEFAULT false NOT NULL,
    start_effective_date date,
    end_effective_date date,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_course_reference.semesters OWNER TO bendo01;

--
-- Name: varieties; Type: TABLE; Schema: academic_course_reference; Owner: bendo01
--

CREATE TABLE academic_course_reference.varieties (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0,
    alphabet_code character varying(255),
    name character varying(255) NOT NULL,
    curriculum_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    start_effective_date date,
    end_effective_date date,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_course_reference.varieties OWNER TO bendo01;

--
-- Name: competences acr_competences_pkey; Type: CONSTRAINT; Schema: academic_course_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_course_reference.competences
    ADD CONSTRAINT acr_competences_pkey PRIMARY KEY (id);


--
-- Name: course_evaluation_bases acr_course_evaluation_bases_pkey; Type: CONSTRAINT; Schema: academic_course_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_course_reference.course_evaluation_bases
    ADD CONSTRAINT acr_course_evaluation_bases_pkey PRIMARY KEY (id);


--
-- Name: curriculum_types acr_curriculum_types_pkey; Type: CONSTRAINT; Schema: academic_course_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_course_reference.curriculum_types
    ADD CONSTRAINT acr_curriculum_types_pkey PRIMARY KEY (id);


--
-- Name: encounter_types acr_encounter_types_pkey; Type: CONSTRAINT; Schema: academic_course_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_course_reference.encounter_types
    ADD CONSTRAINT acr_encounter_types_pkey PRIMARY KEY (id);


--
-- Name: evaluation_types acr_evaluation_types_pkey; Type: CONSTRAINT; Schema: academic_course_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_course_reference.evaluation_types
    ADD CONSTRAINT acr_evaluation_types_pkey PRIMARY KEY (id);


--
-- Name: groups acr_groups_pkey; Type: CONSTRAINT; Schema: academic_course_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_course_reference.groups
    ADD CONSTRAINT acr_groups_pkey PRIMARY KEY (id);


--
-- Name: semesters acr_semesters_pkey; Type: CONSTRAINT; Schema: academic_course_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_course_reference.semesters
    ADD CONSTRAINT acr_semesters_pkey PRIMARY KEY (id);


--
-- Name: varieties acr_varieties_pkey; Type: CONSTRAINT; Schema: academic_course_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_course_reference.varieties
    ADD CONSTRAINT acr_varieties_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict OxqgGYLykVASrFCkLkIJnCvfrrbPCPYGNKJ14MJ79qPpWFSWqzhzr5eLFNW8B8X

