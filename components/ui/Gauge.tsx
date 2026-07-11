import { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface GaugeProps {
  /** 0–1 fill of the arc (clamped) */
  progress: number;
  /** Total width; the rendered height is roughly half of this */
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor: string;
  /** Centered content sitting inside the arc (value + label) */
  children?: ReactNode;
}

// Point on the arc at `angle` degrees: 180 = left end, 0 = right end
function point(cx: number, cy: number, r: number, angle: number) {
  const rad = (Math.PI * angle) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, from: number, to: number) {
  const s = point(cx, cy, r, from);
  const e = point(cx, cy, r, to);
  return `M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}`;
}

// Presentational semicircular progress gauge. Colors come in as props —
// callers resolve theme colors in JS per the Chip/Button convention.
export function Gauge({
  progress,
  size = 190,
  strokeWidth = 14,
  color,
  trackColor,
  children,
}: GaugeProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const height = size / 2 + strokeWidth / 2;
  const sweep = clamped * 180;

  return (
    <View style={{ width: size, height }}>
      <Svg width={size} height={height} viewBox={`0 0 ${size} ${height}`}>
        <Path
          d={arcPath(cx, cy, r, 180, 0)}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
        {sweep > 0 && (
          <Path
            d={arcPath(cx, cy, r, 180, 180 - sweep)}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />
        )}
      </Svg>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
        }}
      >
        {children}
      </View>
    </View>
  );
}
