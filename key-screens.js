// 06 / Ključni ekrani: product detail, AI discovery and a real map of Planika stores.
// Products, prices and stores are taken from planika.ba (new collection 2026, "Lokacije" page).
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './key-screens.css';
import stores from './planika-stores.json';

const photos = {
  ...import.meta.glob('./assets/planika/collection/*.jpg', { eager: true, import: 'default' }),
  ...import.meta.glob('./assets/planika/ai/*.jpg', { eager: true, import: 'default' })
};
const photo = sku => photos[`./assets/planika/collection/${sku.toLowerCase()}.jpg`] || photos[`./assets/planika/ai/${sku.toLowerCase()}.jpg`];
const money = value => `${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM`;
const shoe = (sku, brand, name, price) => ({ sku, brand, name, price, image: photo(sku) });

const section = document.querySelector('.screens');

// 01 Product detail: photo views, size and the add-to-bag confirmation.
function initProduct() {
  const root = section.querySelector('.ks-product');
  if (!root) return;
  const main = root.querySelector('[data-ks-photo]');
  let size = '39';
  root.querySelectorAll('[data-ks-view]').forEach(button => button.addEventListener('click', () => {
    root.querySelectorAll('[data-ks-view]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    main.dataset.view = button.dataset.ksView;
  }));
  const feedback = root.querySelector('[data-ks-feedback]');
  root.querySelectorAll('[data-ks-size]').forEach(button => button.addEventListener('click', () => {
    size = button.dataset.ksSize;
    root.querySelectorAll('[data-ks-size]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    feedback.textContent = `Odabrana veličina: ${size}`;
  }));
  root.querySelector('[data-ks-add]').addEventListener('click', () => {
    feedback.textContent = `✓ Veličina ${size} je u korpi. Dostava 1–3 radna dana ili besplatno preuzimanje u prodavnici.`;
  });
}

// 02 AI discovery: an occasion becomes a short answer and three models from the new collection.
const occasions = {
  posao: {
    ask: 'Treba mi nešto elegantno za posao.',
    answer: 'Za kancelariju sam izdvojio kožne modele čiste linije: idu uz odijelo, a ostaju udobni do kraja radnog dana.',
    shoes: [shoe('17MCJ18221', 'Aldo', 'Muška cipela ANTICO', 225), shoe('49ZCJ14222', 'Hogl', 'Ženska cipela LOREEN', 299), shoe('66MCJ23201', 'Ecco', 'Muška cipela METROPOLE PRAGUE', 289)]
  },
  put: {
    ask: 'Idem na put, treba mi nešto toplo i udobno.',
    answer: 'Za put biram gležnjerice i čizme s čvrstim đonom i toplim uloškom, da izdrže i šetnju po gradu i hladno jutro.',
    shoes: [shoe('20ZGL10382', 'Geox', 'Ženska gležnjerica', 369), shoe('66MGL13241', 'Ecco', 'Muška gležnjerica METROPOLE LONDON', 359), shoe('59ZGL10442', 'D.Franklin', 'Ženska čizma NORDIC TRK FUR LOW', 129)]
  },
  dan: {
    ask: 'Tražim nešto za svaki dan.',
    answer: 'Za svaki dan najbolje rade lagane patike s mekanim uloškom. Ove tri su iz nove kolekcije i lako se kombinuju.',
    shoes: [shoe('18ZCJ12092', 'Mexx', 'Ženska patika RONA TATOU', 179), shoe('83MSP11201', 'Skechers', 'Muška patika CRUCIAL STEP', 185), shoe('73ZCJ17382', 'Gabor', 'Ženska patika', 249)]
  },
  poklon: {
    ask: 'Imaš li ideju za poklon?',
    answer: 'Za poklon biram modele koji se lako uklope u svaki stil. Veličinu možeš zamijeniti u bilo kojoj Planika prodavnici.',
    shoes: [shoe('80MCJ10091', 'GANT', 'Muška patika MCJULIEN', 275), shoe('18ZCJ12042', 'Mexx', 'Ženska cipela MINOU IMMA', 159), shoe('26ZCJ10192', 'Igi&Co', 'Ženska cipela', 179)]
  }
};
function initDiscovery() {
  const root = section.querySelector('.ks-discover');
  if (!root) return;
  const body = root.querySelector('[data-ks-ai]');
  let timer;
  const show = key => {
    const occasion = occasions[key];
    clearTimeout(timer);
    body.innerHTML = `<p class="ks-msg ks-msg-user">${occasion.ask}</p><div class="ks-typing"><i></i><i></i><i></i></div>`;
    timer = setTimeout(() => {
      body.innerHTML = `<p class="ks-msg ks-msg-user">${occasion.ask}</p><p class="ks-msg">${occasion.answer}</p><div class="ks-picks">${occasion.shoes.map(item => `<figure><img src="${item.image}" alt="${item.brand} ${item.name}" loading="lazy" /><figcaption><small>${item.brand}</small><b>${item.name}</b><span>${money(item.price)}</span></figcaption></figure>`).join('')}</div>`;
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650);
  };
  root.querySelectorAll('[data-ks-occasion]').forEach(button => button.addEventListener('click', () => {
    root.querySelectorAll('[data-ks-occasion]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    show(button.dataset.ksOccasion);
  }));
  show('posao');
}

// 03 Stores: a real, zoomable map. It opens on Sarajevo with only the Sarajevo stores;
// every store in BiH appears only after "Cijela BiH", and "Sarajevo" goes back.
const sarajevoArea = ['Sarajevo', 'Vogošća', 'Lukavica'];
function initStores() {
  const root = section.querySelector('.ks-stores');
  const mapNode = root?.querySelector('[data-ks-map]');
  if (!mapNode) return;
  const card = root.querySelector('[data-ks-store]');
  const zoomButtons = root.querySelectorAll('[data-ks-zoom]');
  const point = ([, , , lat, lng]) => [lat, lng];
  const local = stores.filter(([, city]) => sarajevoArea.includes(city));
  const all = L.latLngBounds(stores.map(point));
  const map = L.map(mapNode, {
    minZoom: 7,
    maxZoom: 17,
    zoomSnap: .5,
    maxBounds: all.pad(0.6),
    scrollWheelZoom: false, // the page keeps scrolling; zoom with buttons, double click or pinch
    zoomControl: true,
    attributionControl: true
  });
  // OpenStreetMap tiles, toned down to the site's warm greys in CSS (.ks-map .leaflet-tile-pane).
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  const pin = L.divIcon({ className: 'ks-pin', html: '<i></i>', iconSize: [16, 16], iconAnchor: [8, 8], popupAnchor: [0, -10] });
  const select = ([name, city, address, , , hours]) => {
    card.innerHTML = `<small>ODABRANA POSLOVNICA</small><b>${name}</b><span>${address}, ${city}</span><span class="ks-hours">${hours}</span><span class="ks-online"><i></i>Tvoja veličina je na stanju</span>`;
  };
  const markers = list => L.layerGroup(list.map(store => {
    const [name, city, address, lat, lng, hours] = store;
    return L.marker([lat, lng], { icon: pin, title: name, keyboard: true })
      .bindPopup(`<b>${name}</b><br />${address}, ${city}<br /><small>${hours}</small>`)
      .on('click', () => select(store));
  }));
  markers(local).addTo(map); // Sarajevo pins are on the map from the start
  let view = 'sarajevo';
  const restLayer = markers(stores.filter(store => !local.includes(store)));
  // Room for the buttons on top and the store card at the bottom, so no pin hides under them.
  const frame = { paddingTopLeft: [24, 56], paddingBottomRight: [24, 140] };
  // Sarajevo opens close in, on the city from Alipašin most to Baščaršija, so the neighbourhoods and street names read;
  // Ilidža, Vogošća and Lukavica are a short drag away. Narrow previews (mobitel) step out half a level.
  const cityCenter = [43.851, 18.378];
  // On mobitel the store card spans the whole bottom edge, so the view sits a little lower and the southern stores stay above it.
  const cityView = () => {
    const narrow = mapNode.clientWidth < 540;
    const zoom = mapNode.clientWidth < 700 ? 12.5 : 13;
    const center = narrow ? map.unproject(map.project(cityCenter, zoom).add([0, 55]), zoom) : cityCenter;
    return [center, zoom];
  };
  const fit = (animate = true) => {
    if (view === 'bih') {
      if (animate) map.flyToBounds(all, { ...frame, duration: .9 });
      else map.fitBounds(all, frame);
    } else if (animate) map.flyTo(...cityView(), { duration: .9 });
    else map.setView(...cityView());
  };
  const setView = key => {
    view = key;
    zoomButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.ksZoom === key)));
    if (key === 'bih') restLayer.addTo(map);
    else restLayer.remove();
    fit();
  };
  zoomButtons.forEach(button => button.addEventListener('click', () => setView(button.dataset.ksZoom)));
  // The map can be created before its box has its final size; until someone drags or zooms it, keep the view framed.
  let touched = false;
  mapNode.addEventListener('pointerdown', () => { touched = true; });
  new ResizeObserver(() => {
    map.invalidateSize();
    if (!touched) fit(false);
  }).observe(mapNode);
  fit(false);
}
if (section) {
  initProduct();
  initDiscovery();
  initStores();
}
