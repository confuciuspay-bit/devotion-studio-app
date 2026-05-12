import React from "react";
import { View } from "react-native";
import Svg, { Polyline, Defs, LinearGradient, Stop, Circle } from "react-native-svg";

export function Sparkline({
  data,
  width = 80,
  height = 28,
  positive,
}: {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
}) {
  if (!data || data.length < 2) return <View style={{ width, height }} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = width / (data.length - 1);

  const pts = data.map((v, i) => ({
    x: i * stepX,
    y: height - ((v - min) / span) * height,
  }));

  const isUp = positive ?? data[data.length - 1] >= data[0];
  const color = isUp ? "#10b981" : "#ef4444";
  const id = `sg-${Math.abs(Math.round(data[0] * 1000))}`;

  const linePoints = pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const fillPoints = `0,${height} ${linePoints} ${width},${height}`;
  const lastPt = pts[pts.length - 1];

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Polyline points={fillPoints} fill={`url(#${id})`} stroke="none" />
      <Polyline
        points={linePoints}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Circle cx={lastPt.x} cy={lastPt.y} r={2} fill={color} />
    </Svg>
  );
}
