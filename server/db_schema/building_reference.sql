--
-- PostgreSQL database dump
--

\restrict 3wiVnmcK6XXUYbdhUAw1ZHXfMvefHncbvVrbiz4e1UwPXKj0TWXMkaqkYrXkOff

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
-- Name: building_reference; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA building_reference;


ALTER SCHEMA building_reference OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: building_reference; Owner: bendo01
--

CREATE TABLE building_reference.categories (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE building_reference.categories OWNER TO bendo01;

--
-- Name: conditions; Type: TABLE; Schema: building_reference; Owner: bendo01
--

CREATE TABLE building_reference.conditions (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE building_reference.conditions OWNER TO bendo01;

--
-- Name: room_types; Type: TABLE; Schema: building_reference; Owner: bendo01
--

CREATE TABLE building_reference.room_types (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE building_reference.room_types OWNER TO bendo01;

--
-- Name: varieties; Type: TABLE; Schema: building_reference; Owner: bendo01
--

CREATE TABLE building_reference.varieties (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0 NOT NULL,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE building_reference.varieties OWNER TO bendo01;

--
-- Name: categories br_categories_pkey; Type: CONSTRAINT; Schema: building_reference; Owner: bendo01
--

ALTER TABLE ONLY building_reference.categories
    ADD CONSTRAINT br_categories_pkey PRIMARY KEY (id);


--
-- Name: conditions br_conditions_pkey; Type: CONSTRAINT; Schema: building_reference; Owner: bendo01
--

ALTER TABLE ONLY building_reference.conditions
    ADD CONSTRAINT br_conditions_pkey PRIMARY KEY (id);


--
-- Name: room_types br_room_types_pkey; Type: CONSTRAINT; Schema: building_reference; Owner: bendo01
--

ALTER TABLE ONLY building_reference.room_types
    ADD CONSTRAINT br_room_types_pkey PRIMARY KEY (id);


--
-- Name: varieties br_varieties_pkey; Type: CONSTRAINT; Schema: building_reference; Owner: bendo01
--

ALTER TABLE ONLY building_reference.varieties
    ADD CONSTRAINT br_varieties_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict 3wiVnmcK6XXUYbdhUAw1ZHXfMvefHncbvVrbiz4e1UwPXKj0TWXMkaqkYrXkOff

