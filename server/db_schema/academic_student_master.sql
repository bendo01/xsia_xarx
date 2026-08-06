--
-- PostgreSQL database dump
--

\restrict hucOnS08eywMWNYpabVT0cJ4Zc32dR1Sx5HKrFZzZtkf025AiI1FI6mVzhnY3W3

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
-- Name: academic_student_master; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA academic_student_master;


ALTER SCHEMA academic_student_master OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: images; Type: TABLE; Schema: academic_student_master; Owner: bendo01
--

CREATE TABLE academic_student_master.images (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    student_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    filename character varying(255) NOT NULL,
    dir character varying(255) NOT NULL,
    mimetype character varying(255),
    size bigint,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_student_master.images OWNER TO bendo01;

--
-- Name: students; Type: TABLE; Schema: academic_student_master; Owner: bendo01
--

CREATE TABLE academic_student_master.students (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    selection_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    registered date NOT NULL,
    individual_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    status_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    unit_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    academic_year_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    registration_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    nisn character varying(255),
    resign_status_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    concentration_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    curriculum_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    class_code_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    transfer_code character varying(255),
    transfer_unit_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    id_mahasiswa uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    id_registrasi_mahasiswa uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    finance_fee double precision DEFAULT 0,
    finance_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_student_master.students OWNER TO bendo01;

--
-- Name: images asm_images_pkey; Type: CONSTRAINT; Schema: academic_student_master; Owner: bendo01
--

ALTER TABLE ONLY academic_student_master.images
    ADD CONSTRAINT asm_images_pkey PRIMARY KEY (id);


--
-- Name: students asm_students_pkey; Type: CONSTRAINT; Schema: academic_student_master; Owner: bendo01
--

ALTER TABLE ONLY academic_student_master.students
    ADD CONSTRAINT asm_students_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict hucOnS08eywMWNYpabVT0cJ4Zc32dR1Sx5HKrFZzZtkf025AiI1FI6mVzhnY3W3

