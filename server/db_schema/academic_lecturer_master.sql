--
-- PostgreSQL database dump
--

\restrict vN2YGajddlCcpQf51b6JCRCRBqNBPUHfLsvutB51bdb0spR3PgtAmmzTnI8ZO5d

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
-- Name: academic_lecturer_master; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA academic_lecturer_master;


ALTER SCHEMA academic_lecturer_master OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: lecturers; Type: TABLE; Schema: academic_lecturer_master; Owner: bendo01
--

CREATE TABLE academic_lecturer_master.lecturers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(255) NOT NULL,
    name character varying(255),
    individual_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    institution_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    alternative_code character varying(255),
    accessor_number character varying(255),
    identification_number character varying(255),
    status_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    contract_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    rank_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    start_date date,
    end_date date,
    front_title character varying(255),
    last_title character varying(255),
    id_dosen uuid,
    group_id uuid,
    nuptk character varying,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE academic_lecturer_master.lecturers OWNER TO bendo01;

--
-- Name: lecturers alm_lecturers_pkey; Type: CONSTRAINT; Schema: academic_lecturer_master; Owner: bendo01
--

ALTER TABLE ONLY academic_lecturer_master.lecturers
    ADD CONSTRAINT alm_lecturers_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict vN2YGajddlCcpQf51b6JCRCRBqNBPUHfLsvutB51bdb0spR3PgtAmmzTnI8ZO5d

