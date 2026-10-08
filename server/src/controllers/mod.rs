pub mod literate;
pub mod location;
pub mod person;
pub mod institution;
pub mod building;
pub mod contact;
pub mod document;
pub mod academic;
pub mod feeder;
pub mod auth;
pub mod realtime;

use salvo::Router;

/// All API controller routers, mounted under `api/v1`
pub fn api_routers() -> Vec<Router> {
    vec![
        person::router(),
        literate::router(),
        location::router(),
        institution::router(),
        building::router(),
        contact::router(),
        document::router(),
        academic::router(),
        feeder::router(),
        auth::router(),
        realtime::router(),
    ]
}
