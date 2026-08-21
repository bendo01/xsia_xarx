use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod buildings;
pub mod rooms;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("buildings")
                .get_named("building.master.buildings.list_buildings", buildings::list_buildings)
                .post_named("building.master.buildings.create_building", buildings::create_building)
                .push(
                    Router::with_path("{id}")
                        .get_named("building.master.buildings.get_building", buildings::get_building)
                        .put_named("building.master.buildings.update_building", buildings::update_building)
                        .delete_named("building.master.buildings.delete_building", buildings::delete_building),
                ),
        )
        .push(
            Router::with_path("rooms")
                .get_named("building.master.rooms.list_rooms", rooms::list_rooms)
                .post_named("building.master.rooms.create_room", rooms::create_room)
                .push(
                    Router::with_path("{id}")
                        .get_named("building.master.rooms.get_room", rooms::get_room)
                        .put_named("building.master.rooms.update_room", rooms::update_room)
                        .delete_named("building.master.rooms.delete_room", rooms::delete_room),
                ),
        )
}
