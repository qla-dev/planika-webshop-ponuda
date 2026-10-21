import gaborImageUrl from './assets/planika/products/gabor-womens.png';
import gantImageUrl from './assets/planika/products/gant-womens.png';
import { initProductViewer } from './product-viewer.js';
import './product-viewer.css';

// Self-contained, illustrative interactions for the reconstruction walkthrough.
const walkthrough = document.querySelector('.components-walkthrough');

if (walkthrough) {
  const productViewer = initProductViewer(walkthrough.querySelector('.example-product-photo'));
  const products = [
    { id: 'gabor', brand: 'Gabor', name: 'Udoban korak za grad', image: gaborImageUrl, price: 189, sizes: ['38', '39'], material: 'Kožno gornjište', keywords: 'patike obuca obuća zene žene grad svaki dan' },
    { id: 'gant', brand: 'Gant', name: 'Stil koji prati ritam', image: gantImageUrl, price: 219, sizes: ['39', '40'], material: 'Tekstilno gornjište', keywords: 'patike obuca obuća zene žene svaki dan' }
  ];
  const find = selector => walkthrough.querySelector(selector);
  const all = selector => [...walkthrough.querySelectorAll(selector)];
  const money = value => `${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM`;
  let selectedProduct = products[0];
  let selectedSize = '39';
  let bag = { product: products[0], size: '39', quantity: 1 };

  const productLink = (product, type, size) => type === 'search'
    ? `<a class="example-search-result" href="#component-product" data-product-link="${product.id}"><img src="${product.image}" alt="${product.brand} model" /><div><b>${product.name}</b><small>${product.brand} / Žene</small></div><strong>${money(product.price)}</strong></a>`
    : `<a class="example-catalog-card" href="#component-product" data-product-link="${product.id}" data-result-size="${size}"><div><img src="${product.image}" alt="${product.brand} model obuće" loading="lazy" /></div><small>${product.brand.toUpperCase()} / ŽENE</small><b>${product.name}</b><strong>${money(product.price)}</strong></a>`;

  const searchInput = find('[data-component-search]');
  const renderSearch = () => {
    const query = searchInput.value.trim().toLocaleLowerCase('bs');
    const matches = products.filter(product => `${product.brand} ${product.name} ${product.keywords}`.toLocaleLowerCase('bs').includes(query));
    find('[data-search-count]').textContent = `${matches.length} ${matches.length === 1 ? 'rezultat' : 'rezultata'}`;
    find('[data-search-results]').innerHTML = matches.length
      ? matches.map(product => productLink(product, 'search')).join('')
      : '<p class="example-search-empty">Nema rezultata za ovaj upit.<br />Isprobaj „Gabor“, „Gant“ ili „patike“.</p>';
  };
  searchInput.addEventListener('input', renderSearch);
  searchInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      find('.example-search-result')?.click();
    }
  });
  all('[data-search-term]').forEach(button => button.addEventListener('click', () => {
    searchInput.value = button.dataset.searchTerm;
    renderSearch();
    searchInput.focus({ preventScroll: true });
  }));

  const filterCatalog = size => {
    const matches = products.filter(product => product.sizes.includes(size));
    all('[data-filter-size]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filterSize === size)));
    find('[data-active-filter]').textContent = size;
    find('[data-filter-count]').textContent = `${matches.length} ${matches.length === 1 ? 'model' : 'modela'}`;
    find('[data-catalog-results]').innerHTML = matches.map(product => productLink(product, 'catalog', size)).join('');
  };
  all('[data-filter-size]').forEach(button => button.addEventListener('click', () => filterCatalog(button.dataset.filterSize)));

  const renderStores = () => {
    const city = find('[data-store-city]').value;
    const stores = [
      { name: `${city} / Centar`, detail: 'Primjer poslovnice 01', available: selectedSize !== '40' },
      { name: `${city} / Tržni centar`, detail: 'Primjer poslovnice 02', available: city !== 'Mostar' },
      { name: `${city} / Gradska zona`, detail: 'Primjer poslovnice 03', available: selectedSize === '38' }
    ];
    find('[data-store-list]').innerHTML = stores.map(store => `<div class="example-store"><div><b>${store.name}</b><small>${store.detail} · veličina ${selectedSize}</small></div><span class="example-store-status${store.available ? '' : ' is-unavailable'}">${store.available ? '● Dostupno' : 'Nije dostupno'}</span></div>`).join('');
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

  walkthrough.addEventListener('click', event => {
    const link = event.target.closest('[data-product-link]');
    if (!link) return;
    selectedProduct = products.find(product => product.id === link.dataset.productLink);
    productViewer?.setPhoto(selectedProduct);
    find('.example-product-info > .example-eyebrow').textContent = `${selectedProduct.brand.toUpperCase()} / ŽENE`;
    find('.example-product-info h4').textContent = `${selectedProduct.name}.`;
    find('.example-price').textContent = money(selectedProduct.price);
    find('.example-product-info > p:not(.example-feedback)').textContent = `${selectedProduct.material} · Mekano gazište za svaki dan`;
    find('.example-stock-product > img').src = selectedProduct.image;
    find('.example-stock-product > img').alt = `Odabrani ${selectedProduct.brand} model`;
    find('.example-stock-product b').textContent = selectedProduct.name;
    const stockDescription = find('.example-stock-product > div > span:last-child');
    stockDescription.replaceChildren(document.createTextNode(`${selectedProduct.brand} · Veličina `));
    const sizeLabel = document.createElement('strong');
    sizeLabel.dataset.selectedSize = '';
    stockDescription.append(sizeLabel);
    const preferredSize = link.dataset.resultSize || selectedSize;
    selectSize(selectedProduct.sizes.includes(preferredSize) ? preferredSize : selectedProduct.sizes[0]);
  });

  const renderBag = () => {
    all('[data-bag-count]').forEach(label => { label.textContent = bag.quantity; });
    find('[data-bag-size]').textContent = bag.size;
    const lastDigit = bag.quantity % 10;
    const lastTwoDigits = bag.quantity % 100;
    const pairLabel = lastDigit === 1 && lastTwoDigits !== 11 ? 'par'
      : lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14) ? 'para' : 'parova';
    find('[data-bag-quantity]').textContent = `${bag.quantity} ${pairLabel}`;
    find('.example-bag-product > img').src = bag.product.image;
    find('.example-bag-product > img').alt = `${bag.product.brand} model u korpi`;
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
  find('[data-favorite-toggle]').addEventListener('click', event => {
    const button = event.currentTarget;
    const saved = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(saved));
    button.textContent = saved ? '♥' : '♡';
    find('[data-favorites-count]').textContent = saved ? '2 modela' : '1 model';
    find('.example-favorite div > span').textContent = saved ? 'Gant · sačuvano za kasnije' : 'Gant · dodaj u favorite';
  });

  renderSearch();
  filterCatalog('39');
  selectSize('39');
  renderBag();
}
