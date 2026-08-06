--
-- PostgreSQL database dump
--

\restrict 58KWCfqpYpclu0ZFYRevD5EBpdWMdRlnrU6TcoPvbspJpNX2so37bLuCgsQEJ6v

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
-- Name: academic_survey_transaction; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA academic_survey_transaction;


ALTER SCHEMA academic_survey_transaction OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: conducts; Type: TABLE; Schema: academic_survey_transaction; Owner: bendo01
--

CREATE TABLE academic_survey_transaction.conducts (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    alphabet_code character varying(255),
    name text NOT NULL,
    bundle_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    conductable_type character varying(255) NOT NULL,
    conductable_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    is_finish boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) with time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_survey_transaction.conducts OWNER TO bendo01;

--
-- Name: responds; Type: TABLE; Schema: academic_survey_transaction; Owner: bendo01
--

CREATE TABLE academic_survey_transaction.responds (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    name text,
    conduct_id uuid NOT NULL,
    bundle_id uuid NOT NULL,
    question_id uuid NOT NULL,
    answer_id uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) with time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_survey_transaction.responds OWNER TO bendo01;

--
-- Name: conducts asvt_conducts_pkey; Type: CONSTRAINT; Schema: academic_survey_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_survey_transaction.conducts
    ADD CONSTRAINT asvt_conducts_pkey PRIMARY KEY (id);


--
-- Name: responds asvt_responds_pkey; Type: CONSTRAINT; Schema: academic_survey_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_survey_transaction.responds
    ADD CONSTRAINT asvt_responds_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict 58KWCfqpYpclu0ZFYRevD5EBpdWMdRlnrU6TcoPvbspJpNX2so37bLuCgsQEJ6v

