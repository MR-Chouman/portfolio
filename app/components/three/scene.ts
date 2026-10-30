import {
  DirectionalLight,
  HemisphereLight,
  type Material,
  type Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";

import type { ProjectObjectKind } from "../../../content/schema";
import { type ObjectColors } from "./colors";
import { buildModel, type ObjectMaterials } from "./models";
import type { Rotation } from "./rotation";

// Everything that touches Three.js (T-034, D-032). ProjectObject imports this
// module dynamically, so Three.js is a separate chunk that only case study
// pages load, after first paint.

export interface MountedScene {
  setColors(colors: ObjectColors): void;
  setRotation(rotation: Rotation): void;
  render(): void;
  dispose(): void;
}

export function mountScene(
  container: HTMLElement,
  kind: ProjectObjectKind,
  colors: ObjectColors,
): MountedScene {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.append(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0.6, 5.2);
  camera.lookAt(0, 0, 0);

  scene.add(new HemisphereLight(0xffffff, 0x888888, 1.6));
  const sun = new DirectionalLight(0xffffff, 2.2);
  sun.position.set(3, 5, 4);
  scene.add(sun);

  const materials: ObjectMaterials = {
    primary: new MeshStandardMaterial({ flatShading: true, roughness: 0.7 }),
    accent: new MeshStandardMaterial({ flatShading: true, roughness: 0.5 }),
    detail: new MeshStandardMaterial({ flatShading: true, roughness: 0.8 }),
  };
  const model = buildModel(kind, materials);
  scene.add(model);

  const resize = () => {
    const { clientWidth: width, clientHeight: height } = container;
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  const mounted: MountedScene = {
    setColors(next) {
      for (const slot of Object.keys(materials) as (keyof ObjectColors)[]) {
        (materials[slot] as MeshStandardMaterial).color.set(next[slot]);
      }
    },
    setRotation({ yaw, pitch }) {
      model.rotation.set(pitch, yaw, 0, "XYZ");
    },
    render() {
      renderer.render(scene, camera);
    },
    dispose() {
      resizeObserver.disconnect();
      model.traverse((object) => {
        (object as Mesh).geometry?.dispose();
      });
      Object.values(materials).forEach((material: Material) =>
        material.dispose(),
      );
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
  mounted.setColors(colors);
  resize();
  return mounted;
}
