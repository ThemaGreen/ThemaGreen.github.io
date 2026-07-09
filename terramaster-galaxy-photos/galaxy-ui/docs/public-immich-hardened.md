# My Immich from the public site — hardened Tailscale Funnel setup

This makes “My Immich” work from **https://themagreen.com/galaxy/** for family
signing into the NAS Immich — without opening a single router port. Traffic
flows:

```
Internet ──HTTPS──▶ Tailscale Funnel (TLS at Tailscale's edge)
                      └─▶ 127.0.0.1:8080  hardened nginx (this folder)
                            └─▶ immich_server:2283 (docker network)
```

The hardening layer enforces:

| Control | Setting |
|---|---|
| CORS | **only** `https://themagreen.com` (+ www) — no wildcard |
| Login rate limit | 5 attempts/min per IP (burst 3) → `429` |
| API rate limit | 20 req/s per IP (burst 40) |
| Admin surface | `/api/admin/*` → `403`, never proxied |
| Exposure | proxy binds to NAS **loopback only**; Funnel is the only door |
| Headers | `nosniff`, `X-Frame-Options: DENY`, no server version |

---

## 1 · Start the hardened proxy (on the NAS)

Copy `tools/immich-public-proxy/` to the NAS (next to your Immich compose
folder), check the two marked lines in `docker-compose.public.yml` match your
Immich service/network names (`docker network ls`, default `immich_default`),
then:

```bash
cd immich-public-proxy
docker compose -f docker-compose.public.yml up -d
curl -s http://127.0.0.1:8080/api/server-info/ping    # → {"res":"pong"}
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/api/admin/users  # → 403
```

## 2 · Open the Funnel

Tailscale must already be up on the NAS (it is — you use it today). Then:

```bash
sudo tailscale funnel --bg 8080
tailscale funnel status      # shows your public URL
```

Your public address is `https://<nas-name>.<tailnet>.ts.net`. Verify from a
phone on **cellular** (not your wifi):

```bash
curl -s https://<nas-name>.<tailnet>.ts.net/api/server-info/ping   # → {"res":"pong"}
```

First time only: the command may print a link to enable HTTPS certificates /
Funnel for your tailnet — follow it once.

To close the public door at any time: `sudo tailscale funnel --bg off 8080`
(or `tailscale funnel reset`). Everything else keeps working on your tailnet.

## 3 · Point the app at it

In `.env.production` add:

```
VITE_IMMICH_URL=https://<nas-name>.<tailnet>.ts.net
```

Rebuild + redeploy the site. Now “My Immich” finds the server from anywhere —
family just enters email + password (no server address needed). Guests with
their own Immich can still enter theirs.

## 4 · Immich-side hardening checklist

- **Accounts**: only the Immich admin can create users (there is no open
  sign-up). Give each family member their own account with a **strong, unique
  password** — passwords are now guessable-from-the-internet in theory, and the
  rate limit (5/min) is what makes that impractical: ~7,200 guesses/day vs. a
  good password's ~10¹⁴ space.
- **Updates**: update Immich promptly (`docker compose pull && up -d`) — it's
  the actual attack surface now.
- **Backups**: keep your existing NAS backup of the Immich library + database.
- **Monitoring**: `docker logs -f immich_public_proxy` — bursts of `429`/`403`
  are the limiter doing its job; note the IPs if persistent.
- **Scope it in time** (optional): the funnel is one command on/off. If Immich
  access from the public site is only needed occasionally, leave it off by
  default.

## Threat-model honesty

This setup means your Immich **login page is reachable from the internet**,
via Tailscale's edge. The proxy narrows that to: correct-password required,
5 tries/min, no admin API, one allowed web origin. What it does *not* protect
against: a vulnerability in Immich itself (keep it updated), or a family
member's weak/reused password (set strong ones). Photos/videos never transit
unencrypted — TLS at the funnel edge, WireGuard from edge to NAS.
