import React, { useState } from "react";
import { View, Image, Text } from "react-native";

export function CoinIcon({
  src,
  symbol,
  size = 36,
}: {
  src?: string;
  symbol: string;
  size?: number;
}) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <View
        className="rounded-full bg-secondary items-center justify-center"
        style={{ width: size, height: size }}
      >
        <Text
          className="font-mono font-semibold text-foreground"
          style={{ fontSize: size * 0.3 }}
        >
          {symbol.slice(0, 3).toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: src }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      onError={() => setErrored(true)}
    />
  );
}
