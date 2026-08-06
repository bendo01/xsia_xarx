--
-- PostgreSQL database dump
--

\restrict pmWEWcTZqpv0MTcH2HWWIGSeoNZyZVFovHjH8zngFUxaE1qzXdZWKZyjpFFAcIB

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
-- Name: academic_candidate_master; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA academic_candidate_master;


ALTER SCHEMA academic_candidate_master OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: candidate_unit; Type: TABLE; Schema: academic_candidate_master; Owner: bendo01
--

CREATE TABLE academic_candidate_master.candidate_unit (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    candidate_id uuid NOT NULL,
    unit_id uuid NOT NULL,
    registration_category_id uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_candidate_master.candidate_unit OWNER TO bendo01;

--
-- Name: candidates; Type: TABLE; Schema: academic_candidate_master; Owner: bendo01
--

CREATE TABLE academic_candidate_master.candidates (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    thread integer DEFAULT 0,
    code character varying(255),
    name character varying(255) NOT NULL,
    student_national_number character varying(255),
    school_name character varying(255),
    school_regency_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    state_smart_card_number character varying(255),
    individual_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    academic_year_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    student_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    user_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    registration_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    institution_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    guidence_name character varying(255),
    guidence_phone_number character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_candidate_master.candidates OWNER TO bendo01;

--
-- Name: exam_classes; Type: TABLE; Schema: academic_candidate_master; Owner: bendo01
--

CREATE TABLE academic_candidate_master.exam_classes (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer,
    alphabet_code character varying(255),
    name character varying(255) NOT NULL,
    phase_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    start_date timestamp(0) without time zone NOT NULL,
    end_date timestamp(0) without time zone,
    start_time time(0) without time zone,
    end_time time(0) without time zone,
    capacity integer DEFAULT 0 NOT NULL,
    lms_category integer DEFAULT 0,
    is_online boolean DEFAULT false,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_candidate_master.exam_classes OWNER TO bendo01;

--
-- Name: candidate_unit acm_candidate_unit_pkey; Type: CONSTRAINT; Schema: academic_candidate_master; Owner: bendo01
--

ALTER TABLE ONLY academic_candidate_master.candidate_unit
    ADD CONSTRAINT acm_candidate_unit_pkey PRIMARY KEY (id);


--
-- Name: candidates acm_candidates_pkey; Type: CONSTRAINT; Schema: academic_candidate_master; Owner: bendo01
--

ALTER TABLE ONLY academic_candidate_master.candidates
    ADD CONSTRAINT acm_candidates_pkey PRIMARY KEY (id);


--
-- Name: exam_classes acm_exam_classes_pkey; Type: CONSTRAINT; Schema: academic_candidate_master; Owner: bendo01
--

ALTER TABLE ONLY academic_candidate_master.exam_classes
    ADD CONSTRAINT acm_exam_classes_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict pmWEWcTZqpv0MTcH2HWWIGSeoNZyZVFovHjH8zngFUxaE1qzXdZWKZyjpFFAcIB

