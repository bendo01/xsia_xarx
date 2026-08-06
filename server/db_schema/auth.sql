--
-- PostgreSQL database dump
--

\restrict jBGdvSKHxc5tJ3Uc7ZfosqUZEiCfGmgQcFUdJxtPhPx5bKBNts76c3ZPVONdefy

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
-- Name: auth; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: permission_position_type; Type: TABLE; Schema: auth; Owner: bendo01
--

CREATE TABLE auth.permission_position_type (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    permission_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    position_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE auth.permission_position_type OWNER TO bendo01;

--
-- Name: permission_user; Type: TABLE; Schema: auth; Owner: bendo01
--

CREATE TABLE auth.permission_user (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    user_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    permission_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE auth.permission_user OWNER TO bendo01;

--
-- Name: permissions; Type: TABLE; Schema: auth; Owner: bendo01
--

CREATE TABLE auth.permissions (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    name character varying(255) NOT NULL,
    uri text,
    is_open boolean DEFAULT false,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE auth.permissions OWNER TO bendo01;

--
-- Name: roles; Type: TABLE; Schema: auth; Owner: bendo01
--

CREATE TABLE auth.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    user_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    position_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp(6) without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    roleable_id uuid,
    roleable_type character varying(255)
);


ALTER TABLE auth.roles OWNER TO bendo01;

--
-- Name: user_position_type; Type: TABLE; Schema: auth; Owner: bendo01
--

CREATE TABLE auth.user_position_type (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    user_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    position_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE auth.user_position_type OWNER TO bendo01;

--
-- Name: users; Type: TABLE; Schema: auth; Owner: bendo01
--

CREATE TABLE auth.users (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    remember_token character varying(100),
    individual_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    is_active boolean DEFAULT true,
    current_role_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    pid uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    api_key character varying,
    reset_token character varying,
    email_verification_token character varying,
    reset_sent_at timestamp(6) without time zone,
    email_verification_sent_at timestamp(6) without time zone,
    magic_link_token character varying,
    magic_link_expiration timestamp(6) without time zone,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE auth.users OWNER TO bendo01;

--
-- Name: verifications; Type: TABLE; Schema: auth; Owner: bendo01
--

CREATE TABLE auth.verifications (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    email character varying(255),
    token character varying(255) NOT NULL,
    is_password_recovery boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE auth.verifications OWNER TO bendo01;

--
-- Name: permission_position_type auth_permission_position_type_pkey; Type: CONSTRAINT; Schema: auth; Owner: bendo01
--

ALTER TABLE ONLY auth.permission_position_type
    ADD CONSTRAINT auth_permission_position_type_pkey PRIMARY KEY (id);


--
-- Name: permission_user auth_permission_user_pkey; Type: CONSTRAINT; Schema: auth; Owner: bendo01
--

ALTER TABLE ONLY auth.permission_user
    ADD CONSTRAINT auth_permission_user_pkey PRIMARY KEY (id);


--
-- Name: permissions auth_permissions_pkey; Type: CONSTRAINT; Schema: auth; Owner: bendo01
--

ALTER TABLE ONLY auth.permissions
    ADD CONSTRAINT auth_permissions_pkey PRIMARY KEY (id);


--
-- Name: user_position_type auth_user_position_type_pkey; Type: CONSTRAINT; Schema: auth; Owner: bendo01
--

ALTER TABLE ONLY auth.user_position_type
    ADD CONSTRAINT auth_user_position_type_pkey PRIMARY KEY (id);


--
-- Name: users auth_users_pkey; Type: CONSTRAINT; Schema: auth; Owner: bendo01
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT auth_users_pkey PRIMARY KEY (id);


--
-- Name: verifications auth_verifications_pkey; Type: CONSTRAINT; Schema: auth; Owner: bendo01
--

ALTER TABLE ONLY auth.verifications
    ADD CONSTRAINT auth_verifications_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: auth; Owner: bendo01
--

ALTER TABLE ONLY auth.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: uq_permission_position_active; Type: INDEX; Schema: auth; Owner: bendo01
--

CREATE UNIQUE INDEX uq_permission_position_active ON auth.permission_position_type USING btree (permission_id, position_type_id) WHERE (deleted_at IS NULL);


--
-- PostgreSQL database dump complete
--

\unrestrict jBGdvSKHxc5tJ3Uc7ZfosqUZEiCfGmgQcFUdJxtPhPx5bKBNts76c3ZPVONdefy

