// Apache River — Lee departamentos y datos de contacto en vivo desde Supabase.
// Se carga DESPUÉS de data.js y ANTES de app.js. Si Supabase no responde,
// el sitio sigue funcionando con los datos de data.js.
(function () {
  const SB = window.SUPABASE_CONFIG;
  if (!SB || !SB.url || SB.url.includes("TU-PROYECTO")) return;

  function get(table) {
    try {
      const x = new XMLHttpRequest();
      x.open("GET", `${SB.url}/rest/v1/${table}?select=id,data&order=id.asc`, false); // síncrono: app.js necesita los datos al arrancar
      x.setRequestHeader("apikey", SB.anonKey);
      x.setRequestHeader("Authorization", "Bearer " + SB.anonKey);
      x.send();
      return x.status === 200 ? JSON.parse(x.responseText) : null;
    } catch (e) { return null; }
  }
  const lines = (t) => (t || "").split("\n").map((s) => s.trim()).filter(Boolean);

  const rows = get("units");
  if (rows) {
    window.APACHE_UNITS = rows.map(({ data: u }) => {
      const id = u.id, fe = lines(u.featEn), fs = lines(u.featEs), imgs = u.images || [];
      return {
        id, name: { en: u.nameEn || id, es: u.nameEs || u.nameEn || id },
        beds: u.beds || 0, baths: u.baths || 0, sqft: u.sqft || null, price: u.price || null, deposit: u.deposit || null,
        lease: u.lease ? { en: u.lease, es: u.leaseEs || u.lease } : null,
        status: u.status || "available", availableFrom: u.availableFrom || null,
        image: imgs[0] || "", images: imgs,
        description: { en: u.descEn || "", es: u.descEs || u.descEn || "" },
        features: fe.map((x, i) => ({ en: x, es: fs[i] || x }))
      };
    });
  }

  const site = get("site");
  const main = site && site.find((r) => r.id === "main");
  if (main) {
    const s = main.data, C = (window.APACHE_CONFIG = window.APACHE_CONFIG || {});
    ["phone", "email", "address", "hours"].forEach((k) => { if (s[k]) C[k] = s[k]; });
  }
})();
