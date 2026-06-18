import type { NavigatorScreenParams } from '@react-navigation/native';
import type { EnrichmentStatus, SessionStatus } from '../types/api';

export type AddSessionParams = {
    gameId?: number;
    date?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    note?: string;
};

export type TabParamList = {
    Dashboard: undefined;
    Library: undefined;
    AddSession: AddSessionParams | undefined;
    Stats: undefined;
    Settings: undefined;
};

export type RootStackParamList = {
    Auth: undefined;
    Main: NavigatorScreenParams<TabParamList> | undefined;
    GameDetail: {
        gameId: number;
        gameName?: string;
        enrichmentStatus?: EnrichmentStatus;
        isAccepted?: boolean | null;
        isIgnored?: boolean;
    };
    EditSession: { sessionId: number; status: SessionStatus };
    Voice: undefined;
};

// Makes useNavigation()/navigate() typed against the root stack everywhere,
// including tab screens navigating up to stack routes.
declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList {}
    }
}
