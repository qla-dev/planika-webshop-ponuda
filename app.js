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
