--
-- PostgreSQL database dump
--

\restrict EtBjhdVgEJwOWecxG9RF1IZNKnjzefhVhrtW2nqd7frPnNP4VaiFTUu7xkOp4Oq

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
-- Name: academic_general_reference; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA academic_general_reference;


ALTER SCHEMA academic_general_reference OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: academic_year_categories; Type: TABLE; Schema: academic_general_reference; Owner: bendo01
--

CREATE TABLE academic_general_reference.academic_year_categories (
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


ALTER TABLE academic_general_reference.academic_year_categories OWNER TO bendo01;

--
-- Name: academic_years; Type: TABLE; Schema: academic_general_reference; Owner: bendo01
--

CREATE TABLE academic_general_reference.academic_years (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    year integer NOT NULL,
    name character varying(255) NOT NULL,
    feeder_name character varying(255) NOT NULL,
    academic_year_category_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    is_active boolean DEFAULT true,
    start_date date,
    end_date date
);


ALTER TABLE academic_general_reference.academic_years OWNER TO bendo01;

--
-- Name: academic_year_categories agr_academic_year_categories_pkey; Type: CONSTRAINT; Schema: academic_general_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_general_reference.academic_year_categories
    ADD CONSTRAINT agr_academic_year_categories_pkey PRIMARY KEY (id);


--
-- Name: academic_years agr_academic_years_pkey; Type: CONSTRAINT; Schema: academic_general_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_general_reference.academic_years
    ADD CONSTRAINT agr_academic_years_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict EtBjhdVgEJwOWecxG9RF1IZNKnjzefhVhrtW2nqd7frPnNP4VaiFTUu7xkOp4Oq

