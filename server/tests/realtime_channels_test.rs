use uuid::Uuid;
use xsia_xarx::controllers::realtime::{is_allowed_channel, publish_event, HUB};

#[test]
fn allows_only_teach_and_activity_uuid_channels() {
    let id = Uuid::new_v4();
    assert!(is_allowed_channel(&format!("teach:{id}")));
    assert!(is_allowed_channel(&format!("activity:{id}")));
    assert!(!is_allowed_channel("general"));
    assert!(!is_allowed_channel("teach:not-a-uuid"));
    assert!(!is_allowed_channel(&format!("admin:{id}")));
    assert!(!is_allowed_channel(""));
}

#[tokio::test]
async fn publish_event_reaches_subscribers_with_message_envelope() {
    let chan = format!("teach:{}", Uuid::new_v4());
    let mut rx = HUB.get_or_create(&chan).subscribe();

    let delivered = publish_event(&chan, serde_json::json!({ "type": "seat_changed", "enrolled_count": 3 }));
    assert_eq!(delivered, 1);

    let raw = rx.recv().await.unwrap();
    let v: serde_json::Value = serde_json::from_str(&raw).unwrap();
    assert_eq!(v["event"], "message");
    assert_eq!(v["channel"], chan);
    assert_eq!(v["data"]["enrolled_count"], 3);
}

#[test]
fn publish_without_subscribers_is_noop() {
    assert_eq!(publish_event(&format!("teach:{}", Uuid::new_v4()), serde_json::json!({})), 0);
}
