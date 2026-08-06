--
-- PostgreSQL database dump
--

\restrict QObImmn1xbgcoEtomCvQfwRwTmLzZN52IKot11ibjNmFrADbv5DjeTqenmuQU3J

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
-- Name: academic_candidate_transaction; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA academic_candidate_transaction;


ALTER SCHEMA academic_candidate_transaction OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: candidate_unit_choices; Type: TABLE; Schema: academic_candidate_transaction; Owner: bendo01
--

CREATE TABLE academic_candidate_transaction.candidate_unit_choices (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    candidate_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    unit_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    student_registration_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    registration_category_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    phase_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    priority integer DEFAULT 0 NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_candidate_transaction.candidate_unit_choices OWNER TO bendo01;

--
-- Name: documents; Type: TABLE; Schema: academic_candidate_transaction; Owner: bendo01
--

CREATE TABLE academic_candidate_transaction.documents (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    candidate_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    document_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    filename character varying(255),
    dir character varying(255),
    type character varying(255),
    size integer,
    is_verified boolean DEFAULT false,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_candidate_transaction.documents OWNER TO bendo01;

--
-- Name: exams; Type: TABLE; Schema: academic_candidate_transaction; Owner: bendo01
--

CREATE TABLE academic_candidate_transaction.exams (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    candidate_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    exam_class_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    score double precision DEFAULT 0 NOT NULL,
    is_present boolean DEFAULT false,
    is_pass boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_candidate_transaction.exams OWNER TO bendo01;

--
-- Name: candidate_unit_choices act_candidate_unit_choices_pkey; Type: CONSTRAINT; Schema: academic_candidate_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_candidate_transaction.candidate_unit_choices
    ADD CONSTRAINT act_candidate_unit_choices_pkey PRIMARY KEY (id);


--
-- Name: documents act_documents_pkey; Type: CONSTRAINT; Schema: academic_candidate_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_candidate_transaction.documents
    ADD CONSTRAINT act_documents_pkey PRIMARY KEY (id);


--
-- Name: exams act_exams_pkey; Type: CONSTRAINT; Schema: academic_candidate_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_candidate_transaction.exams
    ADD CONSTRAINT act_exams_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict QObImmn1xbgcoEtomCvQfwRwTmLzZN52IKot11ibjNmFrADbv5DjeTqenmuQU3J

