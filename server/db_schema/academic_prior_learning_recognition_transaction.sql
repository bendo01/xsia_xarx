--
-- PostgreSQL database dump
--

\restrict zXE5ppTe7egd8ug3hJnQTZvVRDcaiymmuWxGmBhcPfTTrF05ERyXyeIYdW8DZoU

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
-- Name: academic_prior_learning_recognition_transaction; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA academic_prior_learning_recognition_transaction;


ALTER SCHEMA academic_prior_learning_recognition_transaction OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: decrees; Type: TABLE; Schema: academic_prior_learning_recognition_transaction; Owner: bendo01
--

CREATE TABLE academic_prior_learning_recognition_transaction.decrees (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    decree_number character varying(255) NOT NULL,
    decree_date date NOT NULL,
    evaluation_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) with time zone,
    sync_at timestamp without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_prior_learning_recognition_transaction.decrees OWNER TO bendo01;

--
-- Name: evaluation_details; Type: TABLE; Schema: academic_prior_learning_recognition_transaction; Owner: bendo01
--

CREATE TABLE academic_prior_learning_recognition_transaction.evaluation_details (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    evaluation_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    archive_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    evidence_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) with time zone,
    sync_at timestamp without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_prior_learning_recognition_transaction.evaluation_details OWNER TO bendo01;

--
-- Name: evaluations; Type: TABLE; Schema: academic_prior_learning_recognition_transaction; Owner: bendo01
--

CREATE TABLE academic_prior_learning_recognition_transaction.evaluations (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    recognition_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    course_evaluation_planning_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    professionalism_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    evidence_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    evaluator_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) with time zone,
    sync_at timestamp without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_prior_learning_recognition_transaction.evaluations OWNER TO bendo01;

--
-- Name: evaluators; Type: TABLE; Schema: academic_prior_learning_recognition_transaction; Owner: bendo01
--

CREATE TABLE academic_prior_learning_recognition_transaction.evaluators (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    individual_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    evaluator_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    recognition_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) with time zone,
    sync_at timestamp without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_prior_learning_recognition_transaction.evaluators OWNER TO bendo01;

--
-- Name: recognitions; Type: TABLE; Schema: academic_prior_learning_recognition_transaction; Owner: bendo01
--

CREATE TABLE academic_prior_learning_recognition_transaction.recognitions (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    name character varying(255) NOT NULL,
    candidate_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) with time zone,
    sync_at timestamp without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    curriculum_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    unit_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL
);


ALTER TABLE academic_prior_learning_recognition_transaction.recognitions OWNER TO bendo01;

--
-- Name: decrees academic_prior_learning_recognition_transaction_decrees_pkey; Type: CONSTRAINT; Schema: academic_prior_learning_recognition_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_prior_learning_recognition_transaction.decrees
    ADD CONSTRAINT academic_prior_learning_recognition_transaction_decrees_pkey PRIMARY KEY (id);


--
-- Name: evaluation_details academic_prior_learning_recognition_transaction_evaluation_deta; Type: CONSTRAINT; Schema: academic_prior_learning_recognition_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_prior_learning_recognition_transaction.evaluation_details
    ADD CONSTRAINT academic_prior_learning_recognition_transaction_evaluation_deta PRIMARY KEY (id);


--
-- Name: evaluations academic_prior_learning_recognition_transaction_evaluations_pke; Type: CONSTRAINT; Schema: academic_prior_learning_recognition_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_prior_learning_recognition_transaction.evaluations
    ADD CONSTRAINT academic_prior_learning_recognition_transaction_evaluations_pke PRIMARY KEY (id);


--
-- Name: evaluators academic_prior_learning_recognition_transaction_evaluators_pkey; Type: CONSTRAINT; Schema: academic_prior_learning_recognition_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_prior_learning_recognition_transaction.evaluators
    ADD CONSTRAINT academic_prior_learning_recognition_transaction_evaluators_pkey PRIMARY KEY (id);


--
-- Name: recognitions academic_prior_learning_recognition_transaction_recognitions_pk; Type: CONSTRAINT; Schema: academic_prior_learning_recognition_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_prior_learning_recognition_transaction.recognitions
    ADD CONSTRAINT academic_prior_learning_recognition_transaction_recognitions_pk PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict zXE5ppTe7egd8ug3hJnQTZvVRDcaiymmuWxGmBhcPfTTrF05ERyXyeIYdW8DZoU

