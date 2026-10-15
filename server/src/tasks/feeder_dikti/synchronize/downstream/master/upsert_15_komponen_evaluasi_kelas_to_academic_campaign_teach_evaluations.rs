use chrono::Local;
use indicatif::{ProgressBar, ProgressStyle};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction,
    EntityTrait, IntoActiveModel, PaginatorTrait, QueryFilter, QueryOrder, QuerySelect,
    TransactionTrait,
};
use std::collections::HashMap;
use uuid::Uuid;

use crate::models::{
    academic::{
        campaign::transaction::{
            teach_evaluations as AcademicTeachEvaluation, teaches as AcademicTeach,
        },
        course::reference::evaluation_types as AcademicEvaluationType,
    },
    feeder::master::komponen_evaluasi_kelas as FeederKomponenEvaluasiKelas,
};
use super::sync_log::SyncLog;
use crate::tasks::Task;
use serde_json::json;

pub struct SyncKomponenEvaluasiKelasToTeachEvaluations;

struct ReferenceCache {
    evaluation_types_by_code: HashMap<i32, AcademicEvaluationType::Model>,
    teaches_by_feeder_id: HashMap<Uuid, AcademicTeach::Model>,
}

enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_teach_evaluation(
    txn: &DatabaseTransaction,
    record: &FeederKomponenEvaluasiKelas::Model,
    teach: &AcademicTeach::Model,
    evaluation_type: &AcademicEvaluationType::Model,
) -> Result<(AcademicTeachEvaluation::Model, UpsertAction), sea_orm::DbErr> {
    let existing = AcademicTeachEvaluation::Entity::find()
        .filter(AcademicTeachEvaluation::Column::FeederId.eq(record.id))
        .one(txn)
        .await?;

    let existing = match existing {
        Some(e) => Some(e),
        None => {
            let mut q = AcademicTeachEvaluation::Entity::find()
                .filter(AcademicTeachEvaluation::Column::TeachId.eq(teach.id))
                .filter(AcademicTeachEvaluation::Column::EvaluationTypeId.eq(evaluation_type.id));
            if let Some(thread) = record.nomor_urut {
                q = q.filter(AcademicTeachEvaluation::Column::Thread.eq(thread));
            }
            q.one(txn).await?
        }
    };

    let weight = record
        .bobot_evaluasi
        .as_ref()
        .and_then(|s| s.parse::<f32>().ok())
        .unwrap_or(0.0);
    let now = Local::now().naive_local();

    if let Some(existing) = existing {
        let mut active = existing.into_active_model();
        active.name = Set(record.nama.clone());
        active.english_name = Set(record.nama_inggris.clone());
        active.thread = Set(record.nomor_urut);
        active.evaluation_weight = Set(Some(weight));
        active.teach_id = Set(Some(teach.id));
        active.evaluation_type_id = Set(Some(evaluation_type.id));
        active.feeder_id = Set(Some(record.id));
        active.sync_at = Set(Some(now));
        active.updated_at = Set(Some(now));

        let updated = active.update(txn).await?;
        Ok((updated, UpsertAction::Updated))
    } else {
        let active = AcademicTeachEvaluation::ActiveModel {
            id: Set(Uuid::new_v4()),
            thread: Set(record.nomor_urut),
            name: Set(record.nama.clone()),
            english_name: Set(record.nama_inggris.clone()),
            evaluation_weight: Set(Some(weight)),
            evaluation_type_id: Set(Some(evaluation_type.id)),
            feeder_id: Set(Some(record.id)),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            sync_at: Set(Some(now)),
            teach_id: Set(Some(teach.id)),
            ..Default::default()
        };

        let inserted = active.insert(txn).await?;
        Ok((inserted, UpsertAction::Inserted))
    }
}

#[async_trait]
impl Task for SyncKomponenEvaluasiKelasToTeachEvaluations {
    fn name(&self) -> &str {
        "SyncKomponenEvaluasiKelasToTeachEvaluations"
    }

