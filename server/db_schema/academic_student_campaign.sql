--
-- PostgreSQL database dump
--

\restrict 3DBWnSfOHdRbMQ4UgjQqyxhmRw0AP8dhXLnVjMiirqMa254qUbRKw2jclKc0vT6

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
-- Name: academic_student_campaign; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA academic_student_campaign;


ALTER SCHEMA academic_student_campaign OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: convertions; Type: TABLE; Schema: academic_student_campaign; Owner: bendo01
--

CREATE TABLE academic_student_campaign.convertions (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    student_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    course_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    grade_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    transfer_code character varying(255) NOT NULL,
    transfer_name character varying(255) NOT NULL,
    transfer_credit double precision DEFAULT 0 NOT NULL,
    transfer_grade character varying(255) NOT NULL,
    is_lock timestamp(0) without time zone,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    feeder_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    name character varying(255),
    academic_year_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    origin_code character varying(255),
    origin_name character varying(255),
    origin_credit double precision DEFAULT 0,
    origin_grade character varying(255)
);


ALTER TABLE academic_student_campaign.convertions OWNER TO bendo01;

--
-- Name: detail_activities; Type: TABLE; Schema: academic_student_campaign; Owner: bendo01
--

CREATE TABLE academic_student_campaign.detail_activities (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    mark double precision DEFAULT '0'::double precision,
    credit double precision,
    grade_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    course_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    activity_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    teach_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    is_lock boolean DEFAULT false,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    feeder_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    name character varying,
    feeder_grade_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    curiculum_detail_sequence integer DEFAULT 0
);


ALTER TABLE academic_student_campaign.detail_activities OWNER TO bendo01;

--
-- Name: detail_activity_evaluation_components; Type: TABLE; Schema: academic_student_campaign; Owner: bendo01
--

CREATE TABLE academic_student_campaign.detail_activity_evaluation_components (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    name text,
    detail_activity_id uuid CONSTRAINT detail_activity_evaluation_componen_detail_activity_id_not_null NOT NULL,
    course_evaluation_planning_id uuid CONSTRAINT detail_activity_evaluation__course_evaluation_planning_not_null NOT NULL,
    mark real DEFAULT '0'::real,
    percentage real DEFAULT '0'::real,
    total real DEFAULT '0'::real,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_student_campaign.detail_activity_evaluation_components OWNER TO bendo01;

--
-- Name: student_activities; Type: TABLE; Schema: academic_student_campaign; Owner: bendo01
--

CREATE TABLE academic_student_campaign.student_activities (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    name character varying(255),
    cumulative_index double precision DEFAULT '0'::double precision NOT NULL,
    grand_cumulative_index double precision DEFAULT '0'::double precision NOT NULL,
    total_credit double precision DEFAULT 0,
    grand_total_credit double precision DEFAULT 0,
    student_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    unit_activity_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    status_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    resign_status_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    unit_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    is_lock boolean DEFAULT false,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    feeder_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    finance_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    finance_fee double precision DEFAULT '0'::double precision
);


ALTER TABLE academic_student_campaign.student_activities OWNER TO bendo01;

--
-- Name: student_activities academic_student_campaign_activities_pkey; Type: CONSTRAINT; Schema: academic_student_campaign; Owner: bendo01
--

ALTER TABLE ONLY academic_student_campaign.student_activities
    ADD CONSTRAINT academic_student_campaign_activities_pkey PRIMARY KEY (id);


--
-- Name: convertions academic_student_campaign_convertions_pkey; Type: CONSTRAINT; Schema: academic_student_campaign; Owner: bendo01
--

ALTER TABLE ONLY academic_student_campaign.convertions
    ADD CONSTRAINT academic_student_campaign_convertions_pkey PRIMARY KEY (id);


--
-- Name: detail_activities academic_student_campaign_detail_activities_pkey; Type: CONSTRAINT; Schema: academic_student_campaign; Owner: bendo01
--

ALTER TABLE ONLY academic_student_campaign.detail_activities
    ADD CONSTRAINT academic_student_campaign_detail_activities_pkey PRIMARY KEY (id);


--
-- Name: detail_activity_evaluation_components academic_student_campaign_detail_activity_evaluation_components; Type: CONSTRAINT; Schema: academic_student_campaign; Owner: bendo01
--

ALTER TABLE ONLY academic_student_campaign.detail_activity_evaluation_components
    ADD CONSTRAINT academic_student_campaign_detail_activity_evaluation_components PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict 3DBWnSfOHdRbMQ4UgjQqyxhmRw0AP8dhXLnVjMiirqMa254qUbRKw2jclKc0vT6

