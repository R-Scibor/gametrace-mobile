import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createGame, getAllGamesForPicker, matchGames, suggestGames } from '../api/games';
import { CreateGamePayload, Game, GameSuggestItem, IGDBCandidate } from '../types/api';

export const MAX_LOCAL_RESULTS = 50;
const SUGGEST_DEBOUNCE_MS = 250;

export type LadderMode = 'browse' | 'searching' | 'online' | 'error';

export interface LadderError {
    /** 'match' drives error mode; 'create' renders inline while mode stays 'online'. */
    scope: 'match' | 'create';
    /** i18n key in the `library` namespace, resolved by the caller. */
    key: string;
}

export interface SelectedGameMeta {
    id: number;
    primary_name: string;
    cover_image_url: string | null;
}

export type LadderPick =
    | { kind: 'library'; game: Game }
    | { kind: 'catalog'; suggestion: GameSuggestItem }
    | { kind: 'candidate'; candidate: IGDBCandidate }
    | { kind: 'unrecognized' };

export interface GameLadder {
    query: string;
    setQuery: (next: string) => void;
    libraryMatches: Game[];
    catalogMatches: GameSuggestItem[];
    pickerGames: Game[];
    isPickerLoading: boolean;
    pickerError: boolean;
    isSuggesting: boolean;
    mode: LadderMode;
    candidates: IGDBCandidate[];
    error: LadderError | null;
    selectedMeta: SelectedGameMeta | null;
    isCreating: boolean;
    searchOnline: () => void;
    reset: () => void;
    /** Resolves to the selected game_id, or null if a create failed. */
    select: (pick: LadderPick) => Promise<number | null>;
}

