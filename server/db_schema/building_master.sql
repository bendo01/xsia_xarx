--
-- PostgreSQL database dump
--

\restrict HY3IeLL4jK7M7u4Qe1ko1gLhzha0V78A5M6dTUFr30ga1sFAJCUygJYBG2M5y7h

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
-- Name: building_master; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA building_master;


ALTER SCHEMA building_master OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: buildings; Type: TABLE; Schema: building_master; Owner: bendo01
--

CREATE TABLE building_master.buildings (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    alphabet_code character varying(255),
    name character varying(255) NOT NULL,
    long real DEFAULT 0,
    wide real DEFAULT 0,
    high real DEFAULT 0,
    variety_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    category_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    total_floor integer DEFAULT 1,
    residence_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    condition_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE building_master.buildings OWNER TO bendo01;

--
-- Name: rooms; Type: TABLE; Schema: building_master; Owner: bendo01
--

CREATE TABLE building_master.rooms (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    alphabet_code character varying(255),
    name character varying(255) NOT NULL,
    long real DEFAULT 0,
    wide real DEFAULT 0,
    high real DEFAULT 0,
    room_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    unit_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    building_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    condition_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE building_master.rooms OWNER TO bendo01;

--
-- Name: buildings bm_buildings_pkey; Type: CONSTRAINT; Schema: building_master; Owner: bendo01
--

ALTER TABLE ONLY building_master.buildings
    ADD CONSTRAINT bm_buildings_pkey PRIMARY KEY (id);


--
-- Name: rooms bm_rooms_pkey; Type: CONSTRAINT; Schema: building_master; Owner: bendo01
--

ALTER TABLE ONLY building_master.rooms
    ADD CONSTRAINT bm_rooms_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict HY3IeLL4jK7M7u4Qe1ko1gLhzha0V78A5M6dTUFr30ga1sFAJCUygJYBG2M5y7h

