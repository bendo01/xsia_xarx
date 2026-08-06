--
-- PostgreSQL database dump
--

\restrict rNcuqtXAxO1BqeKLa4q10xZNy7hPKqwcyI829hzdWIXvIj6oqUUf69Nc8g5aYHS

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
-- Name: academic_lecturer_transaction; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA academic_lecturer_transaction;


ALTER SCHEMA academic_lecturer_transaction OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: academic_groups; Type: TABLE; Schema: academic_lecturer_transaction; Owner: bendo01
--

CREATE TABLE academic_lecturer_transaction.academic_groups (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    decree_number character varying(255),
    decree_date date,
    lecturer_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    group_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    start_date date,
    end_date date
);


ALTER TABLE academic_lecturer_transaction.academic_groups OWNER TO bendo01;

--
-- Name: academic_ranks; Type: TABLE; Schema: academic_lecturer_transaction; Owner: bendo01
--

CREATE TABLE academic_lecturer_transaction.academic_ranks (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    decree_number character varying(255),
    decree_date date,
    lecturer_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    rank_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    start_date date,
    end_date date
);


ALTER TABLE academic_lecturer_transaction.academic_ranks OWNER TO bendo01;

--
-- Name: homebases; Type: TABLE; Schema: academic_lecturer_transaction; Owner: bendo01
--

CREATE TABLE academic_lecturer_transaction.homebases (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    lecturer_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    unit_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    institution_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    status_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    contract_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_lecturer_transaction.homebases OWNER TO bendo01;

--
-- Name: academic_groups alt_academic_groups_pkey; Type: CONSTRAINT; Schema: academic_lecturer_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_lecturer_transaction.academic_groups
    ADD CONSTRAINT alt_academic_groups_pkey PRIMARY KEY (id);


--
-- Name: academic_ranks alt_academic_ranks_pkey; Type: CONSTRAINT; Schema: academic_lecturer_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_lecturer_transaction.academic_ranks
    ADD CONSTRAINT alt_academic_ranks_pkey PRIMARY KEY (id);


--
-- Name: homebases alt_homebases_pkey; Type: CONSTRAINT; Schema: academic_lecturer_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_lecturer_transaction.homebases
    ADD CONSTRAINT alt_homebases_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict rNcuqtXAxO1BqeKLa4q10xZNy7hPKqwcyI829hzdWIXvIj6oqUUf69Nc8g5aYHS

