# Security Policy

## Reporting a vulnerability

Please do **not** open a public issue for anything you believe is exploitable.

Preferred: use GitHub's **private vulnerability reporting** for this repository
(Security tab → "Report a vulnerability"). If it is not enabled yet, contact the
maintainers privately — the commit author email in `git log` is a usable channel.

Include: affected commit/version, a minimal reproduction (event fixture, config,
or test), impact assessment, and whether the issue also affects the published
`@zap.stream/api` npm package.

This project also consumes `@snort/system` / `@snort/shared` / `@snort/wallet`
from the snort project; issues in those libraries (e.g. NIP-57 zap receipt
validation) are best reported upstream at v0l/snort, with a note here so the
dependency can be bumped promptly.

## Scope notes

- `zap.stream` is a client; several integrity guarantees (balances, stream-key
  authorization, zap settlement) live in the closed-source backend and are out
  of scope for this repo's fixes, but reports about client/server trust
  mismatches are welcome.
- Self-hosted deployments (`Dockerfile.prebuilt`, `Dockerfile.ssr`,
  `nginx-edge.conf`, `docker/nginx.conf`) are in scope.

## Supported versions

Only the latest `main` (and production `voidic/zap-stream` images built from it)
receive fixes.
