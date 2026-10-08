//! Interactive SSH via russh. Agent forwarding is not offered.

use std::sync::Arc;

use anyhow::{bail, Context};
use russh::client::{self, Msg};
use russh::keys::{HashAlg, PrivateKeyWithHashAlg, PublicKeyOrCertificate};
use russh::{ChannelMsg, ChannelWriteHalf, Disconnect};
use tokio::sync::mpsc;
use tracing::debug;

pub struct Handler;

impl client::Handler for Handler {
    type Error = russh::Error;

    async fn check_server_key(
        &mut self,
        _server_public_key: &PublicKeyOrCertificate,
    ) -> Result<bool, Self::Error> {
        // Web client should verify known_hosts from the vault before Connect.
        Ok(true)
    }
}

pub struct ShellWriter {
    write: ChannelWriteHalf<Msg>,
}

impl ShellWriter {
    pub async fn data(&mut self, bytes: &[u8]) -> anyhow::Result<()> {
        self.write.data(bytes).await?;
        Ok(())
    }

    pub async fn resize(&self, cols: u32, rows: u32) -> anyhow::Result<()> {
        self.write.window_change(cols, rows, 0, 0).await?;
        Ok(())
    }
}

pub async fn open_shell(
    host: &str,
    port: u16,
    username: &str,
    password: Option<&str>,
    private_key_pem: Option<&str>,
    cols: u32,
    rows: u32,
    term: &str,
    out_tx: mpsc::Sender<Vec<u8>>,
) -> anyhow::Result<ShellWriter> {
    let config = Arc::new(client::Config::default());
    let mut handle = client::connect(config, (host, port), Handler)
        .await
        .with_context(|| format!("tcp {host}:{port}"))?;

    let ok = if let Some(pem) = private_key_pem {
        let key = russh::keys::decode_secret_key(pem, None).context("decode key")?;
        // Prefer SHA-256 for RSA; Ed25519 ignores hash alg.
        let keyed = PrivateKeyWithHashAlg::new(Arc::new(key), Some(HashAlg::Sha256));
        handle
            .authenticate_publickey(username, keyed)
            .await
            .context("pubkey auth")?
            .success()
    } else if let Some(pw) = password {
        handle
            .authenticate_password(username, pw)
            .await
            .context("password auth")?
            .success()
    } else {
        bail!("password or private_key_pem required");
    };
    if !ok {
        bail!("authentication rejected");
    }

    let channel = handle.channel_open_session().await?;
    let term = if term.is_empty() {
        "xterm-256color"
    } else {
        term
    };
    channel
        .request_pty(false, term, cols, rows, 0, 0, &[])
        .await?;
    channel.request_shell(false).await?;
    let (mut read, write) = channel.split();

    tokio::spawn(async move {
        loop {
            match read.wait().await {
                Some(ChannelMsg::Data { data }) | Some(ChannelMsg::ExtendedData { data, .. }) => {
                    if out_tx.send(data.to_vec()).await.is_err() {
                        break;
                    }
                }
                Some(ChannelMsg::Eof) | None => {
                    debug!("ssh channel closed");
                    break;
                }
                _ => {}
            }
        }
        let _ = handle
            .disconnect(Disconnect::ByApplication, "done", "en")
            .await;
    });

    Ok(ShellWriter { write })
}
