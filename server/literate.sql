--
-- PostgreSQL database dump
--

\restrict MCOXJsAXUjnqOT0UFO0hizZFKGNvix9YT4dczARfevsr1c6VgAR9V2xH4WlwWcM

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
-- Name: literate; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA literate;


ALTER SCHEMA literate OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: literate; Owner: bendo01
--

CREATE TABLE literate.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE literate.categories OWNER TO bendo01;

--
-- Name: educations; Type: TABLE; Schema: literate; Owner: bendo01
--

CREATE TABLE literate.educations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    abbreviation character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    level_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    group_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    category_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    variety_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE literate.educations OWNER TO bendo01;

--
-- Name: groups; Type: TABLE; Schema: literate; Owner: bendo01
--

CREATE TABLE literate.groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE literate.groups OWNER TO bendo01;

--
-- Name: levels; Type: TABLE; Schema: literate; Owner: bendo01
--

CREATE TABLE literate.levels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE literate.levels OWNER TO bendo01;

--
-- Name: varieties; Type: TABLE; Schema: literate; Owner: bendo01
--

CREATE TABLE literate.varieties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE literate.varieties OWNER TO bendo01;

--
-- Name: categories literate_categories_pkey; Type: CONSTRAINT; Schema: literate; Owner: bendo01
--

ALTER TABLE ONLY literate.categories
    ADD CONSTRAINT literate_categories_pkey PRIMARY KEY (id);


--
-- Name: educations literate_educations_pkey; Type: CONSTRAINT; Schema: literate; Owner: bendo01
--

ALTER TABLE ONLY literate.educations
    ADD CONSTRAINT literate_educations_pkey PRIMARY KEY (id);


--
-- Name: groups literate_groups_pkey; Type: CONSTRAINT; Schema: literate; Owner: bendo01
--

ALTER TABLE ONLY literate.groups
    ADD CONSTRAINT literate_groups_pkey PRIMARY KEY (id);


--
-- Name: levels literate_levels_pkey; Type: CONSTRAINT; Schema: literate; Owner: bendo01
--

ALTER TABLE ONLY literate.levels
    ADD CONSTRAINT literate_levels_pkey PRIMARY KEY (id);


--
-- Name: varieties literate_varieties_pkey; Type: CONSTRAINT; Schema: literate; Owner: bendo01
--

ALTER TABLE ONLY literate.varieties
    ADD CONSTRAINT literate_varieties_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict MCOXJsAXUjnqOT0UFO0hizZFKGNvix9YT4dczARfevsr1c6VgAR9V2xH4WlwWcM

