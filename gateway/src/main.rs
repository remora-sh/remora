//! Remora optional SSH gateway (WebSocket ↔ SSH).
//!
//! Trust model: operators of this process can observe live session I/O.
//! Disable via compose (default). See docs/web-gateway.md.

mod config;
mod protocol;
mod ssh;
mod ws;

use std::net::SocketAddr;
use std::sync::Arc;

use axum::routing::get;
use axum::Router;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing::info;

use crate::config::GatewayConfig;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "remora_gateway=info,tower_http=info".into()),
        )
        .init();

    let cfg = Arc::new(GatewayConfig::from_env()?);
    let addr: SocketAddr = cfg.listen.parse()?;

    let app = Router::new()
        .route("/healthz", get(|| async { "ok" }))
        .route("/v1/session", get(ws::session_handler))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(cfg.clone());

    info!(%addr, enabled = cfg.enabled, "remora-gateway listening");
    if !cfg.enabled {
        tracing::warn!("REMORA_GATEWAY_ENABLED=false — sessions rejected");
    }

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}
