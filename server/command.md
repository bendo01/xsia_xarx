# Migration

## Generate Migration

```sh
sea-orm-cli migrate generate -d ./migration/src/auth -s auth schema_auth_table_verifications
```

## generate models

```sh
sea-orm-cli generate entity --database-url "postgres://bendo01:talaso@localhost:5432/xsia_rust_v1" --database-schema "academic_campaign_reference" --output-dir "./src/models/academic_campaign/reference"
```

## Refresh Migration

```sh
sea-orm-cli migrate refresh
```

## Gemini command create migration

```sh
@directory:server/migration/src/person/master except @file:server/migration/src/person/master/m20260805_065007_schema_person_master_table_biodatas.rs

create migration sea-orm 2 format based on @file:server/person_master.sql

use reference on @directory:server/migration/src/auth and

@directory:server/migration/src/person/reference

```

```sh
@directory:server/migration/src/institution/reference
create migration sea-orm 2 format based on @file:server/institution_reference.sql

use reference on @directory:server/migration/src/auth and
@directory:server/migration/src/person/reference
```

i want to run sea-orm cli that generate migration
on folder @directory:server/migration/src/feeder

which i run it like this

```sh
sea-orm-cli migrate generate -d ./migration/src/feeder schema_SchemaName_table_TableName
```

generate one migration for each schema in @directory:server/migration/src/feeder based on

these files

@file:server/db_schema/feeder_akumulasi.sql

where created migration on @directory: ./migration/src/feeder/akumulasi

@file:server/db_schema/feeder_akun.sql

where created migration on @directory: ./migration/src/feeder/akun

@file:server/db_schema/feeder_master.sql

where created migration on @directory: ./migration/src/feeder/master

@file:server/db_schema/feeder_referensi.sql

where created migration on @directory: ./migration/src/feeder/referensi

@file:server/db_schema/feeder_rekapitulasi.sql

where created migration on @directory: ./migration/src/feeder/rekapitulasi

example

@file:server/db_schema/feeder_akumulasi.sql

where generated migration on @directory: ./migration/src/feeder/akumulasi

```sh
sea-orm-cli migrate generate -d ./migration/src/feeder/akumulasi schema_feeder_akumulasi_table_estimasi
```

```sh
sea-orm-cli migrate generate -d ./migration/src/feeder/akumulasi schema_feeder_akumulasi_table_jumlah_data
```

## OpenWaSender

```rust
let sender = OpenWaSender::new(openwa_config);
sender.send_message("628123456789", "Hello from xsia_xarx!").await?;

sender.register_webhook(
    "https://api.xsia.app/webhook/openwa", 
    vec!["message.received", "session.status"], 
    "your-hmac-secret"
).await?;
```

## update auth role name based on institution position_types name

```sql
UPDATE auth.roles r
SET name = pt.name,
    updated_at = NOW()
FROM institution_reference.position_types pt
WHERE r.position_type_id = pt.id
  AND r.name IS DISTINCT FROM pt.name;
```

## update auth role name based on mapped position name and role name

```sql
UPDATE auth.roles r
SET name = mapping.role_name,
    updated_at = NOW()
FROM (
  VALUES
    ('Mahasiswa', 'Mahasiswa'),
    ('Kandidat Mahasiswa', 'Kandidat Mahasiswa'),
    ('Dosen', 'Dosen'),
    ('Kepala Program Studi', 'Program Studi'),
    ('Panitia PMB', 'Panitia PMB'),
    ('Dekan', 'Fakultas'),
    ('Wakil Dekan 1 Akademik', 'Fakultas'),
    ('Anggota Lembaga Penerimaan Mahasiswa Baru', 'Panitia PMB'),
    ('Kepala Pengembangan Teknologi Informasi', 'Rektorat'),
    ('Wakil Ketua Yayasan', 'Rektorat'),
    ('Ketua Yayasan', 'Rektorat'),
    ('Administrator', 'Administrator'),
    ('Staff Administrasi Keuangan', 'Rektorat'),
    ('Wakil Rektor I Akademik', 'Rektorat'),
    ('Rektor', 'Rektorat'),
    ('Kepala Biro Administrasi Akademik dan Kemahasiswaan', 'Rektorat')
) AS mapping(pos_name, role_name)
JOIN institution_reference.position_types pt ON pt.name = mapping.pos_name
WHERE r.position_type_id = pt.id
  AND r.name IS DISTINCT FROM mapping.role_name;
```

```sql
SELECT id, name, user_id, position_type_id, created_at, updated_at, sync_at, deleted_at, created_by, updated_by, roleable_id, roleable_type
 FROM auth.roles
 WHERE roleable_id = '20fc46ee-3696-4ee8-941a-bed725a4930c';
```
