import {
  Box3,
  BoxGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  TubeGeometry,
  Vector3,
  type BufferGeometry,
  type Material,
} from "three";

import type { ProjectObjectKind } from "../../../content/schema";
import type { ObjectColors } from "./colors";

// Low-poly models built from simple shapes (T-034, D-032): no model files,
// loaders or textures. Each uses three material slots, colored from tokens.
export type ObjectMaterials = Record<keyof ObjectColors, Material>;

// Radius of every model's bounding sphere, in scene units: the model stays in
// frame at any rotation.
export const MODEL_RADIUS = 1.35;

type Part = (
  geometry: BufferGeometry,
  material: Material,
  position?: [number, number, number],
  rotation?: [number, number, number],
) => Mesh;

function parts(group: Group): Part {
  return (geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) => {
    const mesh = new Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    group.add(mesh);
    return mesh;
  };
}

const QUARTER = Math.PI / 2;

function airplane(m: ObjectMaterials): Group {
  const group = new Group();
  const add = parts(group);
  // Fuselage along x, nose towards +x.
  add(
    new CylinderGeometry(0.2, 0.17, 2.2, 10),
    m.primary,
    [0, 0, 0],
    [0, 0, QUARTER],
  );
  add(
    new ConeGeometry(0.18, 0.45, 10),
    m.primary,
    [1.32, 0, 0],
    [0, 0, -QUARTER],
  );
  add(
    new ConeGeometry(0.16, 0.55, 10),
    m.primary,
    [-1.37, 0.04, 0],
    [0, 0, QUARTER],
  );
  // Swept wings.
  for (const side of [-1, 1]) {
    add(
      new BoxGeometry(0.42, 0.04, 1.5),
      m.detail,
      [-0.2, -0.06, side * 0.8],
      [0, -side * 0.4, 0],
    );
    add(
      new CylinderGeometry(0.08, 0.07, 0.36, 8),
      m.accent,
      [0.12, -0.17, side * 0.6],
      [0, 0, QUARTER],
    );
    add(
      new BoxGeometry(0.22, 0.03, 0.42),
      m.detail,
      [-1.28, 0.06, side * 0.24],
      [0, -side * 0.4, 0],
    );
  }
  // Fin.
  add(
    new BoxGeometry(0.38, 0.5, 0.04),
    m.accent,
    [-1.25, 0.32, 0],
    [0, 0, -0.35],
  );
  // Banked a little, so the wings face the viewer.
  group.rotation.x = 0.45;
  return group;
}

function pallet(m: ObjectMaterials): Group {
  const group = new Group();
  const add = parts(group);
  for (const z of [-0.5, -0.25, 0, 0.25, 0.5]) {
    add(new BoxGeometry(1.6, 0.05, 0.18), m.detail, [0, 0.2, z]);
  }
  for (const x of [-0.7, 0, 0.7]) {
    add(new BoxGeometry(0.16, 0.06, 1.2), m.detail, [x, 0.03, 0]);
    for (const z of [-0.5, 0, 0.5]) {
      add(new BoxGeometry(0.16, 0.12, 0.16), m.detail, [x, 0.12, z]);
    }
  }
  // Two crates on the pallet and one on top.
  const crates: [number, number, number, number][] = [
    [-0.38, 0.53, -0.15, 0.6],
    [0.4, 0.5, 0.2, 0.55],
    [0, 1.08, -0.02, 0.5],
  ];
  crates.forEach(([x, y, z, size], index) => {
    add(
      new BoxGeometry(size, size, size),
      index === 2 ? m.accent : m.primary,
      [x, y, z],
      [0, index * 0.25, 0],
    );
    // Band around each crate.
    add(
      new BoxGeometry(size + 0.02, 0.06, size + 0.02),
      m.detail,
      [x, y, z],
      [0, index * 0.25, 0],
    );
  });
  return group;
}

