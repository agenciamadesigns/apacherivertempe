// Apache River Apartments — unit detail page (departamento.html?unit=A1)
(function () {
  const UI = window.ApacheUI;
  const root = document.getElementById("detail-root");
  if (!UI || !root) return;
  const { card, availability, STATUS, bi, ICON } = UI;
  const UNITS = window.APACHE_UNITS || [];
  const lang = () => (document.documentElement.lang === "es" ? "es" : "en");
  const refresh = () => window.applyLanguage && window.applyLanguage();
  const big = (src) => src.replace(/w=\d+/, "w=1600");
  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const CAL = svg(
    '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  );
  const CHECK = svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>');
  const GRID = svg(
    '<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/>',
  );

  document.body.classList.add("detail-page");
  const id = new URLSearchParams(location.search).get("unit");
  const u = UNITS.find((x) => x.id === id && x.status !== "maintenance");

  if (!u) {
    root.innerHTML = `<section class="detail"><div class="container detail-empty">
      <h1 ${bi("Home not found", "Departamento no encontrado")}>Home not found</h1>
      <p ${bi("This home is not available or the link is incorrect.", "Este departamento no está disponible o el enlace es incorrecto.")}>This home is not available or the link is incorrect.</p>
      <a class="unit-btn unit-btn-primary" href="departamentos.html"><span ${bi("Back to residences", "Volver a departamentos")}>Back to residences</span></a>
    </div></section>`;
    refresh();
    return;
  }

  const s = STATUS[u.status];
  const [ae, as] = availability(u);
  const [tEn, pEn = ""] = u.name.en.split(", ");
  const [tEs, pEs = ""] = u.name.es.split(", ");
  const all = (u.images && u.images.length ? u.images : [u.image]).map(big);
  const shown = all.length >= 5 ? 5 : all.length >= 3 ? 3 : all.length;
  const price = u.price
    ? `$${u.price.toLocaleString("en-US")}<small ${bi("/ month", "/ mes")}>/ month</small>`
    : `<span ${bi("Price on request", "Precio a consultar")}>Price on request</span>`;
  const contactUs = `<span ${bi("Contact us", "Contáctanos")}>Contact us</span>`;
  const desc = u.description || { en: "", es: "" };
  const isAvail = u.status === "available";

  const t = document.querySelector("title");
  if (t) {
    t.dataset.en = `${u.name.en} | Apache River Apartments`;
    t.dataset.es = `${u.name.es} | Apache River Apartments`;
  }

  const row = (en, es, val) =>
    `<div><dt ${bi(en, es)}>${en}</dt><dd>${val}</dd></div>`;
  const spec = (icon, strong, label) =>
    `<li>${icon}<div>${strong}${label}</div></li>`;
  const bedsL =
    u.beds > 1 ? ["Bedrooms", "Habitaciones"] : ["Bedroom", "Habitación"];
  const bathsL = u.baths > 1 ? ["Bathrooms", "Baños"] : ["Bathroom", "Baño"];

  const primary = isAvail
    ? `<a class="unit-btn unit-btn-primary" href="index.html?unit=${u.id}#tour"><span ${bi("Schedule a tour", "Agenda una visita")}>Schedule a tour</span></a>`
    : `<a class="unit-btn unit-btn-primary" href="departamentos.html"><span ${bi("See available homes", "Ver disponibles")}>See available homes</span></a>`;
  const status = ae
    ? `<span class="unit-avail" ${bi(ae, as)}>${ae}</span>`
    : `<span class="unit-avail unit-avail-muted" ${bi(s.en, s.es)}>${s.en}</span>`;

  const others = UNITS.filter(
    (x) => x.id !== u.id && x.status !== "maintenance" && x.status !== "rented",
  ).slice(0, 3);

  root.innerHTML = `
  <section class="detail">
    <div class="container">
      <a class="back-link" href="departamentos.html"><span aria-hidden="true">←</span><span ${bi("Back to residences", "Volver a departamentos")}>Back to residences</span></a>
      <div class="detail-title">
        <p class="unit-plan" ${bi(pEn, pEs)}>${pEn}</p>
        <h1 ${bi(tEn, tEs)}>${tEn}</h1>
      </div>

      <div class="photo-grid" data-count="${shown}">
        ${all
          .slice(0, shown)
          .map(
            (src, i) =>
              `<button class="photo photo-${i}" type="button" data-photo="${i}" aria-label="Photo ${i + 1}" style="background-image:url('${src}')"></button>`,
          )
          .join("")}
        ${all.length > 1 ? `<button class="photos-all" type="button" data-photo="0">${GRID}<span ${bi("Show all photos", "Ver todas las fotos")}>Show all photos</span><span>(${all.length})</span></button>` : ""}
      </div>

      <div class="detail-layout">
        <div class="detail-main">
          <ul class="detail-specs">
            ${spec(ICON.bed, `<strong>${u.beds}</strong>`, `<span ${bi(bedsL[0], bedsL[1])}>${bedsL[0]}</span>`)}
            ${spec(ICON.bath, `<strong>${u.baths}</strong>`, `<span ${bi(bathsL[0], bathsL[1])}>${bathsL[0]}</span>`)}
            ${u.sqft ? spec(ICON.area, `<strong>${u.sqft}</strong>`, `<span ${bi("sq ft", "pies²")}>sq ft</span>`) : ""}
            ${spec(CAL, `<strong ${bi(ae || s.en, ae ? as : s.es)}>${ae || s.en}</strong>`, `<span ${bi("Availability", "Disponibilidad")}>Availability</span>`)}
          </ul>

          <div class="detail-block">
            <h2 class="detail-h" ${bi("About this home", "Sobre este departamento")}>About this home</h2>
            <p class="detail-text" ${bi(desc.en, desc.es)}>${desc.en}</p>
          </div>

          ${
            u.features && u.features.length
              ? `<div class="detail-block">
            <h2 class="detail-h" ${bi("What this home offers", "Lo que ofrece")}>What this home offers</h2>
            <ul class="feature-list">${u.features.map((f) => `<li>${CHECK}<span ${bi(f.en, f.es)}>${f.en}</span></li>`).join("")}</ul>
          </div>`
              : ""
          }

          <div class="detail-block">
            <h2 class="detail-h" ${bi("Rental details", "Detalles de renta")}>Rental details</h2>
            <dl class="detail-dl">
              ${row("Monthly rent", "Renta mensual", price)}
              ${row("Security deposit", "Depósito", u.deposit ? "$" + u.deposit.toLocaleString("en-US") : contactUs)}
              ${row("Lease terms", "Plazo del contrato", u.lease ? `<span ${bi(u.lease.en, u.lease.es)}>${u.lease.en}</span>` : contactUs)}
              ${row("Status", "Estado", `<span ${bi(s.en, s.es)}>${s.en}</span>`)}
            </dl>
            <p class="temporary-note" ${bi("Sample details. Verified photos, floor plans and prices will be added.", "Detalles de ejemplo. Se agregarán fotos, planos y precios confirmados.")}>Sample details. Verified photos, floor plans and prices will be added.</p>
          </div>
        </div>

        <aside class="booking" aria-label="Booking">
          <div class="booking-card">
            <div><p class="unit-label" ${bi("Monthly rent", "Renta mensual")}>Monthly rent</p><p class="unit-price">${price}</p></div>
            ${status}
            ${primary}
            <a class="unit-btn" href="index.html#contact"><span ${bi("Send a message", "Enviar un mensaje")}>Send a message</span></a>
            <p class="booking-note" ${bi("Our team will contact you to confirm your visit.", "Nuestro equipo te contactará para confirmar tu visita.")}>Our team will contact you to confirm your visit.</p>
          </div>
        </aside>
      </div>
    </div>
  </section>

  ${
    others.length
      ? `<section class="residences similar section-space">
    <div class="container">
      <h2 class="detail-h" ${bi("More homes you may like", "Otros departamentos que te pueden gustar")}>More homes you may like</h2>
      <div class="unit-grid">${others.map(card).join("")}</div>
    </div>
  </section>`
      : ""
  }

  <div class="booking-bar"><div><p class="unit-price">${price}</p></div>${primary}</div>`;

  // Lightbox
  const lb = document.createElement("div");
  lb.className = "lightbox" + (all.length < 2 ? " single" : "");
  lb.hidden = true;
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.innerHTML = `<button class="lb-close" type="button">×</button><button class="lb-nav lb-prev" type="button">‹</button><img class="lb-img" alt=""><button class="lb-nav lb-next" type="button">›</button><p class="lb-count"></p>`;
  document.body.appendChild(lb);
  const img = lb.querySelector(".lb-img");
  const count = lb.querySelector(".lb-count");
  let cur = 0,
    opener = null,
    x0 = 0;

  const show = (i) => {
    cur = (i + all.length) % all.length;
    img.src = all[cur];
    img.alt = (lang() === "es" ? "Foto " : "Photo ") + (cur + 1);
    count.textContent = `${cur + 1} / ${all.length}`;
  };
  const open = (i, el) => {
    opener = el;
    const es = lang() === "es";
    lb.setAttribute("aria-label", es ? "Fotos" : "Photos");
    lb.querySelector(".lb-close").setAttribute(
      "aria-label",
      es ? "Cerrar" : "Close",
    );
    lb.querySelector(".lb-prev").setAttribute(
      "aria-label",
      es ? "Foto anterior" : "Previous photo",
    );
    lb.querySelector(".lb-next").setAttribute(
      "aria-label",
      es ? "Foto siguiente" : "Next photo",
    );
    show(i);
    lb.hidden = false;
    document.body.classList.add("lb-open");
    lb.querySelector(".lb-close").focus();
  };
  const close = () => {
    lb.hidden = true;
    document.body.classList.remove("lb-open");
    if (opener) opener.focus();
  };

  root
    .querySelectorAll("[data-photo]")
    .forEach((b) =>
      b.addEventListener("click", () => open(Number(b.dataset.photo), b)),
    );
  lb.querySelector(".lb-close").addEventListener("click", close);
  lb.querySelector(".lb-prev").addEventListener("click", () => show(cur - 1));
  lb.querySelector(".lb-next").addEventListener("click", () => show(cur + 1));
  lb.addEventListener("click", (e) => {
    if (e.target === lb) close();
  });
  lb.addEventListener(
    "touchstart",
    (e) => {
      x0 = e.touches[0].clientX;
    },
    { passive: true },
  );
  lb.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
  });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(cur - 1);
    if (e.key === "ArrowRight") show(cur + 1);
  });

  refresh();
})();
