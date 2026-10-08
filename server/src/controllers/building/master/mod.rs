use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod buildings;
pub mod rooms;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("buildings")
                .get_named("building.master.buildings.index", buildings::index)
                .post_named("building.master.buildings.store", buildings::store)
                .push(
                    Router::with_path("options")
                        .post_named("building.master.buildings.option_select", buildings::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("building.master.buildings.show", buildings::show)
                        .put_named("building.master.buildings.update", buildings::update)
                        .delete_named("building.master.buildings.delete", buildings::delete),
                ),
        )
        .push(
            Router::with_path("rooms")
                .get_named("building.master.rooms.index", rooms::index)
                .post_named("building.master.rooms.store", rooms::store)
                .push(
                    Router::with_path("options")
                        .post_named("building.master.rooms.option_select", rooms::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("building.master.rooms.show", rooms::show)
                        .put_named("building.master.rooms.update", rooms::update)
                        .delete_named("building.master.rooms.delete", rooms::delete),
                ),
        )
}
