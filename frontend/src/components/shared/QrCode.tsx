import { useMemo } from 'react';
import QRCode from 'qrcode';

/**
 * Renders `value` as an SVG QR code — generated synchronously so it works in
 * SSR and needs no uploaded image. Each dark module becomes one path segment.
 */
export function QrCode({ value, size = 128, label }: { value: string; size?: number; label: string }) {
  const { path, count } = useMemo(() => {
    const { modules } = QRCode.create(value, { errorCorrectionLevel: 'M' });
    let d = '';
    for (let row = 0; row < modules.size; row++) {
      for (let col = 0; col < modules.size; col++) {
        if (modules.get(row, col)) d += `M${col} ${row}h1v1h-1z`;
      }
    }
    return { path: d, count: modules.size };
  }, [value]);
  // 2-module quiet zone on every side keeps the code scannable on any background.
  const quiet = 2;
  const box = count + quiet * 2;
  return (
    <svg
      role="img"
      aria-label={label}
      width={size}
      height={size}
      viewBox={`${-quiet} ${-quiet} ${box} ${box}`}
      shapeRendering="crispEdges"
      className="bg-white shrink-0"
    >
      <rect x={-quiet} y={-quiet} width={box} height={box} fill="#fff" />
      <path d={path} fill="#000" />
    </svg>
  );
}
