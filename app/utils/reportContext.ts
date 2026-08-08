import { Platform } from 'react-native';
import { navigationRef } from '../navigation/navigationRef';
import type { ReportContext } from '../api/reports';
import { appVersion } from './appVersion';

export function buildReportContext(): ReportContext {
    return {
        screen: navigationRef.getCurrentRoute()?.name ?? 'unknown',
        platform: Platform.OS,
        osVersion: String(Platform.Version),
        appVersion: appVersion(),
    };
}
