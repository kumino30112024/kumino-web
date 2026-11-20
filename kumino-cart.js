
/* KÚMINO — carrito unificado v2
   1.ª, 3.ª, 5.ª... unidad: precio promocional.
   2.ª, 4.ª, 6.ª... unidad: 40 % de descuento sobre precio regular.
*/
(() => {
  'use strict';
  if (window.__KUMINO_SHARED_CART_V2__) return;
  window.__KUMINO_SHARED_CART_V2__ = true;

  const KEY = document.body.dataset.cartMode === 'casitas'
    ? 'kumino_cart_casitas_v1'
    : 'kumino_cart_global_v1';
  const WA = '51940151463';
  const money = value => 'S/ ' + Number(value || 0).toFixed(2);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  let cart = [];
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (Array.isArray(saved)) cart = saved.filter(item =>
      item && item.key && Number(item.qty) > 0 &&
      Number.isFinite(Number(item.regular)) &&
      Number.isFinite(Number(item.promo))
    );
  } catch (_) {}

  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('No se pudo guardar el carrito.', error);
    }
  };

  const style = document.createElement('style');
  style.textContent = `
    .kumino-cart-fab{position:fixed;right:22px;bottom:22px;z-index:9998;display:flex;align-items:center;gap:9px;border:0;border-radius:999px;padding:13px 18px;background:#81363d;color:#fff;font:700 13px Poppins,Arial,sans-serif;box-shadow:0 5px 20px #28141438;cursor:pointer}
    .kumino-cart-fab-count{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 5px;border-radius:50%;background:#fff;color:#81363d;font-size:11px}
    .kumino-cart-panel{display:none;position:fixed;right:22px;bottom:82px;z-index:9999;width:min(420px,calc(100vw - 28px));max-height:min(72vh,620px);overflow:auto;box-sizing:border-box;padding:20px;border:1px solid rgba(129,54,61,.18);border-radius:17px;background:#fffdf9;color:#333;box-shadow:0 10px 35px #28141433;font:13px Poppins,Arial,sans-serif}
    .kumino-cart-panel.is-open{display:block}
    .kumino-cart-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
    .kumino-cart-head strong{color:#71343a;font:600 23px 'Playfair Display',Georgia,serif}
    .kumino-cart-close{border:0;background:transparent;color:#71343a;font-size:25px;cursor:pointer}
    .kumino-cart-empty{color:#756b62;font-size:13px;line-height:1.6}
    .kumino-cart-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;padding:12px 0;border-bottom:1px solid #eee5dc;font-size:12px}
    .kumino-cart-item strong{display:block;color:#413a35;font-size:13px}
    .kumino-cart-item small{display:block;margin-top:4px;color:#766c63;line-height:1.55}
    .kumino-cart-item-price{text-align:right;white-space:nowrap;font-weight:700;color:#413a35}
    .kumino-cart-old-price{color:#929292;font-size:11px;font-weight:400;text-decoration:line-through}
    .kumino-cart-discount-badge{display:inline-block;margin:3px 0;padding:3px 8px;border-radius:999px;background:#d8f3e3;color:#167447;font-size:10px;font-weight:700}
    .kumino-cart-remove{display:block;margin:6px 0 0 auto;padding:0;border:0;background:none;color:#9b4148;font:11px Poppins,Arial,sans-serif;text-decoration:underline;cursor:pointer}
    .kumino-cart-summary{margin-top:14px;padding-top:12px;border-top:1px solid #e7dcd1;font-size:13px}
    .kumino-cart-line{display:flex;justify-content:space-between;gap:12px;margin:7px 0;color:#413a35}
    .kumino-cart-line strong{font-weight:700}
    .kumino-cart-total{margin-top:10px;padding-top:12px;border-top:1px solid #e7dcd1;color:#81363d;font-size:20px;font-weight:800}
    .kumino-cart-note{margin:12px 0;color:#766c63;font-size:10px;line-height:1.5}
    .kumino-cart-checkout{display:block;width:100%;margin-top:13px;padding:13px;border:0;border-radius:25px;background:#526b50;color:#fff;font:700 13px Poppins,Arial,sans-serif;cursor:pointer}
    .kumino-cart-clear{display:block;margin:10px auto 0;padding:5px;border:0;background:transparent;color:#8a7770;font:11px Poppins,Arial,sans-serif;text-decoration:underline;cursor:pointer}
    @media(max-width:480px){.kumino-cart-fab{right:13px;bottom:13px;padding:11px 14px}.kumino-cart-panel{right:10px;bottom:70px;width:calc(100vw - 20px);padding:16px}}
  `;
  document.head.append(style);

  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'kumino-cart-fab';
  fab.setAttribute('aria-expanded', 'false');
  fab.innerHTML = 'Mi carrito <span class="kumino-cart-fab-count">0</span>';

  const panel = document.createElement('aside');
  panel.className = 'kumino-cart-panel';
  panel.setAttribute('aria-label', 'Carrito de compras KÚMINO');
  panel.setAttribute('aria-live', 'polite');
  panel.innerHTML = '<div class="kumino-cart-head"><strong>Mi carrito</strong><button type="button" class="kumino-cart-close" aria-label="Cerrar carrito">×</button></div><div class="kumino-cart-content"></div>';
  document.body.append(fab, panel);

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
        const isSecondInPair = unitIndex % 2 === 1;
        const regular = Number(item.regular);
        const promo = Number(item.promo);
        const finalPrice = isSecondInPair ? regular * 0.60 : promo;

        itemTotal += finalPrice;
        itemSaving += regular - finalPrice;
        subtotalRegular += regular;
        total += finalPrice;

        if (isSecondInPair) {
          discountedUnits++;
          discountedUnitPrice = finalPrice;
        } else {
          promoUnits++;
        }
        unitIndex++;
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

  function render() {
    const count = cart.reduce((sum, item) => sum + Number(item.qty), 0);
    fab.querySelector('.kumino-cart-fab-count').textContent = count;

    const area = panel.querySelector('.kumino-cart-content');
    const { details, subtotalRegular, total, discount } = calculate();

    if (!details.length) {
      area.innerHTML = '<p class="kumino-cart-empty">Tu carrito está vacío. Selecciona una talla y agrega tu primera prenda.</p>';
      return;
    }

    const itemsHTML = details.map(item => `
      <div class="kumino-cart-item">
        <div>
          <strong>${esc(item.name)}</strong>
          <small>
            ${esc([item.color, item.size ? 'Talla ' + item.size : ''].filter(Boolean).join(' · '))}<br>
            Cantidad: ${Number(item.qty)}<br>
            Ahorro en este producto: ${money(item.itemSaving)}
          </small>
        </div>
        <div class="kumino-cart-item-price">
          ${item.discountedUnits > 0 && Number(item.qty) === 1
            ? `<div><span class="kumino-cart-old-price">${money(item.regular)}</span></div>
               <span class="kumino-cart-discount-badge">40 % de descuento</span>
               <div>${money(item.discountedUnitPrice)}</div>`
            : `${money(item.itemTotal)}
               ${item.discountedUnits > 0
                 ? `<div><span class="kumino-cart-discount-badge">${item.discountedUnits} ${item.discountedUnits === 1 ? 'unidad con' : 'unidades con'} 40 % de descuento</span></div>`
                 : ''}`}
          <button type="button" class="kumino-cart-remove" data-kumino-remove="${esc(item.key)}">Quitar</button>
        </div>
      </div>
    `).join('');

    area.innerHTML = `${itemsHTML}
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
        La promoción se aplica por orden de agregado: la 2.ª, 4.ª, 6.ª prenda, etc., recibe 40 % de descuento sobre su precio regular. Las demás se cobran al precio promocional vigente.
      </p>
      <button type="button" class="kumino-cart-checkout">Finalizar pedido por WhatsApp</button>
      <button type="button" class="kumino-cart-clear">Vaciar carrito</button>`;
  }

  function add(button) {
    const data = button.dataset;
    const regular = Number(data.regularPrice);
    const promo = Number(data.promoPrice);

    if (!data.productId || !data.productName || !data.size || !data.color ||
        !Number.isFinite(regular) || !Number.isFinite(promo) ||
        regular <= 0 || promo <= 0) {
      console.error('Datos incompletos del producto para el carrito.', data);
      return;
    }

    const key = [data.productId, data.color, data.size].join('|');
    const existing = cart.find(item => item.key === key);

    if (existing) {
      existing.qty = Number(existing.qty) + 1;
    } else {
      cart.push({
        key,
        id: data.productId,
        name: data.productName,
        color: data.color,
        size: data.size,
        regular,
        promo,
        qty: 1
      });
    }

    save();
    render();
    panel.classList.add('is-open');
    fab.setAttribute('aria-expanded', 'true');
  }

  function checkout() {
    if (!cart.length) return;

    const { details, subtotalRegular, total, discount } = calculate();

    const lines = details.map(item =>
      `• ${item.name} — ${item.color}, talla ${item.size}, cantidad ${item.qty}: ${money(item.itemTotal)} (ahorro ${money(item.itemSaving)})`
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

  fab.addEventListener('click', () => {
    const open = !panel.classList.contains('is-open');
    panel.classList.toggle('is-open', open);
    fab.setAttribute('aria-expanded', String(open));
  });

  panel.querySelector('.kumino-cart-close').addEventListener('click', () => {
    panel.classList.remove('is-open');
    fab.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('click', event => {
    const addButton = event.target.closest('#kc-add, [data-kumino-add]');

    if (addButton) {
      if (!addButton.disabled) add(addButton);
      return;
    }

    const removeButton = event.target.closest('[data-kumino-remove]');

    if (removeButton) {
      cart = cart.filter(item => item.key !== removeButton.dataset.kuminoRemove);
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

    if (event.target.closest('.kumino-cart-checkout')) checkout();
  });

  render();
})();

