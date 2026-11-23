// Apache River — Capa de datos (versión Supabase)
// Mantiene los datos en memoria para que la interfaz sea inmediata y sincroniza con Supabase.
window.Store = (function () {
  const T = ["units", "gallery", "promos", "tenants", "inquiries", "tours"];
  let S = { units: [], gallery: [], promos: [], tenants: [], inquiries: [], tours: [], site: {} };
  let sb = null, subs = [];
  const emit = () => subs.forEach((f) => f());
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
  const toObj = (r) => ({ ...r.data, _id: r.id, created: (r.data && r.data.created) || r.created_at });
  const row = (o) => { const d = { ...o }; delete d._id; return { id: o._id, data: d }; };

  const fail = async (e) => {
    console.error(e);
    alert("No se pudo guardar en el servidor: " + ((e && e.message) || e));
    try { await api.load(); emit(); } catch (x) { /* sin conexión */ }
  };
  const run = (p) => Promise.resolve(p).then((r) => { if (r && r.error) throw r.error; return r; }).catch(fail);

  const api = {
    async init() {
      const c = window.SUPABASE_CONFIG;
      if (!c || !c.url || c.url.includes("TU-PROYECTO") || !window.supabase) throw new Error("config");
      sb = window.supabase.createClient(c.url, c.anonKey);
    },
    // --- Sesión ---
    async session() { return (await sb.auth.getSession()).data.session; },
    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signOut() { await sb.auth.signOut(); },
    // --- Carga ---
    async load() {
      const names = [...T, "site"];
      const res = await Promise.all(names.map((t) => sb.from(t).select("id,data,created_at")));
      res.forEach((r, i) => {
        if (r.error) throw r.error;
        if (names[i] === "site") S.site = (r.data.find((x) => x.id === "main") || {}).data || {};
        else S[names[i]] = r.data.map(toObj);
      });
    },
    onChange(f) { subs.push(f); },
    list(c) { return S[c] || []; },
    find(c, id) { return (S[c] || []).find((x) => x._id === id); },
    save(c, obj) {
      const o = { ...obj };
      o._id = c === "units" ? o.id : (o._id || uid());
      if (!o.created) o.created = new Date().toISOString();
      const i = S[c].findIndex((x) => x._id === o._id);
      i >= 0 ? (S[c][i] = o) : S[c].push(o);
      emit();
      run(sb.from(c).upsert(row(o)));
      return o;
    },
    patch(c, id, changes) { const o = this.find(c, id); if (o) this.save(c, { ...o, ...changes }); },
    remove(c, id) {
      S[c] = S[c].filter((x) => x._id !== id); emit();
      run(sb.from(c).delete().eq("id", id));
    },
    site() { return S.site || {}; },
    setSite(v) { S.site = v; emit(); run(sb.from("site").upsert({ id: "main", data: v })); },
    // --- Fotos (Supabase Storage, bucket "photos") ---
    async uploadImage(blob) {
      const path = `${new Date().getFullYear()}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
      const { error } = await sb.storage.from("photos").upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
      if (error) throw error;
      return sb.storage.from("photos").getPublicUrl(path).data.publicUrl;
    },
    // --- Respaldo y publicación ---
    exportJSON() { return JSON.stringify(S, null, 2); },
    async importJSON(txt) {
      const d = JSON.parse(txt);
      for (const t of T) for (const o of d[t] || []) { o._id = o._id || uid(); await run(sb.from(t).upsert(row(o))); }
      if (d.site) await run(sb.from("site").upsert({ id: "main", data: d.site }));
      await api.load(); emit();
    },
    // Importa los departamentos de muestra de js/data.js (solo si existen)
    async seedFromDataJs() {
      const C = window.APACHE_CONFIG || {};
      for (const u of window.APACHE_UNITS || []) {
        api.save("units", {
          id: u.id, status: u.status, nameEn: u.name.en, nameEs: u.name.es, beds: u.beds, baths: u.baths, sqft: u.sqft,
          price: u.price, deposit: u.deposit, lease: u.lease ? u.lease.en : "", leaseEs: u.lease ? u.lease.es : "",
          availableFrom: u.availableFrom || "", descEn: u.description.en, descEs: u.description.es,
          featEn: (u.features || []).map((f) => f.en).join("\n"), featEs: (u.features || []).map((f) => f.es).join("\n"),
          images: u.images || [u.image]
        });
      }
      if (!Object.keys(S.site).length) api.setSite({ phone: C.phone || "", email: C.email || "", address: C.address || "", hours: C.hours || "", formEndpoint: "" });
    },
    // Genera js/data.js con el mismo formato que usa el sitio público
    exportDataJs() {
      const lines = (t) => (t || "").split("\n").map((x) => x.trim()).filter(Boolean);
      const units = S.units.map((u) => {
        const fe = lines(u.featEn), fs = lines(u.featEs);
        return {
          id: u.id, name: { en: u.nameEn || "", es: u.nameEs || u.nameEn || "" }, beds: u.beds || 0, baths: u.baths || 0,
          sqft: u.sqft || null, price: u.price || null, deposit: u.deposit || null,
          lease: u.lease ? { en: u.lease, es: u.leaseEs || u.lease } : null,
          status: u.status || "available", availableFrom: u.availableFrom || null,
          image: (u.images || [])[0] || "", images: u.images || [],
          description: { en: u.descEn || "", es: u.descEs || u.descEn || "" },
          features: fe.map((x, i) => ({ en: x, es: fs[i] || x }))
        };
      });
      const s = S.site || {};
      const cfg = { phone: s.phone || "", email: s.email || "", address: s.address || "", hours: s.hours || "", formEndpoint: "" };
      const promos = S.promos.filter((p) => p.active !== "0").map((p) => ({ title: { en: p.titleEn || "", es: p.titleEs || "" }, unit: p.unit || "", deposit: p.deposit || null, until: p.until || "" }));
      return `/* Generado por el panel de administración — ${new Date().toISOString().slice(0, 10)} */\n` +
        `window.APACHE_CONFIG = ${JSON.stringify(cfg, null, 2)};\n\n` +
        `window.APACHE_UNITS = ${JSON.stringify(units, null, 2)};\n\n` +
        `window.APACHE_PROMOS = ${JSON.stringify(promos, null, 2)};\n`;
    }
  };
  return api;
})();
