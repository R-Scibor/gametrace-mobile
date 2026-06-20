import axios from 'axios';

export type ResolveResult =
    | { status: 'ok'; baseUrl: string }
    | { status: 'insecure'; baseUrl: string }
    | { status: 'unreachable' }
    | { status: 'invalid' };

const SCHEME_RE = /^(https?):\/\/(.+)$/i;
const PROBE_TIMEOUT_MS = 3000;

async function probe(scheme: string, hostPort: string): Promise<boolean> {
    try {
        const res = await axios.get(`${scheme}://${hostPort}/health`, { timeout: PROBE_TIMEOUT_MS });
        return res.status >= 200 && res.status < 300 && res.data?.status === 'ok';
    } catch {
        return false;
    }
}

function baseUrlFor(scheme: string, hostPort: string): string {
    return `${scheme}://${hostPort}/api/v1`;
}

export async function resolveServer(input: string): Promise<ResolveResult> {
    const trimmed = input.trim();
    if (!trimmed) return { status: 'invalid' };

    const explicit = trimmed.match(SCHEME_RE);
    if (explicit) {
        const scheme = explicit[1].toLowerCase();
        const hostPort = explicit[2].replace(/\/+$/, '');
        if (!hostPort) return { status: 'invalid' };
        return (await probe(scheme, hostPort))
            ? { status: 'ok', baseUrl: baseUrlFor(scheme, hostPort) }
            : { status: 'unreachable' };
    }

    const hostPort = trimmed.replace(/\/+$/, '');
    if (await probe('https', hostPort)) {
        return { status: 'ok', baseUrl: baseUrlFor('https', hostPort) };
    }
    if (await probe('http', hostPort)) {
        return { status: 'insecure', baseUrl: baseUrlFor('http', hostPort) };
    }
    return { status: 'unreachable' };
}
