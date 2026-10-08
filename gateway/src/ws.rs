use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;

use axum::extract::ws::{Message, WebSocket};
use axum::extract::{Query, State, WebSocketUpgrade};
use axum::response::IntoResponse;
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use tokio::sync::mpsc;
use tracing::{info, warn};
use uuid::Uuid;

use crate::config::GatewayConfig;
use crate::protocol::{ClientMsg, ServerMsg};
use crate::ssh::{self, ShellWriter};

static ACTIVE: AtomicUsize = AtomicUsize::new(0);

#[derive(Deserialize)]
pub struct SessionQuery {
    #[serde(default)]
    pub token: String,
}

pub async fn session_handler(
    ws: WebSocketUpgrade,
    State(cfg): State<Arc<GatewayConfig>>,
    Query(q): Query<SessionQuery>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| run_session(socket, cfg, q.token))
}

async fn send(
    sink: &mut futures_util::stream::SplitSink<WebSocket, Message>,
    msg: ServerMsg,
) -> Result<(), axum::Error> {
    let text =
        serde_json::to_string(&msg).unwrap_or_else(|_| r#"{"type":"error","message":"encode"}"#.into());
    sink.send(Message::Text(text.into())).await
}

async fn run_session(socket: WebSocket, cfg: Arc<GatewayConfig>, token: String) {
    let (mut sink, mut stream) = socket.split();

    if !cfg.enabled {
        let _ = send(
            &mut sink,
            ServerMsg::Error {
                message: "gateway disabled".into(),
            },
        )
        .await;
        return;
    }
    if token.is_empty() || token != cfg.session_token {
        let _ = send(
            &mut sink,
            ServerMsg::Error {
                message: "unauthorized".into(),
            },
        )
        .await;
        return;
    }
    if ACTIVE.load(Ordering::SeqCst) >= cfg.max_sessions {
        let _ = send(
            &mut sink,
            ServerMsg::Error {
                message: "too many sessions".into(),
            },
        )
        .await;
        return;
    }

    let session_id = Uuid::new_v4().to_string();
    let _ = send(
        &mut sink,
        ServerMsg::Ready {
            session_id: session_id.clone(),
        },
    )
    .await;
    ACTIVE.fetch_add(1, Ordering::SeqCst);
    info!(%session_id, "gateway session open");

    let (out_tx, mut out_rx) = mpsc::channel::<Vec<u8>>(256);
    let mut writer: Option<ShellWriter> = None;

    loop {
        tokio::select! {
            incoming = stream.next() => {
                match incoming {
                    Some(Ok(Message::Text(t))) => {
                        let msg: ClientMsg = match serde_json::from_str(&t) {
                            Ok(m) => m,
                            Err(e) => {
                                let _ = send(&mut sink, ServerMsg::Error { message: e.to_string() }).await;
                                continue;
                            }
                        };
                        match msg {
                            ClientMsg::Ping => {
                                let _ = send(&mut sink, ServerMsg::Pong).await;
                            }
                            ClientMsg::Connect {
                                host, port, username, password, private_key_pem, term, cols, rows
                            } => {
                                if writer.is_some() {
                                    let _ = send(&mut sink, ServerMsg::Error {
                                        message: "already connected".into(),
                                    }).await;
                                    continue;
                                }
                                if !cfg.host_allowed(&host) {
                                    let _ = send(&mut sink, ServerMsg::Error {
                                        message: "host not allowlisted".into(),
                                    }).await;
                                    continue;
                                }
                                match ssh::open_shell(
                                    &host, port, &username,
                                    password.as_deref(),
                                    private_key_pem.as_deref(),
                                    cols, rows, &term,
                                    out_tx.clone(),
                                ).await {
                                    Ok(w) => {
                                        info!(%session_id, %host, "ssh connected");
                                        writer = Some(w);
                                    }
                                    Err(e) => {
                                        warn!(error = %e, "ssh connect failed");
                                        let _ = send(&mut sink, ServerMsg::Error {
                                            message: e.to_string(),
                                        }).await;
                                    }
                                }
                            }
                            ClientMsg::Input { data } => {
                                if let Some(w) = writer.as_mut() {
                                    if let Err(e) = w.data(data.as_bytes()).await {
                                        let _ = send(&mut sink, ServerMsg::Error {
                                            message: e.to_string(),
                                        }).await;
                                    }
                                }
                            }
                            ClientMsg::Resize { cols, rows } => {
                                if let Some(w) = writer.as_ref() {
                                    let _ = w.resize(cols, rows).await;
                                }
                            }
                        }
                    }
                    Some(Ok(Message::Close(_))) | None => break,
                    Some(Ok(_)) => {}
                    Some(Err(e)) => {
                        warn!(error = %e, "websocket error");
                        break;
                    }
                }
            }
            data = out_rx.recv() => {
                match data {
                    Some(buf) => {
                        let text = String::from_utf8_lossy(&buf).into_owned();
                        if send(&mut sink, ServerMsg::Output { data: text }).await.is_err() {
                            break;
                        }
                    }
                    None => {
                        let _ = send(&mut sink, ServerMsg::Closed {
                            reason: "ssh eof".into(),
                        }).await;
                        break;
                    }
                }
            }
        }
    }

    ACTIVE.fetch_sub(1, Ordering::SeqCst);
    info!(%session_id, "gateway session closed");
}
