--
-- PostgreSQL database dump
--

\restrict 9XA1rMm0CMJOLi3mphufIMrUiiuBS086EXzdpIBeHNqYOU6BRxO2V6xwOegsUXv

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
-- Name: academic_campaign_transaction; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA academic_campaign_transaction;


ALTER SCHEMA academic_campaign_transaction OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activities; Type: TABLE; Schema: academic_campaign_transaction; Owner: bendo01
--

CREATE TABLE academic_campaign_transaction.activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    week_quantity integer DEFAULT 0,
    student_target integer DEFAULT 0 NOT NULL,
    candidate_number integer DEFAULT 0 NOT NULL,
    candidate_pass integer DEFAULT 0 NOT NULL,
    became_student integer DEFAULT 0 NOT NULL,
    transfer_student integer DEFAULT 0 NOT NULL,
    total_class_member integer DEFAULT 0,
    start_date date,
    end_date date,
    start_transaction date,
    end_transaction date,
    unit_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    academic_year_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    is_active boolean DEFAULT false,
    feeder_id uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_campaign_transaction.activities OWNER TO bendo01;

--
-- Name: calendar_details; Type: TABLE; Schema: academic_campaign_transaction; Owner: bendo01
--

CREATE TABLE academic_campaign_transaction.calendar_details (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    name character varying(255) NOT NULL,
    calendar_category_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    calendar_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_campaign_transaction.calendar_details OWNER TO bendo01;

--
-- Name: calendars; Type: TABLE; Schema: academic_campaign_transaction; Owner: bendo01
--

CREATE TABLE academic_campaign_transaction.calendars (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    name character varying(255) NOT NULL,
    academic_year_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    institution_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_campaign_transaction.calendars OWNER TO bendo01;

--
-- Name: class_codes; Type: TABLE; Schema: academic_campaign_transaction; Owner: bendo01
--

CREATE TABLE academic_campaign_transaction.class_codes (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer,
    alphabet_code character varying(255),
    name character varying(255) NOT NULL,
    activity_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    start_effective_date date,
    end_effective_date date,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    unit_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    capacity integer DEFAULT 0
);


ALTER TABLE academic_campaign_transaction.class_codes OWNER TO bendo01;

--
-- Name: grades; Type: TABLE; Schema: academic_campaign_transaction; Owner: bendo01
--

CREATE TABLE academic_campaign_transaction.grades (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0,
    alphabet_code character varying(255),
    name character varying(255) NOT NULL,
    grade double precision DEFAULT '0'::double precision NOT NULL,
    minimum double precision DEFAULT '0'::double precision NOT NULL,
    maximum double precision DEFAULT '0'::double precision NOT NULL,
    start_date date,
    end_date date,
    unit_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    feeder_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_campaign_transaction.grades OWNER TO bendo01;

--
-- Name: schedules; Type: TABLE; Schema: academic_campaign_transaction; Owner: bendo01
--

CREATE TABLE academic_campaign_transaction.schedules (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    name text,
    start_hour time(0) without time zone NOT NULL,
    end_hour time(0) without time zone NOT NULL,
    weekday_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    room_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    teach_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_campaign_transaction.schedules OWNER TO bendo01;

--
-- Name: teach_decrees; Type: TABLE; Schema: academic_campaign_transaction; Owner: bendo01
--

CREATE TABLE academic_campaign_transaction.teach_decrees (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    decree_number character varying(255) NOT NULL,
    decree_date date NOT NULL,
    activity_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    staff_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    feeder_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_campaign_transaction.teach_decrees OWNER TO bendo01;

--
-- Name: teach_evaluations; Type: TABLE; Schema: academic_campaign_transaction; Owner: bendo01
--

CREATE TABLE academic_campaign_transaction.teach_evaluations (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    thread integer DEFAULT 0,
    name character varying(255),
    english_name character varying(255),
    evaluation_weight real DEFAULT '0'::real,
    evaluation_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    feeder_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    teach_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_campaign_transaction.teach_evaluations OWNER TO bendo01;

--
-- Name: teach_lecturers; Type: TABLE; Schema: academic_campaign_transaction; Owner: bendo01
--

CREATE TABLE academic_campaign_transaction.teach_lecturers (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    name character varying(255),
    planning integer DEFAULT 0 NOT NULL,
    realization integer DEFAULT 0 NOT NULL,
    credit numeric(3,1) DEFAULT 0,
    is_lecturer_home_base boolean DEFAULT false NOT NULL,
    lecturer_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    teach_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    feeder_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_campaign_transaction.teach_lecturers OWNER TO bendo01;

--
-- Name: teaches; Type: TABLE; Schema: academic_campaign_transaction; Owner: bendo01
--

CREATE TABLE academic_campaign_transaction.teaches (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    name text,
    class_code_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    course_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    activity_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    description text,
    start_date date,
    end_date date,
    practice_start_date date,
    practice_end_date date,
    curriculum_detail_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    teach_decree_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    is_lecturer_credit_sum_problem boolean DEFAULT false,
    is_lock boolean DEFAULT false,
    encounter_category_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    scope_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    max_member integer DEFAULT 0,
    feeder_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_campaign_transaction.teaches OWNER TO bendo01;

--
-- Name: activities act_activities_pkey; Type: CONSTRAINT; Schema: academic_campaign_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_campaign_transaction.activities
    ADD CONSTRAINT act_activities_pkey PRIMARY KEY (id);


--
-- Name: calendar_details act_calendar_details_pkey; Type: CONSTRAINT; Schema: academic_campaign_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_campaign_transaction.calendar_details
    ADD CONSTRAINT act_calendar_details_pkey PRIMARY KEY (id);


--
-- Name: calendars act_calendars_pkey; Type: CONSTRAINT; Schema: academic_campaign_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_campaign_transaction.calendars
    ADD CONSTRAINT act_calendars_pkey PRIMARY KEY (id);


--
-- Name: class_codes act_class_codes_pkey; Type: CONSTRAINT; Schema: academic_campaign_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_campaign_transaction.class_codes
    ADD CONSTRAINT act_class_codes_pkey PRIMARY KEY (id);


--
-- Name: grades act_grades_pkey; Type: CONSTRAINT; Schema: academic_campaign_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_campaign_transaction.grades
    ADD CONSTRAINT act_grades_pkey PRIMARY KEY (id);


--
-- Name: schedules act_schedules_pkey; Type: CONSTRAINT; Schema: academic_campaign_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_campaign_transaction.schedules
    ADD CONSTRAINT act_schedules_pkey PRIMARY KEY (id);


--
-- Name: teach_decrees act_teach_decrees_pkey; Type: CONSTRAINT; Schema: academic_campaign_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_campaign_transaction.teach_decrees
    ADD CONSTRAINT act_teach_decrees_pkey PRIMARY KEY (id);


--
-- Name: teach_evaluations act_teach_evaluations_pkey; Type: CONSTRAINT; Schema: academic_campaign_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_campaign_transaction.teach_evaluations
    ADD CONSTRAINT act_teach_evaluations_pkey PRIMARY KEY (id);


--
-- Name: teach_lecturers act_teach_lecturers_pkey; Type: CONSTRAINT; Schema: academic_campaign_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_campaign_transaction.teach_lecturers
    ADD CONSTRAINT act_teach_lecturers_pkey PRIMARY KEY (id);


--
-- Name: teaches act_teaches_pkey; Type: CONSTRAINT; Schema: academic_campaign_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_campaign_transaction.teaches
    ADD CONSTRAINT act_teaches_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict 9XA1rMm0CMJOLi3mphufIMrUiiuBS086EXzdpIBeHNqYOU6BRxO2V6xwOegsUXv

