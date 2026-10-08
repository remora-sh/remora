use anyhow::bail;

#[derive(Clone, Debug)]
pub struct GatewayConfig {
    pub enabled: bool,
    pub listen: String,
    pub session_token: String,
    pub host_allowlist: Vec<String>,
    pub max_sessions: usize,
}

impl GatewayConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        let enabled = env_bool("REMORA_GATEWAY_ENABLED", false);
        let listen =
            std::env::var("REMORA_GATEWAY_LISTEN").unwrap_or_else(|_| "0.0.0.0:7700".into());
        let session_token = std::env::var("REMORA_GATEWAY_TOKEN").unwrap_or_default();
        if enabled && session_token.len() < 16 {
            bail!("REMORA_GATEWAY_TOKEN must be ≥16 chars when gateway is enabled");
        }
        let host_allowlist = std::env::var("REMORA_GATEWAY_ALLOWLIST")
            .unwrap_or_default()
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();
        let max_sessions = std::env::var("REMORA_GATEWAY_MAX_SESSIONS")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(32);
        Ok(Self {
            enabled,
            listen,
            session_token,
            host_allowlist,
            max_sessions,
        })
    }

    pub fn host_allowed(&self, host: &str) -> bool {
        if self.host_allowlist.is_empty() {
            return false;
        }
        self.host_allowlist
            .iter()
            .any(|e| e == "*" || e.eq_ignore_ascii_case(host))
    }
}

fn env_bool(key: &str, default: bool) -> bool {
    match std::env::var(key) {
        Ok(v) => matches!(
            v.to_ascii_lowercase().as_str(),
            "1" | "true" | "yes" | "on"
        ),
        Err(_) => default,
    }
}
