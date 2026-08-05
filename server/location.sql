--
-- PostgreSQL database dump
--

\restrict kaOUJZrIp3e43Au8O9TUaDVfj62pmzsEH6H0ReIkH1bAaJpfmDTUfnowrmWwMJg

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
-- Name: location; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA location;


ALTER SCHEMA location OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: continents; Type: TABLE; Schema: location; Owner: bendo01
--

CREATE TABLE location.continents (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0,
    alphabet_code character varying(255) DEFAULT NULL::character varying NOT NULL,
    name character varying(255) DEFAULT NULL::character varying NOT NULL,
    slug character varying(255) DEFAULT NULL::character varying,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE location.continents OWNER TO bendo01;

--
-- Name: countries; Type: TABLE; Schema: location; Owner: bendo01
--

CREATE TABLE location.countries (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    alpha2_code character varying(255) NOT NULL,
    alpha3_code character varying(255) NOT NULL,
    iso3166_2_code character varying(255) NOT NULL,
    dikti_code character varying(255) DEFAULT NULL::character varying,
    continent_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    region_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    slug character varying(255),
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE location.countries OWNER TO bendo01;

--
-- Name: provinces; Type: TABLE; Schema: location; Owner: bendo01
--

CREATE TABLE location.provinces (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code character varying(255) DEFAULT NULL::character varying,
    name character varying(255),
    dikti_code character varying(255) DEFAULT NULL::character varying,
    epsbed_code character varying(255) DEFAULT NULL::character varying,
    slug character varying(255) DEFAULT NULL::character varying,
    description text,
    alt_slug character varying(255) DEFAULT NULL::character varying,
    state_ministry_code character varying(255) DEFAULT NULL::character varying,
    state_ministry_full_code character varying(255) DEFAULT NULL::character varying,
    state_post_department_code character varying(255) DEFAULT NULL::character varying,
    state_ministry_name character varying(255) DEFAULT NULL::character varying,
    dikti_name character varying(255) DEFAULT NULL::character varying,
    validation_code character varying(255) DEFAULT NULL::character varying,
    latitude double precision DEFAULT 0,
    longitude double precision DEFAULT 0,
    zoom integer DEFAULT 0,
    country_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE location.provinces OWNER TO bendo01;

--
-- Name: regencies; Type: TABLE; Schema: location; Owner: bendo01
--

CREATE TABLE location.regencies (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code character varying(255) DEFAULT NULL::character varying,
    name character varying(255),
    dikti_code character varying(255) DEFAULT NULL::character varying,
    epsbed_code character varying(255) DEFAULT NULL::character varying,
    province_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    regency_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    slug character varying(255) DEFAULT NULL::character varying,
    description text,
    alt_slug character varying(255) DEFAULT NULL::character varying,
    state_ministry_code character varying(255) DEFAULT NULL::character varying,
    state_ministry_full_code character varying(255) DEFAULT NULL::character varying,
    state_post_department_code character varying(255) DEFAULT NULL::character varying,
    state_ministry_name character varying(255) DEFAULT NULL::character varying,
    dikti_name character varying(255) DEFAULT NULL::character varying,
    validation_code character varying(255) DEFAULT NULL::character varying,
    latitude double precision DEFAULT 0,
    longitude double precision DEFAULT 0,
    zoom integer DEFAULT 0,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE location.regencies OWNER TO bendo01;

--
-- Name: regency_types; Type: TABLE; Schema: location; Owner: bendo01
--

CREATE TABLE location.regency_types (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE location.regency_types OWNER TO bendo01;

--
-- Name: regions; Type: TABLE; Schema: location; Owner: bendo01
--

CREATE TABLE location.regions (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code integer DEFAULT 0,
    alphabet_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) DEFAULT NULL::character varying,
    alt_slug character varying(255) DEFAULT NULL::character varying,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE location.regions OWNER TO bendo01;

--
-- Name: sub_districts; Type: TABLE; Schema: location; Owner: bendo01
--

CREATE TABLE location.sub_districts (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    dikti_code character varying(255) DEFAULT NULL::character varying,
    regency_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    slug character varying(255) DEFAULT NULL::character varying,
    alt_slug character varying(255) DEFAULT NULL::character varying,
    state_ministry_code character varying(255) DEFAULT NULL::character varying,
    state_ministry_full_code character varying(255) DEFAULT NULL::character varying,
    state_post_department_code character varying(255) DEFAULT NULL::character varying,
    state_ministry_name character varying(255) DEFAULT NULL::character varying,
    dikti_name character varying(255) DEFAULT NULL::character varying,
    validation_code character varying(255) DEFAULT NULL::character varying,
    agriculture_department_name character varying(255) DEFAULT NULL::character varying,
    latitude double precision DEFAULT 0,
    longitude double precision DEFAULT 0,
    zoom integer DEFAULT 0,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE location.sub_districts OWNER TO bendo01;

--
-- Name: villages; Type: TABLE; Schema: location; Owner: bendo01
--

CREATE TABLE location.villages (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code character varying(255) DEFAULT NULL::character varying NOT NULL,
    name character varying(255) DEFAULT NULL::character varying NOT NULL,
    sub_district_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    slug character varying(255) DEFAULT NULL::character varying,
    alt_slug character varying(255) DEFAULT NULL::character varying,
    state_ministry_code character varying(255) DEFAULT NULL::character varying,
    state_post_department_code character varying(255) DEFAULT NULL::character varying,
    state_ministry_name character varying(255) DEFAULT NULL::character varying,
    dikti_name character varying(255) DEFAULT NULL::character varying,
    dikti_code character varying(255),
    latitude double precision DEFAULT 0,
    longitude double precision DEFAULT 0,
    zoom integer DEFAULT 0,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE location.villages OWNER TO bendo01;

--
-- Name: continents location_continents_pkey; Type: CONSTRAINT; Schema: location; Owner: bendo01
--

ALTER TABLE ONLY location.continents
    ADD CONSTRAINT location_continents_pkey PRIMARY KEY (id);


--
-- Name: countries location_countries_pkey; Type: CONSTRAINT; Schema: location; Owner: bendo01
--

ALTER TABLE ONLY location.countries
    ADD CONSTRAINT location_countries_pkey PRIMARY KEY (id);


--
-- Name: provinces location_provinces_pkey; Type: CONSTRAINT; Schema: location; Owner: bendo01
--

ALTER TABLE ONLY location.provinces
    ADD CONSTRAINT location_provinces_pkey PRIMARY KEY (id);


--
-- Name: regencies location_regencies_pkey; Type: CONSTRAINT; Schema: location; Owner: bendo01
--

ALTER TABLE ONLY location.regencies
    ADD CONSTRAINT location_regencies_pkey PRIMARY KEY (id);


--
-- Name: regency_types location_regency_types_pkey; Type: CONSTRAINT; Schema: location; Owner: bendo01
--

ALTER TABLE ONLY location.regency_types
    ADD CONSTRAINT location_regency_types_pkey PRIMARY KEY (id);


--
-- Name: regions location_regions_pkey; Type: CONSTRAINT; Schema: location; Owner: bendo01
--

ALTER TABLE ONLY location.regions
    ADD CONSTRAINT location_regions_pkey PRIMARY KEY (id);


--
-- Name: sub_districts location_sub_districts_pkey; Type: CONSTRAINT; Schema: location; Owner: bendo01
--

ALTER TABLE ONLY location.sub_districts
    ADD CONSTRAINT location_sub_districts_pkey PRIMARY KEY (id);


--
-- Name: villages location_villages_pkey; Type: CONSTRAINT; Schema: location; Owner: bendo01
--

ALTER TABLE ONLY location.villages
    ADD CONSTRAINT location_villages_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict kaOUJZrIp3e43Au8O9TUaDVfj62pmzsEH6H0ReIkH1bAaJpfmDTUfnowrmWwMJg

