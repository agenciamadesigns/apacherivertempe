// Apache River Apartments — unit detail modal
(function () {
  const UI = window.ApacheUI;
  if (!UI) return;
  const { availability, STATUS, bi, ICON, card } = UI;
  const UNITS = window.APACHE_UNITS || [];
  const lang = () => (document.documentElement.lang === "es" ? "es" : "en");
  const refresh = () => window.applyLanguage && window.applyLanguage();
  const big = (src) => src.replace(/w=\d+/, "w=1600");
  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const CAL = svg('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>');
  const CHECK = svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>');

  // Modal shell (created once)
  const modal = document.createElement("div");
  modal.className = "unit-modal";
  modal.hidden = true;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.innerHTML = `
    <div class="um-backdrop" data-um-close></div>
    <div class="um-dialog">
      <button class="um-close" type="button" data-um-close>×</button>
      <div class="um-scroll"></div>
      <div class="um-foot"></div>
    </div>`;
  document.body.appendChild(modal);
  const scroll = modal.querySelector(".um-scroll");
  const foot = modal.querySelector(".um-foot");
  const closeBtn = modal.querySelector(".um-close");
  let opener = null;
  let photos = [];
  let cur = 0;

  function setPhoto(i) {
    cur = (i + photos.length) % photos.length;
    const img = scroll.querySelector(".um-main-img");
    img.src = photos[cur];
    img.alt = (lang() === "es" ? "Foto " : "Photo ") + (cur + 1);
    scroll.querySelectorAll(".um-thumb").forEach((t, k) => t.classList.toggle("is-active", k === cur));
    const c = scroll.querySelector(".um-count");
    if (c) c.textContent = `${cur + 1} / ${photos.length}`;
  }

  function render(u) {
    const s = STATUS[u.status];
    const [ae, as] = availability(u);
    const [tEn, pEn = ""] = u.name.en.split(", ");
    const [tEs, pEs = ""] = u.name.es.split(", ");
    const desc = u.description || { en: "", es: "" };
    const isAvail = u.status === "available";
    photos = (u.images && u.images.length ? u.images : [u.image]).map(big);

    // NUEVO: los otros departamentos disponibles (máximo 3, sin contar el actual)
    const others = UNITS.filter((x) => x.id !== u.id && x.status === "available").slice(0, 3);

    const price = u.price
      ? `$${u.price.toLocaleString("en-US")}<small ${bi("/ month", "/ mes")}>/ month</small>`
      : `<span ${bi("Price on request", "Precio a consultar")}>Price on request</span>`;
    const contactUs = `<span ${bi("Contact us", "Contáctanos")}>Contact us</span>`;
    const row = (en, es, val) => `<div><dt ${bi(en, es)}>${en}</dt><dd>${val}</dd></div>`;
    const spec = (icon, strong, label) => `<li>${icon}<div>${strong}${label}</div></li>`;
    const bedsL = u.beds > 1 ? ["Bedrooms", "Habitaciones"] : ["Bedroom", "Habitación"];
    const bathsL = u.baths > 1 ? ["Bathrooms", "Baños"] : ["Bathroom", "Baño"];

    scroll.innerHTML = `
      <div class="um-gallery">
        <img class="um-main-img" alt="">
        ${photos.length > 1 ? `
          <button class="um-nav um-prev" type="button" aria-label="Previous">‹</button>
          <button class="um-nav um-next" type="button" aria-label="Next">›</button>
          <span class="um-count"></span>` : ""}
      </div>
      ${photos.length > 1 ? `<div class="um-thumbs">${photos.map((src, i) =>
        `<button class="um-thumb" type="button" data-i="${i}" style="background-image:url('${src.replace("w=1600", "w=300")}')" aria-label="Photo ${i + 1}"></button>`).join("")}</div>` : ""}

      <div class="um-body">
        <p class="unit-plan" ${bi(pEn, pEs)}>${pEn}</p>
        <h2 class="um-title" ${bi(tEn, tEs)}>${tEn}</h2>

        <ul class="detail-specs">
          ${spec(ICON.bed, `<strong>${u.beds}</strong>`, `<span ${bi(bedsL[0], bedsL[1])}>${bedsL[0]}</span>`)}
          ${spec(ICON.bath, `<strong>${u.baths}</strong>`, `<span ${bi(bathsL[0], bathsL[1])}>${bathsL[0]}</span>`)}
          ${u.sqft ? spec(ICON.area, `<strong>${u.sqft}</strong>`, `<span ${bi("sq ft", "pies²")}>sq ft</span>`) : ""}
          ${spec(CAL, `<strong ${bi(ae || s.en, ae ? as : s.es)}>${ae || s.en}</strong>`, `<span ${bi("Availability", "Disponibilidad")}>Availability</span>`)}
        </ul>

        <div class="detail-block">
          <h3 class="detail-h" ${bi("About this home", "Sobre este departamento")}>About this home</h3>
          <p class="detail-text" ${bi(desc.en, desc.es)}>${desc.en}</p>
        </div>

        ${u.features && u.features.length ? `<div class="detail-block">
          <h3 class="detail-h" ${bi("What this home offers", "Lo que ofrece")}>What this home offers</h3>
          <ul class="feature-list">${u.features.map((f) => `<li>${CHECK}<span ${bi(f.en, f.es)}>${f.en}</span></li>`).join("")}</ul>
        </div>` : ""}

        <div class="detail-block">
          <h3 class="detail-h" ${bi("Rental details", "Detalles de renta")}>Rental details</h3>
          <dl class="detail-dl">
            ${row("Monthly rent", "Renta mensual", price)}
            ${row("Security deposit", "Depósito", u.deposit ? "$" + u.deposit.toLocaleString("en-US") : contactUs)}
            ${row("Lease terms", "Plazo del contrato", u.lease ? `<span ${bi(u.lease.en, u.lease.es)}>${u.lease.en}</span>` : contactUs)}
            ${row("Status", "Estado", `<span ${bi(s.en, s.es)}>${s.en}</span>`)}
          </dl>
          <p class="temporary-note" ${bi("Sample details. Verified photos, floor plans and prices will be added.", "Detalles de ejemplo. Se agregarán fotos, planos y precios confirmados.")}>Sample details. Verified photos, floor plans and prices will be added.</p>
        </div>

        ${others.length ? `<div class="detail-block um-similar">
          <h3 class="detail-h" ${bi("You may also like", "También te puede interesar")}>You may also like</h3>
          <div class="unit-grid">${others.map(card).join("")}</div>
        </div>` : ""}
      </div>`;

    foot.innerHTML = `
      <p class="unit-price">${price}</p>
      <div class="um-actions">
        <a class="unit-btn" href="index.html#contact"><span ${bi("Send a message", "Enviar un mensaje")}>Send a message</span></a>
        ${isAvail ? `<a class="unit-btn unit-btn-primary" href="index.html?unit=${u.id}#tour"><span ${bi("Schedule a tour", "Agenda una visita")}>Schedule a tour</span></a>` : ""}
      </div>`;

    scroll.scrollTop = 0;
    scroll.querySelectorAll(".um-thumb").forEach((t) => t.addEventListener("click", () => setPhoto(Number(t.dataset.i))));
    const prev = scroll.querySelector(".um-prev");
    const next = scroll.querySelector(".um-next");
    if (prev) prev.addEventListener("click", () => setPhoto(cur - 1));
    if (next) next.addEventListener("click", () => setPhoto(cur + 1));
    setPhoto(0);
    refresh();
  }

  function open(id, el) {
    const u = UNITS.find((x) => x.id === id && x.status !== "maintenance");
    if (!u) return false;
    if (modal.hidden) opener = el || null; // NUEVO: solo guarda el botón original la primera vez
    render(u);
    closeBtn.setAttribute("aria-label", lang() === "es" ? "Cerrar" : "Close");
    modal.setAttribute("aria-label", lang() === "es" ? "Detalles del departamento" : "Home details");
    modal.hidden = false;
    document.body.classList.add("um-open");
    closeBtn.focus();
    return true;
  }

  function close() {
    modal.hidden = true;
    document.body.classList.remove("um-open");
    if (opener) opener.focus();
  }

  // Intercept "View details" links (cards and card titles)
  document.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return; // allow open in new tab
    const a = e.target.closest('a[href*="departamento.html?unit="]');
    if (!a) return;
    const id = new URL(a.href, location.href).searchParams.get("unit");
    if (open(id, a)) e.preventDefault();
  });

  modal.addEventListener("click", (e) => { if (e.target.closest("[data-um-close]")) close(); });
  document.addEventListener("keydown", (e) => {
    if (modal.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft" && photos.length > 1) setPhoto(cur - 1);
    if (e.key === "ArrowRight" && photos.length > 1) setPhoto(cur + 1);
  });
})();