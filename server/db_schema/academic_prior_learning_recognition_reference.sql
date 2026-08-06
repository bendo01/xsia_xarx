--
-- PostgreSQL database dump
--

\restrict rCrd5eRhiWBTwaoH1joZdES5NFz8AA1Mfh4YlYwljnYszzE4Yd5BKuaVzNSSFLK

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
-- Name: academic_prior_learning_recognition_reference; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA academic_prior_learning_recognition_reference;


ALTER SCHEMA academic_prior_learning_recognition_reference OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: evaluator_types; Type: TABLE; Schema: academic_prior_learning_recognition_reference; Owner: bendo01
--

CREATE TABLE academic_prior_learning_recognition_reference.evaluator_types (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) with time zone,
    sync_at timestamp without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_prior_learning_recognition_reference.evaluator_types OWNER TO bendo01;

--
-- Name: evidence_categories; Type: TABLE; Schema: academic_prior_learning_recognition_reference; Owner: bendo01
--

CREATE TABLE academic_prior_learning_recognition_reference.evidence_categories (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) with time zone,
    sync_at timestamp without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_prior_learning_recognition_reference.evidence_categories OWNER TO bendo01;

--
-- Name: evidence_types; Type: TABLE; Schema: academic_prior_learning_recognition_reference; Owner: bendo01
--

CREATE TABLE academic_prior_learning_recognition_reference.evidence_types (
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


ALTER TABLE academic_prior_learning_recognition_reference.evidence_types OWNER TO bendo01;

--
-- Name: professionalisms; Type: TABLE; Schema: academic_prior_learning_recognition_reference; Owner: bendo01
--

CREATE TABLE academic_prior_learning_recognition_reference.professionalisms (
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


ALTER TABLE academic_prior_learning_recognition_reference.professionalisms OWNER TO bendo01;

--
-- Name: evaluator_types academic_prior_learning_recognition_reference_evaluator_types_p; Type: CONSTRAINT; Schema: academic_prior_learning_recognition_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_prior_learning_recognition_reference.evaluator_types
    ADD CONSTRAINT academic_prior_learning_recognition_reference_evaluator_types_p PRIMARY KEY (id);


--
-- Name: evidence_categories academic_prior_learning_recognition_reference_evidence_categori; Type: CONSTRAINT; Schema: academic_prior_learning_recognition_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_prior_learning_recognition_reference.evidence_categories
    ADD CONSTRAINT academic_prior_learning_recognition_reference_evidence_categori PRIMARY KEY (id);


--
-- Name: evidence_types academic_prior_learning_recognition_reference_evidence_types_pk; Type: CONSTRAINT; Schema: academic_prior_learning_recognition_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_prior_learning_recognition_reference.evidence_types
    ADD CONSTRAINT academic_prior_learning_recognition_reference_evidence_types_pk PRIMARY KEY (id);


--
-- Name: professionalisms academic_prior_learning_recognition_reference_professionalisms_; Type: CONSTRAINT; Schema: academic_prior_learning_recognition_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_prior_learning_recognition_reference.professionalisms
    ADD CONSTRAINT academic_prior_learning_recognition_reference_professionalisms_ PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict rCrd5eRhiWBTwaoH1joZdES5NFz8AA1Mfh4YlYwljnYszzE4Yd5BKuaVzNSSFLK

