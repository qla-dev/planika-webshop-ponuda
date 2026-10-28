import './ai-chat.css';
// Planika AI demo: a scripted shopping conversation over real planika.ba products (new collection 2026).
// Names, brands, prices and available sizes are copied from planika.ba; the replies are illustrative.
const photos = import.meta.glob('./assets/planika/ai/*.jpg', { eager: true, import: 'default' });
const item = (sku, brand, name, price, sizes) => ({ sku, brand, name, price, sizes, image: photos[`./assets/planika/ai/${sku.toLowerCase()}.jpg`] });

// Each shelf: everything for one need and department, `picks` = the three shown first.
const shelves = {
  comfy: {
    zene: [
      item('73ZCJ17382', 'Gabor', 'Ženska patika', 249, [37, 38, 39, 40, 40.5]),
      item('18ZCJ12092', 'Mexx', 'Ženska patika RONA TATOU', 179, [37, 38, 39, 40, 41]),
      item('80ZCJ11222', 'GANT', 'Ženska patika CUZIMA', 235, [38, 40]),
      item('73ZCJ17392', 'Gabor', 'Ženska patika', 249, [37, 38, 39, 40, 40.5]),
      item('18ZCJ12102', 'Mexx', 'Ženska patika VIPER TASTY', 195, [37, 38, 39, 40, 41]),
      item('80ZCJ11212', 'GANT', 'Ženska patika CUZIMA', 255, [37, 38, 39, 40, 41])
    ],
    muskarci: [
      item('83MSP11201', 'Skechers', 'Muška patika CRUCIAL STEP', 185, [41, 42, 43, 44, 45, 46]),
      item('80MCJ10091', 'GANT', 'Muška patika MCJULIEN', 275, [41, 43, 44, 46]),
      item('26MCJ10501', 'Igi&Co', 'Muška patika', 259, [41, 42, 43, 44, 45]),
      item('80MCJ10071', 'GANT', 'Muška patika JOREE', 255, [41, 42, 43, 44, 45, 46]),
      item('28MSP10131', 'Extr4', 'Muška patika', 279, [41, 42, 43, 44, 45, 46]),
      item('90MCJ10801', 'Replay', 'Muška patika FIELD MOD', 299, [41, 42, 43, 44, 45])
    ]
  },
  work: {
    zene: [
      item('49ZCJ14222', 'Hogl', 'Ženska cipela LOREEN', 299, [37, 37.5, 38, 38.5, 39, 40, 41]),
      item('17ZCJ17222', 'Aldo', 'Ženska cipela ELLYA', 179, [37, 38, 39, 40, 41]),
      item('49ZCJ14322', 'Hogl', 'Ženska cipela PENNY', 369, [37.5, 40, 41]),
      item('49ZCJ14312', 'Hogl', 'Ženska cipela FINN CHUNKY', 369, [37, 38, 39, 40, 41]),
      item('19ZCJ25392', 'Tamaris', 'Ženska cipela', 145, [37, 38, 39, 40, 41]),
      item('48ZCJ11842', 'Marco Tozzi', 'Ženska cipela', 125, [37, 38, 39, 40, 41, 42])
    ],
    muskarci: [
      item('17MCJ18221', 'Aldo', 'Muška cipela ANTICO', 225, [41, 42, 43, 44, 45]),
      item('66MCJ23201', 'Ecco', 'Muška cipela METROPOLE PRAGUE', 289, [41, 42, 43, 44, 45]),
      item('23MCJ13731', 'Bugatti', 'Muška cipela RENATO', 199, [41, 42, 43, 44, 45, 46]),
      item('17MCJ18231', 'Aldo', 'Muška cipela HARINGTON', 255, [41, 42, 42.5, 43, 44, 45]),
      item('17MCJ18211', 'Aldo', 'Muška cipela CALLAHAN', 235, [41, 42, 42.5, 43, 44, 45]),
      item('11MCJ13181', 'Salamander', 'Muška cipela', 239, [41, 42, 43, 44, 45, 46])
    ]
  }
};
const copy = {
  comfy: {
    label: 'udobne patike',
    intro: 'Za cijeli dan na nogama tražimo mekan uložak, lagan i savitljiv đon i gornjište koje diše. Iz nove kolekcije sam izdvojio po tri modela za žene i za muškarce:',
    reason: 'Mekan uložak i lagan đon nose te kroz cijeli dan.'
  },
  work: {
    label: 'obuću za posao',
    intro: 'Za posao biramo čistu, elegantnu liniju koja ide uz odijelo, a ostaje udobna do kraja radnog dana. Evo po tri modela iz nove kolekcije:',
    reason: 'Elegantna je za kancelariju, a kožni uložak ostaje udoban i poslije osam sati.'
  }
};
const departments = { zene: 'za žene', muskarci: 'za muškarce' };
const sizeChips = { zene: [37, 38, 39, 40, 41], muskarci: [41, 42, 43, 44, 45, 46] };
const sizeHelpShoe = shelves.comfy.muskarci[0]; // Skechers CRUCIAL STEP