function charger(m: ObjectMaterials): Group {
  const group = new Group();
  const add = parts(group);
  add(new BoxGeometry(0.8, 0.08, 0.6), m.detail, [0, 0.04, 0]);
  add(new BoxGeometry(0.5, 1.7, 0.34), m.primary, [0, 0.93, 0]);
  add(new BoxGeometry(0.62, 0.08, 0.46), m.detail, [0, 1.82, 0]);
  // Screen and status light on the front (+z).
  add(new BoxGeometry(0.34, 0.24, 0.02), m.accent, [0, 1.45, 0.18]);
  add(new BoxGeometry(0.2, 0.04, 0.02), m.accent, [0, 1.2, 0.18]);
  // Holster on the side, and a cable from it down to a plug on the ground.
  add(new BoxGeometry(0.1, 0.22, 0.16), m.detail, [0.3, 1.0, 0.05]);
  const cable = new CatmullRomCurve3([
    new Vector3(0.3, 0.9, 0.05),
    new Vector3(0.45, 0.5, 0.15),
    new Vector3(0.6, 0.12, 0.35),
    new Vector3(0.9, 0.06, 0.45),
    new Vector3(1.05, 0.08, 0.2),
  ]);
  add(new TubeGeometry(cable, 24, 0.035, 6), m.detail);
  add(
    new CylinderGeometry(0.07, 0.07, 0.2, 8),
    m.accent,
    [1.05, 0.08, 0.05],
    [QUARTER, 0, 0],
  );
  return group;
}

function hospitalBed(m: ObjectMaterials): Group {
  const group = new Group();
  const add = parts(group);
  // Frame, legs and wheels.
  add(new BoxGeometry(2, 0.08, 0.9), m.detail, [0, 0.5, 0]);
  for (const x of [-0.9, 0.9]) {
    for (const z of [-0.38, 0.38]) {
      add(new CylinderGeometry(0.03, 0.03, 0.42, 6), m.detail, [x, 0.27, z]);
      add(
        new CylinderGeometry(0.06, 0.06, 0.05, 10),
        m.accent,
        [x, 0.06, z],
        [QUARTER, 0, 0],
      );
    }
  }
  // Mattress with the head section raised, and a pillow.
  add(new BoxGeometry(1.3, 0.18, 0.84), m.primary, [0.32, 0.63, 0]);
  add(
    new BoxGeometry(0.66, 0.18, 0.84),
    m.primary,
    [-0.6, 0.76, 0],
    [0, 0, -0.45],
  );
  add(
    new BoxGeometry(0.22, 0.1, 0.56),
    m.detail,
    [-0.68, 0.92, 0],
    [0, 0, -0.45],
  );
  // Headboard, footboard and side rails resting on the frame.
  add(new BoxGeometry(0.06, 0.75, 0.9), m.accent, [-1.0, 0.85, 0]);
  add(new BoxGeometry(0.06, 0.5, 0.9), m.accent, [1.0, 0.72, 0]);
  for (const z of [-0.45, 0.45]) {
    add(new BoxGeometry(0.9, 0.1, 0.03), m.detail, [0.1, 0.86, z]);
    for (const x of [-0.25, 0.45]) {
      add(new BoxGeometry(0.04, 0.32, 0.03), m.detail, [x, 0.7, z]);
    }
  }
  return group;
}

const builders: Record<ProjectObjectKind, (m: ObjectMaterials) => Group> = {
  airplane,
  pallet,
  charger,
  "hospital-bed": hospitalBed,
};

// Distance from `center` to the model's farthest vertex.
function radiusAround(model: Group, center: Vector3): number {
  model.updateMatrixWorld(true);
  const point = new Vector3();
  let radius = 0;
  model.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const positions = (object.geometry as BufferGeometry).getAttribute(
      "position",
    );
    for (let index = 0; index < positions.count; index++) {
      point.fromBufferAttribute(positions, index);
      point.applyMatrix4(object.matrixWorld);
      radius = Math.max(radius, point.distanceTo(center));
    }
  });
  return radius;
}

// The model for `kind`, centered on the origin and scaled so its farthest
// vertex sits at MODEL_RADIUS, inside a wrapper group that the scene rotates.
export function buildModel(
  kind: ProjectObjectKind,
  materials: ObjectMaterials,
): Group {
  const model = builders[kind](materials);
  model.updateMatrixWorld(true);
  const center = new Box3().setFromObject(model).getCenter(new Vector3());
  const scale = MODEL_RADIUS / radiusAround(model, center);
  model.scale.setScalar(scale);
  model.position.copy(center).multiplyScalar(-scale);
  const pivot = new Group();
  pivot.add(model);
  return pivot;
}
