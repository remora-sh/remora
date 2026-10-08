use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ClientMsg {
    Connect {
        host: String,
        port: u16,
        username: String,
        #[serde(default)]
        password: Option<String>,
        #[serde(default)]
        private_key_pem: Option<String>,
        #[serde(default)]
        term: String,
        #[serde(default = "default_cols")]
        cols: u32,
        #[serde(default = "default_rows")]
        rows: u32,
    },
    Input {
        data: String,
    },
    Resize {
        cols: u32,
        rows: u32,
    },
    Ping,
}

fn default_cols() -> u32 {
    120
}
fn default_rows() -> u32 {
    40
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ServerMsg {
    Ready { session_id: String },
    Output { data: String },
    Error { message: String },
    Closed { reason: String },
    Pong,
}