export function initAiChat(root) {
  if (!root) return;
  const chat = root.querySelector('.chat');
  const typing = root.querySelector('.typing');
  const form = root.querySelector('.chat-input');
  const input = form.querySelector('input');
  const money = value => `${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM`;
  const size = value => String(value).replace('.', ',');
  // Where the conversation is: the shelf in play and the product waiting for a size.
  let state = { need: null, department: null, product: null };
  // Sizes said in this chat are remembered: the shopper's own, and someone else's once they shop for another person.
  let sizes = { me: null, other: null };
  let forOther = false;
  let busy = false;
  const timers = new Set();
  const later = (callback, delay) => { const id = setTimeout(() => { timers.delete(id); callback(); }, delay); timers.add(id); };
  const knownSize = () => sizes[forOther ? 'other' : 'me'];
  const otherPerson = /ni(je|su) za mene|za nekog|za drug|poklon|za (mu[zž]|supr|sestr|brat|mam|tat|sin|k[cć]erk|prijatelj|djevojk|de[cč]k|kolegic|koleg)/i;
  const backToMe = /(ipak|ovo je|sad[a]?|opet) za mene|za sebe/i;

  const scroll = () => { chat.scrollTop = chat.scrollHeight; };
  const append = node => { chat.append(node, typing); scroll(); return node; };
  function bubble(text, type = 'bot') {
    const node = document.createElement('div');
    node.className = `bubble ${type}`;
    node.textContent = text;
    return append(node);
  }
  // Bot replies arrive after a short "typing" pause; steps run in order.
  function reply(steps, delay = 750) {
    busy = true;
    typing.hidden = false;
    append(typing);
    later(() => {
      typing.hidden = true;
      busy = false;
      steps.forEach(step => (typeof step === 'string' ? bubble(step) : step()));
      scroll();
    }, delay);
  }
  const productCard = (product, extra = '') => `<button type="button" class="chat-product" data-sku="${product.sku}"${extra}><img src="${product.image}" alt="" /><small>${product.brand}</small><b>${product.name}</b><span>${money(product.price)}</span></button>`;
  function products(list, title, options = {}) {
    const node = document.createElement('div');
    node.className = 'chat-products';
    node.innerHTML = `${title ? `<span class="chat-products-title">${title}</span>` : ''}<div>${list.map(product => productCard(product, options.size ? ` data-size="${options.size}"` : '')).join('')}</div>`;
    node.querySelectorAll('.chat-product').forEach(button => button.addEventListener('click', () => {
      const product = findProduct(button.dataset.sku);
      if (button.dataset.size) chooseWithSize(product, Number(button.dataset.size));
      else choose(product);
    }));
    return append(node);
  }
  function choices(list) {
    const node = document.createElement('div');
    node.className = 'quick-replies chat-choices';
    list.forEach(([label, action]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', () => { if (!busy) action(); });
      node.append(button);
    });
    return append(node);
  }
  const findProduct = sku => Object.values(shelves).flatMap(shelf => [...shelf.zene, ...shelf.muskarci]).find(product => product.sku === sku);
  const placeOf = product => {
    for (const [need, shelf] of Object.entries(shelves)) for (const [department, list] of Object.entries(shelf)) if (list.includes(product)) return { need, department };
  };
  const whose = () => (forOther ? 'osobe za koju kupuješ' : 'tvoju');

  // 1. A need (comfortable sneakers or work shoes): three picks for women and three for men.
  function startNeed(need, question) {
    state = { need, department: null, product: null };
    bubble(question, 'user');
    reply([
      copy[need].intro,
      () => products(shelves[need].zene.slice(0, 3), 'ZA ŽENE'),
      () => products(shelves[need].muskarci.slice(0, 3), 'ZA MUŠKARCE'),
      `Želiš li vidjeti cijelu kolekciju? Klikni na model koji ti se sviđa i provjerit ću ${forOther ? 'veličinu osobe za koju kupuješ' : 'tvoju veličinu'}.`,
      () => choices([['Sve za žene', () => showDepartment(need, 'zene')], ['Sve za muškarce', () => showDepartment(need, 'muskarci')]])
    ], 900);
  }
  // 2. The whole shelf for one department.
  function showDepartment(need, department) {
    state = { need, department, product: null };
    bubble(`Pokaži mi ${copy[need].label} ${departments[department]}`, 'user');
    const list = shelves[need][department];
    reply([
      `Evo cijele kolekcije: ${list.length} modela ${departments[department]} iz nove sezone. Koji ti se sviđa?`,
      () => products(list)
    ]);
  }
  // 3. A product: use the size already given in this chat, otherwise ask for it once.
  const askSize = department => [
    forOther ? 'Koju veličinu nosi osoba za koju kupuješ? Napiši broj ili izaberi ispod.' : 'Koju veličinu nosiš? Napiši broj ili izaberi ispod.',
    () => choices(sizeChips[department].map(value => [size(value), () => answerSize(value)]))
  ];
  function choose(product) {
    if (busy) return;
    const place = placeOf(product);
    state = { ...place, product };
    bubble(`Sviđa mi se ${product.brand} ${product.name}.`, 'user');
    const praise = `Odličan izbor, ${product.brand} ${product.name} (${money(product.price)}). ${copy[place.need].reason}`;
    const remembered = knownSize();
    if (remembered) {
      reply([praise, `Pamtim ${forOther ? 'da osoba za koju kupuješ nosi' : 'da nosiš'} ${size(remembered)}, pa odmah provjeravam.`, () => checkSize(product, remembered)]);
      return;
    }
    reply([praise, ...askSize(place.department)]);
  }
  // 4. A size: remembered from now on, then checked (available, or the same shelf filtered to it).
  function answerSize(value) {
    if (!state.product) return;
    sizes[forOther ? 'other' : 'me'] = value;
    bubble(`${size(value)}`, 'user');
    checkSize(state.product, value);
  }
  function chooseWithSize(product, value) {
    if (busy) return;
    state = { ...placeOf(product), product };
    bubble(`Može ${product.brand} ${product.name}, veličina ${size(value)}?`, 'user');
    checkSize(product, value);
  }
  function checkSize(product, value) {
    const { need, department } = placeOf(product);
    if (product.sizes.includes(value)) {
      state.product = null;
      reply([
        `Imamo je! ${product.brand} ${product.name} u veličini ${size(value)} je dostupna online i u prodavnicama.`,
        () => products([product]),
        () => choices([
          ['Dodaj u korpu', () => { bubble('Dodaj u korpu', 'user'); reply([`Dodano u korpu: ${product.name}, veličina ${size(value)}. Dostava je 1–3 radna dana, a preuzimanje u prodavnici je besplatno.`]); }],
          ['Pogledaj još', () => showDepartment(need, department)],
          forOther ? ['Ipak za mene', () => switchPerson(false, 'Ipak tražim za mene.')] : ['Za nekog drugog', () => switchPerson(true, 'Nisu za mene, nego za nekog drugog.')]
        ])
      ]);
      return;
    }
    const alternatives = shelves[need][department].filter(other => other !== product && other.sizes.includes(value));
    state.product = null;
    reply([
      `Nažalost, ${product.brand} ${product.name} trenutno nema veličinu ${size(value)}. Dostupne su: ${product.sizes.map(size).join(', ')}.`,
      alternatives.length
        ? `Ali ${alternatives.length === 1 ? 'ovaj model ima' : 'ovi modeli imaju'} ${forOther ? 'tu' : 'tvoju'} veličinu ${size(value)}:`
        : `Nijedan model iz ovog izbora trenutno nema veličinu ${size(value)}. Mogu te obavijestiti kad stigne.`,
      () => alternatives.length && products(alternatives, null, { size: value })
    ], 900);
  }

  // Shopping for someone else asks that person's size once; "za mene" goes back to the shopper's own.
  function switchPerson(other, text) {
    bubble(text, 'user');
    forOther = other;
    if (other) sizes.other = null;
    const product = state.product;
    if (!other) {
      reply([sizes.me ? `Važi, vraćam se na tvoju veličinu ${size(sizes.me)}.` : 'Važi, tražimo za tebe.', ...(product ? (sizes.me ? [() => checkSize(product, sizes.me)] : askSize(state.department)) : [])]);
      return;
    }
    reply(product
      ? ['Razumijem, kupuješ za nekog drugog.', ...askSize(state.department)]
      : ['Razumijem, kupuješ za nekog drugog. Kad izabereš model, pitat ću koju veličinu ta osoba nosi.']);
  }

  // Size help: the bot asks, a sample shopper answers (Skechers, usually 45), the bot recommends 44.
  function sizeHelp(question) {
    state = { need: null, department: null, product: null };
    bubble(question, 'user');
    reply(['Rado pomažem! Pošalji mi za koje patike ti treba pomoć i koji broj obuće inače nosiš.']);
    busy = true;
    later(() => {
      const node = document.createElement('div');
      node.className = 'bubble user chat-shared';
      node.innerHTML = `<div class="chat-shared-product"><img src="${sizeHelpShoe.image}" alt="" /><div><small>${sizeHelpShoe.brand}</small><b>${sizeHelpShoe.name}</b></div></div><p>Ove, a inače nosim 45.</p>`;
      append(node);
      sizes.me = 45;
      forOther = false;
      reply([
        `${sizeHelpShoe.brand} CRUCIAL STEP je prirodno širokog kalupa, a gornjište je od rastezljivog, laganog materijala koji se nakon par dana nošenja prilagodi stopalu.`,
        'Kalup je malo veći od standardnog, pa bih ja izabrao 44: stopalo neće klizati u peti, a prsti i dalje imaju dovoljno prostora. Ako imaš širu nogu ili zimi nosiš deblje čarape, 45 je i dalje siguran izbor.',
        () => choices([['Provjeri 44', () => chooseWithSize(sizeHelpShoe, 44)], ['Ipak 45', () => chooseWithSize(sizeHelpShoe, 45)]])
      ], 1400);
    }, 1900);
  }

  function handle(text) {
    const value = Number(text.replace(',', '.').match(/\d{2}(?:\.5)?/)?.[0]);
    if (otherPerson.test(text) && !forOther) {
      if (!value) return switchPerson(true, text);
      // "Za mamu, nosi 38": switch to that person and remember their size at once.
      bubble(text, 'user');
      forOther = true;
      sizes.other = value;
      const product = state.product;
      reply([`Razumijem, kupuješ za nekog drugog. Zapamtio sam da ta osoba nosi ${size(value)}.`, ...(product ? [() => checkSize(product, value)] : [])]);
      return;
    }
    if (backToMe.test(text) && forOther) return switchPerson(false, text);
    if (state.product && value) return answerSize(value);
    if (/udob|patik/i.test(text)) return startNeed('comfy', text);
    if (/posa|posl|elegant|kancelar|odijel/i.test(text)) return startNeed('work', text);
    if (/veli[cč]in|broj/i.test(text)) return sizeHelp(text);
    bubble(text, 'user');
    reply(['U ovoj demonstraciji mogu pomoći s udobnim patikama, obućom za posao i izborom veličine. Odaberi jednu od opcija ili mi napiši šta tražiš.']);
  }

  // The × in the corner starts the conversation over: only the greeting and the three starters stay.
  const starters = root.querySelector('.chat > .quick-replies');
  function reset() {
    timers.forEach(clearTimeout);
    timers.clear();
    while (starters.nextSibling) starters.nextSibling.remove();
    typing.hidden = true;
    chat.append(typing);
    state = { need: null, department: null, product: null };
    sizes = { me: null, other: null };
    forOther = false;
    busy = false;
    input.value = '';
    chat.scrollTop = 0;
  }
  root.querySelector('[data-close-ai]')?.addEventListener('click', reset);

  root.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => {
    if (busy) return;
    const question = button.dataset.prompt;
    if (button.dataset.flow === 'size') sizeHelp(question);
    else startNeed(button.dataset.flow, question);
  }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;
    input.value = '';
    handle(text);
  });
}