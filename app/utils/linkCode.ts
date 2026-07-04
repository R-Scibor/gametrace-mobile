// Discord /login issues a 6-digit code shown as "XXX XXX". The backend accepts
// the code with or without the internal space; we normalize to bare digits for
// transport and format for display.

export function normalizeLinkCode(raw: string): string {
    return raw.replace(/\D/g, '').slice(0, 6);
}

export function formatLinkCode(raw: string): string {
    const digits = normalizeLinkCode(raw);
    if (digits.length <= 3) return digits;
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
}

export function isCompleteLinkCode(raw: string): boolean {
    return normalizeLinkCode(raw).length === 6;
}
