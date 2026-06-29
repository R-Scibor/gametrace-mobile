import Svg, { Circle, Path } from 'react-native-svg';

type IconProps = { color: string; size?: number };

// Crescent moon.
export const NightIcon = ({ color, size = 16 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <Path
            d="M13.6 3.2A7 7 0 1 0 16.8 14.6 5.6 5.6 0 0 1 13.6 3.2Z"
            fill={color}
        />
    </Svg>
);

// Sun on the horizon with an upward arrow — rising.
export const MorningIcon = ({ color, size = 16 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <Path d="M3 16h14" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        <Path d="M6.5 16a3.5 3.5 0 0 1 7 0" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        <Path
            d="M6.4 13.9 4.8 13M7.9 12.4 7 10.8M12.1 12.4 13 10.8M13.6 13.9 15.2 13"
            stroke={color} strokeWidth={1.6} strokeLinecap="round"
        />
        <Path d="M10 10V4M7.6 6.4 10 4l2.4 2.4" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// Full sun with rays.
export const AfternoonIcon = ({ color, size = 16 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <Circle cx="10" cy="10" r="3.2" stroke={color} strokeWidth={1.6} />
        <Path
            d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.8 4.8l1.4 1.4M13.8 13.8l1.4 1.4M15.2 4.8l-1.4 1.4M6.2 13.8l-1.4 1.4"
            stroke={color}
            strokeWidth={1.6}
            strokeLinecap="round"
        />
    </Svg>
);

// Sun on the horizon with a downward arrow — setting.
export const EveningIcon = ({ color, size = 16 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <Path d="M3 16h14" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        <Path d="M6.5 16a3.5 3.5 0 0 1 7 0" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        <Path
            d="M6.4 13.9 4.8 13M7.9 12.4 7 10.8M12.1 12.4 13 10.8M13.6 13.9 15.2 13"
            stroke={color} strokeWidth={1.6} strokeLinecap="round"
        />
        <Path d="M10 4v6M7.6 7.6 10 10l2.4-2.4" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);
