import Svg, { Rect, Circle, Path } from 'react-native-svg';

type IconProps = { color: string; size?: number };

export const DashboardIcon = ({ color, size = 20 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <Rect x="2" y="2" width="7" height="7" rx="1.5" fill={color} opacity={0.9} />
        <Rect x="11" y="2" width="7" height="7" rx="1.5" fill={color} opacity={0.5} />
        <Rect x="2" y="11" width="7" height="7" rx="1.5" fill={color} opacity={0.5} />
        <Rect x="11" y="11" width="7" height="7" rx="1.5" fill={color} opacity={0.5} />
    </Svg>
);

export const LibraryIcon = ({ color, size = 20 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <Rect x="2" y="2" width="5" height="16" rx="1" fill={color} opacity={0.9} />
        <Rect x="9" y="4" width="5" height="14" rx="1" fill={color} opacity={0.7} />
        <Rect x="16" y="6" width="3" height="12" rx="1" fill={color} opacity={0.5} />
    </Svg>
);

export const AddIcon = ({ color, size = 20 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <Circle cx="10" cy="10" r="8" stroke={color} strokeWidth={1.5} />
        <Path d="M10 6v8M6 10h8" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
);

export const StatsIcon = ({ color, size = 20 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <Path
            d="M2 16L6 10L10 12L14 6L18 8"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Circle cx="6" cy="10" r="1.5" fill={color} />
        <Circle cx="10" cy="12" r="1.5" fill={color} />
        <Circle cx="14" cy="6" r="1.5" fill={color} />
    </Svg>
);

export const SettingsIcon = ({ color, size = 20 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <Circle cx="10" cy="10" r="2.5" stroke={color} strokeWidth={1.5} />
        <Path
            d="M10 2v2M10 16v2M2 10h2M16 10h2M4.1 4.1l1.4 1.4M14.5 14.5l1.4 1.4M14.5 5.5L13.1 6.9M6.9 13.1L5.5 14.5"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
        />
    </Svg>
);
