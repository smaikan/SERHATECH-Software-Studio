import { MODULE, glyphs, iso } from "@/lib/lab/glyphs";

const SCALE = 74;
const INSET = 0.86;

function point(x: number, y: number, z: number) {
  const [px, py] = iso(x, y, z);
  return [px * SCALE, py * SCALE] as const;
}

function path(points: (readonly [number, number])[], close = false) {
  return (
    points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("") +
    (close ? "Z" : "")
  );
}

// tek bir Serhatech Core modülünün izometrik çizimi, webgl modülüyle aynı sayılardan
// yapılıyor. hizmet sayfalarında ve webgl yokken yedek olarak kullanılıyor.
export function ModuleGlyph({
  index,
  className = "",
  title,
}: {
  index: number;
  className?: string;
  title?: string;
}) {
  const w = MODULE.width / 2;
  const d = MODULE.depth / 2;
  const h = MODULE.height / 2;
  const top = [
    point(-w, h, -d),
    point(w, h, -d),
    point(w, h, d),
    point(-w, h, d),
  ];
  const bottom = [point(w, -h, -d), point(w, -h, d), point(-w, -h, d)];
  const segments = glyphs[index] ?? [];
  const pattern = segments
    .map(([u1, v1, u2, v2]) => {
      const a = point(u1 * w * INSET, h, v1 * d * INSET);
      const b = point(u2 * w * INSET, h, v2 * d * INSET);
      return path([a, b]);
    })
    .join("");
  const all = [...top, ...bottom];
  const pad = 18;
  const minX = Math.min(...all.map((p) => p[0])) - pad;
  const maxX = Math.max(...all.map((p) => p[0])) + pad;
  const minY = Math.min(...all.map((p) => p[1])) - pad;
  const maxY = Math.max(...all.map((p) => p[1])) + pad;
  return (
    <svg
      className={`module-glyph ${className}`}
      viewBox={`${minX.toFixed(0)} ${minY.toFixed(0)} ${(maxX - minX).toFixed(0)} ${(maxY - minY).toFixed(0)}`}
      fill="none"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path className="glyph-side" d={path([top[1], bottom[0], bottom[1], bottom[2], top[3], top[2]], true)} />
      <path className="glyph-top" d={path(top, true)} pathLength={1} />
      <path
        className="glyph-edge"
        d={path([top[1], bottom[0], bottom[1], bottom[2], top[3]]) + path([top[2], bottom[1]])}
        pathLength={1}
      />
      <path className="glyph-pattern" d={pattern} />
      <circle className="glyph-port" cx={point(w * 0.78, h, -d * 0.62)[0]} cy={point(w * 0.78, h, -d * 0.62)[1]} r="3" />
    </svg>
  );
}
