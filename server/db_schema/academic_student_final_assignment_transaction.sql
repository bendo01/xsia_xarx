--
-- PostgreSQL database dump
--

\restrict wJFKL3T8VGRNP5nDGc2X7mJTy8hhpij6We8Y1rdrg78ILmo6onJvfhSOALvb7zm

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
-- Name: academic_student_final_assignment_transaction; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA academic_student_final_assignment_transaction;


ALTER SCHEMA academic_student_final_assignment_transaction OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: advisers; Type: TABLE; Schema: academic_student_final_assignment_transaction; Owner: bendo01
--

CREATE TABLE academic_student_final_assignment_transaction.advisers (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    thread integer NOT NULL,
    lecturer_id uuid NOT NULL,
    detail_activity_id uuid NOT NULL,
    submission_id uuid,
    adviser_category_id uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_student_final_assignment_transaction.advisers OWNER TO bendo01;

--
-- Name: evaluation_details; Type: TABLE; Schema: academic_student_final_assignment_transaction; Owner: bendo01
--

CREATE TABLE academic_student_final_assignment_transaction.evaluation_details (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    evaluation_summary_id uuid NOT NULL,
    adviser_id uuid NOT NULL,
    mark real DEFAULT '0'::real,
    grade_id uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_student_final_assignment_transaction.evaluation_details OWNER TO bendo01;

--
-- Name: evaluation_summaries; Type: TABLE; Schema: academic_student_final_assignment_transaction; Owner: bendo01
--

CREATE TABLE academic_student_final_assignment_transaction.evaluation_summaries (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    submission_id uuid,
    detail_activity_id uuid NOT NULL,
    stage_id uuid NOT NULL,
    mark real DEFAULT '0'::real,
    grade_id uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_student_final_assignment_transaction.evaluation_summaries OWNER TO bendo01;

--
-- Name: final_assignment_decrees; Type: TABLE; Schema: academic_student_final_assignment_transaction; Owner: bendo01
--

CREATE TABLE academic_student_final_assignment_transaction.final_assignment_decrees (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    decree_number character varying(255) NOT NULL,
    decree_date date NOT NULL,
    unit_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    activity_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    staff_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_student_final_assignment_transaction.final_assignment_decrees OWNER TO bendo01;

--
-- Name: prerequisites; Type: TABLE; Schema: academic_student_final_assignment_transaction; Owner: bendo01
--

CREATE TABLE academic_student_final_assignment_transaction.prerequisites (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    thread integer NOT NULL,
    requirement_id uuid NOT NULL,
    submission_id uuid NOT NULL,
    approval_type_id uuid NOT NULL,
    stage_id uuid NOT NULL,
    filename character varying(255),
    dir character varying(255),
    type character varying(255),
    filesize integer,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_student_final_assignment_transaction.prerequisites OWNER TO bendo01;

--
-- Name: schedules; Type: TABLE; Schema: academic_student_final_assignment_transaction; Owner: bendo01
--

CREATE TABLE academic_student_final_assignment_transaction.schedules (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    ecree_number character varying(255),
    schedule_date date,
    schedule_time time(0) without time zone,
    submission_id uuid,
    detail_activity_id uuid NOT NULL,
    stage_id uuid NOT NULL,
    room_id uuid,
    zoom_meeting text,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_student_final_assignment_transaction.schedules OWNER TO bendo01;

--
-- Name: submissions; Type: TABLE; Schema: academic_student_final_assignment_transaction; Owner: bendo01
--

CREATE TABLE academic_student_final_assignment_transaction.submissions (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    title text,
    student_id uuid NOT NULL,
    approval_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    category_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    stage_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    final_assignment_decree_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    detail_activity_id uuid NOT NULL,
    is_taken timestamp(0) without time zone,
    is_lock timestamp(0) without time zone,
    filename character varying(255),
    dir character varying(255),
    type character varying(255),
    filesize integer,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_student_final_assignment_transaction.submissions OWNER TO bendo01;

--
-- Name: advisers academic_student_final_assignment_transaction_advisers_pkey; Type: CONSTRAINT; Schema: academic_student_final_assignment_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_student_final_assignment_transaction.advisers
    ADD CONSTRAINT academic_student_final_assignment_transaction_advisers_pkey PRIMARY KEY (id);


--
-- Name: evaluation_details academic_student_final_assignment_transaction_evaluation_detail; Type: CONSTRAINT; Schema: academic_student_final_assignment_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_student_final_assignment_transaction.evaluation_details
    ADD CONSTRAINT academic_student_final_assignment_transaction_evaluation_detail PRIMARY KEY (id);


--
-- Name: evaluation_summaries academic_student_final_assignment_transaction_evaluation_summar; Type: CONSTRAINT; Schema: academic_student_final_assignment_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_student_final_assignment_transaction.evaluation_summaries
    ADD CONSTRAINT academic_student_final_assignment_transaction_evaluation_summar PRIMARY KEY (id);


--
-- Name: final_assignment_decrees academic_student_final_assignment_transaction_final_assignment_; Type: CONSTRAINT; Schema: academic_student_final_assignment_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_student_final_assignment_transaction.final_assignment_decrees
    ADD CONSTRAINT academic_student_final_assignment_transaction_final_assignment_ PRIMARY KEY (id);


--
-- Name: prerequisites academic_student_final_assignment_transaction_prerequisites_pke; Type: CONSTRAINT; Schema: academic_student_final_assignment_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_student_final_assignment_transaction.prerequisites
    ADD CONSTRAINT academic_student_final_assignment_transaction_prerequisites_pke PRIMARY KEY (id);


--
-- Name: schedules academic_student_final_assignment_transaction_schedules_pkey; Type: CONSTRAINT; Schema: academic_student_final_assignment_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_student_final_assignment_transaction.schedules
    ADD CONSTRAINT academic_student_final_assignment_transaction_schedules_pkey PRIMARY KEY (id);


--
-- Name: submissions academic_student_final_assignment_transaction_submissions_pkey; Type: CONSTRAINT; Schema: academic_student_final_assignment_transaction; Owner: bendo01
--

ALTER TABLE ONLY academic_student_final_assignment_transaction.submissions
    ADD CONSTRAINT academic_student_final_assignment_transaction_submissions_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict wJFKL3T8VGRNP5nDGc2X7mJTy8hhpij6We8Y1rdrg78ILmo6onJvfhSOALvb7zm

