use salvo::prelude::*;

pub mod buildings;
pub mod rooms;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("buildings")
                .get(buildings::list_buildings)
                .post(buildings::create_building)
                .push(
                    Router::with_path("{id}")
                        .get(buildings::get_building)
                        .put(buildings::update_building)
                        .delete(buildings::delete_building),
                ),
        )
        .push(
            Router::with_path("rooms")
                .get(rooms::list_rooms)
                .post(rooms::create_room)
                .push(
                    Router::with_path("{id}")
                        .get(rooms::get_room)
                        .put(rooms::update_room)
                        .delete(rooms::delete_room),
                ),
        )
}
