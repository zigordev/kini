# Deployment

Kini currently has a manual deploy workflow placeholder. Before enabling production deploys, decide the target runtime and secrets source.

The intended repository contract matches the other app repos:

- CI owns quality gates and compose validation.
- Release Please owns version and changelog updates.
- Runtime secrets are not committed and are injected by the deployment target.
- Docker manifests live under `docker/`.
