# Migration

## Generate Migration
```sh
sea-orm-cli migrate generate -d ./migration/src/auth -s auth schema_auth_table_verifications
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

