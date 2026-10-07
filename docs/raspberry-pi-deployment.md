# Raspberry Pi deployment with Tailscale Serve

Run the complete DeclutterAI application on a Raspberry Pi and expose it privately over HTTPS to your tailnet. Google performs the AI inference remotely; the Pi runs Express, serves the built frontend, and forwards image/chat requests.

> This procedure is based on the app's source and the documented Tailscale Serve behavior. TypeScript checks and the frontend build completed locally. Local production startup, both host-binding modes, health JSON, and static frontend serving were smoke-tested with a dummy key. The unit passed `systemd-analyze verify`. Pi/ARM execution, actual systemd operation, Tailscale connectivity, and live Gemini requests still need verification on your Pi.

## Recommended setup

- Raspberry Pi 4 or 5 with a **64-bit Raspberry Pi OS or Debian-based OS**. Other hardware may work, but 32-bit ARM compatibility with the current toolchain is not verified.
- A system-wide current **Node.js 22 LTS release at or above 22.12**, with npm. Check resolved dependencies' engine requirements; do not assume your OS's default Node package is new enough.
- Tailscale installed on the Pi and joined to your tailnet. Install using the [official Linux instructions](https://tailscale.com/download/linux).
- Client devices signed into Tailscale and authorized to connect to the Pi's HTTPS port by your tailnet policy.
- A working Gemini API key and outbound internet access. Images and conversations still leave your network for Gemini; samples also use Unsplash.

The guide uses these literal deployment paths and account names:

| Item | Value |
| --- | --- |
| Service user/group | `declutter-ai` |
| Application directory | `/opt/declutter-ai` |
| Service account home | `/var/lib/declutter-ai` |
| Secret/configuration file | `/etc/declutter-ai.env` |
| System-wide Node binary | `/usr/bin/node` |
| Local backend | `http://127.0.0.1:3000` |

If you change them, update the commands and service template consistently. Do not use a Node executable inside a personal home directory with the supplied service: `ProtectHome=true` deliberately hides those directories. Prefer a system-wide Node installation. If Node is elsewhere, replace `/usr/bin/node` in the unit with its actual absolute path.

## 1. Prepare the Pi

Check architecture and tooling:

```sh
uname -m
node --version
npm --version
command -v node
```

For a 64-bit ARM installation, `uname -m` should normally print `aarch64`. `command -v node` should match the service's executable path.

Install file-transfer tooling and create a dedicated service account (once):

```sh
sudo apt update
sudo apt install rsync
sudo useradd --system --user-group --create-home --home-dir /var/lib/declutter-ai --shell /usr/sbin/nologin declutter-ai
sudo install -d -o declutter-ai -g declutter-ai -m 0755 /opt/declutter-ai
```

If the account already exists, skip `useradd`; do not recreate it. The service does not need root privileges.

## 2. Install the application

Get the repository onto the Pi using Git or a file transfer. Run the following **from its checkout directory on the Pi**:

```sh
sudo rsync -a --exclude='.git' --exclude='.env*' --exclude='node_modules' --exclude='dist' ./ /opt/declutter-ai/
sudo chown -R declutter-ai:declutter-ai /opt/declutter-ai
```

This intentionally excludes local secrets and desktop build dependencies. Do not copy a desktop `node_modules` tree onto the Pi: build tools have architecture-specific packages.

Now install and build inside the deployment directory:

```sh
cd /opt/declutter-ai
sudo -H -u declutter-ai npm ci
sudo -H -u declutter-ai npm run lint
sudo -H -u declutter-ai npm run build
```

Keep development dependencies installed: the backend uses `tsx`, currently declared as a development dependency. Do **not** use `npm ci --omit=dev` with this service template. Do not work around peer conflicts with `--force` or `--legacy-peer-deps`.

If npm reports an install-script approval warning, review it using `npm install-scripts ls` if your npm version supports that policy. Approve only scripts you have reviewed and need; approval is not a reason to disable security checks globally.

## 3. Configure the server

Create a root-owned configuration file:

```sh
sudo install -o root -g root -m 0600 /dev/null /etc/declutter-ai.env
sudo nano /etc/declutter-ai.env
```

The `install` command creates an empty file and would overwrite an existing one. **Only use it for initial setup**; for later changes, edit the existing file.

Enter:

```dotenv
GEMINI_API_KEY=your_actual_gemini_api_key
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
```

Use plain `NAME=value` entries, not shell `export` statements. Avoid entering the key in shell commands where it could be retained in history. Systemd reads this root-owned file and supplies the values to the service process. The app does not need its own `.env` in `/opt/declutter-ai`.

Keep the key server-side; do not use a `VITE_` variable. A separate key with an appropriate provider quota/budget is advisable. Key presence does not prove model availability; check the identifiers in `server.ts` against your account.

`HOST=127.0.0.1` means only local programs, including Tailscale Serve, can reach Express directly. This is the recommended configuration.

## 4. Install and start the systemd service

The template uses Node and the installed tsx CLI directly, so it does not rely on an interactive shell, npm startup, nvm, or native TypeScript support in `npm start`.

```sh
sudo install -o root -g root -m 0644 /opt/declutter-ai/deploy/declutter-ai.service /etc/systemd/system/declutter-ai.service
sudo systemd-analyze verify /etc/systemd/system/declutter-ai.service
sudo systemctl daemon-reload
sudo systemctl enable --now declutter-ai.service
sudo systemctl --no-pager status declutter-ai.service
curl --fail http://127.0.0.1:3000/api/health
```

Inspect logs if it does not start:

```sh
sudo journalctl -u declutter-ai.service -n 100 --no-pager
```

The unit runs without root privileges, restarts after failures with a rate limit, uses a private temporary directory, and makes the filesystem read-only to the service. This app currently requires no writable database or upload directory. If future features need persistent writes, explicitly provision a narrow writable location rather than removing all sandboxing.

The process is expected to remain running. `hasApiKey: true` in the health response only checks configuration presence; exercise analysis and chat to verify the provider connection.

## 5. Configure private HTTPS with Tailscale Serve

Check that Tailscale is connected, then proxy the complete Express server:

```sh
tailscale status
sudo tailscale serve --bg http://127.0.0.1:3000
sudo tailscale serve status
```

Follow any HTTPS-enablement prompt or administrative instructions shown by Tailscale. It prints the actual HTTPS address for this Pi, typically of the form `https://your-pi.your-tailnet.ts.net`.

Open that printed URL from an authorized Tailscale-connected device. Tailscale terminates TLS and forwards requests to Express. Check the site's `/api/health` path too, then test a small image and follow-up chat.

Important details:

- Proxy the **whole app**, not just the `dist/` directory. Static-only serving would omit the AI API.
- Serve at the root path. The current client uses absolute `/api/...` URLs and is not configured for a subpath deployment.
- HTTPS gives camera and clipboard features a secure browser context, but browser permissions still apply.
- Serve is tailnet-only. Being on the same LAN does not itself grant access. Tailnet access rules still apply.
- Do **not** enable Tailscale Funnel for this deployment. Funnel makes a service publicly reachable; this app has no authentication, rate limiting, or per-user usage budget.
- Other local processes on the Pi can still reach loopback. Limit access to the Pi itself as well as its tailnet policy.

`--bg` saves Serve configuration and resumes it after reboot/Tailscale restarts. It does not keep Node running; systemd handles that separately. See the [official Serve documentation](https://tailscale.com/kb/1242/tailscale-serve).

To stop only this default HTTPS listener:

```sh
sudo tailscale serve --https=443 off
```

Avoid `tailscale serve reset` if this Pi serves other applications: it clears the whole Serve configuration.

## 6. Check restart behavior

When convenient, reboot the Pi:

```sh
sudo reboot
```

After reconnecting, confirm:

```sh
sudo systemctl --no-pager status declutter-ai.service
sudo tailscale serve status
curl --fail http://127.0.0.1:3000/api/health
```

Then open the HTTPS URL from a client. Test the camera, uploaded JPEG/PNG images, chat, triage, and a timer. Known application limitations—including MIME handling in chat, state carrying between rooms, and camera cleanup—are listed in the [main README](../README.md#known-limitations-and-review-findings).

## Updates and routine maintenance

For an update, get the new source into your checkout on the Pi, then run from that checkout:

```sh
sudo systemctl stop declutter-ai.service
sudo rsync -a --exclude='.git' --exclude='.env*' --exclude='node_modules' --exclude='dist' ./ /opt/declutter-ai/
sudo chown -R declutter-ai:declutter-ai /opt/declutter-ai
cd /opt/declutter-ai
sudo -H -u declutter-ai npm ci
sudo -H -u declutter-ai npm run lint
sudo -H -u declutter-ai npm run build
sudo systemctl start declutter-ai.service
```

Run these steps individually; if installation or validation fails, investigate before starting the new build. This procedure causes downtime, does not delete obsolete source files, and is not an atomic deployment. Keep a known working release for rollback. For a larger service, use separate versioned release directories and switch only after validation.

If you change the service template, reinstall it and run `sudo systemctl daemon-reload` before restarting. For changes only to `/etc/declutter-ai.env`, just restart the service. If you change the port, update the Tailscale Serve target too.

Useful commands:

```sh
sudo systemctl restart declutter-ai.service
sudo journalctl -u declutter-ai.service -n 100 --no-pager
sudo tailscale serve status
```

## Optional direct LAN access

If you intentionally want devices **without Tailscale** to reach the app on your LAN, change the configuration to:

```dotenv
HOST=0.0.0.0
```

Restart the service. The environment file overrides the defaults in the unit, and the app now listens on all IPv4 interfaces. Clients can use `http://<pi-lan-ip>:3000`, subject to firewall rules. The Tailscale proxy still works through loopback.

**Tradeoffs:** Direct LAN access bypasses tailnet access controls, is unencrypted HTTP unless separately proxied through HTTPS, and normally does not provide the secure context required for camera/clipboard features. Any reachable user can consume the Gemini key's quota. Use firewall restrictions, do not forward port 3000 on your router, and prefer Tailscale Serve for trusted clients.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `203/EXEC` or Node not found | Compare `command -v node` with `ExecStart`; use a system-wide executable outside personal home directories. |
| `217/USER` | Ensure the `declutter-ai` user/group exist. |
| tsx module cannot be found | Run `npm ci` in `/opt/declutter-ai` with development dependencies included. |
| Missing environment file | Create `/etc/declutter-ai.env`; it is deliberately required by the unit. |
| Missing `dist/index.html` | Build in `/opt/declutter-ai` before starting production. |
| Native module / architecture error | Install dependencies on the Pi; check 64-bit OS, Node version, optional dependencies, and any reviewed install-script requirements. |
| Local health works but HTTPS fails | Check `tailscale serve status`, HTTPS setup, client tailnet membership, and access rules for port 443. |
| Gemini request fails | Check API key, model availability, provider limits, Pi outbound connectivity, and redacted server logs. |
| Service stops retrying | Fix the root cause, then run `sudo systemctl reset-failed declutter-ai.service` and start it again. |
| Read-only filesystem error | Identify the library/feature attempting writes; provision a specific writable directory if genuinely required. |
| Client cannot reach direct LAN port | Loopback is the default and is intentional. Use the Serve URL or explicitly opt into LAN binding. |

The deployment restricts network access, but it does not fix the application's remaining validation, privacy, accessibility, and usage-control issues. Treat authorized tailnet access as access to your Gemini-backed application, not as read-only access to a static website.
