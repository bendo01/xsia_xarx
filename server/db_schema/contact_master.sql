--
-- PostgreSQL database dump
--

\restrict N9ZldDju5OGyxPdChp5rnAoepeu5zIzTouHnJck68m6LiwZxKx7jkkETI80dZdK

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
-- Name: contact_master; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA contact_master;


ALTER SCHEMA contact_master OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: electronic_mails; Type: TABLE; Schema: contact_master; Owner: bendo01
--

CREATE TABLE contact_master.electronic_mails (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    email_address character varying(255) NOT NULL,
    electronic_mail_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    electronic_mailable_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    electronic_mailable_type character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE contact_master.electronic_mails OWNER TO bendo01;

--
-- Name: phones; Type: TABLE; Schema: contact_master; Owner: bendo01
--

CREATE TABLE contact_master.phones (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    phone_number character varying(255) NOT NULL,
    phone_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    phoneable_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    phoneable_type character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE contact_master.phones OWNER TO bendo01;

--
-- Name: residences; Type: TABLE; Schema: contact_master; Owner: bendo01
--

CREATE TABLE contact_master.residences (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    street character varying(255) NOT NULL,
    citizens_association integer DEFAULT 0 NOT NULL,
    neighborhood_association integer DEFAULT 0 NOT NULL,
    province_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    regency_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    sub_district_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    village_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    residence_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    residenceable_type character varying(255),
    residenceable_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    latitude double precision,
    longitude double precision,
    zoom integer,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE contact_master.residences OWNER TO bendo01;

--
-- Name: websites; Type: TABLE; Schema: contact_master; Owner: bendo01
--

CREATE TABLE contact_master.websites (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    website_url character varying(255) NOT NULL,
    website_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    websiteable_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    websiteable_type character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) without time zone,
    sync_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE contact_master.websites OWNER TO bendo01;

--
-- Name: electronic_mails cm_electronic_mails_pkey; Type: CONSTRAINT; Schema: contact_master; Owner: bendo01
--

ALTER TABLE ONLY contact_master.electronic_mails
    ADD CONSTRAINT cm_electronic_mails_pkey PRIMARY KEY (id);


--
-- Name: phones cm_phones_pkey; Type: CONSTRAINT; Schema: contact_master; Owner: bendo01
--

ALTER TABLE ONLY contact_master.phones
    ADD CONSTRAINT cm_phones_pkey PRIMARY KEY (id);


--
-- Name: residences cm_residences_pkey; Type: CONSTRAINT; Schema: contact_master; Owner: bendo01
--

ALTER TABLE ONLY contact_master.residences
    ADD CONSTRAINT cm_residences_pkey PRIMARY KEY (id);


--
-- Name: websites cm_websites_pkey; Type: CONSTRAINT; Schema: contact_master; Owner: bendo01
--

ALTER TABLE ONLY contact_master.websites
    ADD CONSTRAINT cm_websites_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict N9ZldDju5OGyxPdChp5rnAoepeu5zIzTouHnJck68m6LiwZxKx7jkkETI80dZdK

