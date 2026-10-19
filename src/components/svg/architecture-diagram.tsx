import {
  architectures,
  nodeLabel,
  nodeTech,
  type Architecture,
} from "@/content/architectures";
import { text, type Locale } from "@/i18n/routing";

const COL = 200;
const ROW = 96;
const NODE_W = 164;
const NODE_H = 60;

function layout(arch: Architecture) {
  const columns = [...new Set(arch.nodes.map((n) => n.column))].sort((a, b) => a - b);
  // boş sütunları sıkıştır, diyagramlar derli toplu kalsın.
  const colIndex = new Map(columns.map((c, i) => [c, i]));
  const pos = new Map(
    arch.nodes.map((n) => [
      n.id,
      { x: (colIndex.get(n.column) ?? 0) * COL, y: n.row * ROW },
    ]),
  );
  const xs = [...pos.values()].map((p) => p.x);
  const ys = [...pos.values()].map((p) => p.y);
  return {
    pos,
    minX: Math.min(...xs) - NODE_W / 2,
    maxX: Math.max(...xs) + NODE_W / 2,
    minY: Math.min(...ys) - NODE_H / 2,
    maxY: Math.max(...ys) + NODE_H / 2,
  };
}

// gerçek bir projenin mimarisinin 2d haritası. düğümlerde data-node id'leri var, sayfa
// o an anlatılan paragrafın kısmını vurgulayabiliyor.
export function ArchitectureDiagram({
  slug,
  locale,
  className = "",
  showTech = true,
}: {
  slug: string;
  locale: Locale;
  className?: string;
  // müşteriye dönük yerlerde sadece parça adları var, vaka çalışmalarında teknoloji de
  // ekleniyor.
  showTech?: boolean;
}) {
  const arch = architectures[slug];
  if (!arch) return null;
  const { pos, minX, maxX, minY, maxY } = layout(arch);
  const pad = 34;
  const frame = arch.frame
    ? (() => {
        const ps = arch.frame.nodeIds.map((id) => pos.get(id)!);
        const x1 = Math.min(...ps.map((p) => p.x)) - NODE_W / 2 - 16;
        const x2 = Math.max(...ps.map((p) => p.x)) + NODE_W / 2 + 16;
        const y1 = Math.min(...ps.map((p) => p.y)) - NODE_H / 2 - 30;
        const y2 = Math.max(...ps.map((p) => p.y)) + NODE_H / 2 + 16;
        return { x1, x2, y1, y2 };
      })()
    : null;
  const vx = Math.min(minX, frame?.x1 ?? minX) - pad;
  const vy = Math.min(minY, frame?.y1 ?? minY) - pad;
  const vw = Math.max(maxX, frame?.x2 ?? maxX) + pad - vx;
  const vh = Math.max(maxY, frame?.y2 ?? maxY) + pad - vy;
  return (
    <figure className={`arch-diagram ${className}`}>
      <svg
        viewBox={`${vx} ${vy} ${vw} ${vh}`}
        role="img"
        aria-label={text(
          locale,
          `Mimari: ${arch.nodes.map((n) => nodeLabel(n, locale)).join(", ")}`,
          `Architecture: ${arch.nodes.map((n) => nodeLabel(n, locale)).join(", ")}`,
        )}
      >
        {frame ? (
          <g className="arch-frame">
            <rect x={frame.x1} y={frame.y1} width={frame.x2 - frame.x1} height={frame.y2 - frame.y1} />
            <text x={frame.x1 + 12} y={frame.y1 + 18}>
              {arch.frame!.label[locale]}
            </text>
          </g>
        ) : null}
        <g className="arch-edges">
          {arch.edges.map(([from, to]) => {
            const a = pos.get(from)!;
            const b = pos.get(to)!;
            const sameCol = Math.abs(a.x - b.x) < 1;
            const d = sameCol
              ? `M${a.x} ${a.y + Math.sign(b.y - a.y) * (NODE_H / 2)}V${b.y - Math.sign(b.y - a.y) * (NODE_H / 2)}`
              : (() => {
                  const x1 = a.x + Math.sign(b.x - a.x) * (NODE_W / 2);
                  const x2 = b.x - Math.sign(b.x - a.x) * (NODE_W / 2);
                  const mid = (x1 + x2) / 2;
                  return `M${x1} ${a.y}H${mid}V${b.y}H${x2}`;
                })();
            return (
              <path
                key={`${from}-${to}`}
                d={d}
                pathLength={1}
                data-edge={`${from} ${to}`}
              />
            );
          })}
        </g>
        <g className="arch-nodes">
          {arch.nodes.map((node) => {
            const p = pos.get(node.id)!;
            return (
              <g key={node.id} data-node={node.id} transform={`translate(${p.x} ${p.y})`}>
                <path
                  className="arch-node-shape"
                  d={`M${-NODE_W / 2} ${-NODE_H / 2}H${NODE_W / 2 - 10}L${NODE_W / 2} ${-NODE_H / 2 + 10}V${NODE_H / 2}H${-NODE_W / 2 + 10}L${-NODE_W / 2} ${NODE_H / 2 - 10}Z`}
                />
                <text className="arch-node-label" x={-NODE_W / 2 + 14} y={showTech ? -4 : 5}>
                  {nodeLabel(node, locale)}
                </text>
                {showTech ? (
                  <text className="arch-node-tech" x={-NODE_W / 2 + 14} y={16}>
                    {nodeTech(node, locale)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>
    </figure>
  );
}
