--
-- PostgreSQL database dump
--

\restrict w7siCb5lY9tn3ydrsxB7ZtNcgBaVYwNGGEyPe7qMqXx9sdRL8KlNr8GjHqcVht5

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
-- Name: person_reference; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA person_reference;


ALTER SCHEMA person_reference OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: age_classifications; Type: TABLE; Schema: person_reference; Owner: bendo01
--

CREATE TABLE person_reference.age_classifications (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    minimum integer DEFAULT 0 NOT NULL,
    maximum integer DEFAULT 0,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) with time zone,
    sync_at timestamp without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE person_reference.age_classifications OWNER TO bendo01;

--
-- Name: blood_types; Type: TABLE; Schema: person_reference; Owner: bendo01
--

CREATE TABLE person_reference.blood_types (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
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


ALTER TABLE person_reference.blood_types OWNER TO bendo01;

--
-- Name: eye_colors; Type: TABLE; Schema: person_reference; Owner: bendo01
--

CREATE TABLE person_reference.eye_colors (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
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


ALTER TABLE person_reference.eye_colors OWNER TO bendo01;

--
-- Name: genders; Type: TABLE; Schema: person_reference; Owner: bendo01
--

CREATE TABLE person_reference.genders (
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


ALTER TABLE person_reference.genders OWNER TO bendo01;

--
-- Name: hair_colors; Type: TABLE; Schema: person_reference; Owner: bendo01
--

CREATE TABLE person_reference.hair_colors (
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


ALTER TABLE person_reference.hair_colors OWNER TO bendo01;

--
-- Name: hair_types; Type: TABLE; Schema: person_reference; Owner: bendo01
--

CREATE TABLE person_reference.hair_types (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
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


ALTER TABLE person_reference.hair_types OWNER TO bendo01;

--
-- Name: identification_types; Type: TABLE; Schema: person_reference; Owner: bendo01
--

CREATE TABLE person_reference.identification_types (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
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


ALTER TABLE person_reference.identification_types OWNER TO bendo01;

--
-- Name: incomes; Type: TABLE; Schema: person_reference; Owner: bendo01
--

CREATE TABLE person_reference.incomes (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    minimum double precision DEFAULT 0,
    maximum double precision DEFAULT 0,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE person_reference.incomes OWNER TO bendo01;

--
-- Name: marital_statuses; Type: TABLE; Schema: person_reference; Owner: bendo01
--

CREATE TABLE person_reference.marital_statuses (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
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


ALTER TABLE person_reference.marital_statuses OWNER TO bendo01;

--
-- Name: occupations; Type: TABLE; Schema: person_reference; Owner: bendo01
--

CREATE TABLE person_reference.occupations (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
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


ALTER TABLE person_reference.occupations OWNER TO bendo01;

--
-- Name: professions; Type: TABLE; Schema: person_reference; Owner: bendo01
--

CREATE TABLE person_reference.professions (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
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


ALTER TABLE person_reference.professions OWNER TO bendo01;

--
-- Name: relative_types; Type: TABLE; Schema: person_reference; Owner: bendo01
--

CREATE TABLE person_reference.relative_types (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
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


ALTER TABLE person_reference.relative_types OWNER TO bendo01;

--
-- Name: religions; Type: TABLE; Schema: person_reference; Owner: bendo01
--

CREATE TABLE person_reference.religions (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
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


ALTER TABLE person_reference.religions OWNER TO bendo01;

--
-- Name: age_classifications person_reference_age_classifications_pkey; Type: CONSTRAINT; Schema: person_reference; Owner: bendo01
--

ALTER TABLE ONLY person_reference.age_classifications
    ADD CONSTRAINT person_reference_age_classifications_pkey PRIMARY KEY (id);


--
-- Name: blood_types person_reference_blood_types_pkey; Type: CONSTRAINT; Schema: person_reference; Owner: bendo01
--

ALTER TABLE ONLY person_reference.blood_types
    ADD CONSTRAINT person_reference_blood_types_pkey PRIMARY KEY (id);


--
-- Name: eye_colors person_reference_eye_colors_pkey; Type: CONSTRAINT; Schema: person_reference; Owner: bendo01
--

ALTER TABLE ONLY person_reference.eye_colors
    ADD CONSTRAINT person_reference_eye_colors_pkey PRIMARY KEY (id);


--
-- Name: genders person_reference_genders_pkey; Type: CONSTRAINT; Schema: person_reference; Owner: bendo01
--

ALTER TABLE ONLY person_reference.genders
    ADD CONSTRAINT person_reference_genders_pkey PRIMARY KEY (id);


--
-- Name: hair_colors person_reference_hair_colors_pkey; Type: CONSTRAINT; Schema: person_reference; Owner: bendo01
--

ALTER TABLE ONLY person_reference.hair_colors
    ADD CONSTRAINT person_reference_hair_colors_pkey PRIMARY KEY (id);


--
-- Name: hair_types person_reference_hair_types_pkey; Type: CONSTRAINT; Schema: person_reference; Owner: bendo01
--

ALTER TABLE ONLY person_reference.hair_types
    ADD CONSTRAINT person_reference_hair_types_pkey PRIMARY KEY (id);


--
-- Name: identification_types person_reference_identification_types_pkey; Type: CONSTRAINT; Schema: person_reference; Owner: bendo01
--

ALTER TABLE ONLY person_reference.identification_types
    ADD CONSTRAINT person_reference_identification_types_pkey PRIMARY KEY (id);


--
-- Name: incomes person_reference_incomes_pkey; Type: CONSTRAINT; Schema: person_reference; Owner: bendo01
--

ALTER TABLE ONLY person_reference.incomes
    ADD CONSTRAINT person_reference_incomes_pkey PRIMARY KEY (id);


--
-- Name: marital_statuses person_reference_marital_statuses_pkey; Type: CONSTRAINT; Schema: person_reference; Owner: bendo01
--

ALTER TABLE ONLY person_reference.marital_statuses
    ADD CONSTRAINT person_reference_marital_statuses_pkey PRIMARY KEY (id);


--
-- Name: occupations person_reference_occupations_pkey; Type: CONSTRAINT; Schema: person_reference; Owner: bendo01
--

ALTER TABLE ONLY person_reference.occupations
    ADD CONSTRAINT person_reference_occupations_pkey PRIMARY KEY (id);


--
-- Name: professions person_reference_professions_pkey; Type: CONSTRAINT; Schema: person_reference; Owner: bendo01
--

ALTER TABLE ONLY person_reference.professions
    ADD CONSTRAINT person_reference_professions_pkey PRIMARY KEY (id);


--
-- Name: relative_types person_reference_relative_types_pkey; Type: CONSTRAINT; Schema: person_reference; Owner: bendo01
--

ALTER TABLE ONLY person_reference.relative_types
    ADD CONSTRAINT person_reference_relative_types_pkey PRIMARY KEY (id);


--
-- Name: religions person_reference_religions_pkey; Type: CONSTRAINT; Schema: person_reference; Owner: bendo01
--

ALTER TABLE ONLY person_reference.religions
    ADD CONSTRAINT person_reference_religions_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict w7siCb5lY9tn3ydrsxB7ZtNcgBaVYwNGGEyPe7qMqXx9sdRL8KlNr8GjHqcVht5

