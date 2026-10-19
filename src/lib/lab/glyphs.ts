// altı Serhatech Core modülünün ortak geometrisi. aynı sayılar hem webgl çekirdeği
// (ana sayfa) hem svg glifleri (alt sayfalar) çiziyor, modül sitenin her yerinde aynı
// fiziksel parça gibi görünüyor.

export const MODULE = { width: 1.5, depth: 1, height: 0.34 } as const;

// modülün üst yüzündeki çizgiler, [-1, 1] aralığına normalize edilmiş koordinatlarla.
// u genişlik boyunca, v derinlik boyunca gidiyor. [u1, v1, u2, v2]
export type Segment = readonly [number, number, number, number];

function rect(u1: number, v1: number, u2: number, v2: number): Segment[] {
  return [
    [u1, v1, u2, v1],
    [u2, v1, u2, v2],
    [u2, v2, u1, v2],
    [u1, v2, u1, v1],
  ];
}

// sıralama src/content/studio.ts'teki hizmet sırasıyla aynı.
export const glyphs: Segment[][] = [
  // web uygulamaları: yan menülü ve içerik satırlı bir pencere.
  [
    ...rect(-0.84, -0.78, 0.84, 0.78),
    [-0.84, -0.42, 0.84, -0.42],
    [-0.38, -0.42, -0.38, 0.78],
    [-0.2, -0.02, 0.66, -0.02],
    [-0.2, 0.3, 0.44, 0.3],
    [-0.7, -0.6, -0.56, -0.6],
  ],
  // backend & api: portlarla biten dört şeritli bir hat.
  [
    ...[-0.6, -0.2, 0.2, 0.6].flatMap((v): Segment[] => [
      [-0.86, v, 0.5, v],
      ...rect(0.56, v - 0.11, 0.78, v + 0.11),
    ]),
    [-0.86, -0.78, -0.86, 0.78],
  ],
  // e-ticaret: ürün kutucuklarından oluşan bir katalog.
  [-0.56, 0, 0.56].flatMap((u) =>
    [-0.4, 0.4].flatMap((v) => rect(u - 0.22, v - 0.28, u + 0.22, v + 0.28)),
  ),
  // otomasyon: yön işaretli kapalı bir döngü ve üç adım.
  [
    [-0.7, -0.5, 0.7, -0.5],
    [0.7, -0.5, 0.7, 0.5],
    [0.7, 0.5, -0.7, 0.5],
    [-0.7, 0.5, -0.7, -0.5],
    [0.08, -0.62, 0.22, -0.5],
    [0.08, -0.38, 0.22, -0.5],
    [-0.08, 0.38, -0.22, 0.5],
    [-0.08, 0.62, -0.22, 0.5],
    ...rect(-0.5, -0.12, -0.26, 0.12),
    ...rect(-0.12, -0.12, 0.12, 0.12),
    ...rect(0.26, -0.12, 0.5, 0.12),
  ],
  // sistem & altyapı: durum işaretli dört üniteli bir kabin.
  [-0.6, -0.2, 0.2, 0.6].flatMap((v): Segment[] => [
    ...rect(-0.82, v - 0.15, 0.82, v + 0.15),
    [0.52, v, 0.68, v],
  ]),
  // yapay zeka entegrasyonları: birbirine bağlı düğümlerden küçük bir graf.
  (() => {
    const nodes = [
      [-0.66, -0.5],
      [-0.66, 0.5],
      [0, -0.1],
      [0.62, -0.56],
      [0.62, 0.46],
    ] as const;
    const edges = [
      [0, 2],
      [1, 2],
      [2, 3],
      [2, 4],
      [0, 1],
    ] as const;
    const diamond = ([u, v]: readonly [number, number]): Segment[] => {
      const r = 0.1;
      return [
        [u - r, v, u, v - r],
        [u, v - r, u + r, v],
        [u + r, v, u, v + r],
        [u, v + r, u - r, v],
      ];
    };
    return [
      ...edges.map(
        ([a, b]): Segment => [nodes[a][0], nodes[a][1], nodes[b][0], nodes[b][1]],
      ),
      ...nodes.flatMap(diamond),
    ];
  })(),
];

// svg gliflerin kullandığı izometrik izdüşüm: x genişlik, z derinlik, y yukarı.
const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);
export function iso(x: number, y: number, z: number): [number, number] {
  return [(x - z) * COS, (x + z) * SIN - y];
}
