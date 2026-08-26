import { describe, expect, it } from "vitest";
import { clusterMapPoints } from "./mapClustering";

describe("clusterMapPoints", () => {
  const nearby = [
    { id: 1, latitude: -25.281, longitude: -57.635 },
    { id: 2, latitude: -25.2811, longitude: -57.6351 },
  ];

  it("agrupa puntos cercanos cuando el zoom es amplio", () => {
    expect(clusterMapPoints(nearby, 10)).toEqual([
      expect.objectContaining({ ids: [1, 2] }),
    ]);
  });

  it("muestra los puntos individuales al acercar el zoom", () => {
    expect(clusterMapPoints(nearby, 17)).toEqual([]);
  });

  it("mantiene el punto seleccionado fuera de una agrupación", () => {
    expect(clusterMapPoints([...nearby, { id: 3, latitude: -25.28105, longitude: -57.63505, selected: true }], 10))
      .toEqual([expect.objectContaining({ ids: [1, 2] })]);
  });
});
