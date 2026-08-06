--
-- PostgreSQL database dump
--

\restrict GPr1w376JHxfruEWnjNwLklWDbcsibi5bnud2nIKiG9MT1T5U3CV2UrqvqSqtFB

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
-- Name: academic_student_adviser; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA academic_student_adviser;


ALTER SCHEMA academic_student_adviser OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: counsellors; Type: TABLE; Schema: academic_student_adviser; Owner: bendo01
--

CREATE TABLE academic_student_adviser.counsellors (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    decree_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    student_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    lecturer_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_student_adviser.counsellors OWNER TO bendo01;

--
-- Name: decrees; Type: TABLE; Schema: academic_student_adviser; Owner: bendo01
--

CREATE TABLE academic_student_adviser.decrees (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    decree_date date NOT NULL,
    decree_number character varying(255) NOT NULL,
    unit_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    staff_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_student_adviser.decrees OWNER TO bendo01;

--
-- Name: counsellors academic_student_adviser_counsellors_pkey; Type: CONSTRAINT; Schema: academic_student_adviser; Owner: bendo01
--

ALTER TABLE ONLY academic_student_adviser.counsellors
    ADD CONSTRAINT academic_student_adviser_counsellors_pkey PRIMARY KEY (id);


--
-- Name: decrees academic_student_adviser_decrees_pkey; Type: CONSTRAINT; Schema: academic_student_adviser; Owner: bendo01
--

ALTER TABLE ONLY academic_student_adviser.decrees
    ADD CONSTRAINT academic_student_adviser_decrees_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict GPr1w376JHxfruEWnjNwLklWDbcsibi5bnud2nIKiG9MT1T5U3CV2UrqvqSqtFB

