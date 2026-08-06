--
-- PostgreSQL database dump
--

\restrict tCDTUlUxJxQee7hPCC4FyVUgk1WTvKeUk6r6HabXloCNgXKyoaz5PRU35ByvLzn

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
-- Name: academic_campaign_reference; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA academic_campaign_reference;


ALTER SCHEMA academic_campaign_reference OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: attend_types; Type: TABLE; Schema: academic_campaign_reference; Owner: bendo01
--

CREATE TABLE academic_campaign_reference.attend_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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


ALTER TABLE academic_campaign_reference.attend_types OWNER TO bendo01;

--
-- Name: calendar_categories; Type: TABLE; Schema: academic_campaign_reference; Owner: bendo01
--

CREATE TABLE academic_campaign_reference.calendar_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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


ALTER TABLE academic_campaign_reference.calendar_categories OWNER TO bendo01;

--
-- Name: encounter_categories; Type: TABLE; Schema: academic_campaign_reference; Owner: bendo01
--

CREATE TABLE academic_campaign_reference.encounter_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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


ALTER TABLE academic_campaign_reference.encounter_categories OWNER TO bendo01;

--
-- Name: implementations; Type: TABLE; Schema: academic_campaign_reference; Owner: bendo01
--

CREATE TABLE academic_campaign_reference.implementations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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


ALTER TABLE academic_campaign_reference.implementations OWNER TO bendo01;

--
-- Name: scopes; Type: TABLE; Schema: academic_campaign_reference; Owner: bendo01
--

CREATE TABLE academic_campaign_reference.scopes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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


ALTER TABLE academic_campaign_reference.scopes OWNER TO bendo01;

--
-- Name: substances; Type: TABLE; Schema: academic_campaign_reference; Owner: bendo01
--

CREATE TABLE academic_campaign_reference.substances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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


ALTER TABLE academic_campaign_reference.substances OWNER TO bendo01;

--
-- Name: attend_types acr_attend_types_pkey; Type: CONSTRAINT; Schema: academic_campaign_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_campaign_reference.attend_types
    ADD CONSTRAINT acr_attend_types_pkey PRIMARY KEY (id);


--
-- Name: calendar_categories acr_calendar_categories_pkey; Type: CONSTRAINT; Schema: academic_campaign_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_campaign_reference.calendar_categories
    ADD CONSTRAINT acr_calendar_categories_pkey PRIMARY KEY (id);


--
-- Name: encounter_categories acr_encounter_categories_pkey; Type: CONSTRAINT; Schema: academic_campaign_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_campaign_reference.encounter_categories
    ADD CONSTRAINT acr_encounter_categories_pkey PRIMARY KEY (id);


--
-- Name: implementations acr_implementations_pkey; Type: CONSTRAINT; Schema: academic_campaign_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_campaign_reference.implementations
    ADD CONSTRAINT acr_implementations_pkey PRIMARY KEY (id);


--
-- Name: scopes aucr_scopes_pkey; Type: CONSTRAINT; Schema: academic_campaign_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_campaign_reference.scopes
    ADD CONSTRAINT aucr_scopes_pkey PRIMARY KEY (id);


--
-- Name: substances aucr_substances_pkey; Type: CONSTRAINT; Schema: academic_campaign_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_campaign_reference.substances
    ADD CONSTRAINT aucr_substances_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict tCDTUlUxJxQee7hPCC4FyVUgk1WTvKeUk6r6HabXloCNgXKyoaz5PRU35ByvLzn

