import type { NavigatorScreenParams } from '@react-navigation/native';
import type { EnrichmentStatus, LibraryFilter, SessionStatus } from '../types/api';

export type AddSessionParams = {
    gameId?: number;
    gameName?: string;
    date?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    note?: string;
};

export type TabParamList = {
    Dashboard: undefined;
    Library: { filter?: LibraryFilter } | undefined;
    AddSession: AddSessionParams | undefined;
    Stats: undefined;
    Settings: undefined;
};

export type RootStackParamList = {
    Welcome: undefined;
    OfficialPolicy: undefined;
    CustomServer: undefined;
    Auth: undefined;
    Main: NavigatorScreenParams<TabParamList> | undefined;
    GameDetail: {
        gameId: number;
        gameName?: string;
        coverImageUrl?: string | null;
        enrichmentStatus?: EnrichmentStatus;
        isAccepted?: boolean | null;
        isIgnored?: boolean;
    };
    EditSession: { sessionId: number; status: SessionStatus };
    Trash: undefined;
    Voice: undefined;
    DeleteAccount: undefined;
};

// Makes useNavigation()/navigate() typed against the root stack everywhere,
// including tab screens navigating up to stack routes.
declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList {}
    }
}
