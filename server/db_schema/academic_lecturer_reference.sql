--
-- PostgreSQL database dump
--

\restrict DLUT1qlZdX954Djdbf7rzOYsAobjW0xhrxQxMN9tdaNiIEXZpKHWSPr8GpVcpy0

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
-- Name: academic_lecturer_reference; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA academic_lecturer_reference;


ALTER SCHEMA academic_lecturer_reference OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: contracts; Type: TABLE; Schema: academic_lecturer_reference; Owner: bendo01
--

CREATE TABLE academic_lecturer_reference.contracts (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255),
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_lecturer_reference.contracts OWNER TO bendo01;

--
-- Name: groups; Type: TABLE; Schema: academic_lecturer_reference; Owner: bendo01
--

CREATE TABLE academic_lecturer_reference.groups (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255),
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_lecturer_reference.groups OWNER TO bendo01;

--
-- Name: ranks; Type: TABLE; Schema: academic_lecturer_reference; Owner: bendo01
--

CREATE TABLE academic_lecturer_reference.ranks (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255),
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_lecturer_reference.ranks OWNER TO bendo01;

--
-- Name: statuses; Type: TABLE; Schema: academic_lecturer_reference; Owner: bendo01
--

CREATE TABLE academic_lecturer_reference.statuses (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255),
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_lecturer_reference.statuses OWNER TO bendo01;

--
-- Name: contracts alr_contracts_pkey; Type: CONSTRAINT; Schema: academic_lecturer_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_lecturer_reference.contracts
    ADD CONSTRAINT alr_contracts_pkey PRIMARY KEY (id);


--
-- Name: groups alr_groups_pkey; Type: CONSTRAINT; Schema: academic_lecturer_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_lecturer_reference.groups
    ADD CONSTRAINT alr_groups_pkey PRIMARY KEY (id);


--
-- Name: ranks alr_ranks_pkey; Type: CONSTRAINT; Schema: academic_lecturer_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_lecturer_reference.ranks
    ADD CONSTRAINT alr_ranks_pkey PRIMARY KEY (id);


--
-- Name: statuses alr_statuses_pkey; Type: CONSTRAINT; Schema: academic_lecturer_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_lecturer_reference.statuses
    ADD CONSTRAINT alr_statuses_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict DLUT1qlZdX954Djdbf7rzOYsAobjW0xhrxQxMN9tdaNiIEXZpKHWSPr8GpVcpy0

