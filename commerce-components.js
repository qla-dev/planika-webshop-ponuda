import heelCutoutUrl from './assets/planika/products/hogl-heel.png';
import { initProductViewer } from './product-viewer.js';
import { renderHeelShots } from './heel-variants.js';
// Product photos from the planika.ba new collection (season 2026), named by Planika SKU.
const collectionPhotos = import.meta.glob('./assets/planika/collection/*.jpg', { eager: true, import: 'default' });
import './product-viewer.css';

// Self-contained, illustrative interactions for the reconstruction walkthrough.
const walkthrough = document.querySelector('.components-walkthrough');

if (walkthrough) {
  const productViewer = initProductViewer(walkthrough.querySelector('.example-product-photo'));
  // All heels. Only the black Högl is photographed; the others are variants rendered from its 3D model:
  // tint = leather colour, shape = stiletto or kitten (low) heel, plain = no gold buckle, finish = patent or suede.
  // `shelf` says where a product appears: search suggestions or the everyday catalog.
  const products = [
    { id: 'hogl', brand: 'Högl', name: 'Lakirana salonka', price: 469, sizes: ['38', '39', '40'], material: 'Lakirana koža', note: 'Stabilna peta od 8 cm', tint: null, shelf: 'search', sku: '261104', badge: 'Novo', keywords: 'štikle stikle salonka lak crna' },
    { id: 'hogl-nude', brand: 'Högl', name: 'Salonka u nude laku', price: 399, sizes: ['38', '39'], material: 'Lakirana koža', note: 'Čista linija, peta od 8 cm', tint: '#e2bfa3', plain: true, shelf: 'search', sku: '261118', keywords: 'štikle stikle salonka lak nude' },
    { id: 'tamaris', brand: 'Tamaris', name: 'Salonka za svaki dan', price: 119, sizes: ['38', '39', '40'], material: 'Brušena koža', note: 'Niska peta od 4 cm', tint: '#7b2230', shape: 'kitten', plain: true, finish: 'suede', shelf: 'everyday', sku: '258230', keywords: 'štikle stikle salonka svaki dan bordo antilop niska peta' },
    { id: 'gabor-heel', brand: 'Gabor', name: 'Udobna salonka', price: 159, sizes: ['39', '40'], material: 'Lakirana koža', note: 'Comfort uložak, niska peta', tint: '#b8875a', shape: 'kitten', shelf: 'everyday', sku: '258244', keywords: 'štikle stikle salonka svaki dan karamel niska peta' },
    { id: 'caprice', brand: 'Caprice', name: 'Crvena salonka', price: 139, was: 174, sizes: ['38', '39'], material: 'Lakirana koža', note: 'Niska peta, zlatna kopča', tint: '#bb132b', shape: 'kitten', sku: '259012', keywords: 'štikle stikle salonka crvena lak' }
  ];
  products.forEach(product => { product.image = heelCutoutUrl; product.model = 'heel'; product.gender = 'zene'; });
  // 01 New collection: real models from planika.ba "Nova kolekcija" (season 2026), with Planika's own
  // brand, name, SKU and price; women's and men's shuffled. Every item is new this season.
  const collection = [
    ['80MCJ10091', 'GANT', 'Muška patika MCJULIEN', 275, 'muskarci'],
    ['18ZCJ12102', 'Mexx', 'Ženska patika VIPER TASTY', 195, 'zene'],
    ['17ZZV13162', 'Aldo', 'Ženska čizma SELINE', 449, 'zene'],
    ['66MCJ23511', 'Ecco', 'Muška patika GOLF BIOM C5', 469, 'muskarci'],
    ['17MCJ18221', 'Aldo', 'Muška cipela ANTICO', 225, 'muskarci'],
    ['19ZGL20272', 'Tamaris', 'Ženska gležnjerica', 199, 'zene'],
    ['15MCJ12021', 'CAT', 'Muška cipela HEX READY NOIR', 249, 'muskarci'],
    ['26ZCJ10192', 'Igi&Co', 'Ženska cipela', 179, 'zene'],
    ['20ZGL10382', 'Geox', 'Ženska gležnjerica', 369, 'zene'],
    ['90MCJ10821', 'Replay', 'Muška patika FIELD RACE', 299, 'muskarci'],
    ['18ZCJ12042', 'Mexx', 'Ženska cipela MINOU IMMA', 159, 'zene'],
    ['66MGL13241', 'Ecco', 'Muška gležnjerica METROPOLE LONDON', 359, 'muskarci'],
    ['28MSP10161', 'Extr4', 'Muška patika', 299, 'muskarci'],
    ['59ZGL10442', 'D.Franklin', 'Ženska čizma NORDIC TRK FUR LOW', 129, 'zene'],
    ['11ZGL11162', 'Salamander', 'Ženska gležnjerica', 229, 'zene'],
    ['20MCJ10901', 'Geox', 'Muška cipela VITTOUR PLUS MAN', 229, 'muskarci']
  ].map(([sku, brand, name, price, gender]) => ({ sku, brand, name, price, gender, image: collectionPhotos[`./assets/planika/collection/${sku.toLowerCase()}.jpg`] }));
  const byId = id => products.find(product => product.id === id);
  const find = selector => walkthrough.querySelector(selector);
  const all = selector => [...walkthrough.querySelectorAll(selector)];
  const money = value => `${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM`;
  const favorite = collection.find(shoe => shoe.sku === '18ZCJ12042'); // a women's shoe from the new collection
  let selectedProduct = byId('hogl');
  let selectedSize = '39';
  let filterSize = '39';
  let bag = { product: selectedProduct, size: '39', quantity: 1 };

  const productLink = (product, type, size) => type === 'search'
    ? `<a class="example-search-result" href="#component-product" data-product-link="${product.id}"><img src="${product.image}" alt="${product.brand} ${product.name}" /><div><b>${product.name}</b><small>${product.brand} / Žene</small></div><strong>${money(product.price)}</strong></a>`
    : `<a class="example-catalog-card" href="#component-product" data-product-link="${product.id}" data-result-size="${size}"><div><img src="${product.image}" alt="${product.brand} ${product.name}" loading="lazy" /></div><small>${product.brand.toUpperCase()} / ŽENE</small><b>${product.name}</b><strong>${money(product.price)}</strong></a>`;

  // 01 New collection: the shelf in rows, filtered by department.
  let collectionGender = 'all';
  const collectionCard = shoe => `<article class="collection-item"><span class="badge is-new">Novo</span><small>${shoe.sku}</small><small>${shoe.brand}</small><img src="${shoe.image}" alt="${shoe.brand} ${shoe.name}" loading="lazy" /><p><span>${shoe.name}</span><span>${money(shoe.price)}</span></p></article>`;
  const renderCollection = () => {
    const matches = collection.filter(product => collectionGender === 'all' || product.gender === collectionGender);
    all('[data-collection-gender]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.collectionGender === collectionGender)));
    find('[data-collection-count]').textContent = `${matches.length} ${matches.length === 1 ? 'model' : 'modela'}`;
    find('[data-collection-grid]').innerHTML = matches.map(collectionCard).join('');
  };
  all('[data-collection-gender]').forEach(button => button.addEventListener('click', () => { collectionGender = button.dataset.collectionGender; renderCollection(); }));

  // 02 Search: suggestions sorted from the most expensive, two at a time.
  const searchInput = find('[data-component-search]');
  const renderSearch = () => {
    const query = searchInput.value.trim().toLocaleLowerCase('bs');
    const matches = products
      .filter(product => `${product.brand} ${product.name} ${product.keywords}`.toLocaleLowerCase('bs').includes(query))
      .sort((a, b) => b.price - a.price);
    find('[data-search-count]').textContent = `${matches.length} ${matches.length === 1 ? 'rezultat' : 'rezultata'}`;
    find('[data-search-results]').innerHTML = matches.length
      ? matches.slice(0, 2).map(product => productLink(product, 'search')).join('')
      : '<p class="example-search-empty">Nema rezultata za ovaj upit.<br />Isprobaj „Högl“, „Tamaris“ ili „štikle“.</p>';
  };
  searchInput.addEventListener('input', () => { stopTyping(); renderSearch(); });
  searchInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      find('.example-search-result')?.click();
    }
  });
  all('[data-search-term]').forEach(button => button.addEventListener('click', () => {
    stopTyping();
    searchInput.value = button.dataset.searchTerm;
    renderSearch();
    searchInput.focus({ preventScroll: true });
  }));

  // When the search demo scrolls into view, "štikle" is typed letter by letter, like a shopper would.
  let typingTimer;
  const stopTyping = () => { window.clearTimeout(typingTimer); typingTimer = undefined; };
  const typeQuery = (text, index = 0) => {
    searchInput.value = text.slice(0, index);
    renderSearch();
    if (index < text.length) typingTimer = window.setTimeout(() => typeQuery(text, index + 1), index ? 140 : 500);
  };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) searchInput.value = 'štikle';
  else {
    new IntersectionObserver((entries, observer) => {
      if (!entries[0].isIntersecting || document.activeElement === searchInput) return;
      observer.disconnect();
      typeQuery('štikle');
    }, { threshold: .6 }).observe(find('.search-example'));
  }

  // 03 Catalog: everyday heels filtered by size.
  const filterCatalog = size => {
    filterSize = size;
    const matches = products.filter(product => product.shelf === 'everyday' && product.sizes.includes(size));
    all('[data-filter-size]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filterSize === size)));
    find('[data-active-filter]').textContent = size;
    find('[data-filter-count]').textContent = `${matches.length} ${matches.length === 1 ? 'model' : 'modela'}`;
    find('[data-catalog-results]').innerHTML = matches.map(product => productLink(product, 'catalog', size)).join('');
  };
  all('[data-filter-size]').forEach(button => button.addEventListener('click', () => filterCatalog(button.dataset.filterSize)));

  // 05 Store availability for the selected heel and size.
  const renderStores = () => {
    const city = find('[data-store-city]').value;
    const stores = [
      { name: `${city} / Centar`, detail: 'Primjer poslovnice 01', available: selectedSize !== '40' },
      { name: `${city} / Tržni centar`, detail: 'Primjer poslovnice 02', available: city !== 'Mostar' },
      { name: `${city} / Gradska zona`, detail: 'Primjer poslovnice 03', available: selectedSize === '38' }
    ];
    find('[data-store-list]').innerHTML = stores.map(store => `<div class="example-store"><div><b>${store.name}</b><small>${store.detail} · veličina ${selectedSize}</small></div><span class="example-store-status${store.available ? '' : ' is-unavailable'}">${store.available ? 'Dostupno' : 'Nije dostupno'}</span></div>`).join('');
  };
  find('[data-store-city]').addEventListener('change', renderStores);

  const selectSize = size => {
    selectedSize = size;
    all('[data-product-size]').forEach(button => {
      button.disabled = !selectedProduct.sizes.includes(button.dataset.productSize);
      button.setAttribute('aria-pressed', String(button.dataset.productSize === size));
    });
    find('[data-selected-size]').textContent = size;
    find('[data-product-feedback]').textContent = `Odabrana veličina: ${size}`;
    renderStores();
  };
  all('[data-product-size]').forEach(button => button.addEventListener('click', () => selectSize(button.dataset.productSize)));

  // 04 Product detail (+ 05 stock header) for one product.
  const selectProduct = (product, preferredSize = selectedSize) => {
    selectedProduct = product;
    productViewer?.setProduct(product);
    find('.example-product-info > .example-eyebrow').textContent = `${product.brand.toUpperCase()} / ŽENE`;
    find('.example-product-info h4').textContent = `${product.name}.`;
    find('.example-price').textContent = money(product.price);
    find('.example-product-info > p:not(.example-feedback)').textContent = `${product.material} · ${product.note}`;
    find('.example-stock-product > img').src = product.image;
    find('.example-stock-product > img').alt = `Odabrani model: ${product.brand} ${product.name}`;
    find('.example-stock-product b').textContent = product.name;
    const stockDescription = find('.example-stock-product > div > span:last-child');
    stockDescription.replaceChildren(document.createTextNode(`${product.brand} · Veličina `));
    const sizeLabel = document.createElement('strong');
    sizeLabel.dataset.selectedSize = '';
    stockDescription.append(sizeLabel);
    selectSize(product.sizes.includes(preferredSize) ? preferredSize : product.sizes[0]);
  };
  // Product links anywhere on the page (search, catalog, the hero heel card) open that product here.
  document.addEventListener('click', event => {
    const link = event.target.closest('[data-product-link]');
    if (link) selectProduct(byId(link.dataset.productLink), link.dataset.resultSize || selectedSize);
  });

  // 06 Bag.
  const renderBag = () => {
    all('[data-bag-count]').forEach(label => { label.textContent = bag.quantity; });
    find('[data-bag-size]').textContent = bag.size;
    const lastDigit = bag.quantity % 10;
    const lastTwoDigits = bag.quantity % 100;
    const pairLabel = lastDigit === 1 && lastTwoDigits !== 11 ? 'par'
      : lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14) ? 'para' : 'parova';
    find('[data-bag-quantity]').textContent = `${bag.quantity} ${pairLabel}`;
    find('.example-bag-product > img').src = bag.product.image;
    find('.example-bag-product > img').alt = `${bag.product.brand} ${bag.product.name} u korpi`;
    find('.example-bag-product .example-eyebrow').textContent = bag.product.brand.toUpperCase();
    find('.example-bag-product b').textContent = bag.product.name;
    const subtotal = bag.product.price * bag.quantity;
    const delivery = Number(find('[data-delivery-method]').value);
    all('[data-bag-subtotal]').forEach(label => { label.textContent = money(subtotal); });
    find('[data-bag-delivery]').textContent = money(delivery);
    find('[data-bag-total]').textContent = money(subtotal + delivery);
  };
  find('[data-add-to-bag]').addEventListener('click', () => {
    const sameItem = bag.product.id === selectedProduct.id && bag.size === selectedSize;
    bag = { product: selectedProduct, size: selectedSize, quantity: sameItem ? bag.quantity + 1 : 1 };
    renderBag();
    const feedback = find('[data-product-feedback]');
    feedback.replaceChildren(document.createTextNode(`✓ Veličina ${selectedSize} dodana. `));
    const bagLink = document.createElement('a');
    bagLink.href = '#component-bag';
    bagLink.textContent = 'Pogledaj korpu →';
    feedback.append(bagLink);
    find('[data-checkout-feedback]').textContent = 'Kupovina je moguća i bez registracije.';
  });
  find('[data-delivery-method]').addEventListener('change', renderBag);
  find('[data-demo-checkout]').addEventListener('click', () => {
    find('[data-checkout-feedback]').textContent = 'Sljedeći korak: kontakt, adresa i plaćanje. Ovo je demonstracija; narudžba se ne šalje.';
  });

  // 07 Club favourite.
  const renderFavorite = () => {
    find('.example-favorite > img').src = favorite.image;
    find('.example-favorite > img').alt = `${favorite.brand} ${favorite.name} u favoritima`;
    find('.example-favorite b').textContent = favorite.name;
  };
  find('[data-favorite-toggle]').addEventListener('click', event => {
    const button = event.currentTarget;
    const saved = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(saved));
    button.classList.remove('is-popping');
    void button.offsetWidth; // restart the pop on every click
    button.classList.add('is-popping');
    find('[data-favorites-count]').textContent = saved ? '2 modela' : '1 model';
    find('.example-favorite div > span').textContent = saved ? `${favorite.brand} · sačuvano za kasnije` : `${favorite.brand} · dodaj u favorite`;
  });

  renderCollection();
  renderSearch();
  filterCatalog('39');
  selectProduct(byId('hogl'), '39');
  renderBag();
  renderFavorite();

  // Swap in the rendered side-profile shots (one per variant) once the 3D heel has loaded.
  renderHeelShots(products).then(shots => {
    products.forEach(product => { product.image = shots[product.id]; });
    renderSearch();
    filterCatalog(filterSize);
    find('.example-stock-product > img').src = selectedProduct.image;
    renderBag();
    renderFavorite();
  }).catch(() => {}); // keep the photo cut-out if WebGL is unavailable
}
