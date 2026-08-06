--
-- PostgreSQL database dump
--

\restrict xHLt5Lbmu8aVhCcgHaYpbW7pEX3oGxuazFmgrUnxsqGAzKR7MLdL3vrcmfrqC6k

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
-- Name: academic_survey_reference; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA academic_survey_reference;


ALTER SCHEMA academic_survey_reference OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bundle_categories; Type: TABLE; Schema: academic_survey_reference; Owner: bendo01
--

CREATE TABLE academic_survey_reference.bundle_categories (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) with time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_survey_reference.bundle_categories OWNER TO bendo01;

--
-- Name: question_varieties; Type: TABLE; Schema: academic_survey_reference; Owner: bendo01
--

CREATE TABLE academic_survey_reference.question_varieties (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) with time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_survey_reference.question_varieties OWNER TO bendo01;

--
-- Name: bundle_categories asvr_bundle_categories_pkey; Type: CONSTRAINT; Schema: academic_survey_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_survey_reference.bundle_categories
    ADD CONSTRAINT asvr_bundle_categories_pkey PRIMARY KEY (id);


--
-- Name: question_varieties asvr_question_varieties_pkey; Type: CONSTRAINT; Schema: academic_survey_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_survey_reference.question_varieties
    ADD CONSTRAINT asvr_question_varieties_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict xHLt5Lbmu8aVhCcgHaYpbW7pEX3oGxuazFmgrUnxsqGAzKR7MLdL3vrcmfrqC6k

