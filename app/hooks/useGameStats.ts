import { useState, useEffect } from 'react';
import { getGameStats } from '../api/games';
import { GameStats } from '../types/api';

export const useGameStats = (gameId: number | null | undefined) => {
    const [data, setData] = useState<GameStats | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (gameId == null) {
            setData(null);
            return;
        }
        let cancelled = false;
        setLoading(true);
        getGameStats(gameId)
            .then((result) => { if (!cancelled) setData(result); })
            .catch(() => { if (!cancelled) setData(null); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [gameId]);

    return { data, loading };
};
