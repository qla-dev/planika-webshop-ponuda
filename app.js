import './commerce-components.js';
import { initAiChat } from './ai-chat.js';
import './key-screens.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import heelModelUrl from './assets/models/hogl-heel.glb?url';
import heroHeelFrontUrl from './assets/planika/products/hogl-heel-front.png';

const aiWindow = document.querySelector('#ai-window');
document.querySelector('.design-language')?.setAttribute('id', 'brandbook');
const mainContent = document.querySelector('main');
const brandbook = document.querySelector('.design-language');
const webshopSection = document.querySelector('.experience');
if (mainContent && brandbook && webshopSection) mainContent.insertBefore(brandbook, webshopSection);
const input = document.querySelector('.chat-input input');
initAiChat(aiWindow);
document.querySelectorAll('[data-open-ai]').forEach(button => button.addEventListener('click', () => { aiWindow.classList.add('open'); input.focus(); }));
document.querySelector('[data-close-ai]').addEventListener('click', () => aiWindow.classList.remove('open'));
const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); }), { threshold: 0, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.section, .reveal').forEach(el => observer.observe(el));

// Brandbook motion card: the orbit number counts 01 → 02 → 03 and loops.
const orbitNumber = document.querySelector('.motion-orbit b');
if (orbitNumber && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let step = 0;
  window.setInterval(() => { step = (step + 1) % 3; orbitNumber.textContent = `0${step + 1}`; }, 1600);
}

// Lightweight 3D commerce scene: layered HTML moves with the pointer; no heavy WebGL runtime.
const heroScene = document.querySelector('.hero-visual');
if (heroScene) {
  heroScene.classList.add('is-three-scene');
  heroScene.classList.add('has-webgl');
  // Stage: the heel stands alone under spotlights; its product card only appears after a 3 s hover (see heel scene below).
  heroScene.insertAdjacentHTML('afterbegin', `<div class="stage-beams" aria-hidden="true"><i></i><i></i><i></i></div><div class="scene-ui"><a class="three-card product-plane" href="#component-product" data-product-link="hogl" aria-label="Högl lakirana salonka, 469,00 KM — pogledaj veličine i dostupnost"><img src="${heroHeelFrontUrl}" alt="Högl lakirana salonka" /><div><small>HÖGL · 469,00 KM</small><b>Lakirana salonka</b><span class="plane-cta">Pogledaj proizvod <i>→</i></span></div></a></div>`);
  const setTilt = (x, y) => { heroScene.style.setProperty('--tilt-x-soft', `${x * .28 + 4}deg`); heroScene.style.setProperty('--tilt-y-soft', `${y * .28 - 14}deg`); heroScene.style.setProperty('--tilt-x-product', `${x * .7 - 7}deg`); heroScene.style.setProperty('--tilt-y-product', `${y * .7 + 12}deg`); heroScene.style.setProperty('--tilt-x-float', `${x * .9}deg`); heroScene.style.setProperty('--tilt-y-float', `${y * .9}deg`); };
  const resetScene = () => setTilt(0, 0);
  heroScene.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const box = heroScene.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    setTilt((0.5 - y) * 8, (x - 0.5) * 10);
  });
  heroScene.addEventListener('pointerleave', resetScene);
  resetScene();
}

