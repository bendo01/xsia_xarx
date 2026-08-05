--
-- PostgreSQL database dump
--

\restrict Xq1H4TQLrlAlMXIZ9kD7TjWgpFZPyvS1BnTC4B7HWKHaXFVJyTd48BQ92bSRRJg

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
-- Name: person_master; Type: SCHEMA; Schema: -; Owner: bendo01
--

CREATE SCHEMA person_master;


ALTER SCHEMA person_master OWNER TO bendo01;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: biodatas; Type: TABLE; Schema: person_master; Owner: bendo01
--

CREATE TABLE person_master.biodatas (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    height double precision DEFAULT '0'::double precision,
    weight double precision DEFAULT '0'::double precision,
    is_positive_blood_rhesus boolean DEFAULT false NOT NULL,
    blood_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    hair_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    hair_color_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    eye_color_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    individual_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    bust double precision DEFAULT '0'::double precision NOT NULL,
    waist double precision DEFAULT '0'::double precision NOT NULL,
    hip double precision DEFAULT '0'::double precision NOT NULL,
    arm_circumference double precision DEFAULT '0'::double precision NOT NULL,
    menarche_age integer DEFAULT 0 NOT NULL,
    menopause_age integer DEFAULT 0 NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) with time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    sync_at timestamp without time zone
);


ALTER TABLE person_master.biodatas OWNER TO bendo01;

--
-- Name: family_card_members; Type: TABLE; Schema: person_master; Owner: bendo01
--

CREATE TABLE person_master.family_card_members (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    family_card_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    individual_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    relative_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    relative_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) with time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    sync_at timestamp without time zone
);


ALTER TABLE person_master.family_card_members OWNER TO bendo01;

--
-- Name: family_cards; Type: TABLE; Schema: person_master; Owner: bendo01
--

CREATE TABLE person_master.family_cards (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code character varying(255),
    individual_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) with time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    sync_at timestamp without time zone
);


ALTER TABLE person_master.family_cards OWNER TO bendo01;

--
-- Name: images; Type: TABLE; Schema: person_master; Owner: bendo01
--

CREATE TABLE person_master.images (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    individual_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    filename character varying(255) NOT NULL,
    dir character varying(255) NOT NULL,
    mimetype character varying(255),
    size bigint,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    sync_at timestamp without time zone,
    deleted_at timestamp(0) without time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);


ALTER TABLE person_master.images OWNER TO bendo01;

--
-- Name: individuals; Type: TABLE; Schema: person_master; Owner: bendo01
--

CREATE TABLE person_master.individuals (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    front_title character varying(255),
    last_title character varying(255),
    birth_date date NOT NULL,
    birth_place character varying(255) NOT NULL,
    gender_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    religion_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    occupation_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    education_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    income_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    identification_type_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    marital_status_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    profession_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    age_classification_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    is_special_need boolean DEFAULT false NOT NULL,
    is_social_protection_card_recipient boolean DEFAULT false NOT NULL,
    is_deceased boolean DEFAULT false,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now(),
    deleted_at timestamp(0) with time zone,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    sync_at timestamp without time zone
);


ALTER TABLE person_master.individuals OWNER TO bendo01;

--
-- Name: biodatas pm_biodatas_pkey; Type: CONSTRAINT; Schema: person_master; Owner: bendo01
--

ALTER TABLE ONLY person_master.biodatas
    ADD CONSTRAINT pm_biodatas_pkey PRIMARY KEY (id);


--
-- Name: family_card_members pm_family_card_members_pkey; Type: CONSTRAINT; Schema: person_master; Owner: bendo01
--

ALTER TABLE ONLY person_master.family_card_members
    ADD CONSTRAINT pm_family_card_members_pkey PRIMARY KEY (id);


--
-- Name: family_cards pm_family_cards_pkey; Type: CONSTRAINT; Schema: person_master; Owner: bendo01
--

ALTER TABLE ONLY person_master.family_cards
    ADD CONSTRAINT pm_family_cards_pkey PRIMARY KEY (id);


--
-- Name: images pm_images_pkey; Type: CONSTRAINT; Schema: person_master; Owner: bendo01
--

ALTER TABLE ONLY person_master.images
    ADD CONSTRAINT pm_images_pkey PRIMARY KEY (id);


--
-- Name: individuals pm_individuals_pkey; Type: CONSTRAINT; Schema: person_master; Owner: bendo01
--

ALTER TABLE ONLY person_master.individuals
    ADD CONSTRAINT pm_individuals_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict Xq1H4TQLrlAlMXIZ9kD7TjWgpFZPyvS1BnTC4B7HWKHaXFVJyTd48BQ92bSRRJg

