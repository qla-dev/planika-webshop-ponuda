import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import heelModelUrl from './assets/models/hogl-heel.glb?url';

// Variants of the Högl heel for the shop demos (illustrative: we only have photos of the black one).
// A variant is { tint, shape, plain, finish }:
//   tint   – colour for the patent leather (null = original black)
//   shape  – 'stiletto' (original 8 cm) or 'kitten' (low heel, the body tilts down at the back)
//   plain  – true dyes the gold buckle too, so the pump reads as a clean court shoe
//   finish – 'patent' (glossy) or 'suede' (matte, no highlights)
export function tintTexture(texture, hex, { plain = false, finish = 'patent' } = {}) {
  const image = texture.image;
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = pixels.data;
  const tint = new THREE.Color(hex || '#141414');
  const [tr, tg, tb] = [tint.r * 255, tint.g * 255, tint.b * 255];
  const shineAmount = finish === 'suede' ? .15 : .9;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const light = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const saturation = max ? (max - min) / max : 0;
    const gold = saturation > .28 && light > .22;
    if (light > .62 && !gold) continue; // pale lining
    if (gold && !plain) continue; // keep the buckle
    const shade = gold ? .85 : finish === 'suede' ? .78 + light * .35 : Math.min(1, .5 + light * 1.4);
    const shine = gold ? 0 : Math.max(0, light - .35) * 255 * shineAmount; // patent highlights
    data[i] = Math.min(255, tr * shade + shine);
    data[i + 1] = Math.min(255, tg * shade + shine);
    data[i + 2] = Math.min(255, tb * shade + shine);
  }
  ctx.putImageData(pixels, 0, 0);
  const tinted = new THREE.CanvasTexture(canvas);
  tinted.flipY = texture.flipY;
  tinted.colorSpace = texture.colorSpace;
  tinted.wrapS = texture.wrapS;
  tinted.wrapT = texture.wrapT;
  return tinted;
}

let heelPromise;
export const loadHeel = () => (heelPromise ||= new GLTFLoader().loadAsync(heelModelUrl));

// Lower the heel: the tip stays on the ground, the back of the shoe sinks, the toe does not move.
// The model runs along z (toe at -z, heel at +z) with y up.
function kittenGeometry(geometry) {
  const lowered = geometry.clone();
  const position = lowered.attributes.position;
  geometry.computeBoundingBox();
  const floor = geometry.boundingBox.min.y;
  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i), z = position.getZ(i);
    const back = THREE.MathUtils.smoothstep(z, -.2, .32);
    const lift = THREE.MathUtils.clamp((y - floor) / .18, 0, 1);
    position.setY(i, y - .1 * back * lift);
  }
  position.needsUpdate = true;
  lowered.computeVertexNormals();
  lowered.computeBoundingBox();
  return lowered;
}

const textures = new Map();
const geometries = new Map();
const variantKey = variant => [variant.tint || 'black', variant.plain ? 'plain' : 'buckle', variant.finish || 'patent'].join('|');

// A ready-to-place copy of the heel for one variant (fresh materials, cached textures and geometry).
export function buildHeel(gltf, variant = {}) {
  const model = gltf.scene.clone(true);
  model.traverse(node => {
    if (!node.isMesh) return;
    const original = node.material.map;
    node.material = node.material.clone();
    const key = variantKey(variant);
    if (!textures.has(key)) {
      const untouched = !variant.tint && !variant.plain && (variant.finish || 'patent') === 'patent';
      textures.set(key, untouched ? original : tintTexture(original, variant.tint, variant));
    }
    node.material.map = textures.get(key);
    node.material.roughness = .5;
    node.material.envMapIntensity = 1.1;
    if (variant.finish === 'suede') {
      // Brushed leather: drop the glossy roughness/metalness maps so no reflections remain.
      Object.assign(node.material, { roughnessMap: null, metalnessMap: null, roughness: .95, metalness: 0, envMapIntensity: .6 });
    }
    if (variant.shape === 'kitten') {
      if (!geometries.has(node.geometry)) geometries.set(node.geometry, kittenGeometry(node.geometry));
      node.geometry = geometries.get(node.geometry);
    }
  });
  return model;
}

// Side-profile product shots (transparent PNG data URLs) for each { id, ...variant }, toe pointing right,
// framed with an orthographic camera so nothing is ever cropped.
export async function renderHeelShots(variants, width = 800, height = 520) {
  const gltf = await loadHeel();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.add(new THREE.HemisphereLight(0xfff8f0, 0xcfc3b4, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(2, 5, 6);
  scene.add(key);
  const aspect = width / height;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 50);
  camera.position.set(0, 0, 10);

  const shots = {};
  for (const variant of variants) {
    const holder = new THREE.Group();
    const model = buildHeel(gltf, variant);
    holder.add(model);
    holder.rotation.y = -Math.PI / 2; // pure side view, toe to the right
    holder.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(holder);
    holder.position.sub(box.getCenter(new THREE.Vector3()));
    const size = box.getSize(new THREE.Vector3());
    const pad = 1.12;
    const halfHeight = Math.max(size.y, size.x / aspect) * pad / 2;
    Object.assign(camera, { top: halfHeight, bottom: -halfHeight, left: -halfHeight * aspect, right: halfHeight * aspect });
    camera.updateProjectionMatrix();
    scene.add(holder);
    renderer.render(scene, camera);
    shots[variant.id] = renderer.domElement.toDataURL('image/png');
    scene.remove(holder);
  }
  renderer.dispose();
  pmrem.dispose();
  return shots;
}
