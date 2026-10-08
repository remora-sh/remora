# Remora SSH gateway — standalone crate build
FROM rust:1.95-bookworm AS build
WORKDIR /src
COPY gateway/ /src/
RUN cargo build --release

FROM gcr.io/distroless/cc-debian12:nonroot
COPY --from=build /src/target/release/remora-gateway /usr/local/bin/remora-gateway
USER nonroot
EXPOSE 7700
ENTRYPOINT ["/usr/local/bin/remora-gateway"]