    fn description(&self) -> &str {
        "Synchronize Feeder Dikti komponen_evaluasi_kelas to academic_campaign_transaction teach_evaluations"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let show_progress = !args
            .iter()
            .any(|arg| arg == "--no-progress" || arg == "false");

        let mut sync_log = SyncLog::open("komponen_evaluasi", !show_progress)?;

        sync_log.info("Starting synchronization of komponen_evaluasi_kelas to teach_evaluations...")?;

        // Preload references
        let evaluation_types = AcademicEvaluationType::Entity::find().all(db).await?;
        let mut evaluation_types_by_code = HashMap::new();
        for et in evaluation_types {
            evaluation_types_by_code.insert(et.code, et);
        }

        let teaches = AcademicTeach::Entity::find().all(db).await?;
        let mut teaches_by_feeder_id = HashMap::new();
        for t in teaches {
            if let Some(fid) = t.feeder_id {
                teaches_by_feeder_id.insert(fid, t);
            }
        }

        let cache = ReferenceCache {
            evaluation_types_by_code,
            teaches_by_feeder_id,
        };

        let total_records = FeederKomponenEvaluasiKelas::Entity::find()
            .count(db)
            .await?;

        let pb = if show_progress {
            let pb = ProgressBar::new(total_records);
            pb.set_style(
                ProgressStyle::default_bar()
                    .template("[{elapsed_precise}] [{bar:40.cyan/blue}] {pos}/{len} ({eta}) {msg}")
                    .unwrap()
                    .progress_chars("#>-"),
            );
            Some(pb)
        } else {
            None
        };

        let batch_size: u64 = 1000;
        let mut offset: u64 = 0;
        let mut inserted = 0;
        let mut updated = 0;
        let mut skipped = 0;
        let mut errors = 0;

        loop {
            let batch = FeederKomponenEvaluasiKelas::Entity::find()
                .order_by_asc(FeederKomponenEvaluasiKelas::Column::Id)
                .offset(offset)
                .limit(batch_size)
                .all(db)
                .await?;

            if batch.is_empty() {
                break;
            }

            for record in batch {
                let txn = match db.begin().await {
                    Ok(tx) => tx,
                    Err(e) => {
                        sync_log.record_error(&record, &format!("Failed to begin transaction: {}", e))?;
                        errors += 1;
                        continue;
                    }
                };

                let jenis_evaluasi_code = match record.id_jenis_evaluasi {
                    Some(c) => c,
                    None => {
                        let _ = txn.rollback().await;
                        sync_log.skip(&record, "missing_id_jenis_evaluasi", json!({}), "Missing id_jenis_evaluasi")?;
                        skipped += 1;
                        if let Some(ref p) = pb {
                            p.inc(1);
                        }
                        continue;
                    }
                };

                let evaluation_type = match cache.evaluation_types_by_code.get(&jenis_evaluasi_code) {
                    Some(et) => et,
                    None => {
                        let _ = txn.rollback().await;
                        sync_log.skip(&record, "evaluation_type_not_found", json!({"code": jenis_evaluasi_code}), &format!("Evaluation type not found for code {}", jenis_evaluasi_code))?;
                        skipped += 1;
                        if let Some(ref p) = pb {
                            p.inc(1);
                        }
                        continue;
                    }
                };

                let kelas_kuliah_id = match record.id_kelas_kuliah {
                    Some(id) => id,
                    None => {
                        let _ = txn.rollback().await;
                        sync_log.skip(&record, "missing_id_kelas_kuliah", json!({}), "Missing id_kelas_kuliah")?;
                        skipped += 1;
                        if let Some(ref p) = pb {
                            p.inc(1);
                        }
                        continue;
                    }
                };

                let teach = match cache.teaches_by_feeder_id.get(&kelas_kuliah_id) {
                    Some(t) => t,
                    None => {
                        let _ = txn.rollback().await;
                        sync_log.skip(&record, "teach_not_found", json!({"id_kelas_kuliah": kelas_kuliah_id}), &format!("Teach class not found for feeder id {}", kelas_kuliah_id))?;
                        skipped += 1;
                        if let Some(ref p) = pb {
                            p.inc(1);
                        }
                        continue;
                    }
                };

                match upsert_teach_evaluation(&txn, &record, teach, evaluation_type).await {
                    Ok((_, action)) => {
                        if let Err(e) = txn.commit().await {
                            sync_log.record_error(&record, &format!("Failed to commit transaction: {}", e))?;
                            errors += 1;
                        } else {
                            match action {
                                UpsertAction::Inserted => inserted += 1,
                                UpsertAction::Updated => updated += 1,
                            }
                        }
                    }
                    Err(e) => {
                        let _ = txn.rollback().await;
                        sync_log.record_error(&record, &format!("Failed to upsert teach evaluation: {}", e))?;
                        errors += 1;
                    }
                }

                if let Some(ref p) = pb {
                    p.inc(1);
                    p.set_message(format!(
                        "inserted: {} | updated: {} | skipped: {} | errors: {}",
                        inserted, updated, skipped, errors
                    ));
                }
            }

            offset += batch_size;
        }

        if let Some(ref p) = pb {
            p.finish_with_message(format!(
                "Sync completed - inserted: {} | updated: {} | skipped: {} | errors: {} (see {})",
                inserted, updated, skipped, errors, sync_log.text_path
            ));
        }

        sync_log.summary(inserted, updated, skipped, errors)?;

        Ok(())
    }
}