export function useGameLadder(onResolved: (gameId: number) => void): GameLadder {
    // Belt-and-braces consistency with the `cancelled` flag in the picker-load
    // effect below: skip state writes below after the hosting screen has
    // unmounted (e.g. the user navigates away while a suggest/match/create
    // request is in flight). On React 19 a setState call after unmount is
    // already a silent no-op with no console warning or thrown error, so this
    // guard is not fixing an observable bug here — it just keeps this hook's
    // async paths uniformly defensive rather than only the picker-load effect
    // being so. Distinct from `latestQuery`: that guard discards a response for
    // an abandoned query while the hook is still mounted; this one is about the
    // hook itself being gone.
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    const [pickerGames, setPickerGames] = useState<Game[]>([]);
    const [isPickerLoading, setIsPickerLoading] = useState(true);
    const [pickerError, setPickerError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const all = await getAllGamesForPicker();
                if (!cancelled) setPickerGames(all);
            } catch {
                if (!cancelled) setPickerError(true);
            } finally {
                if (!cancelled) setIsPickerLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const [query, setQueryState] = useState('');
    const [debounced, setDebounced] = useState('');
    const trimmed = query.trim();

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(trimmed), SUGGEST_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [trimmed]);

    const [suggestions, setSuggestions] = useState<GameSuggestItem[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);

    // Web keys this query on the debounced string so react-query files a slow
    // response for "had" under the "had" cache entry while the component already
    // renders "hades" — stale results are structurally impossible there. With no
    // query cache here, the same guarantee comes from comparing the query a
    // response was issued for against the latest one before applying it.
    const latestQuery = useRef('');

    useEffect(() => {
        latestQuery.current = debounced;

        if (!debounced) {
            setSuggestions([]);
            setIsSuggesting(false);
            return;
        }

        setIsSuggesting(true);
        (async () => {
            try {
                const data = await suggestGames(debounced);
                if (!mounted.current || latestQuery.current !== debounced) return;
                setSuggestions(data.items);
            } catch {
                if (!mounted.current || latestQuery.current !== debounced) return;
                // A suggest failure is not worth a visible error: the catalog group
                // simply stays empty and the user can still escalate to IGDB.
                setSuggestions([]);
            } finally {
                if (mounted.current && latestQuery.current === debounced) setIsSuggesting(false);
            }
        })();
    }, [debounced]);

    const localMatches = useMemo(() => {
        const q = trimmed.toLowerCase();
        const base = q
            ? pickerGames.filter(g => g.primary_name.toLowerCase().includes(q))
            : pickerGames;
        // Capped so a blank query does not dump an entire library into the list.
        return base.slice(0, MAX_LOCAL_RESULTS);
    }, [pickerGames, trimmed]);

    const { libraryMatches, catalogMatches } = useMemo(() => {
        const items = debounced.length > 0 ? suggestions : [];
        const localIds = new Set(localMatches.map(g => g.id));
        const pickerById = new Map(pickerGames.map(g => [g.id, g]));

        // Owned games the substring filter missed but fuzzy suggest found: promote
        // into the library group rather than dropping them as duplicates.
        const promoted = items
            .filter(s => !localIds.has(s.game_id) && pickerById.has(s.game_id))
            .map(s => pickerById.get(s.game_id)!);

        return {
            libraryMatches: [...localMatches, ...promoted],
            catalogMatches: items.filter(
                s => !localIds.has(s.game_id) && !pickerById.has(s.game_id),
            ),
        };
    }, [suggestions, debounced, localMatches, pickerGames]);

    const [mode, setMode] = useState<LadderMode>('browse');
    const [candidates, setCandidates] = useState<IGDBCandidate[]>([]);
    const [error, setError] = useState<LadderError | null>(null);
    const [selectedMeta, setSelectedMeta] = useState<SelectedGameMeta | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const searchOnline = useCallback(() => {
        if (!trimmed) return;
        setMode('searching');
        setCandidates([]);
        setError(null);
        (async () => {
            try {
                const list = await matchGames(trimmed);
                if (!mounted.current) return;
                // An empty list is a legitimate outcome, not an error: it is precisely
                // the case the unrecognized-create rung exists for.
                setCandidates(list);
                setMode('online');
            } catch {
                if (!mounted.current) return;
                // 503 (rate limit) and 502 (any other IGDB failure) are the same thing
                // to the user and both are retryable — no status branching.
                setCandidates([]);
                setError({ scope: 'match', key: 'select.igdbUnavailable' });
                setMode('error');
            }
        })();
    }, [trimmed]);

    const setQuery = useCallback((next: string) => {
        // Only a change to the TRIMMED string invalidates an online search, so typing
        // a trailing space does not throw away candidates the user just paid for.
        if (next.trim() !== trimmed) {
            setMode('browse');
            setCandidates([]);
            setError(null);
        }
        setQueryState(next);
    }, [trimmed]);

    const reset = useCallback(() => {
        setQueryState('');
        setDebounced('');
        setSuggestions([]);
        setCandidates([]);
        setMode('browse');
        setError(null);
    }, []);

    const select = useCallback(async (pick: LadderPick): Promise<number | null> => {
        if (mounted.current) setError(null);

        let meta: SelectedGameMeta;
        if (pick.kind === 'library') {
            meta = {
                id: pick.game.id,
                primary_name: pick.game.primary_name,
                cover_image_url: pick.game.cover_image_url,
            };
        } else if (pick.kind === 'catalog') {
            meta = {
                id: pick.suggestion.game_id,
                primary_name: pick.suggestion.primary_name,
                cover_image_url: pick.suggestion.cover_image_url,
            };
        } else {
            if (!trimmed) return null;
            const payload: CreateGamePayload = pick.kind === 'candidate'
                ? { igdb_id: pick.candidate.igdb_id, query: trimmed }
                : { name: trimmed, unrecognized: true };
            if (mounted.current) setIsCreating(true);
            try {
                const created = await createGame(payload);
                // id and name only. is_ignored/is_accepted on this response are always
                // false/null regardless of the user's real prefs — never propagate them.
                meta = {
                    id: created.id,
                    primary_name: created.primary_name,
                    cover_image_url: created.cover_image_url,
                };
            } catch {
                if (mounted.current) setError({ scope: 'create', key: 'select.createFailed' });
                return null;
            } finally {
                if (mounted.current) setIsCreating(false);
            }
        }

        // The return value is the caller's contract and must resolve regardless of
        // mount state; only the state writes below are guarded.
        if (mounted.current) {
            setSelectedMeta(meta);
            setQueryState('');
            setDebounced('');
            setSuggestions([]);
            setCandidates([]);
            setMode('browse');
        }
        onResolved(meta.id);
        return meta.id;
    }, [trimmed, onResolved]);

    return {
        query,
        setQuery,
        libraryMatches,
        catalogMatches,
        pickerGames,
        isPickerLoading,
        pickerError,
        isSuggesting: debounced.length > 0 && isSuggesting,
        mode,
        candidates,
        error,
        selectedMeta,
        isCreating,
        searchOnline,
        reset,
        select,
    };
}
