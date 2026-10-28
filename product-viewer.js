import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { loadHeel, buildHeel } from './heel-variants.js';

// Still shots for "Istraži model", rendered from the same 3D sneaker (camera direction + label).
const STILLS = [
  // The model sits turned by .3 rad, so the side views follow it to stay a true profile.
  { label: 'Bočno', direction: [Math.sin(.3), .2, Math.cos(.3)] },
  { label: 'Tri četvrtine', direction: [-1.8, 1.4, 4.1] },
  { label: 'Druga strana', direction: [-Math.sin(.3), .2, -Math.cos(.3)] },
  { label: 'Odozgo', direction: [.02, 1, .25] }
];

// The licensed sample is explicitly separate from each catalog product's photo.
export function initProductViewer(photoPanel) {
  if (!photoPanel) return;
  const viewport = photoPanel.querySelector('[data-shoe-viewport]');
  const fallback = photoPanel.querySelector('[data-shoe-photo]');
  const status = photoPanel.querySelector('[data-shoe-status]');
  const modeButtons = photoPanel.querySelectorAll('[data-shoe-mode]');
  const gallery = photoPanel.querySelector('[data-shoe-gallery]');
  const still = photoPanel.querySelector('[data-shoe-still]');
  const thumbs = photoPanel.querySelector('[data-shoe-thumbs]');
  const hint = photoPanel.querySelector('[data-shoe-hint]');
  const caption = photoPanel.querySelector('[data-shoe-caption]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ready = false;
  let visible = false;
  let mode = '3d';
  let renderer, camera, orbit, scene, frame, normalized, shadow;
  let started = false;
  // The product on show: its colour (tint, null = black patent) and its name for labels.
  let wanted = { tint: null, label: 'Högl lakirana salonka' };
  let shown;
  let lastTime = 0;

  function render(time = performance.now()) {
    frame = undefined;
    if (!ready || !visible || mode !== '3d' || document.hidden) return;
    const delta = Math.min((time - lastTime) / 1000, .05);
    lastTime = time;
    orbit.update(delta);
    // Same gentle float as the hero heel while it spins on its own.
    if (orbit.autoRotate) normalized.position.y = Math.sin(time / 1000 * .85) * .05;
    renderer.render(scene, camera);
    if (orbit.autoRotate && !frame) frame = requestAnimationFrame(render);
  }
  function requestRender() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  // Narrow viewports (tablet, phone) pull the camera back so the side-on shoe never clips.
  const baseDistance = Math.hypot(-1.8, 1.4, 4.1);
  function fitDistance() {
    camera.position.setLength(baseDistance * Math.max(1, 1.3 / camera.aspect));
  }

  function setMode(next) {
    mode = next;
    modeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.shoeMode === mode)));
    viewport.hidden = mode !== '3d';
    gallery.hidden = mode !== 'photos';
    hint.textContent = mode === '3d' ? 'Strelicom drži proizvod i rotiraj' : 'Odaberi ugao';
    caption.firstElementChild.textContent = mode === '3d' ? '3D / ILUSTRACIJA' : 'FOTOGRAFIJE / ILUSTRACIJA';
    caption.lastElementChild.textContent = mode === '3d' ? '360°' : `${STILLS.length} UGLA`;
    lastTime = performance.now();
    requestRender();
  }
  modeButtons.forEach(button => button.addEventListener('click', () => setMode(button.dataset.shoeMode)));

  function showStill(index) {
    const shot = thumbs.children[index];
    still.src = shot.querySelector('img').src;
    still.alt = `${shown.label}, ${STILLS[index].label.toLowerCase()}`;
    [...thumbs.children].forEach((thumb, i) => thumb.setAttribute('aria-pressed', String(i === index)));
  }
  // Render each still from the live scene, then put the camera back where it was.
  function captureStills() {
    const saved = camera.position.clone();
    const savedY = normalized.position.y;
    normalized.position.y = 0;
    thumbs.innerHTML = '';
    STILLS.forEach((shot, index) => {
      camera.position.set(...shot.direction).setLength(saved.length());
      camera.lookAt(orbit.target);
      renderer.render(scene, camera);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'shoe-viewer-thumb';
      button.setAttribute('aria-label', shot.label);
      button.innerHTML = `<img src="${renderer.domElement.toDataURL('image/png')}" alt="" />`;
      button.addEventListener('click', () => showStill(index));
      thumbs.append(button);
    });
    camera.position.copy(saved);
    normalized.position.y = savedY;
    orbit.update();
    showStill(0);
  }

  // Show the heel as the selected product's variant (colour, heel height, buckle, finish), then refresh the still shots.
  async function showModel(product) {
    const gltf = await loadHeel();
    if (product !== wanted) return; // a newer product was picked while this one loaded
    if (normalized) scene.remove(normalized);
    if (shadow) scene.remove(shadow);
    const model = buildHeel(gltf, product);
    model.position.set(0, 0, 0);
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const dimensions = bounds.getSize(new THREE.Vector3());
    model.position.sub(bounds.getCenter(new THREE.Vector3()));
    normalized = new THREE.Group();
    normalized.add(model);
    normalized.scale.setScalar(3.5 / Math.max(dimensions.x, dimensions.y, dimensions.z));
    normalized.rotation.y = -Math.PI / 2 + .3;
    scene.add(normalized);
    // Neutral studio shadow, drawn locally without another image request.
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    gradient.addColorStop(0, '#57463638');
    gradient.addColorStop(1, '#57463600');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -dimensions.y * normalized.scale.x / 2 - .08;
    scene.add(shadow);
    shown = product;
    renderer.domElement.setAttribute('aria-label', `${product.label} u 3D prikazu koja se stalno okreće. Povuci mišem ili prstom za rotaciju; koristi strelice na tastaturi.`);
    captureStills();
    requestRender();
  }

  function fail() {
    ready = false;
    if (frame) cancelAnimationFrame(frame);
    renderer?.dispose();
    renderer?.domElement.remove();
    photoPanel.classList.remove('show-3d');
    photoPanel.classList.add('show-photo-fallback');
    modeButtons.forEach(button => { button.hidden = true; });
    hint.textContent = 'Fotografija proizvoda kao zamjena za nedostupan 3D prikaz';
    status.textContent = '3D prikaz nije dostupan. Prikazana je fotografija proizvoda.';
    status.hidden = false;
  }

  async function load() {
    if (started) return;
    started = true;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;
      const canvas = renderer.domElement;
      canvas.className = 'shoe-viewer-canvas';
      canvas.style.removeProperty('display');
      canvas.tabIndex = 0;
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', 'Ilustrativna Reebok patika u 3D prikazu koja se stalno okreće. Povuci mišem ili prstom za rotaciju; koristi strelice na tastaturi.');
      viewport.append(canvas);
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(35, 1, .1, 50);
      camera.position.set(-1.8, 1.4, 4.1);
      orbit = new OrbitControls(camera, canvas);
      orbit.enablePan = false;
      orbit.enableZoom = false; // Preserve page scrolling over the product.
      orbit.enableDamping = false;
      orbit.rotateSpeed = .7;
      orbit.minPolarAngle = .15;
      orbit.maxPolarAngle = Math.PI - .15;
      // Always turning: dragging takes over, releasing hands it back to the spin.
      orbit.autoRotate = !reduceMotion;
      orbit.autoRotateSpeed = 1.6;
      orbit.addEventListener('change', requestRender);
      orbit.addEventListener('end', () => { lastTime = performance.now(); requestRender(); });
      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const environment = pmrem.fromScene(room, .04);
      scene.environment = environment.texture;
      room.dispose();
      pmrem.dispose();
      scene.add(new THREE.HemisphereLight(0xfff8ed, 0x786d60, 2.2));
      const key = new THREE.DirectionalLight(0xffffff, 3);
      key.position.set(3, 5, 4);
      scene.add(key);

      function resize() {
        const width = viewport.clientWidth;
        const height = viewport.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        fitDistance();
        requestRender();
      }
      new ResizeObserver(resize).observe(viewport);
      resize();
      do { await showModel(wanted); } while (shown !== wanted); // product may change while loading
      ready = true;
      photoPanel.dataset.viewerReady = 'true';
      photoPanel.classList.add('show-3d');
      status.hidden = true;
      modeButtons.forEach(button => { button.disabled = false; });
      lastTime = performance.now();
      requestRender();
      canvas.addEventListener('keydown', event => {
        const delta = { ArrowLeft: [-.18, 0], ArrowRight: [.18, 0], ArrowUp: [0, -.14], ArrowDown: [0, .14] }[event.key];
        if (!delta) return;
        event.preventDefault();
        const offset = camera.position.clone().sub(orbit.target);
        const spherical = new THREE.Spherical().setFromVector3(offset);
        spherical.theta += delta[0];
        spherical.phi = THREE.MathUtils.clamp(spherical.phi + delta[1], .15, Math.PI - .15);
        camera.position.copy(orbit.target).add(new THREE.Vector3().setFromSpherical(spherical));
        orbit.update();
        requestRender();
      });
      canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); fail(); });
    } catch { fail(); }
  }
  const visibility = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) { load(); lastTime = performance.now(); requestRender(); }
  }, { rootMargin: '200px 0px' });
  visibility.observe(viewport);
  document.addEventListener('visibilitychange', requestRender);
  return {
    setProduct(product) {
      fallback.src = product.image;
      fallback.alt = `${product.brand} ženski model obuće`;
      const next = { tint: product.tint, shape: product.shape, plain: product.plain, finish: product.finish, label: `${product.brand} ${product.name.toLowerCase()}` };
      const same = (a, b) => ['tint', 'shape', 'plain', 'finish'].every(key => (a[key] || null) === (b[key] || null));
      if (same(next, wanted)) { wanted.label = next.label; return; }
      wanted = next;
      if (ready) showModel(wanted).catch(fail);
    }
  };
}
