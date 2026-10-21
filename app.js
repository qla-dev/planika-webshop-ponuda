import './commerce-components.js';
import heroHeelUrl from './assets/planika/products/hogl-heel.png';
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
  heroScene.insertAdjacentHTML('afterbegin', `<div class="three-grid"></div><div class="three-woman-bg"></div><div class="three-orb orb-back"></div><div class="three-orb orb-front"></div><div class="scene-ui"><div class="three-card product-plane"><img src="${heroHeelFrontUrl}" alt="Högl lakirana salonka" /><div><small>HÖGL · 469,00 KM</small><b>Lakirana salonka</b></div></div><div class="three-float fit-float"><b>AI FIT</b><span>Veličina bez nagađanja</span></div><div class="three-float stock-float"><i></i><b>DOSTUPNO</b><span>Provjeri prodavnicu u blizini</span></div></div>`);
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

// Högl heel from the Planika catalogue: a layered cut-out that turns in 3D space with the pointer.
if (heroScene) {
  const stage = document.createElement('div');
  stage.className = 'heel-stage';
  stage.setAttribute('aria-hidden', 'true');
  const depth = Array.from({ length: 8 }, (_, i) => `<img class="heel-layer" style="--z:${-(i + 1) * 1.5}px" src="${heroHeelUrl}" alt="" />`).join('');
  stage.innerHTML = `<div class="heel-shadow"></div><div class="heel">${depth}<img class="heel-face" src="${heroHeelUrl}" alt="" /><span class="heel-shine" style="-webkit-mask-image:url(${heroHeelUrl});mask-image:url(${heroHeelUrl})"></span></div>`;
  heroScene.append(stage);
  const heel = stage.querySelector('.heel');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0, hovering = false;
  heroScene.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const rect = heroScene.getBoundingClientRect();
    targetX = ((event.clientX - rect.left) / rect.width - .5) * 2;
    targetY = ((event.clientY - rect.top) / rect.height - .5) * 2;
    hovering = true;
  });
  heroScene.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; hovering = false; });
  const tick = time => {
    currentX += (targetX - currentX) * .07;
    currentY += (targetY - currentY) * .07;
    const idle = reduceMotion || hovering ? 0 : Math.sin(time / 1500) * 9;
    heel.style.setProperty('--ry', `${-14 + currentX * 40 + idle}deg`);
    heel.style.setProperty('--rx', `${5 - currentY * 14}deg`);
    heel.style.setProperty('--lift', `${reduceMotion ? 0 : Math.sin(time / 1100) * 7}px`);
    heel.style.setProperty('--sx', `${50 + currentX * 45}%`);
    heel.style.setProperty('--sy', `${35 + currentY * 35}%`);
    stage.style.setProperty('--shadow', `${1 - Math.abs(currentX) * .22}`);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}