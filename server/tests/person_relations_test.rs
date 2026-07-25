use sea_orm::*;
use xsia_xarx::db::connect_db;
use xsia_xarx::models::person::master::{biodata, individual};
use xsia_xarx::models::person::reference::{
    age_classification, blood_type, eye_color, gender, hair_color, hair_type, identification_type,
    income, marital_status, occupation, profession, relative_type, religion,
};

#[tokio::test]
async fn test_person_reference_queries() {
    let db = connect_db()
        .await
        .expect("Failed to connect to the database");

    let genders = gender::Entity::find()
        .all(&db)
        .await
        .expect("Failed to fetch genders");
    println!("Fetched {} genders.", genders.len());

    let religions = religion::Entity::find()
        .all(&db)
        .await
        .expect("Failed to fetch religions");
    println!("Fetched {} religions.", religions.len());

    let occupations = occupation::Entity::find()
        .all(&db)
        .await
        .expect("Failed to fetch occupations");
    println!("Fetched {} occupations.", occupations.len());

    let incomes = income::Entity::find()
        .all(&db)
        .await
        .expect("Failed to fetch incomes");
    println!("Fetched {} incomes.", incomes.len());

    let id_types = identification_type::Entity::find()
        .all(&db)
        .await
        .expect("Failed to fetch identification types");
    println!("Fetched {} identification types.", id_types.len());

    let marital_statuses = marital_status::Entity::find()
        .all(&db)
        .await
        .expect("Failed to fetch marital statuses");
    println!("Fetched {} marital statuses.", marital_statuses.len());

    let professions = profession::Entity::find()
        .all(&db)
        .await
        .expect("Failed to fetch professions");
    println!("Fetched {} professions.", professions.len());

    let age_classes = age_classification::Entity::find()
        .all(&db)
        .await
        .expect("Failed to fetch age classifications");
    println!("Fetched {} age classifications.", age_classes.len());

    let blood_types = blood_type::Entity::find()
        .all(&db)
        .await
        .expect("Failed to fetch blood types");
    println!("Fetched {} blood types.", blood_types.len());

    let hair_types = hair_type::Entity::find()
        .all(&db)
        .await
        .expect("Failed to fetch hair types");
    println!("Fetched {} hair types.", hair_types.len());

    let hair_colors = hair_color::Entity::find()
        .all(&db)
        .await
        .expect("Failed to fetch hair colors");
    println!("Fetched {} hair colors.", hair_colors.len());

    let eye_colors = eye_color::Entity::find()
        .all(&db)
        .await
        .expect("Failed to fetch eye colors");
    println!("Fetched {} eye colors.", eye_colors.len());

    let relative_types = relative_type::Entity::find()
        .all(&db)
        .await
        .expect("Failed to fetch relative types");
    println!("Fetched {} relative types.", relative_types.len());
}

#[tokio::test]
async fn test_individual_master_relations() {
    let db = connect_db()
        .await
        .expect("Failed to connect to the database");

    // Fetch individuals with their gender relation
    let ind_genders = individual::Entity::find()
        .limit(100)
        .find_also_related(gender::Entity)
        .all(&db)
        .await
        .expect("Failed to fetch individuals with gender");
    println!("Fetched {} individuals with gender relation.", ind_genders.len());

    // Fetch individuals with their religion relation
    let ind_religions = individual::Entity::find()
        .limit(100)
        .find_also_related(religion::Entity)
        .all(&db)
        .await
        .expect("Failed to fetch individuals with religion");
    println!(
        "Fetched {} individuals with religion relation.",
        ind_religions.len()
    );

    // Fetch individuals with their marital status relation
    let ind_marital = individual::Entity::find()
        .limit(100)
        .find_also_related(marital_status::Entity)
        .all(&db)
        .await
        .expect("Failed to fetch individuals with marital status");
    println!(
        "Fetched {} individuals with marital status relation.",
        ind_marital.len()
    );

    // Fetch genders with associated individuals (HasMany)
    let genders_with_inds = gender::Entity::find()
        .find_with_related(individual::Entity)
        .all(&db)
        .await
        .expect("Failed to fetch genders with individuals");
    println!(
        "Fetched {} genders with associated individuals.",
        genders_with_inds.len()
    );
}

#[tokio::test]
async fn test_biodata_master_relations() {
    let db = connect_db()
        .await
        .expect("Failed to connect to the database");

    // Fetch biodatas with individual relation
    let biodatas_ind = biodata::Entity::find()
        .find_also_related(individual::Entity)
        .all(&db)
        .await
        .expect("Failed to fetch biodatas with individual");
    println!("Fetched {} biodatas with individual relation.", biodatas_ind.len());

    // Fetch biodatas with blood type relation
    let biodatas_blood = biodata::Entity::find()
        .find_also_related(blood_type::Entity)
        .all(&db)
        .await
        .expect("Failed to fetch biodatas with blood type");
    println!(
        "Fetched {} biodatas with blood type relation.",
        biodatas_blood.len()
    );

    // Fetch blood types with associated biodatas (HasMany)
    let blood_types_biodata = blood_type::Entity::find()
        .find_with_related(biodata::Entity)
        .all(&db)
        .await
        .expect("Failed to fetch blood types with biodatas");
    println!(
        "Fetched {} blood types with associated biodatas.",
        blood_types_biodata.len()
    );
}
