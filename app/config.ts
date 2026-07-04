// Dev-only floating feedback button. Flip to false to retire the FAB after the
// testing push; the Settings "Wyślij opinię" row remains either way.
export const DEV_REPORT_FAB = true;

// Dev-only username login (POST /auth/login) on the sign-in screen. The primary
// path is the Discord link code; flip to false to hide the username fallback in
// prod builds once link (and later OAuth) login has shipped.
export const DEV_USERNAME_LOGIN = true;
