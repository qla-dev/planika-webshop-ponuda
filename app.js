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
