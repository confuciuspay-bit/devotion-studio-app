import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QR({ value, size = 200, className = "" }: { value: string; size?: number; className?: string }) {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size * 2, margin: 1,
      color: { dark: "#0a0a14", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((url) => { if (!cancelled) setSrc(url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [value, size]);
  return (
    <div
      className={`rounded-2xl bg-white p-3 ${className}`}
      style={{ width: size + 24, height: size + 24 }}
    >
      {src && <img src={src} alt="QR code" width={size} height={size} className="block" />}
    </div>
  );
}
