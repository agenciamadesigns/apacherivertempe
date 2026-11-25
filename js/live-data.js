// Apache River — Lee departamentos y datos de contacto en vivo desde Supabase.
// Se carga DESPUÉS de data.js y ANTES de app.js. Si Supabase no responde,
// el sitio sigue funcionando con los datos de data.js.
(function () {
  const SB = window.SUPABASE_CONFIG;
  if (!SB || !SB.url || SB.url.includes("TU-PROYECTO")) return;

  function get(table) {
    try {
      const x = new XMLHttpRequest();
      x.open(
        "GET",
        `${SB.url}/rest/v1/${table}?select=id,data&order=id.asc`,
        false,
      ); // síncrono: app.js necesita los datos al arrancar
      x.setRequestHeader("apikey", SB.anonKey);
      x.setRequestHeader("Authorization", "Bearer " + SB.anonKey);
      x.send();
      return x.status === 200 ? JSON.parse(x.responseText) : null;
    } catch (e) {
      return null;
    }
  }
  const lines = (t) =>
    (t || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

  const nm = (u) => {
    const b = u.beds || 0,
      id = u.id;
    const en0 =
      (u.nameEn || "").split(", ")[0] ||
      (b === 1 ? "One-bedroom" : b === 2 ? "Two-bedroom" : b + "-bedroom");
    const es0 =
      (u.nameEs || u.nameEn || "").split(", ")[0] ||
      (b === 1
        ? "Una habitación"
        : b === 2
          ? "Dos habitaciones"
          : b + " habitaciones");
    return u.plan
      ? {
          en: `${en0}, Unit ${id} · Plan ${u.plan}`,
          es: `${es0}, Unidad ${id} · Plano ${u.plan}`,
        }
      : { en: u.nameEn || id, es: u.nameEs || u.nameEn || id };
  };

  const rows = get("units");
  if (rows) {
    window.APACHE_UNITS = rows.map(({ data: u }) => {
      const id = u.id,
        fe = lines(u.featEn),
        fs = lines(u.featEs),
        imgs = u.images || [];
      return {
        id,
        name: nm(u),
        plan: u.plan || "",
        building: u.building || "",
        beds: u.beds || 0,
        baths: u.baths || 0,
        sqft: u.sqft || null,
        price: u.price || null,
        deposit: u.deposit || null,
        lease: u.lease ? { en: u.lease, es: u.leaseEs || u.lease } : null,
        status: u.status || "available",
        availableFrom: u.availableFrom || null,
        image: imgs[0] || "",
        images: imgs,
        description: { en: u.descEn || "", es: u.descEs || u.descEn || "" },
        features: fe.map((x, i) => ({ en: x, es: fs[i] || x })),
      };
    });
  }

  const site = get("site");
  const main = site && site.find((r) => r.id === "main");
  if (main) {
    const s = main.data,
      C = (window.APACHE_CONFIG = window.APACHE_CONFIG || {});
    ["phone", "email", "address", "hours"].forEach((k) => {
      if (s[k]) C[k] = s[k];
    });
    C.tour = Object.assign(
      {},
      C.tour,
      Object.fromEntries(
        [
          ["days", s.tourDays],
          ["start", s.tourStart],
          ["end", s.tourEnd],
          ["step", s.tourStep],
          ["tz", s.tourTz],
        ].filter(([, v]) => v),
      ),
    );
  }
  // Galería: si hay fotos en el panel, reemplazan las de ejemplo escritas en el HTML
  const gal = get("gallery"),
    grid = document.querySelector(".gallery-grid");
  if (gal && gal.length && grid) {
    const esc = (t) =>
      String(t ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      );
    const items = gal
      .map((r) => r.data)
      .filter((g) => (g.images || [])[0])
      .sort((a, b) =>
        String(a.created || "").localeCompare(String(b.created || "")),
      );
    if (items.length) {
      grid.innerHTML = items
        .map((g) => {
          const en = g.capEn || g.capEs || "",
            es = g.capEs || g.capEn || "";
          return `<figure class="gallery-item" data-cat="${esc(g.cat || "interior")}"><div class="image-placeholder" role="img" aria-label="${esc(en)}" style="background-image:url('${esc(g.images[0])}')"></div>${en ? `<figcaption data-en="${esc(en)}" data-es="${esc(es)}">${esc(en)}</figcaption>` : ""}</figure>`;
        })
        .join("");
    }
  }
  // Contenido editable desde el panel. Si un campo está vacío, se conserva el original.
  if (main) {
    const s = main.data,
      q = (sel, root = document) => root.querySelector(sel);
    const esc = (t) =>
      String(t ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      );
    const html = (t) => esc(t).replace(/\n/g, "<br>");
    const text = (el, en, es) => {
      if (!el || !(en || es)) return;
      el.setAttribute("data-en", html(en || es));
      el.setAttribute("data-es", html(es || en));
      el.innerHTML = html(en || es);
    };
    const bg = (el, url, overlay) => {
      if (el && url)
        el.style.backgroundImage =
          (overlay ? overlay + ", " : "") + `url("${url}")`;
    };

    bg(q(".hero"), s.heroImage);
    text(q("#hero-title"), s.heroEn, s.heroEs);

    bg(
      q(".intro-media"),
      s.welcomeImage,
      "linear-gradient(0deg, rgb(207 220 222 / 15%), transparent)",
    );
    text(q(".intro-text .eyebrow"), s.welcomeEyebrowEn, s.welcomeEyebrowEs);
    text(q("#about-title"), s.welcomeTitleEn, s.welcomeTitleEs);
    text(q(".intro-copy p"), s.welcomeTextEn, s.welcomeTextEs);

    const am = q("#amenities");
    if (am) {
      const head = q(".section-heading", am); // en la página Comunidad el encabezado es el banner de la página
      text(
        head ? q(".eyebrow", head) : q(".page-hero .eyebrow"),
        s.detailsEyebrowEn,
        s.detailsEyebrowEs,
      );
      text(
        head ? q("#amenities-title") : q(".page-hero h1"),
        s.detailsTitleEn,
        s.detailsTitleEs,
      );
      text(
        head ? q(".section-heading > p", am) : q(".page-hero-copy"),
        s.detailsTextEn,
        s.detailsTextEs,
      );
      am.querySelectorAll(".amenity-card").forEach((card, i) => {
        const n = i + 1;
        bg(q(".image-placeholder", card), s["amenity" + n + "Image"]);
        text(
          q("h3", card),
          s["amenity" + n + "TitleEn"],
          s["amenity" + n + "TitleEs"],
        );
        text(
          q(".amenity-label p", card),
          s["amenity" + n + "TextEn"],
          s["amenity" + n + "TextEs"],
        );
      });
    }
    text(q(".footer-brand p"), s.tagEn, s.tagEs);
  }
})();
