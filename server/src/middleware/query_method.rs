use salvo::http::Method;
use salvo::prelude::*;

/// Support for the HTTP `QUERY` method (safe + idempotent read carrying its filters in a JSON body).
///
/// Hooped on every named route (see `NamedRouterExt::named`; Salvo matches routes before service hoops run): a `QUERY` request is turned into the equivalent `GET`. The JSON object body is
/// merged into the query string parameters, so every existing GET handler (and its RBAC permission,
/// which maps GET to `read`) serves it unchanged. Arrays are sent as comma separated values, matching
/// the existing `*_ids` query conventions.
pub struct QueryMethod;

#[async_trait]
impl Handler for QueryMethod {
    async fn handle(
        &self,
        req: &mut Request,
        depot: &mut Depot,
        res: &mut Response,
        ctrl: &mut FlowCtrl,
    ) {
        if req.method().as_str() == "QUERY" {
            if let Ok(bytes) = req.payload().await {
                let bytes = bytes.clone();
                if let Ok(serde_json::Value::Object(map)) = serde_json::from_slice::<serde_json::Value>(&bytes) {
                    let queries = req.queries_mut();
                    for (key, value) in map {
                        let text = match value {
                            serde_json::Value::Null => continue,
                            serde_json::Value::String(s) => s,
                            serde_json::Value::Array(items) => items
                                .iter()
                                .map(|v| v.as_str().map(str::to_owned).unwrap_or_else(|| v.to_string()))
                                .collect::<Vec<_>>()
                                .join(","),
                            other => other.to_string(),
                        };
                        queries.insert(key, text);
                    }
                }
            }
            *req.method_mut() = Method::GET;
        }
        ctrl.call_next(req, depot, res).await;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use salvo::test::{ResponseExt, TestClient};

    #[handler]
    async fn echo(req: &mut Request) -> String {
        format!(
            "{}|{:?}|{:?}|{:?}",
            req.method(),
            req.query::<String>("name"),
            req.query::<u64>("page"),
            req.query::<String>("ids")
        )
    }

    #[tokio::test]
    async fn query_body_becomes_get_query_params() {
        let router = Router::new().push(
            Router::with_path("x")
                .hoop(QueryMethod)
                .filter_fn(|req, _| req.method() == Method::GET || req.method().as_str() == "QUERY")
                .goal(echo),
        );
        let service = Service::new(router);
        let mut res = TestClient::query("http://127.0.0.1/x")
            .json(&serde_json::json!({"name":"a","page":2,"ids":["1","2"],"skip":null}))
            .send(&service)
            .await;
        assert_eq!(
            res.take_string().await.unwrap(),
            "GET|Some(\"a\")|Some(2)|Some(\"1,2\")"
        );
    }
}
