import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import shoeModelUrl from './assets/models/materials-variants-shoe.glb?url';

const aiWindow = document.querySelector('#ai-window');
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
const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); }), { threshold: .12 });
document.querySelectorAll('.section, .reveal').forEach(el => observer.observe(el));

// Lightweight 3D commerce scene: layered HTML moves with the pointer; no heavy WebGL runtime.
const heroScene = document.querySelector('.hero-visual');
if (heroScene) {
  heroScene.classList.add('is-three-scene');
  heroScene.insertAdjacentHTML('afterbegin', `<div class="three-grid"></div><div class="three-orb orb-back"></div><div class="three-orb orb-front"></div><div class="three-card campaign-plane"><img src="assets/planika/hero-new-collection.jpg" alt="Planika collection" /><span>NEW COLLECTION / 01</span></div><div class="three-card product-plane"><img src="assets/planika/product-ara.jpg" alt="Planika footwear" /><div><small>ARA / HIGH SOFT</small><b>Comfort in motion</b></div></div><div class="three-float fit-float"><b>AI FIT</b><span>Size without guessing</span></div><div class="three-float stock-float"><i></i><b>AVAILABLE</b><span>Check a nearby store</span></div><p class="three-hint">MOVE CURSOR <span>↗</span></p>`);
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

// Actual Three.js / WebGL shoe model, loaded locally rather than simulated with a 2D image.
if (heroScene && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const canvas = document.createElement('canvas');
  canvas.className = 'threejs-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  heroScene.append(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.45, 7.4);
  const group = new THREE.Group();
  scene.add(group);
  scene.add(new THREE.HemisphereLight(0xfff6ec, 0x4b0709, 3.2));
  const key = new THREE.DirectionalLight(0xffffff, 4.5); key.position.set(4, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff4050, 4); rim.position.set(-5, 2, -3); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(2.65, 64), new THREE.MeshBasicMaterial({ color: 0xe1252c, transparent: true, opacity: 0.32 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.65; scene.add(floor);
  const loader = new GLTFLoader();
  loader.load(shoeModelUrl, gltf => {
    const shoe = gltf.scene;
    const box = new THREE.Box3().setFromObject(shoe);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());
    shoe.position.sub(center);
    shoe.scale.setScalar(3.4 / size);
    shoe.rotation.set(-0.16, -0.82, 0.1);
    shoe.traverse(node => { if (node.isMesh) { node.castShadow = true; node.material.envMapIntensity = 1.25; } });
    group.add(shoe);
    heroScene.classList.add('has-webgl');
  });
  const pointer = new THREE.Vector2(0, 0);
  heroScene.addEventListener('pointermove', event => { const rect = heroScene.getBoundingClientRect(); pointer.x = ((event.clientX - rect.left) / rect.width - .5) * 2; pointer.y = ((event.clientY - rect.top) / rect.height - .5) * 2; });
  heroScene.addEventListener('pointerleave', () => pointer.set(0, 0));
  const resize = () => { const width = heroScene.clientWidth; const height = heroScene.clientHeight; renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); };
  const clock = new THREE.Clock();
  const render = () => { const time = clock.getElapsedTime(); group.rotation.y += ((pointer.x * .34) - group.rotation.y) * .045; group.rotation.x += ((-pointer.y * .16) - group.rotation.x) * .045; group.position.y = Math.sin(time * .85) * .08; renderer.render(scene, camera); requestAnimationFrame(render); };
  resize(); new ResizeObserver(resize).observe(heroScene); render();
}