// Högl heel from the Planika catalogue as a real 3D model (generated from the product photo); turns with the pointer.
if (heroScene) {
  const canvas = document.createElement('canvas');
  canvas.className = 'threejs-canvas heel-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  heroScene.append(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0.9, 7.6);
  camera.lookAt(0.15, 0.1, 0);
  const group = new THREE.Group();
  group.position.set(0.15, 0.55, 0);
  scene.add(group);
  // Dim house lights; the spotlights below put the heel in the centre of attention.
  scene.add(new THREE.HemisphereLight(0xfff1e4, 0x2a1d16, 0.55));
  const spot = new THREE.SpotLight(0xfff0dc, 70, 0, 0.4, 0.85, 1.4);
  spot.position.set(0.15, 6.2, 2.4);
  spot.target = group;
  scene.add(spot);
  const sideSpot = new THREE.SpotLight(0xffe2c8, 35, 0, 0.3, 0.7, 1.4);
  sideSpot.position.set(-4.5, 4.5, 3);
  sideSpot.target = group;
  scene.add(sideSpot);
  const rim = new THREE.DirectionalLight(0xfff1e0, 1.4); rim.position.set(4, 2.5, -4); scene.add(rim);

  // Round podium with a warm pool of light where the heel stands.
  const glowTexture = (inner, outer) => {
    const canvas2d = document.createElement('canvas');
    canvas2d.width = canvas2d.height = 256;
    const ctx = canvas2d.getContext('2d');
    const gradient = ctx.createRadialGradient(128, 128, 6, 128, 128, 128);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(1, outer);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(canvas2d);
  };
  const podium = new THREE.Group();
  podium.position.x = group.position.x;
  const podiumBody = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.55, 0.26, 96), new THREE.MeshStandardMaterial({ color: 0x2c221d, roughness: 0.55, metalness: 0.05, envMapIntensity: 0.35 }));
  podiumBody.position.y = -0.13;
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.44, 96), new THREE.MeshBasicMaterial({ map: glowTexture('#fff0dc80', '#fff0dc00'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.002;
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.9), new THREE.MeshBasicMaterial({ map: glowTexture('#0d0806b0', '#0d080600'), transparent: true, depthWrite: false }));
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.004;
  podium.add(podiumBody, pool, contact);
  podium.visible = false;
  scene.add(podium);

  let holder;
  new GLTFLoader().load(heelModelUrl, gltf => {
    const heel = gltf.scene;
    const box = new THREE.Box3().setFromObject(heel);
    const size = box.getSize(new THREE.Vector3());
    heel.position.sub(box.getCenter(new THREE.Vector3()));
    holder = new THREE.Group();
    holder.add(heel);
    holder.scale.setScalar(2.75 / Math.max(size.x, size.y, size.z));
    holder.rotation.set(0.06, -Math.PI / 2 + 0.3, 0);
    heel.traverse(node => { if (node.isMesh) { node.material.roughness = 0.5; node.material.envMapIntensity = 1.1; } });
    group.add(holder);
    // Stand the heel on the podium top.
    group.updateMatrixWorld(true);
    const heelBox = new THREE.Box3().setFromObject(holder);
    podium.position.y = heelBox.min.y;
    podium.visible = true;
    stageSpan = { top: heelBox.max.y, bottom: podium.position.y - 0.26 }; // heel tip to podium base
    resize();
  });

  // Light beams (CSS) aim at the podium: pass its screen position to the stylesheet.
  const placeBeams = () => {
    const target = new THREE.Vector3(podium.position.x, podium.position.y, 0).project(camera);
    heroScene.style.setProperty('--stage-x', `${((target.x + 1) / 2 * 100).toFixed(1)}%`);
    heroScene.style.setProperty('--stage-y', `${((1 - target.y) / 2 * 100).toFixed(1)}%`);
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = new THREE.Vector2(0, 0);
  let hovering = false;

  // Hovering the heel itself for 3 s reveals its product card; tapping it shows the card right away.
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let cardTimer;
  const overHeel = event => {
    if (!holder) return false;
    const rect = heroScene.getBoundingClientRect();
    ndc.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObject(holder, true).length > 0;
  };
  const showCard = () => { window.clearTimeout(cardTimer); cardTimer = undefined; heroScene.classList.add('show-card'); };
  heroScene.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const onHeel = overHeel(event);
    heroScene.classList.toggle('on-heel', onHeel);
    if (onHeel && !cardTimer && !heroScene.classList.contains('show-card')) cardTimer = window.setTimeout(showCard, 3000);
    if (!onHeel && cardTimer) { window.clearTimeout(cardTimer); cardTimer = undefined; }
  });
  heroScene.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse' && overHeel(event)) showCard(); });
  heroScene.addEventListener('pointerleave', () => { window.clearTimeout(cardTimer); cardTimer = undefined; heroScene.classList.remove('show-card', 'on-heel'); });

  // On its own the heel keeps turning on the podium; once the mouse is over the stage it follows the mouse instead.
  let hoverBase = 0;
  heroScene.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const rect = heroScene.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width - .5) * 2;
    pointer.y = ((event.clientY - rect.top) / rect.height - .5) * 2;
    if (!hovering) hoverBase = group.rotation.y - pointer.x * 1.4; // pick up from the current angle, no jump
    hovering = true;
  });
  heroScene.addEventListener('pointerleave', () => { pointer.set(0, 0); hovering = false; });
  // Heel + podium sit in the middle of the stage, a little under it to leave room for the title on top:
  // once the heel is loaded, the view is shifted so their vertical centre lands at STAGE_CENTER (NDC, 0 = middle).
  let stageSpan;
  const STAGE_CENTER = -0.08;
  const resize = () => {
    const width = heroScene.clientWidth; const height = heroScene.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const fit = Math.max(1, 1.3 / camera.aspect); // narrow (phone) stages pull back
    camera.position.z = 7.6 * fit;
    camera.lookAt(0.15, 0.1 + (fit - 1) * 1.1, 0);
    camera.clearViewOffset();
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    if (stageSpan) {
      const top = new THREE.Vector3(0.15, stageSpan.top, 0).project(camera).y;
      const bottom = new THREE.Vector3(0.15, stageSpan.bottom, 0).project(camera).y;
      camera.setViewOffset(width, height, 0, (STAGE_CENTER - (top + bottom) / 2) / 2 * height, width, height);
    }
    placeBeams();
    window.__dbg = { camera, stageSpan, width, height, podium, holder, THREE };
  };
  const clock = new THREE.Clock();
  const render = () => {
    const delta = Math.min(clock.getDelta(), .05);
    // Turns on the spot; small tilt only, so it stays standing on the podium.
    if (hovering) group.rotation.y += ((hoverBase + pointer.x * 1.4) - group.rotation.y) * .06;
    else if (!reduceMotion) group.rotation.y += delta * .45;
    group.rotation.x += ((hovering ? pointer.y * .06 : 0) - group.rotation.x) * .05;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };
  resize(); new ResizeObserver(resize).observe(heroScene); render();
}
