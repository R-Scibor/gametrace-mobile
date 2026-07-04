// Dev-only floating feedback button. Flip to false to retire the FAB after the
// testing push; the Settings "Wyślij opinię" row remains either way.
export const DEV_REPORT_FAB = true;

// Dev-only username login (POST /auth/login) on the sign-in screen. The primary
// path is the Discord link code; flip to false to hide the username fallback in
// prod builds once link (and later OAuth) login has shipped.
export const DEV_USERNAME_LOGIN = true;

// Discord OAuth2 sign-in on the auth screen. Flip to false to hide the button in
// a build where OAuth's redirect URI isn't registered (Discord portal + backend
// allowlist). Link code remains the primary path either way.
export const DISCORD_OAUTH_LOGIN = true;

// Public Discord application id and the bot-install URL for needs_server_join.
// Sourced from EXPO_PUBLIC_* env vars (see .env.example); inlined at build time.
export const DISCORD_CLIENT_ID = process.env.EXPO_PUBLIC_DISCORD_CLIENT_ID ?? '';
export const DISCORD_INVITE_URL = process.env.EXPO_PUBLIC_DISCORD_INVITE_URL ?? '';
