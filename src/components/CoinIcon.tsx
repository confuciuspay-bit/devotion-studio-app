import { useState } from "react";

export function CoinIcon({
  src,
  symbol,
  size = 36,
  className = "",
}: {
  src?: string;
  symbol: string;
  size?: number;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div
        className={`rounded-full bg-secondary text-foreground grid place-items-center font-mono font-semibold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.32 }}
      >
        {symbol.slice(0, 3).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={symbol}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setErrored(true)}
      className={`rounded-full bg-card object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
