--
-- PostgreSQL database dump
--

\restrict ebuNyJSiC4MQVhM25fNqeerprNxvLK3BZf3LaBuiXrUjweKPRQNvnJF7ZUXhahX

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
-- Name: academic_survey_master; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA academic_survey_master;


ALTER SCHEMA academic_survey_master OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: answers; Type: TABLE; Schema: academic_survey_master; Owner: bendo01
--

CREATE TABLE academic_survey_master.answers (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255),
    name character varying(255) NOT NULL,
    question_id uuid NOT NULL,
    point double precision DEFAULT '0'::double precision NOT NULL,
    suggestion text,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) with time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_survey_master.answers OWNER TO bendo01;

--
-- Name: bundle_question; Type: TABLE; Schema: academic_survey_master; Owner: bendo01
--

CREATE TABLE academic_survey_master.bundle_question (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    bundle_id uuid NOT NULL,
    question_id uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) with time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_survey_master.bundle_question OWNER TO bendo01;

--
-- Name: bundles; Type: TABLE; Schema: academic_survey_master; Owner: bendo01
--

CREATE TABLE academic_survey_master.bundles (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    institution_id uuid NOT NULL,
    bundle_category_id uuid NOT NULL,
    unit_id uuid,
    suggestion text,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) with time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_survey_master.bundles OWNER TO bendo01;

--
-- Name: questions; Type: TABLE; Schema: academic_survey_master; Owner: bendo01
--

CREATE TABLE academic_survey_master.questions (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255),
    name text NOT NULL,
    institution_id uuid NOT NULL,
    question_variety_id uuid,
    suggestion text,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) with time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_survey_master.questions OWNER TO bendo01;

--
-- Name: answers asvm_answers_pkey; Type: CONSTRAINT; Schema: academic_survey_master; Owner: bendo01
--

ALTER TABLE ONLY academic_survey_master.answers
    ADD CONSTRAINT asvm_answers_pkey PRIMARY KEY (id);


--
-- Name: bundle_question asvm_bundle_question_pkey; Type: CONSTRAINT; Schema: academic_survey_master; Owner: bendo01
--

ALTER TABLE ONLY academic_survey_master.bundle_question
    ADD CONSTRAINT asvm_bundle_question_pkey PRIMARY KEY (id);


--
-- Name: bundles asvm_bundles_pkey; Type: CONSTRAINT; Schema: academic_survey_master; Owner: bendo01
--

ALTER TABLE ONLY academic_survey_master.bundles
    ADD CONSTRAINT asvm_bundles_pkey PRIMARY KEY (id);


--
-- Name: questions asvm_questions_pkey; Type: CONSTRAINT; Schema: academic_survey_master; Owner: bendo01
--

ALTER TABLE ONLY academic_survey_master.questions
    ADD CONSTRAINT asvm_questions_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict ebuNyJSiC4MQVhM25fNqeerprNxvLK3BZf3LaBuiXrUjweKPRQNvnJF7ZUXhahX

