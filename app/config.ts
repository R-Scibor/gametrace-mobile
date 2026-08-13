import Constants from 'expo-constants';

// Single source of truth for the version shown in-app: expo.version in app.json.
// Bump there (and package.json to match) on release; everything else reads this.
export const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

// Dev-only floating feedback button. Flip to false to retire the FAB after the
// testing push; the Settings "Wyślij opinię" row remains either way.
export const DEV_REPORT_FAB = true;

// Shared secret gating the dev-only POST /auth/login. Sent as the
// X-Dev-Login-Secret header; the backend returns 404 without a matching value.
// Sourced from EXPO_PUBLIC_DEV_LOGIN_SECRET (gitignored .env); inlined at build
// time. Empty in tester/prod builds whose env doesn't set it — see .env.example.
export const DEV_LOGIN_SECRET = process.env.EXPO_PUBLIC_DEV_LOGIN_SECRET ?? '';

// Dev-only username login (POST /auth/login) on the sign-in screen. The primary
// path is the Discord link code. Gated on the secret: a build without one gets a
// bare 404 from the endpoint anyway, so the username fallback stays hidden unless
// EXPO_PUBLIC_DEV_LOGIN_SECRET is set.
export const DEV_USERNAME_LOGIN = !!DEV_LOGIN_SECRET;

// Discord OAuth2 sign-in on the auth screen. Flip to false to hide the button in
// a build where OAuth's redirect URI isn't registered (Discord portal + backend
// allowlist). Link code remains the primary path either way.
export const DISCORD_OAUTH_LOGIN = true;

// Public Discord application id and the bot-install URL for needs_server_join.
// Sourced from EXPO_PUBLIC_* env vars (see .env.example); inlined at build time.
export const DISCORD_CLIENT_ID = process.env.EXPO_PUBLIC_DISCORD_CLIENT_ID ?? '';
export const DISCORD_INVITE_URL = process.env.EXPO_PUBLIC_DISCORD_INVITE_URL ?? '';

// Host of the official GameTrace server offered on the first-run Welcome screen.
// Stored bare (no scheme) because the self-host form prefills it as a format
// example; the official connect path prepends https:// at the call site so the
// probe never falls back to plain HTTP.
export const OFFICIAL_SERVER_HOST = 'gametrace.rscibor.dev';

// Full privacy notice, opened in the browser from the in-app summary. It lives
// on the web so it can be revised without shipping an app build. Fixed public
// URL rather than one derived from the connected server: a self-hosted instance
// has no /privacy page, and the notice describes the official service anyway.
export const PRIVACY_POLICY_URL = 'https://gametrace.rscibor.dev/privacy';
