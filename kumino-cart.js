/* KÚMINO — carrito unificado v2
   Prendas:
   1.ª, 3.ª, 5.ª... unidad: precio promocional.
   2.ª, 4.ª, 6.ª... unidad: 40 % de descuento sobre precio regular.

   Casitas:
   Se agregan al mismo carrito global, pero no participan
   en la promoción del 40 %.
*/

(() => {
  'use strict';

  if (window.__KUMINO_SHARED_CART_V2__) return;
  window.__KUMINO_SHARED_CART_V2__ = true;

  // Todas las colecciones, incluidas Casitas, comparten el mismo carrito.
  const KEY = 'kumino_cart_global_v1';

  const WA = '51919503045';

  const money = value =>
    'S/ ' + Number(value || 0).toFixed(2);

  const esc = value =>
    String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));

  let cart = [];

  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '[]');

    if (Array.isArray(saved)) {
      cart = saved.filter(item =>
        item &&
        item.key &&
        Number(item.qty) > 0 &&
        Number.isFinite(Number(item.regular)) &&
        Number.isFinite(Number(item.promo))
      );
    }
  } catch (_) {}

  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('No se pudo guardar el carrito.', error);
    }
  };

  /* =========================================
     ESTILOS DEL CARRITO
  ========================================= */

  const style = document.createElement('style');

  style.textContent = `

    .kumino-cart-nav {
      position: relative;
      display: inline-flex;
      flex: 0 0 44px;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      margin-left: 12px;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: #81363d;
      cursor: pointer;
      vertical-align: middle;
      transition: background .2s ease;
    }

    .kumino-cart-nav:hover {
      background: rgba(129,54,61,.08);
    }

    .kumino-cart-nav svg {
      display: block;
      width: 25px;
      height: 25px;
      stroke: currentColor;
    }

    .kumino-cart-nav-count {
      position: absolute;
      top: 1px;
      right: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      border: 2px solid #fff;
      border-radius: 999px;
      background: #E63946;
      color: #fff;
      font: 700 10px Poppins,Arial,sans-serif;
      line-height: 1;
    }

    .kumino-cart-nav-count.is-empty {
      display: none;
    }

    .kumino-cart-panel {
      display: none;
      position: fixed;
      top: 88px;
      right: 20px;
      bottom: auto;
      z-index: 10200;
      width: min(420px,calc(100vw - 28px));
      max-height: min(72vh,620px);
      overflow: auto;
      box-sizing: border-box;
      padding: 20px;
      border: 1px solid rgba(129,54,61,.18);
      border-radius: 17px;
      background: #fffdf9;
      color: #333;
      box-shadow: 0 10px 35px #28141433;
      font: 13px Poppins,Arial,sans-serif;
    }

    .kumino-cart-panel.is-open {
      display: block;
    }

    .kumino-cart-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
    }

    .kumino-cart-head strong {
      color: #71343a;
      font: 600 23px 'Playfair Display',Georgia,serif;
    }

    .kumino-cart-close {
      border: 0;
      background: transparent;
      color: #71343a;
      font-size: 25px;
      cursor: pointer;
    }

    .kumino-cart-empty {
      color: #756b62;
      font-size: 13px;
      line-height: 1.6;
    }

    .kumino-cart-item {
      display: grid;
      grid-template-columns: minmax(0,1fr) auto;
      gap: 8px;
      padding: 12px 0;
      border-bottom: 1px solid #eee5dc;
      font-size: 12px;
    }

    .kumino-cart-item strong {
      display: block;
      color: #413a35;
      font-size: 13px;
    }

    .kumino-cart-item small {
      display: block;
      margin-top: 4px;
      color: #766c63;
      line-height: 1.55;
    }

    .kumino-cart-item-price {
      text-align: right;
      white-space: nowrap;
      font-weight: 700;
      color: #413a35;
    }

    .kumino-cart-old-price {
      color: #929292;
      font-size: 11px;
      font-weight: 400;
      text-decoration: line-through;
    }

    .kumino-cart-discount-badge {
      display: inline-block;
      margin: 3px 0;
      padding: 3px 8px;
      border-radius: 999px;
      background: #d8f3e3;
      color: #167447;
      font-size: 10px;
      font-weight: 700;
    }

    .kumino-cart-remove {
      display: block;
      margin: 6px 0 0 auto;
      padding: 0;
      border: 0;
      background: none;
      color: #9b4148;
      font: 11px Poppins,Arial,sans-serif;
      text-decoration: underline;
      cursor: pointer;
    }

    .kumino-cart-summary {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid #e7dcd1;
      font-size: 13px;
    }

    .kumino-cart-line {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin: 7px 0;
      color: #413a35;
    }

    .kumino-cart-line strong {
      font-weight: 700;
    }

    .kumino-cart-total {
      margin-top: 10px;
      padding-top: 12px;
      border-top: 1px solid #e7dcd1;
      color: #81363d;
      font-size: 20px;
      font-weight: 800;
    }

    .kumino-cart-note {
      margin: 12px 0;
      color: #766c63;
      font-size: 10px;
      line-height: 1.5;
    }

    .kumino-cart-checkout {
      display: block;
      width: 100%;
      margin-top: 13px;
      padding: 13px;
      border: 0;
      border-radius: 25px;
      background: #526b50;
      color: #fff;
      font: 700 13px Poppins,Arial,sans-serif;
      cursor: pointer;
    }

    .kumino-cart-clear {
      display: block;
      margin: 10px auto 0;
      padding: 5px;
      border: 0;
      background: transparent;
      color: #8a7770;
      font: 11px Poppins,Arial,sans-serif;
      text-decoration: underline;
      cursor: pointer;
    }

    .nav-container .kumino-cart-nav {
      order: 4;
    }

    @media(max-width:600px) {

      .kumino-cart-nav {
        width: 40px;
        height: 40px;
        flex-basis: 40px;
        margin-left: 7px;
      }

      .kumino-cart-nav svg {
        width: 23px;
        height: 23px;
      }

      .kumino-cart-panel {
        top: 76px;
        right: 10px;
        width: calc(100vw - 20px);
        max-height: calc(100dvh - 92px);
        padding: 16px;
      }
    }
  `;

  document.head.append(style);

  /* =========================================
     ICONO DEL CARRITO
  ========================================= */

  const fab = document.createElement('button');

  fab.type = 'button';
  fab.className = 'kumino-cart-nav';
  fab.setAttribute('aria-label', 'Abrir carrito de compras');
  fab.setAttribute('aria-expanded', 'false');

  fab.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
         aria-hidden="true">

      <circle cx="9" cy="20" r="1"></circle>
      <circle cx="19" cy="20" r="1"></circle>

      <path d="M2 3h2l2.4 11.2a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 7H5"></path>

    </svg>

    <span class="kumino-cart-nav-count is-empty">0</span>
  `;

  // Inserta el icono inmediatamente después de Contacto.
  const contactLink = document.querySelector(
    '.nav-container .btn-contacto'
  );

  const navContainer = document.querySelector('.nav-container');

  if (contactLink) {
    contactLink.insertAdjacentElement('afterend', fab);
  } else if (navContainer) {
    navContainer.appendChild(fab);
  } else {
    document.body.appendChild(fab);
  }

  /* =========================================
     PANEL DEL CARRITO
  ========================================= */

  const panel = document.createElement('aside');

  panel.className = 'kumino-cart-panel';
  panel.setAttribute('aria-label', 'Carrito de compras KÚMINO');
  panel.setAttribute('aria-live', 'polite');

  panel.innerHTML = `
    <div class="kumino-cart-head">

      <strong>Mi carrito</strong>

      <button type="button"
              class="kumino-cart-close"
              aria-label="Cerrar carrito">
        ×
      </button>

    </div>

    <div class="kumino-cart-content"></div>
  `;

  document.body.append(panel);

  /* =========================================
     CÁLCULO DE PRECIOS Y DESCUENTOS
  ========================================= */

  function calculate() {

    let unitIndex = 0;
    let subtotalRegular = 0;
    let total = 0;

    const details = cart.map(item => {

      let itemTotal = 0;
      let itemSaving = 0;
      let discountedUnits = 0;
      let promoUnits = 0;
      let discountedUnitPrice = 0;

      for (let i = 0; i < Number(item.qty); i++) {

        const isCasita = item.category === 'casitas';

        const isSecondInPair =
          !isCasita && unitIndex % 2 === 1;

        const regular = Number(item.regular);
        const promo = Number(item.promo);

        // Las casitas se cobran a su precio normal
        // y no consumen turno promocional.
        const finalPrice = isCasita
          ? regular
          : (isSecondInPair ? regular * 0.60 : promo);

        itemTotal += finalPrice;
        itemSaving += regular - finalPrice;
        subtotalRegular += regular;
        total += finalPrice;

        if (isSecondInPair) {

          discountedUnits++;
          discountedUnitPrice = finalPrice;

        } else if (!isCasita) {

          promoUnits++;

        }

        if (!isCasita) {
          unitIndex++;
        }
      }

      return {
        ...item,
        itemTotal,
        itemSaving,
        discountedUnits,
        promoUnits,
        discountedUnitPrice
      };
    });

    return {
      details,
      subtotalRegular,
      total,
      discount: subtotalRegular - total
    };
  }

  /* =========================================
     MOSTRAR CARRITO
  ========================================= */

  function render() {

    const count = cart.reduce(
      (sum, item) => sum + Number(item.qty),
      0
    );

    const countBadge = fab.querySelector(
      '.kumino-cart-nav-count'
    );

    countBadge.textContent = count;
    countBadge.classList.toggle('is-empty', count === 0);

    fab.setAttribute(
      'aria-label',
      count
        ? `Abrir carrito de compras, ${count} ${count === 1 ? 'producto' : 'productos'}`
        : 'Abrir carrito de compras'
    );

    const area = panel.querySelector('.kumino-cart-content');

    const {
      details,
      subtotalRegular,
      total,
      discount
    } = calculate();

    if (!details.length) {

      area.innerHTML = `
        <p class="kumino-cart-empty">
          Tu carrito está vacío. Elige tus productos y agrégalos para continuar.
        </p>
      `;

      return;
    }

    const itemsHTML = details.map(item => `

      <div class="kumino-cart-item">

        <div>

          <strong>${esc(item.name)}</strong>

          <small>
            ${esc([
              item.color,
              item.size
                ? (item.category === 'casitas' ? 'Medida ' : 'Talla ') + item.size
                : ''
            ].filter(Boolean).join(' · '))}<br>

            Cantidad: ${Number(item.qty)}<br>

            Ahorro en este producto: ${money(item.itemSaving)}
          </small>

        </div>

        <div class="kumino-cart-item-price">

          ${
            item.discountedUnits > 0 && Number(item.qty) === 1

              ? `
                <div>
                  <span class="kumino-cart-old-price">
                    ${money(item.regular)}
                  </span>
                </div>

                <span class="kumino-cart-discount-badge">
                  40 % de descuento
                </span>

                <div>
                  ${money(item.discountedUnitPrice)}
                </div>
              `

              : `
                ${money(item.itemTotal)}

                ${
                  item.discountedUnits > 0

                    ? `
                      <div>
                        <span class="kumino-cart-discount-badge">
                          ${item.discountedUnits}
                          ${item.discountedUnits === 1 ? 'unidad con' : 'unidades con'}
                          40 % de descuento
                        </span>
                      </div>
                    `

                    : ''
                }
              `
          }

          <button
            type="button"
            class="kumino-cart-remove"
            data-kumino-remove="${esc(item.key)}">
            Quitar
          </button>

        </div>

      </div>

    `).join('');

    area.innerHTML = `

      ${itemsHTML}

      <div class="kumino-cart-summary">

        <div class="kumino-cart-line">
          <span>Subtotal (precios regulares)</span>
          <strong>${money(subtotalRegular)}</strong>
        </div>

        <div class="kumino-cart-line">
          <span>Descuentos aplicados</span>
          <strong>− ${money(discount)}</strong>
        </div>

        <div class="kumino-cart-line kumino-cart-total">
          <span>Total a pagar</span>
          <strong>${money(total)}</strong>
        </div>

      </div>

      <p class="kumino-cart-note">
        La promoción se aplica por orden de agregado a las prendas:
        la 2.ª, 4.ª, 6.ª prenda, etc., recibe 40 % de descuento
        sobre su precio regular. Las demás se cobran al precio
        promocional vigente. Las casitas no participan en esta promoción.
      </p>

      <button type="button" class="kumino-cart-checkout">
        Finalizar pedido por WhatsApp
      </button>

      <button type="button" class="kumino-cart-clear">
        Vaciar carrito
      </button>

    `;
  }

  /* =========================================
     AGREGAR PRODUCTOS
  ========================================= */

  function add(button) {

    const data = button.dataset;

    const regular = Number(data.regularPrice);
    const promo = Number(data.promoPrice);

    if (
      !data.productId ||
      !data.productName ||
      !data.size ||
      !data.color ||
      !Number.isFinite(regular) ||
      !Number.isFinite(promo) ||
      regular <= 0 ||
      promo <= 0
    ) {

      console.error(
        'Datos incompletos del producto para el carrito.',
        data
      );

      return;
    }

    const key = [
      data.productId,
      data.color,
      data.size
    ].join('|');

    const existing = cart.find(
      item => item.key === key
    );

    if (existing) {

      existing.qty = Number(existing.qty) + 1;

    } else {

      cart.push({

        key,

        id: data.productId,

        name: data.productName,

        category: data.category || '',

        color: data.color,

        size: data.size,

        regular,

        promo,

        qty: 1

      });
    }

    save();
    render();

    // Abrir automáticamente para confirmar el producto agregado.
    // El usuario puede cerrar el panel y continuar navegando normalmente.
    panel.classList.add('is-open');
    fab.setAttribute('aria-expanded', 'true');
  }

  /* =========================================
     FINALIZAR PEDIDO POR WHATSAPP
  ========================================= */

  function checkout() {

    if (!cart.length) return;

    const {
      details,
      subtotalRegular,
      total,
      discount
    } = calculate();

    const lines = details.map(item =>

      `• ${item.name} — ${item.color}, ${
        item.category === 'casitas' ? 'medida' : 'talla'
      } ${item.size}, cantidad ${item.qty}: ${
        money(item.itemTotal)
      }${
        item.itemSaving > 0
          ? ` (ahorro ${money(item.itemSaving)})`
          : ''
      }`

    );

    const message = [

      '¡Hola KÚMINO! Quiero realizar este pedido:',

      '',

      ...lines,

      '',

      `Subtotal (precios regulares): ${money(subtotalRegular)}`,

      `Descuentos aplicados: − ${money(discount)}`,

      `TOTAL A PAGAR: ${money(total)}`,

      '',

      'Quedo atento/a a la confirmación de disponibilidad y envío. ¡Gracias!'

    ].join('\n');

    window.open(
      `https://wa.me/${WA}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  /* =========================================
     EVENTOS DEL CARRITO
  ========================================= */

  function closeCartPanel() {
    panel.classList.remove('is-open');
    fab.setAttribute('aria-expanded', 'false');
  }

  // Coordinación con el menú móvil y con la navegación del navegador.
  document.addEventListener('kumino:close-cart', closeCartPanel);
  window.addEventListener('pagehide', closeCartPanel);
  window.addEventListener('pageshow', closeCartPanel);

  // Al navegar desde un enlace, el panel se cierra sin bloquear el enlace.
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (link && !link.matches('.kumino-cart-nav')) {
      closeCartPanel();
    }
  }, true);

  fab.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();

    const open = !panel.classList.contains('is-open');
    panel.classList.toggle('is-open', open);
    fab.setAttribute('aria-expanded', String(open));
  });

  panel.querySelector('.kumino-cart-close')
    .addEventListener('click', closeCartPanel);

  // Cerrar al tocar fuera del panel, sin interferir con el icono del carrito.
  document.addEventListener('click', event => {
    if (panel.classList.contains('is-open') &&
        !event.target.closest('.kumino-cart-panel') &&
        !event.target.closest('.kumino-cart-nav')) {
      closeCartPanel();
    }

    const addButton = event.target.closest(
      '#kc-add, [data-kumino-add]'
    );

    if (addButton) {

      if (!addButton.disabled) {
        add(addButton);
      }

      return;
    }

    const removeButton = event.target.closest(
      '[data-kumino-remove]'
    );

    if (removeButton) {

      cart = cart.filter(
        item => item.key !== removeButton.dataset.kuminoRemove
      );

      save();
      render();

      return;
    }

    if (event.target.closest('.kumino-cart-clear')) {

      cart = [];

      save();
      render();

      return;
    }

    if (event.target.closest('.kumino-cart-checkout')) {
      checkout();
    }

  });

  // Escape también permite cerrar el panel en PC y móvil con teclado.
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeCartPanel();
  });

  // Carga inicial del carrito guardado.
  render();

})();