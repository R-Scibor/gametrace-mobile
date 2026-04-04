import client from './client';
import { GameBrief } from '../types/api';

type GamesResponse =  {
    items: GameBrief[];
    total: number;
};

export const getGames = async (skip= 0, limit =20): Promise<GamesResponse> => {
    const response = await client.get<GamesResponse>('/games', {
        params: { skip, limit },
    });
    return response.data;
};