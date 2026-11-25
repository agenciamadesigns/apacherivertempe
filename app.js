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
    maintenance: { en: "Under maintenance", es: "En mantenimiento" },
  };
  const state = { status: "available", beds: "all" };

  function availability(u) {
    if (u.status !== "available") return ["", ""];
    if (!u.availableFrom || u.availableFrom === "now")
      return ["Available now", "Disponible ahora"];
    const d = new Date(u.availableFrom + "T00:00:00");
    const fmt = (l) =>
      d.toLocaleDateString(l, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    return ["Available " + fmt("en-US"), "Disponible desde " + fmt("es-MX")];
  }

  const ICON = {
    bed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18V6M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/></svg>',
    bath: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16v2a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-2zM6 12V6.5a2 2 0 0 1 3.4-1.4M8 18l-1 2M16 18l1 2"/></svg>',
    area: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
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
    grid.className = "plan-groups";
    const visible = UNITS.filter((u) => u.status !== "maintenance");
    const list = visible.filter(
      (u) =>
        (state.status === "all" || u.status === state.status) &&
        (state.beds === "all" || String(u.beds) === state.beds),
    );
    const plans = [...new Set(visible.map((u) => u.plan || ""))].sort(
      (a, b) =>
        (a === "") - (b === "") ||
        a.localeCompare(b, undefined, { numeric: true }),
    );
    const grouped = plans.length > 1 || plans[0] !== "";

    grid.innerHTML = plans
      .map((p) => {
        const all = visible.filter((u) => (u.plan || "") === p);
        const shown = list.filter((u) => (u.plan || "") === p);
        if (!shown.length) return "";
        const cards = `<div class="unit-grid">${shown.map(card).join("")}</div>`;
        if (!grouped) return cards;

        const f = all[0],
          same = all.every((u) => u.beds === f.beds && u.baths === f.baths);
        const b = all.find((u) => u.building);
        const en = [`${all.length} ${all.length > 1 ? "homes" : "home"}`];
        const es = [
          `${all.length} ${all.length > 1 ? "departamentos" : "departamento"}`,
        ];
        if (b) {
          en.push("Building " + b.building);
          es.push("Edificio " + b.building);
        }
        if (same && f.beds) {
          en.push(
            `${f.beds} ${f.beds > 1 ? "bedrooms" : "bedroom"} · ${f.baths} ${f.baths > 1 ? "bathrooms" : "bathroom"}`,
          );
          es.push(
            `${f.beds} ${f.beds > 1 ? "habitaciones" : "habitación"} · ${f.baths} ${f.baths > 1 ? "baños" : "baño"}`,
          );
        }
        const tEn = p ? "Plan " + p : "More homes",
          tEs = p ? "Plano " + p : "Más departamentos";
        return `<section class="plan-group">
        <div class="plan-group-head">
          <h2 class="plan-group-title" ${bi(tEn, tEs)}>${tEn}</h2>
          <p class="plan-group-meta" ${bi(en.join(" · "), es.join(" · "))}>${en.join(" · ")}</p>
        </div>${cards}</section>`;
      })
      .join("");

    $("#unit-empty").hidden = list.length > 0;
    refresh();
  }

  // Unit filters
  $$("[data-unit-filter]").forEach((btn) =>
    btn.addEventListener("click", () => {
      state[btn.dataset.unitFilter] = btn.dataset.value;
      $$(`[data-unit-filter="${btn.dataset.unitFilter}"]`).forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      renderUnits();
    }),
  );

  // Gallery filters
  $$("[data-gallery-filter]").forEach((btn) =>
    btn.addEventListener("click", () => {
      $$("[data-gallery-filter]").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      $$(".gallery-item").forEach((it) => {
        it.hidden =
          btn.dataset.value !== "all" && it.dataset.cat !== btn.dataset.value;
      });
    }),
  );

  // Tour form: unit select + min date
  const tourUnit = $("#tour-unit");
  if (tourUnit) {
    $$("option[data-unit-opt]", tourUnit).forEach((o) => o.remove());   // evita duplicados si el script corre dos veces
    const seen = new Set();
    UNITS.filter((u) => u.status === "available" && !seen.has(u.id) && seen.add(u.id)).forEach((u) =>
      tourUnit.insertAdjacentHTML("beforeend", `<option data-unit-opt value="${u.id}" ${bi(u.name.en, u.name.es)}>${u.name.en}</option>`));
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
    try {
      sessionStorage.setItem(
        "apache-last-unit",
        new URL(a.href, location.href).searchParams.get("unit"),
      );
    } catch (err) {
      /* ignore */
    }
  });

  // Contact details from config (removes the "coming soon" translation attrs when filled)
  $$("[data-contact]").forEach((el) => {
    const v = C[el.dataset.contact];
    if (v) {
      el.textContent = v;
      el.removeAttribute("data-en");
      el.removeAttribute("data-es");
    }
  });
  const mail = $("[data-contact-link]");
  if (mail && C.email) mail.href = "mailto:" + C.email;

  // Forms
  $$("form[data-form]").forEach((form) =>
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (form.elements.website && form.elements.website.value) return; // honeypot
      const status = $(".form-status", form);
      const say = (en, es, ok) => {
        status.setAttribute("data-en", en);
        status.setAttribute("data-es", es);
        status.textContent = lang() === "es" ? es : en;
        status.className = "form-status " + (ok ? "is-ok" : "is-error");
      };
      const data = Object.fromEntries(new FormData(form));
      delete data.website;
      data.form = form.dataset.form;
      data.language = lang();
      try {
        const SB = window.SUPABASE_CONFIG;
        if (SB) {
          const isTour = form.dataset.form === "tour";
          const id = crypto.randomUUID();
          const row = isTour
            ? {
                name: data.name,
                email: data.email,
                phone: data.phone || "",
                unit: data.unit || "",
                date: data.date,
                time: data.time,
                notes: data.message || "",
                status: "pending",
              }
            : {
                name: data.name,
                email: data.email,
                phone: data.phone || "",
                topic: data.topic || "",
                message: data.message || "",
                status: "new",
              };
          row.language = data.language;
          row.created = new Date().toISOString();
          row._id = id;
          const r = await fetch(
            `${SB.url}/rest/v1/${isTour ? "tours" : "inquiries"}`,
            {
              method: "POST",
              headers: {
                apikey: SB.anonKey,
                Authorization: "Bearer " + SB.anonKey,
                "Content-Type": "application/json",
                Prefer: "return=minimal",
              },
              body: JSON.stringify({ id, data: row }),
            },
          );
          if (!r.ok) throw new Error("bad response");
          form.reset();
          say(
            "Thank you! We received your request and will be in touch soon.",
            "¡Gracias! Recibimos tu solicitud y te contactaremos pronto.",
            true,
          );
        } else if (C.formEndpoint) {
          const r = await fetch(C.formEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(data),
          });
          if (!r.ok) throw new Error("bad response");
          form.reset();
          say(
            "Thank you! We received your request and will be in touch soon.",
            "¡Gracias! Recibimos tu solicitud y te contactaremos pronto.",
            true,
          );
        } else if (C.email) {
          const body = Object.entries(data)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n");
          window.location.href = `mailto:${C.email}?subject=${encodeURIComponent("Apache River — " + data.form)}&body=${encodeURIComponent(body)}`;
          say(
            "Opening your email app…",
            "Abriendo tu aplicación de correo…",
            true,
          );
        } else {
          say(
            "This form is not connected yet. Please contact us directly.",
            "Este formulario aún no está conectado. Contáctanos directamente.",
            false,
          );
        }
      } catch (err) {
        say(
          "Something went wrong. Please try again or contact us directly.",
          "Algo salió mal. Inténtalo de nuevo o contáctanos directamente.",
          false,
        );
      }
    }),
  );

  window.ApacheUI = { card, availability, STATUS, bi, ICON };
  renderUnits();
})();
