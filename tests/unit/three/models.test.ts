import { Box3, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { describe, expect, it } from "vitest";

import { buildModel, MODEL_RADIUS } from "~/components/three/models";

import { projectObjectKinds } from "../../../content/schema";

const materials = {
  primary: new MeshBasicMaterial(),
  accent: new MeshBasicMaterial(),
  detail: new MeshBasicMaterial(),
};

describe("3D object models (T-034)", () => {
  for (const kind of projectObjectKinds) {
    it(`builds a ${kind} from all three material slots`, () => {
      const model = buildModel(kind, materials);
      const used = new Set<unknown>();
      model.traverse((object) => {
        if (object instanceof Mesh) used.add(object.material);
      });
      expect(used).toEqual(new Set(Object.values(materials)));
    });

    it(`centers the ${kind} and keeps it inside its sphere`, () => {
      const model = buildModel(kind, materials);
      model.updateMatrixWorld(true);
      const box = new Box3().setFromObject(model);
      const center = box.getCenter(new Vector3());
      expect(center.length()).toBeLessThan(1e-6);
      // Every corner of the box may lie outside the sphere, but no vertex.
      const point = new Vector3();
      let farthest = 0;
      model.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        const positions = object.geometry.getAttribute("position");
        for (let index = 0; index < positions.count; index++) {
          point.fromBufferAttribute(positions, index);
          point.applyMatrix4(object.matrixWorld);
          farthest = Math.max(farthest, point.length());
        }
      });
      expect(farthest).toBeCloseTo(MODEL_RADIUS, 5);
    });
  }
});
