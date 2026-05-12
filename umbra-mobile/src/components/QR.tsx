import React, { useEffect, useState } from "react";
import { View, Image } from "react-native";
import QRCode from "qrcode";

export function QR({ value, size = 200 }: { value: string; size?: number }) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: { dark: "#0a0a14", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((url) => { if (!cancelled) setSrc(url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [value, size]);

  return (
    <View
      className="rounded-2xl bg-white p-3"
      style={{ width: size + 24, height: size + 24 }}
    >
      {src && (
        <Image
          source={{ uri: src }}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      )}
    </View>
  );
}
