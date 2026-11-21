// Apache River Apartments — units, gallery filters and forms
(function () {
  const C = window.APACHE_CONFIG || {};
  const UNITS = window.APACHE_UNITS || [];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const lang = () => (document.documentElement.lang === "es" ? "es" : "en");
  const bi = (en, es) => `data-en="${en}" data-es="${es}"`;
  const refresh = () => window.applyLanguage && window.applyLanguage();

  const STATUS = {
    available: { en: "Available", es: "Disponible" },
    reserved: { en: "Reserved", es: "Reservado" },
    rented: { en: "Rented", es: "Rentado" },
    maintenance: { en: "Under maintenance", es: "En mantenimiento" }
  };
  const state = { status: "available", beds: "all" };

  function availability(u) {
    if (u.status !== "available") return ["", ""];
    if (!u.availableFrom || u.availableFrom === "now") return ["Available now", "Disponible ahora"];
    const d = new Date(u.availableFrom + "T00:00:00");
    const fmt = (l) => d.toLocaleDateString(l, { month: "short", day: "numeric", year: "numeric" });
    return ["Available " + fmt("en-US"), "Disponible desde " + fmt("es-MX")];
  }

const ICON = {
    bed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18V6M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/></svg>',
    bath: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16v2a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-2zM6 12V6.5a2 2 0 0 1 3.4-1.4M8 18l-1 2M16 18l1 2"/></svg>',
    area: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>'
  };

  function card(u) {
    const s = STATUS[u.status];
    const [ae, as] = availability(u);
    const [tEn, pEn = ""] = u.name.en.split(", ");
    const [tEs, pEs = ""] = u.name.es.split(", ");
    const price = u.price
      ? `$${u.price.toLocaleString("en-US")}<small ${bi("/ month", "/ mes")}>/ month</small>`
      : `<span ${bi("Price on request", "Precio a consultar")}>Price on request</span>`;
    const cta = `<a class="unit-btn unit-btn-primary" href="departamento.html?unit=${u.id}"><span ${bi("View details", "Ver detalles")}>View details</span></a>`;
    return `<article class="unit-card is-${u.status}">
      <div class="unit-image">
        <div class="unit-photo" style="background-image:url('${u.image}')"></div>
        <span class="status status-${u.status}" ${bi(s.en, s.es)}>${s.en}</span>
      </div>
      <div class="unit-body">
        <div class="unit-head">
          <p class="unit-plan" ${bi(pEn, pEs)}>${pEn}</p>
          <h3><a class="unit-link" href="departamento.html?unit=${u.id}"><span ${bi(tEn, tEs)}>${tEn}</span></a></h3>
        </div>
        <ul class="unit-specs">
          <li>${ICON.bed}<span ${bi(u.beds + " bed", u.beds + " hab.")}>${u.beds} bed</span></li>
          <li>${ICON.bath}<span ${bi(u.baths + " bath", u.baths + " baño" + (u.baths > 1 ? "s" : ""))}>${u.baths} bath</span></li>
          ${u.sqft ? `<li>${ICON.area}<span ${bi(u.sqft + " sq ft", u.sqft + " pies²")}>${u.sqft} sq ft</span></li>` : ""}
        </ul>
        <div class="unit-price-row">
          <div>
            <p class="unit-label" ${bi("Monthly rent", "Renta mensual")}>Monthly rent</p>
            <p class="unit-price">${price}</p>
          </div>
          ${ae ? `<span class="unit-avail" ${bi(ae, as)}>${ae}</span>` : ""}
        </div>
        ${cta}
      </div>
    </article>`;
  }

  function renderUnits() {
    const grid = $("#unit-grid");
    if (!grid) return;
    const list = UNITS.filter((u) => u.status !== "maintenance" &&
      (state.status === "all" || u.status === state.status) &&
      (state.beds === "all" || String(u.beds) === state.beds));
    grid.innerHTML = list.map(card).join("");
    $("#unit-empty").hidden = list.length > 0;
    refresh();
  }

  // Unit filters
  $$("[data-unit-filter]").forEach((btn) => btn.addEventListener("click", () => {
    state[btn.dataset.unitFilter] = btn.dataset.value;
    $$(`[data-unit-filter="${btn.dataset.unitFilter}"]`).forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    renderUnits();
  }));

  // Gallery filters
  $$("[data-gallery-filter]").forEach((btn) => btn.addEventListener("click", () => {
    $$("[data-gallery-filter]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    $$(".gallery-item").forEach((it) => { it.hidden = btn.dataset.value !== "all" && it.dataset.cat !== btn.dataset.value; });
  }));

  // Tour form: unit select + min date
  const tourUnit = $("#tour-unit");
  if (tourUnit) {
    UNITS.filter((u) => u.status === "available").forEach((u) =>
      tourUnit.insertAdjacentHTML("beforeend", `<option value="${u.id}" ${bi(u.name.en, u.name.es)}>${u.name.en}</option>`));
  }
  const preselect = new URLSearchParams(location.search).get("unit");
  if (tourUnit && preselect) tourUnit.value = preselect;
  const dateInput = $("#tour-date");
  if (dateInput) dateInput.min = new Date().toISOString().slice(0, 10);

  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-unit]");
    if (link && tourUnit) tourUnit.value = link.dataset.unit;
  });

  // Remember which unit was opened (backup for servers that drop ?unit=)
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href*="departamento.html?unit="]');
    if (!a) return;
    try { sessionStorage.setItem("apache-last-unit", new URL(a.href, location.href).searchParams.get("unit")); } catch (err) { /* ignore */ }
  });

  // Contact details from config (removes the "coming soon" translation attrs when filled)
  $$("[data-contact]").forEach((el) => {
    const v = C[el.dataset.contact];
    if (v) { el.textContent = v; el.removeAttribute("data-en"); el.removeAttribute("data-es"); }
  });
  const mail = $("[data-contact-link]");
  if (mail && C.email) mail.href = "mailto:" + C.email;

  // Forms
  $$("form[data-form]").forEach((form) => form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form.elements.website && form.elements.website.value) return; // honeypot
    const status = $(".form-status", form);
    const say = (en, es, ok) => {
      status.setAttribute("data-en", en); status.setAttribute("data-es", es);
      status.textContent = lang() === "es" ? es : en;
      status.className = "form-status " + (ok ? "is-ok" : "is-error");
    };
    const data = Object.fromEntries(new FormData(form));
    delete data.website;
    data.form = form.dataset.form;
    data.language = lang();
    try {
      if (C.formEndpoint) {
        const r = await fetch(C.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
        if (!r.ok) throw new Error("bad response");
        form.reset();
        say("Thank you! We received your request and will be in touch soon.", "¡Gracias! Recibimos tu solicitud y te contactaremos pronto.", true);
      } else if (C.email) {
        const body = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join("\n");
        window.location.href = `mailto:${C.email}?subject=${encodeURIComponent("Apache River — " + data.form)}&body=${encodeURIComponent(body)}`;
        say("Opening your email app…", "Abriendo tu aplicación de correo…", true);
      } else {
        say("This form is not connected yet. Please contact us directly.", "Este formulario aún no está conectado. Contáctanos directamente.", false);
      }
    } catch (err) {
      say("Something went wrong. Please try again or contact us directly.", "Algo salió mal. Inténtalo de nuevo o contáctanos directamente.", false);
    }
  }));

  window.ApacheUI = { card, availability, STATUS, bi, ICON };
  renderUnits();
})();