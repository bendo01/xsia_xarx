--
-- PostgreSQL database dump
--

\restrict lI27E2FC2yGAHrAalvJcc0aZLjGaWbMELxD4f2S6JTBKijsO0rZwdIlmSK0PirV

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
-- Name: institution_master; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA institution_master;


ALTER SCHEMA institution_master OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: employees; Type: TABLE; Schema: institution_master; Owner: bendo01
--

CREATE TABLE institution_master.employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    institution_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    individual_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    decree_number character varying(255),
    decree_date date,
    is_active boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE institution_master.employees OWNER TO bendo01;

--
-- Name: institutions; Type: TABLE; Schema: institution_master; Owner: bendo01
--

CREATE TABLE institution_master.institutions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(255),
    name character varying(255),
    alphabet_code character varying(255),
    is_active boolean DEFAULT false NOT NULL,
    variety_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    category_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    country_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    parent_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    feeder_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    academic_year_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE institution_master.institutions OWNER TO bendo01;

--
-- Name: staffes; Type: TABLE; Schema: institution_master; Owner: bendo01
--

CREATE TABLE institution_master.staffes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(255),
    name character varying(255),
    decree_number character varying(255),
    decree_date date,
    start_date date,
    end_date date,
    employee_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    unit_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    position_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE institution_master.staffes OWNER TO bendo01;

--
-- Name: units; Type: TABLE; Schema: institution_master; Owner: bendo01
--

CREATE TABLE institution_master.units (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(255),
    name character varying(255),
    is_active boolean DEFAULT false NOT NULL,
    unit_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    institution_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    parent_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    education_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    feeder_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    lft bigint DEFAULT 0,
    rght bigint DEFAULT 0,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE institution_master.units OWNER TO bendo01;

--
-- Name: employees im_employees_pkey; Type: CONSTRAINT; Schema: institution_master; Owner: bendo01
--

ALTER TABLE ONLY institution_master.employees
    ADD CONSTRAINT im_employees_pkey PRIMARY KEY (id);


--
-- Name: institutions im_institutions_pkey; Type: CONSTRAINT; Schema: institution_master; Owner: bendo01
--

ALTER TABLE ONLY institution_master.institutions
    ADD CONSTRAINT im_institutions_pkey PRIMARY KEY (id);


--
-- Name: staffes im_staffes_pkey; Type: CONSTRAINT; Schema: institution_master; Owner: bendo01
--

ALTER TABLE ONLY institution_master.staffes
    ADD CONSTRAINT im_staffes_pkey PRIMARY KEY (id);


--
-- Name: units im_units_pkey; Type: CONSTRAINT; Schema: institution_master; Owner: bendo01
--

ALTER TABLE ONLY institution_master.units
    ADD CONSTRAINT im_units_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict lI27E2FC2yGAHrAalvJcc0aZLjGaWbMELxD4f2S6JTBKijsO0rZwdIlmSK0PirV

