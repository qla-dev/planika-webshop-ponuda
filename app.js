import './commerce-components.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import heelModelUrl from './assets/models/hogl-heel.glb?url';
import heroHeelFrontUrl from './assets/planika/products/hogl-heel-front.jpg';

const aiWindow = document.querySelector('#ai-window');
document.querySelector('.design-language')?.setAttribute('id', 'brandbook');
const mainContent = document.querySelector('main');
const brandbook = document.querySelector('.design-language');
const webshopSection = document.querySelector('.experience');
if (mainContent && brandbook && webshopSection) mainContent.insertBefore(brandbook, webshopSection);
const chat = document.querySelector('.chat');
const input = document.querySelector('.chat-input input');
const form = document.querySelector('.chat-input');
const replies = {
  'Tražim udobne patike za svaki dan': 'Za svakodnevni tempo, krenula bih od patika s dobrom amortizacijom i prozračnim gornjištem. Želite li urbaniji ili sportskiji stil?',
  'Treba mi elegantna obuća za posao': 'Odlično — mogu suziti izbor prema dress codeu, boji i tome koliko ste na nogama tokom dana. Preferirate li ravniji model ili malu petu?',
  'Koju veličinu da uzmem?': 'Mogu pomoći kroz vodič za veličinu i uporediti kalup brenda s modelima koje već nosite. Recite mi koji brend i broj inače birate.'
};
function say(message, type = 'bot') { const bubble = document.createElement('div'); bubble.className = `bubble ${type}`; bubble.textContent = message; chat.insertBefore(bubble, document.querySelector('.quick-replies')); chat.scrollTop = chat.scrollHeight; }
function answer(question) { say(question, 'user'); input.value = ''; const typing = document.querySelector('.typing'); typing.hidden = false; setTimeout(() => { typing.hidden = true; say(replies[question] || 'Hvala — u punoj verziji asistenta ovo pitanje bi povezalo katalog, dostupnost i vodič za veličine kako bi preporuka bila stvarno korisna.'); }, 650); }
document.querySelectorAll('[data-open-ai]').forEach(button => button.addEventListener('click', () => { aiWindow.classList.add('open'); input.focus(); }));
document.querySelector('[data-close-ai]').addEventListener('click', () => aiWindow.classList.remove('open'));
document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => answer(button.dataset.prompt)));
form.addEventListener('submit', event => { event.preventDefault(); const question = input.value.trim(); if (question) answer(question); });
const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); }), { threshold: 0, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.section, .reveal').forEach(el => observer.observe(el));

// Lightweight 3D commerce scene: layered HTML moves with the pointer; no heavy WebGL runtime.
const heroScene = document.querySelector('.hero-visual');
if (heroScene) {
  heroScene.classList.add('is-three-scene');
  heroScene.classList.add('has-webgl');
  heroScene.insertAdjacentHTML('afterbegin', `<div class="three-grid"></div><div class="three-woman-bg"></div><div class="three-orb orb-back"></div><div class="three-orb orb-front"></div><div class="scene-ui"><a class="three-card product-plane" href="#izgled" aria-label="Högl lakirana salonka, 469,00 KM — pogledaj u konceptu webshopa"><img src="${heroHeelFrontUrl}" alt="Högl lakirana salonka" /><div><small>HÖGL · 469,00 KM</small><b>Lakirana salonka</b><span class="plane-cta">Pogledaj proizvod <i>→</i></span></div></a><div class="three-float fit-float"><b>AI FIT</b><span>Veličina bez nagađanja</span></div><div class="three-float stock-float"><i></i><b>DOSTUPNO</b><span>Provjeri prodavnicu u blizini</span></div></div>`);
  window.setTimeout(() => heroScene.querySelectorAll('.scene-ui .three-card, .scene-ui .three-float').forEach(card => card.classList.add('gentle-float')), 820);
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
  camera.position.set(0, 0.35, 7.6);
  const group = new THREE.Group();
  group.position.x = 0.15;
  scene.add(group);
  scene.add(new THREE.HemisphereLight(0xfff8f0, 0xcfc3b4, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(4, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xfff1e0, 1.6); rim.position.set(-5, 2, -3); scene.add(rim);
  new GLTFLoader().load(heelModelUrl, gltf => {
    const heel = gltf.scene;
    const box = new THREE.Box3().setFromObject(heel);
    const size = box.getSize(new THREE.Vector3());
    heel.position.sub(box.getCenter(new THREE.Vector3()));
    const holder = new THREE.Group();
    holder.add(heel);
    holder.scale.setScalar(2.1 / Math.max(size.x, size.y, size.z));
    holder.rotation.set(0.06, -Math.PI / 2 + 0.3, 0);
    heel.traverse(node => { if (node.isMesh) { node.material.roughness = 0.6; node.material.envMapIntensity = 1.3; } });
    group.add(holder);
  });
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = new THREE.Vector2(0, 0);
  let hovering = false;
  heroScene.addEventListener('pointermove', event => { if (event.pointerType === 'touch') return; const rect = heroScene.getBoundingClientRect(); pointer.x = ((event.clientX - rect.left) / rect.width - .5) * 2; pointer.y = ((event.clientY - rect.top) / rect.height - .5) * 2; hovering = true; });
  heroScene.addEventListener('pointerleave', () => { pointer.set(0, 0); hovering = false; });
  const resize = () => { const width = heroScene.clientWidth; const height = heroScene.clientHeight; renderer.setSize(width, height, false); camera.aspect = width / height; camera.position.z = width / height < 1.2 ? 9.4 : 7.6; camera.updateProjectionMatrix(); };
  const clock = new THREE.Clock();
  const render = () => {
    const time = clock.getElapsedTime();
    const idle = reduceMotion || hovering ? 0 : Math.sin(time * .5) * .35;
    group.rotation.y += ((pointer.x * 1.4 + idle) - group.rotation.y) * .05;
    group.rotation.x += ((pointer.y * .25) - group.rotation.x) * .05;
    group.position.y = 0.62 + (reduceMotion ? 0 : Math.sin(time * .85) * .06);
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };
  resize(); new ResizeObserver(resize).observe(heroScene); render();
}