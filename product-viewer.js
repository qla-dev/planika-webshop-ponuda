import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import sneakerUrl from './assets/models/reebok-sneaker.glb?url';

// The licensed sample is explicitly separate from each catalog product's photo.
export function initProductViewer(photoPanel) {
  if (!photoPanel) return;
  const viewport = photoPanel.querySelector('[data-shoe-viewport]');
  const fallback = photoPanel.querySelector('[data-shoe-photo]');
  const status = photoPanel.querySelector('[data-shoe-status]');
  const controlsBar = photoPanel.querySelector('.shoe-viewer-controls');
  const modeButtons = [...photoPanel.querySelectorAll('[data-shoe-mode]')];
  const autoButton = photoPanel.querySelector('[data-shoe-auto]');
  const resetButton = photoPanel.querySelector('[data-shoe-reset]');
  const hint = photoPanel.querySelector('[data-shoe-hint]');
  const attribution = photoPanel.querySelector('.shoe-viewer-credit');
  let mode = '3d';
  let ready = false;
  let visible = false;
  let renderer, camera, orbit, scene, frame;
  let started = false;
  let lastTime = 0;

  function render(time = performance.now()) {
    frame = undefined;
    if (!ready || mode !== '3d' || !visible || document.hidden) return;
    const delta = Math.min((time - lastTime) / 1000, .05);
    lastTime = time;
    orbit.update(delta);
    renderer.render(scene, camera);
    if (orbit.autoRotate && !frame) frame = requestAnimationFrame(render);
  }
  function requestRender() {
    if (!frame) frame = requestAnimationFrame(render);
  }
  function pauseAuto() {
    if (orbit) orbit.autoRotate = false;
    autoButton.setAttribute('aria-pressed', 'false');
    autoButton.textContent = '↻ Auto';
  }
  function setMode(nextMode) {
    mode = nextMode;
    modeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.shoeMode === mode)));
    photoPanel.classList.toggle('show-3d', mode === '3d' && ready);
    controlsBar.hidden = mode !== '3d';
    attribution.hidden = mode !== '3d';
    status.hidden = mode !== '3d' || ready;
    photoPanel.querySelector('.example-photo-caption > span').textContent = mode === '3d' ? '3D / ILUSTRACIJA' : (photoPanel.dataset.productBrand || 'GABOR');
    photoPanel.querySelector('.example-photo-caption > span:last-child').textContent = mode === '3d' ? '360°' : '01 / 01';
    hint.textContent = mode === '3d' ? 'Povuci za rotaciju · strelice na tastaturi' : 'Fotografija odabranog proizvoda';
    if (mode !== '3d') pauseAuto();
    requestRender();
  }
  modeButtons.forEach(button => button.addEventListener('click', () => setMode(button.dataset.shoeMode)));

  function fail() {
    ready = false;
    pauseAuto();
    if (frame) cancelAnimationFrame(frame);
    renderer?.dispose();
    renderer?.domElement.remove();
    modeButtons.find(button => button.dataset.shoeMode === '3d').disabled = true;
    setMode('photo');
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
      canvas.setAttribute('aria-label', 'Ilustrativna Reebok patika u 3D prikazu. Povuci mišem ili prstom za rotaciju; koristi strelice na tastaturi.');
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
      orbit.autoRotateSpeed = 1.6;
      orbit.addEventListener('change', requestRender);
      orbit.addEventListener('start', pauseAuto);
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

      const gltf = await new GLTFLoader().loadAsync(sneakerUrl);
      const model = gltf.scene;
      model.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(model);
      const dimensions = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const normalized = new THREE.Group();
      model.position.sub(center);
      normalized.add(model);
      normalized.scale.setScalar(3.5 / Math.max(dimensions.x, dimensions.y, dimensions.z));
      normalized.rotation.y = -.25;
      scene.add(normalized);
      model.traverse(node => {
        if (!node.isMesh) return;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach(material => { material.roughness = .85; material.metalness = 0; });
      });
      // Neutral studio shadow, drawn locally without another image request.
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = shadowCanvas.height = 128;
      const ctx = shadowCanvas.getContext('2d');
      const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
      gradient.addColorStop(0, '#57463638');
      gradient.addColorStop(1, '#57463600');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }));
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = -dimensions.y * normalized.scale.x / 2 - .08;
      scene.add(shadow);

      function resize() {
        const width = viewport.clientWidth;
        const height = viewport.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        requestRender();
      }
      new ResizeObserver(resize).observe(viewport);
      resize();
      orbit.saveState();
      ready = true;
      photoPanel.dataset.viewerReady = 'true';
      autoButton.disabled = resetButton.disabled = false;
      setMode(mode);
      autoButton.addEventListener('click', () => {
        orbit.autoRotate = !orbit.autoRotate;
        autoButton.setAttribute('aria-pressed', String(orbit.autoRotate));
        autoButton.textContent = orbit.autoRotate ? 'Ⅱ Pauza' : '↻ Auto';
        lastTime = performance.now();
        requestRender();
      });
      resetButton.addEventListener('click', () => { pauseAuto(); orbit.reset(); requestRender(); });
      canvas.addEventListener('keydown', event => {
        const delta = { ArrowLeft: [-.18, 0], ArrowRight: [.18, 0], ArrowUp: [0, -.14], ArrowDown: [0, .14] }[event.key];
        if (!delta) return;
        event.preventDefault();
        pauseAuto();
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
    setPhoto(product) {
      fallback.src = product.image;
      fallback.alt = `${product.brand} ženski model obuće`;
      photoPanel.dataset.productBrand = product.brand.toUpperCase();
      setMode(mode);
    }
  };
}
