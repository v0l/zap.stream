# Security Policy

## Reporting a vulnerability

Please do **not** open a public issue for anything you believe is exploitable.

Preferred: use GitHub's **private vulnerability reporting** for this repository
(Security tab → "Report a vulnerability" — maintainers, please keep this
enabled).

When reporting, include: affected commit/version, a minimal reproduction (event
fixture, config, or test), an impact assessment, and whether the issue also
affects the published `@zap.stream/api` npm package.

For bugs in the Nostr libraries this project builds on (`@snort/system`,
`@snort/shared`, `@snort/wallet`), please report those upstream to the snort
project as well, and note it here so the dependency gets bumped promptly once a
fixed release exists.

## Scope notes

- This repository contains the web client. Balances, stream-key authorization
  and zap settlement are enforced server-side and are out of scope for fixes in
  this repo.
- Self-hosted deployment configs (`Dockerfile.prebuilt`, `Dockerfile.ssr`,
  `nginx-edge.conf`, `docker/nginx.conf`) are in scope.

## Supported versions

Only the latest `main` (and production `voidic/zap-stream` images built from it)
receive fixes.
