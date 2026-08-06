--
-- PostgreSQL database dump
--

\restrict 5ly13YhDj5U6lmuATZU8UhSTM0eaNf4huztF7N30kpaRg8nrJea8UCDVRonF8jf

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
-- Name: academic_student_reference; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA academic_student_reference;


ALTER SCHEMA academic_student_reference OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: finances; Type: TABLE; Schema: academic_student_reference; Owner: bendo01
--

CREATE TABLE academic_student_reference.finances (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255),
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) with time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_student_reference.finances OWNER TO bendo01;

--
-- Name: registrations; Type: TABLE; Schema: academic_student_reference; Owner: bendo01
--

CREATE TABLE academic_student_reference.registrations (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255),
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) with time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_student_reference.registrations OWNER TO bendo01;

--
-- Name: resign_statuses; Type: TABLE; Schema: academic_student_reference; Owner: bendo01
--

CREATE TABLE academic_student_reference.resign_statuses (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255),
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) with time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_student_reference.resign_statuses OWNER TO bendo01;

--
-- Name: selection_types; Type: TABLE; Schema: academic_student_reference; Owner: bendo01
--

CREATE TABLE academic_student_reference.selection_types (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255),
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) with time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_student_reference.selection_types OWNER TO bendo01;

--
-- Name: statuses; Type: TABLE; Schema: academic_student_reference; Owner: bendo01
--

CREATE TABLE academic_student_reference.statuses (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255),
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) with time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_student_reference.statuses OWNER TO bendo01;

--
-- Name: registrations asr__registrations_pkey; Type: CONSTRAINT; Schema: academic_student_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_student_reference.registrations
    ADD CONSTRAINT asr__registrations_pkey PRIMARY KEY (id);


--
-- Name: finances asr_finances_pkey; Type: CONSTRAINT; Schema: academic_student_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_student_reference.finances
    ADD CONSTRAINT asr_finances_pkey PRIMARY KEY (id);


--
-- Name: resign_statuses asr_resign_statuses_pkey; Type: CONSTRAINT; Schema: academic_student_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_student_reference.resign_statuses
    ADD CONSTRAINT asr_resign_statuses_pkey PRIMARY KEY (id);


--
-- Name: selection_types asr_selection_types_pkey; Type: CONSTRAINT; Schema: academic_student_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_student_reference.selection_types
    ADD CONSTRAINT asr_selection_types_pkey PRIMARY KEY (id);


--
-- Name: statuses asr_statuses_pkey; Type: CONSTRAINT; Schema: academic_student_reference; Owner: bendo01
--

ALTER TABLE ONLY academic_student_reference.statuses
    ADD CONSTRAINT asr_statuses_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict 5ly13YhDj5U6lmuATZU8UhSTM0eaNf4huztF7N30kpaRg8nrJea8UCDVRonF8jf

