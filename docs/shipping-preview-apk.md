# Shipping the preview APK

How the tester Android build gets from `main` onto a download URL. For app architecture see [architecture.md](architecture.md); for local `expo start` see the [README](../README.md).

This is for operators who serve `gametrace.apk` the same way **gametrace-web** does: nginx aliases `/download/gametrace.apk` to a file bind-mounted into the container. Testers hit that URL (on the official site: `https://gametrace.rscibor.dev/download/gametrace.apk`). Play Store AAB, `eas submit`, and `eas update` are out of scope.

## Git vs the runner

Two different places. Mixing them up is the usual setup failure.

| | Lives in git (`gametrace-mobile`) | Lives on the APK host |
|---|---|---|
| What | Workflow YAML, app source, `eas.json` (preview profile + public Discord/Sentry env) | A GitHub Actions **self-hosted runner** process + the file nginx serves |
| Role | Defines *what* the job does. Testers clone this; GitHub stores the workflow. | Does *the work*: talk to EAS, wait, write the live APK |
| Push to `main` | Updates the recipe. Does **not** publish an APK. | — |
| `workflow_dispatch` | GitHub UI / `gh workflow run` starts a run of that recipe | The runner registered to **this** repo picks up `runs-on: self-hosted` |

EAS still compiles in Expo’s cloud. The runner is not an Android builder. It starts `eas build --profile preview --platform android --non-interactive --wait`, downloads the artifact, and atomically replaces the live file (`*.tmp` then `mv` on the same filesystem).

A GitHub-hosted `ubuntu-latest` job can start EAS. It cannot see your web container’s `./downloads` volume, so this workflow does not use it.

**One registration, one scope.** A self-hosted runner is bound to a single repository, or to a GitHub organization. Personal accounts have no shared pool: a listener registered to `gametrace-backend` will never run `gametrace-mobile` jobs. Same machine, second directory / second `config.sh` for this repo is the usual pattern.

## One-time setup

You need admin on the GitHub repo, an Expo account that owns the EAS project, and write access (as the runner user) to the host path of `gametrace.apk`.

### 1. Self-hosted runner on the APK host

On the box that already bind-mounts `downloads/` into **gametrace-web** (compose: `./downloads:/var/downloads:ro` — replace **on the host**, leave the container mount read-only).

1. Repo **Settings → Actions → Runners → New self-hosted runner** (Linux x64). Copy the registration token (short-lived).
2. Own directory — do not reuse another repo’s runner folder:

```bash
mkdir -p /opt/actions-runner-gametrace-mobile
cd /opt/actions-runner-gametrace-mobile
# download + extract the runner tarball GitHub shows on that page
./config.sh --unattended \
  --url https://github.com/<you>/gametrace-mobile \
  --token <registration-token> \
  --name homelab \
  --work _work
sudo ./svc.sh install "$USER"
sudo ./svc.sh start
```

The runner user must be able to write the dest file. Confirm Idle on that repo’s Runners page. Labels will include `self-hosted`, which matches `runs-on: self-hosted`.

### 2. `EXPO_TOKEN` (Actions secret)

Mint an access token on the Expo account that owns `@zyrafel/gametrace-app` (or your fork’s EAS project). Store it as a **repository secret** named `EXPO_TOKEN`:

https://github.com/<you>/gametrace-mobile/settings/secrets/actions

Discord client id / invite URL are already in `eas.json` `build.preview.env`. Do not copy a local `.env` into GitHub. Keep `EXPO_PUBLIC_DEV_LOGIN_SECRET` off preview builds.

### 3. Dest path (Actions variables)

https://github.com/<you>/gametrace-mobile/settings/variables/actions

| Variable | Meaning | Example |
|----------|---------|---------|
| `APK_DEST_PATH` | Absolute host path of the file nginx aliases | `/var/www/gametrace-web/downloads/gametrace.apk` |
| `APK_PUBLIC_URL` | URL testers download (used for a HEAD check) | `https://example.com/download/gametrace.apk` |

The workflow falls back to the official homelab dest if a variable is empty; set yours explicitly.

### 4. Workflow on `main`

`.github/workflows/ship-preview-apk.yml` must exist on `main`. GitHub will not list **Ship preview APK** until that file is pushed.

## Run a ship

Actions → **Ship preview APK** → Run workflow, branch **main**. Or:

```bash
gh workflow run ship-preview-apk.yml --ref main --repo <you>/gametrace-mobile
```

The first step fails if `github.ref` is not `refs/heads/main` (the UI can dispatch any branch). After that the runner holds the job until EAS finishes (often ~1h, timeout 120 minutes), then replaces the file. Failure before `mv` leaves the previous APK in place. EAS `autoIncrement` may already have bumped `versionCode`; there is no rollback of that.

This runner is busy for the whole wait. Other workflows registered to the **same** mobile runner queue. A separate backend runner on the same machine is a different queue.

The workflow turns off `patch-watchers` (the Expo action’s `sudo sysctl` for inotify — this host has no passwordless sudo, and EAS cloud does the Metro work) and GitHub Actions cache for eas-cli (self-hosted cache calls were 400 / unavailable; `npm ci` is cheap next to the EAS wait).

## Related

- Preview profile: `eas.json` → `build.preview` (APK, `autoIncrement`, channel `preview`)
- How the file is served: **gametrace-web** `nginx.conf` `location = /download/gametrace.apk` and `docker-compose.yml` volume
- Version numbers testers see: [architecture.md](architecture.md) § Versioning
