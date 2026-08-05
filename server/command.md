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