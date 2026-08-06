--
-- PostgreSQL database dump
--

\restrict GYn1aZgsSxPYeSKUrMTbMB22RyfNXa339tqVZTgUd0nwE8blmNVlqNiWApSV0AD

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
-- Name: academic_course_master; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA academic_course_master;


ALTER SCHEMA academic_course_master OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: concentrations; Type: TABLE; Schema: academic_course_master; Owner: bendo01
--

CREATE TABLE academic_course_master.concentrations (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    name character varying(255) NOT NULL,
    unit_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_course_master.concentrations OWNER TO bendo01;

--
-- Name: course_evaluation_plannings; Type: TABLE; Schema: academic_course_master; Owner: bendo01
--

CREATE TABLE academic_course_master.course_evaluation_plannings (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    name character varying(255) NOT NULL,
    percentage real DEFAULT '0'::real,
    decription_indonesian text NOT NULL,
    decription_english text,
    course_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    evaluation_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid CONSTRAINT course_evaluation_plannings_course_evaluation_base_id_not_null NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    code integer DEFAULT 0
);


ALTER TABLE academic_course_master.course_evaluation_plannings OWNER TO bendo01;

--
-- Name: course_learn_plannings; Type: TABLE; Schema: academic_course_master; Owner: bendo01
--

CREATE TABLE academic_course_master.course_learn_plannings (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    name character varying(255) NOT NULL,
    decription_indonesian text NOT NULL,
    decription_english text,
    course_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    feeder_id_rencana_ajar uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_course_master.course_learn_plannings OWNER TO bendo01;

--
-- Name: courses; Type: TABLE; Schema: academic_course_master; Owner: bendo01
--

CREATE TABLE academic_course_master.courses (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    implementation_method text,
    total_credit double precision DEFAULT 0 NOT NULL,
    lecture_credit double precision DEFAULT 0 NOT NULL,
    practice_credit double precision DEFAULT 0 NOT NULL,
    field_practice_credit double precision DEFAULT 0 NOT NULL,
    simulation_credit double precision DEFAULT 0 NOT NULL,
    has_unit boolean DEFAULT false NOT NULL,
    has_syllabus boolean DEFAULT false NOT NULL,
    has_material boolean DEFAULT false NOT NULL,
    has_practice boolean DEFAULT false NOT NULL,
    has_dictation boolean DEFAULT false NOT NULL,
    group_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    variety_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    unit_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    competence_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    feeder_course_group_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    feeder_course_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    feeder_course_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    start_date date,
    end_date date,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_course_master.courses OWNER TO bendo01;

--
-- Name: curriculum_details; Type: TABLE; Schema: academic_course_master; Owner: bendo01
--

CREATE TABLE academic_course_master.curriculum_details (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer,
    curriculum_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    semester_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    course_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    credit double precision DEFAULT '0'::double precision,
    name character varying,
    concentration_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    is_convertable_to_mbkm boolean DEFAULT false,
    feeder_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    is_convertable_to_prior_learning_recognition boolean DEFAULT false
);


ALTER TABLE academic_course_master.curriculum_details OWNER TO bendo01;

--
-- Name: curriculums; Type: TABLE; Schema: academic_course_master; Owner: bendo01
--

CREATE TABLE academic_course_master.curriculums (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    name character varying(255) NOT NULL,
    unit_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    academic_year_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    curriculum_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    total_credit double precision DEFAULT 0,
    mandatory_course_credit double precision DEFAULT 0,
    optional_course_credit double precision DEFAULT 0,
    feeder_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    start_date date,
    end_date date,
    is_active boolean DEFAULT false NOT NULL
);


ALTER TABLE academic_course_master.curriculums OWNER TO bendo01;

--
-- Name: curriculum_details academic_course_master_curriculum_details_pkey; Type: CONSTRAINT; Schema: academic_course_master; Owner: bendo01
--

ALTER TABLE ONLY academic_course_master.curriculum_details
    ADD CONSTRAINT academic_course_master_curriculum_details_pkey PRIMARY KEY (id);


--
-- Name: concentrations acm_concentrations_pkey; Type: CONSTRAINT; Schema: academic_course_master; Owner: bendo01
--

ALTER TABLE ONLY academic_course_master.concentrations
    ADD CONSTRAINT acm_concentrations_pkey PRIMARY KEY (id);


--
-- Name: course_evaluation_plannings acm_course_evaluation_plannings_pkey; Type: CONSTRAINT; Schema: academic_course_master; Owner: bendo01
--

ALTER TABLE ONLY academic_course_master.course_evaluation_plannings
    ADD CONSTRAINT acm_course_evaluation_plannings_pkey PRIMARY KEY (id);


--
-- Name: course_learn_plannings acm_course_learn_plannings_pkey; Type: CONSTRAINT; Schema: academic_course_master; Owner: bendo01
--

ALTER TABLE ONLY academic_course_master.course_learn_plannings
    ADD CONSTRAINT acm_course_learn_plannings_pkey PRIMARY KEY (id);


--
-- Name: courses acm_courses_pkey; Type: CONSTRAINT; Schema: academic_course_master; Owner: bendo01
--

ALTER TABLE ONLY academic_course_master.courses
    ADD CONSTRAINT acm_courses_pkey PRIMARY KEY (id);


--
-- Name: curriculums acm_curriculums_pkey; Type: CONSTRAINT; Schema: academic_course_master; Owner: bendo01
--

ALTER TABLE ONLY academic_course_master.curriculums
    ADD CONSTRAINT acm_curriculums_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict GYn1aZgsSxPYeSKUrMTbMB22RyfNXa339tqVZTgUd0nwE8blmNVlqNiWApSV0AD

