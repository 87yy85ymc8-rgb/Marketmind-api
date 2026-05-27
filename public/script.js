// ---------- State ----------
const product = {
  id: "mm-001",
  title: "Nom du produit",
  price: 129,
  variants: {
    natural: { label: "Naturel", shopifyVariantId: null },
    ardoise: { label: "Ardoise", shopifyVariantId: null },
    terracotta: { label: "Terracotta", shopifyVariantId: null }
  }
};

const state = {
  selectedVariant: "natural",
  quantity: 1,
  cart: loadCart()
};

const fmt = (n) => "€" + n.toFixed(2).replace(".", ",");

// ---------- Gallery ----------
const thumbs = document.querySelectorAll("[data-thumb]");
const slides = document.querySelectorAll("[data-slide]");

thumbs.forEach((thumb) => {
  thumb.addEventListener("click", () => {
    const idx = thumb.dataset.thumb;
    thumbs.forEach((t) => t.classList.toggle("is-active", t === thumb));
    slides.forEach((s) => s.classList.toggle("is-active", s.dataset.slide === idx));
  });
});

// ---------- Variants ----------
const swatches = document.querySelectorAll("[data-variant]");
swatches.forEach((sw) => {
  sw.addEventListener("click", () => {
    state.selectedVariant = sw.dataset.variant;
    swatches.forEach((s) => s.classList.toggle("is-selected", s === sw));
  });
});

// ---------- Quantity ----------
const qtyValue = document.querySelector("[data-qty-value]");
const lineTotal = document.querySelector("[data-line-total]");

document.querySelectorAll("[data-qty]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const delta = parseInt(btn.dataset.qty, 10);
    state.quantity = Math.max(1, state.quantity + delta);
    qtyValue.textContent = state.quantity;
    lineTotal.textContent = fmt(state.quantity * product.price);
  });
});

// ---------- Add to cart ----------
const addBtn = document.querySelector("[data-add-to-cart]");
addBtn.addEventListener("click", () => {
  const variant = state.selectedVariant;
  const existing = state.cart.find((item) => item.variant === variant);
  if (existing) {
    existing.quantity += state.quantity;
  } else {
    state.cart.push({
      id: product.id,
      title: product.title,
      variant,
      variantLabel: product.variants[variant].label,
      price: product.price,
      quantity: state.quantity
    });
  }
  saveCart();
  renderCart();
  openCart();
  pulseAddButton();
});

function pulseAddButton() {
  const original = addBtn.innerHTML;
  addBtn.innerHTML = "Ajouté ✓";
  addBtn.disabled = true;
  setTimeout(() => {
    addBtn.innerHTML = original;
    addBtn.disabled = false;
  }, 1100);
}

// ---------- Cart drawer ----------
const cartEl = document.querySelector("[data-cart]");
const cartBody = document.querySelector("[data-cart-body]");
const cartTotal = document.querySelector("[data-cart-total]");
const cartCount = document.querySelector("[data-cart-count]");
const checkoutBtn = document.querySelector("[data-checkout]");

document.querySelectorAll("[data-cart-toggle]").forEach((el) => {
  el.addEventListener("click", toggleCart);
});

function toggleCart() {
  cartEl.classList.toggle("is-open");
}
function openCart() { cartEl.classList.add("is-open"); }

function renderCart() {
  cartCount.textContent = state.cart.reduce((s, i) => s + i.quantity, 0);

  if (state.cart.length === 0) {
    cartBody.innerHTML = '<p class="cart__empty">Votre panier est vide.</p>';
    cartTotal.textContent = fmt(0);
    checkoutBtn.disabled = true;
    return;
  }

  cartBody.innerHTML = state.cart.map((item, i) => `
    <div class="cart__item">
      <div class="cart__item-thumb"></div>
      <div>
        <p class="cart__item-title">${item.title}</p>
        <p class="cart__item-meta">${item.variantLabel} · Qté ${item.quantity}</p>
        <button class="cart__item-remove" data-remove="${i}">Retirer</button>
      </div>
      <div class="cart__item-price">${fmt(item.price * item.quantity)}</div>
    </div>
  `).join("");

  cartBody.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.cart.splice(parseInt(btn.dataset.remove, 10), 1);
      saveCart();
      renderCart();
    });
  });

  const total = state.cart.reduce((s, i) => s + i.price * i.quantity, 0);
  cartTotal.textContent = fmt(total);
  checkoutBtn.disabled = false;
}

// ---------- Persistence ----------
function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("mm_cart")) || [];
  } catch { return []; }
}
function saveCart() {
  localStorage.setItem("mm_cart", JSON.stringify(state.cart));
}

// ---------- Checkout (headless Shopify hook) ----------
checkoutBtn.addEventListener("click", () => {
  // À brancher : construction d'un permalink Shopify ou appel à
  // /api/checkout qui utilise la Storefront API pour créer un cart
  // et retourne checkoutUrl.
  //
  // Exemple de permalink (à remplacer par les vrais variant IDs Shopify) :
  //   https://votre-boutique.myshopify.com/cart/{variantId}:{qty},{variantId}:{qty}
  const variantIds = state.cart
    .map((i) => product.variants[i.variant].shopifyVariantId)
    .filter(Boolean);

  if (variantIds.length === 0) {
    alert(
      "Pour activer le paiement, branche les Variant IDs de ta boutique Shopify dans script.js (objet product.variants)."
    );
    return;
  }

  const items = state.cart
    .map((i) => `${product.variants[i.variant].shopifyVariantId}:${i.quantity}`)
    .join(",");
  // window.location.href = `https://votre-boutique.myshopify.com/cart/${items}`;
});

// ---------- Init ----------
renderCart();
