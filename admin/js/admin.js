// Apache River — Interfaz del panel
(function () {
  const { esc, money, pill, lists } = AdminUtil;
  const $ = (s, r = document) => r.querySelector(s);
  const SEC = ADMIN_SECTIONS;
  const state = { tab: location.hash.slice(1) || "dashboard", q: "", f: "" };
  const view = $("#view"),
    title = $("#page-title"),
    actions = $("#top-actions");

  const ICON = (d) =>
    `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => (t.hidden = true), 2600);
  }
  const download = (name, text, type = "text/plain") => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([text], { type: type + ";charset=utf-8" }),
    );
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  const badgeCount = (key) =>
    key === "new"
      ? Store.list("inquiries").filter((d) => d.status === "new").length
      : key === "pending"
        ? Store.list("tours").filter((d) => d.status === "pending").length
        : 0;

  /* ---------- Menú lateral ---------- */
  function renderNav() {
    $("#side-nav").innerHTML = ADMIN_MENU.map(
      (g) =>
        `<p class="nav-group">${g.group}</p>` +
        g.items
          .map((i) => {
            const n = i.badge ? badgeCount(i.badge) : 0;
            return `<button class="nav-item ${state.tab === i.id ? "on" : ""}" data-go="${i.id}">${ICON(i.icon)}<span>${i.label}</span>${n ? `<span class="badge">${n}</span>` : ""}</button>`;
          })
          .join(""),
    ).join("");
  }
  function go(id) {
    state.tab = id;
    state.q = "";
    state.f = "";
    location.hash = id;
    document.body.classList.remove("menu-open");
    render();
  }
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-go]");
    if (g) go(g.dataset.go);
  });
  $("#burger").onclick = () => document.body.classList.toggle("menu-open");
  $("#scrim").onclick = () => document.body.classList.remove("menu-open");

  /* ---------- Resumen ---------- */
  function renderDashboard() {
    title.textContent = "Resumen";
    actions.innerHTML = "";
    const U = Store.list("units"),
      cnt = (s) => U.filter((u) => u.status === s).length;
    const stat = (n, l, go) =>
      `<button class="stat" data-go="${go}"><b>${n}</b><span>${l}</span></button>`;
    const up = Store.list("tours")
      .filter((t) => t.status === "pending" || t.status === "confirmed")
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
      .slice(0, 5);
    const inq = Store.list("inquiries")
      .slice()
      .sort((a, b) => (b.created || "").localeCompare(a.created || ""))
      .slice(0, 5);
    const bd = daysSince(Store.site().lastBackup);
    const banner =
      bd === null || bd > 30
        ? `<div class="note backup-note"><span>${bd === null ? "Aún no has descargado ningún respaldo." : "Hace " + bd + " días que no descargas un respaldo."} Hazlo ahora para proteger tu información.</span><button class="btn btn-s btn-p" id="bk-now">Descargar respaldo</button></div>`
        : "";
    view.innerHTML =
      banner +
      `<div class="stats">
      ${stat(cnt("available"), "Disponibles", "units")}${stat(cnt("reserved"), "Reservados", "units")}
      ${stat(cnt("rented"), "Rentados", "units")}${stat(cnt("maintenance"), "En mantenimiento", "units")}
      ${stat(Store.list("tenants").length, "Inquilinos", "tenants")}
      ${stat(badgeCount("new"), "Solicitudes nuevas", "inquiries")}${stat(badgeCount("pending"), "Visitas por confirmar", "tours")}</div>
      <div class="grid2">
        <div class="card"><h2>Próximas visitas</h2>${up.length ? `<ul class="mini">${up.map((t) => `<li><span><b>${esc(t.name || "")}</b><br><small>${esc(t.date || "—")} · ${AdminUtil.timeLabel(t.time)}${t.unit ? " · " + esc(t.unit) : ""}</small></span>${pill(lists.tourStatus, t.status)}</li>`).join("")}</ul>` : `<p class="empty">Sin visitas pendientes.</p>`}</div>
        <div class="card"><h2>Últimas solicitudes</h2>${inq.length ? `<ul class="mini">${inq.map((t) => `<li><span><b>${esc(t.name || "")}</b><br><small>${esc((t.message || t.email || "").slice(0, 50))}</small></span>${pill(lists.inquiryStatus, t.status)}</li>`).join("")}</ul>` : `<p class="empty">Sin solicitudes.</p>`}</div>
      </div>`;
  }

  /* ---------- Listados (CRUD genérico) ---------- */
  function renderList() {
    const s = SEC[state.tab],
      all = Store.list(state.tab);
    title.textContent = s.title;
    actions.innerHTML = `<button class="btn btn-p" id="add">+ ${state.tab === "inquiries" || state.tab === "tours" ? "Registrar" : "Agregar"} ${s.singular}</button>`;
    let rows = all.slice();
    if (state.q) {
      const q = state.q.toLowerCase();
      rows = rows.filter((d) =>
        s.search.some((k) =>
          String(d[k] ?? "")
            .toLowerCase()
            .includes(q),
        ),
      );
    }
    if (state.f && s.filter)
      rows = rows.filter((d) => String(d[s.filter.key]) === state.f);
    if (s.sort)
      rows.sort((a, b) =>
        String(
          s.sort === "created" ? b[s.sort] : a[s.sort] || "",
        ).localeCompare(
          String(s.sort === "created" ? a[s.sort] : b[s.sort] || ""),
        ),
      );
    const manual = state.tab === "inquiries" || state.tab === "tours";
    view.innerHTML = `${manual ? `<div class="note">Los formularios del sitio todavía no llegan automáticamente a este panel (requiere un servidor). Por ahora registra aquí lo que recibas por correo o teléfono.</div>` : ""}
      <div class="toolbar"><input id="q" type="search" placeholder="Buscar…" value="${esc(state.q)}">
      ${s.filter ? `<select id="f"><option value="">${s.filter.label}</option>${s.filter.list.map((o) => `<option value="${o[0]}" ${state.f === o[0] ? "selected" : ""}>${o[1]}</option>`).join("")}</select>` : ""}</div>
      <div class="tablewrap">${
        rows.length
          ? `<table><thead><tr>${s.cols.map((c) => `<th>${c[0]}</th>`).join("")}${s.status ? "<th>Estado</th>" : ""}<th></th></tr></thead><tbody>
      ${rows
        .map(
          (
            d,
          ) => `<tr>${s.cols.map((c) => `<td>${c[1](d)}</td>`).join("")}${s.status ? `<td><select data-st="${esc(d._id)}">${s.statusList.map((o) => `<option value="${o[0]}" ${String(d[s.status]) === o[0] ? "selected" : ""}>${o[1]}</option>`).join("")}</select></td>` : ""}
      <td><div class="row-actions"><button class="btn btn-s" data-edit="${esc(d._id)}">Editar</button><button class="btn btn-s btn-d" data-del="${esc(d._id)}">Eliminar</button></div></td></tr>`,
        )
        .join("")}</tbody></table>`
          : `<p class="empty">${all.length ? "Ningún resultado." : "Aún no hay registros."}</p>`
      }</div>`;
    $("#add").onclick = () => openForm(null);
    $("#q").oninput = (e) => {
      state.q = e.target.value;
      const p = e.target.selectionStart;
      renderList();
      const i = $("#q");
      i.focus();
      i.setSelectionRange(p, p);
    };
    if ($("#f"))
      $("#f").onchange = (e) => {
        state.f = e.target.value;
        renderList();
      };
    view
      .querySelectorAll("[data-edit]")
      .forEach(
        (b) =>
          (b.onclick = () => openForm(Store.find(state.tab, b.dataset.edit))),
      );
    view.querySelectorAll("[data-del]").forEach(
      (b) =>
        (b.onclick = () => {
          if (confirm("¿Eliminar este registro? No se puede deshacer.")) {
            Store.remove(state.tab, b.dataset.del);
            toast("Eliminado");
          }
        }),
    );
    view.querySelectorAll("[data-st]").forEach(
      (x) =>
        (x.onchange = () => {
          Store.patch(state.tab, x.dataset.st, { [s.status]: x.value });
          toast("Estado actualizado");
        }),
    );
  }

  /* ---------- Formularios ---------- */
  function fieldHtml([k, l, t, o], v) {
    if (k === "§") return `<p class="fsec">${l}</p>`;
    if (t === "images")
      return `<div class="w"><label class="f">${l}</label><div class="imgs" id="imgs"></div>
      <input type="file" id="file" accept="image/*" multiple>
      <div style="display:flex;gap:8px;margin-top:8px"><input id="img-url" placeholder="…o pega la URL de una imagen"><button type="button" class="btn" id="img-add">Agregar URL</button></div></div>`;
    if (t === "image")
      return `<div class="w imgfield" data-key="${k}"><label class="f">${l}</label><div class="imgfield-row"><div class="thumb big"></div><div class="imgfield-ctl"><input type="hidden" name="${k}" value="${esc(v ?? "")}"><input type="file" accept="image/*" data-file><div><button type="button" class="btn btn-s" data-clear>Usar la foto original</button> <small data-st></small></div></div></div></div>`;
    const w = t === "area" ? "w" : "";
    if (t === "select")
      return `<label class="f ${w}">${l}<select name="${k}">${o.map((x) => `<option value="${x[0]}" ${String(v ?? o[0][0]) === x[0] ? "selected" : ""}>${x[1]}</option>`).join("")}</select></label>`;
    if (t === "area")
      return `<label class="f w">${l}<textarea name="${k}" rows="3">${esc(v ?? "")}</textarea></label>`;
    return `<label class="f">${l}<input name="${k}" type="${t || "text"}" value="${esc(v ?? "")}"></label>`;
  }
  // Reduce las fotos para que el panel no se vuelva pesado
  function resize(file, max = 1400) {
    return new Promise((res, rej) => {
      const img = new Image(),
        r = new FileReader();
      r.onload = () => {
        img.src = r.result;
      };
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height)),
          c = document.createElement("canvas");
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(
          (b) => (b ? res(b) : rej(new Error("blob"))),
          "image/jpeg",
          0.8,
        );
      };
      img.onerror = rej;
      r.readAsDataURL(file);
    });
  }
  function openForm(d) {
    const key = state.tab,
      s = SEC[key],
      cur = { ...(d || {}) };
    let imgs = [...(cur.images || [])];
    const single = (s.fields.find((f) => f[2] === "images") || [])[3];
    const el = document.createElement("div");
    el.className = "modal";
    el.innerHTML = `<form><h2>${d ? "Editar" : "Agregar"} ${s.singular}</h2><div class="fgrid">${s.fields.map((f) => fieldHtml(f, cur[f[0]])).join("")}</div>
      <div class="form-actions"><button type="button" class="btn" id="cancel">Cancelar</button><button class="btn btn-p">Guardar</button></div></form>`;
    document.body.appendChild(el);
    const paint = () => {
      const c = $("#imgs", el);
      if (!c) return;
      c.innerHTML = imgs
        .map(
          (u, i) =>
            `<div><div class="thumb" style="background-image:url('${esc(u)}')"></div><button type="button" class="rm" data-r="${i}" aria-label="Quitar">×</button>${i > 0 ? `<button type="button" class="mv" data-m="${i}" aria-label="Mover al inicio">↑</button>` : ""}</div>`,
        )
        .join("");
      c.querySelectorAll("[data-r]").forEach(
        (b) =>
          (b.onclick = () => {
            imgs.splice(+b.dataset.r, 1);
            paint();
          }),
      );
      c.querySelectorAll("[data-m]").forEach(
        (b) =>
          (b.onclick = () => {
            const i = +b.dataset.m;
            imgs.unshift(imgs.splice(i, 1)[0]);
            paint();
          }),
      );
    };
    paint();
    const add = (u) => {
      single ? (imgs = [u]) : imgs.push(u);
      paint();
    };
    if ($("#file", el))
      $("#file", el).onchange = async (e) => {
        for (const f of e.target.files) {
          try {
            toast("Subiendo " + f.name + "…");
            add(await Store.uploadImage(await resize(f)));
          } catch (x) {
            toast("No se pudo subir " + f.name);
          }
        }
        e.target.value = "";
      };
    if ($("#img-add", el))
      $("#img-add", el).onclick = () => {
        const i = $("#img-url", el);
        if (i.value.trim()) {
          add(i.value.trim());
          i.value = "";
        }
      };
    $("#cancel", el).onclick = () => el.remove();
    $("form", el).onsubmit = (e) => {
      e.preventDefault();
      const o = { ...cur };
      s.fields.forEach(([k, , t]) => {
        if (k === "§") return;
        if (t === "images") {
          o.images = imgs;
          return;
        }
        const v = $(`[name="${k}"]`, el).value;
        o[k] = t === "number" ? (v === "" ? null : Number(v)) : v.trim();
      });
      if (key === "units") {
        o.id = (o.id || "").replace(/[^\w-]/g, "");
        if (!o.id) return toast("El ID es obligatorio");
        if (!d && Store.find("units", o.id))
          return toast("Ya existe un departamento con ese ID");
      }
      el.remove();
      Store.save(key, o);
      toast("Guardado");
    };
  }

  /* ---------- Contenido del sitio ---------- */
  function renderSite() {
    title.textContent = "Contenido del sitio";
    actions.innerHTML = "";
    const v = Store.site();
    view.innerHTML = `<div class="note">Lo que cambies aquí se ve en el sitio al guardar. Si dejas una foto vacía, el sitio usa la original. Recuerda pulsar <b>Guardar cambios</b> al terminar.</div>
      <form class="card" id="site-form"><div class="fgrid">${ADMIN_SITE_FIELDS.map(([k, l, t, w]) => fieldHtml([k, l, t || "text", w], v[k])).join("")}</div>
      <div class="form-actions"><button class="btn btn-p">Guardar cambios</button></div></form>`;
    view.querySelectorAll(".imgfield").forEach((box) => {
      const key = box.dataset.key,
        hid = $("input[type=hidden]", box),
        th = $(".thumb", box),
        st = $("[data-st]", box);
      const paint = () => {
        th.style.backgroundImage = hid.value ? `url("${hid.value}")` : "";
        th.classList.toggle("is-empty", !hid.value);
        st.textContent = hid.value
          ? "Foto personalizada."
          : "Se usa la foto original del sitio.";
      };
      paint();
      $("[data-file]", box).onchange = async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        st.textContent = "Subiendo…";
        try {
          hid.value = await Store.uploadImage(
            await resize(f, key === "heroImage" ? 2200 : 1400),
          );
          paint();
        } catch (x) {
          st.textContent = "No se pudo subir la foto.";
        }
        e.target.value = "";
      };
      $("[data-clear]", box).onclick = () => {
        hid.value = "";
        paint();
      };
    });
    $("#site-form").onsubmit = (e) => {
      e.preventDefault();
      Store.setSite({
        ...Store.site(),
        ...Object.fromEntries(new FormData(e.target)),
      });
      toast("Contenido guardado");
    };
  }

  /* ---------- Respaldo ---------- */
  const daysSince = (iso) =>
    iso ? Math.floor((Date.now() - new Date(iso)) / 864e5) : null;
  function downloadBackup() {
    download(
      "apache-river-respaldo-" +
        new Date().toISOString().slice(0, 10) +
        ".json",
      Store.exportJSON(),
      "application/json",
    );
    Store.setSite({ ...Store.site(), lastBackup: new Date().toISOString() });
    toast("Respaldo descargado. Guárdalo en un lugar seguro.");
  }
  document.addEventListener("click", (e) => {
    if (e.target.id === "bk-now") downloadBackup();
  });

  function renderBackup() {
    title.textContent = "Respaldo";
    actions.innerHTML = "";
    const last = Store.site().lastBackup,
      d = daysSince(last);
    const when = last
      ? `${new Date(last).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })} (${d === 0 ? "hoy" : "hace " + d + (d === 1 ? " día" : " días")})`
      : "todavía no has descargado ninguno";
    const hasSample = window.APACHE_UNITS && !Store.list("units").length;
    view.innerHTML = `<div class="card backup-main">
        <h2>Copia de seguridad</h2>
        <p>Es un archivo con toda la información del panel: departamentos, inquilinos, visitas, solicitudes, galería y textos del sitio. Si algo se borra por error, se puede recuperar con él.</p>
        <p class="backup-when ${last && d <= 30 ? "ok" : "warn"}">Último respaldo: <b>${when}</b></p>
        <button class="btn btn-p" id="bk">Descargar respaldo ahora</button>
        <p class="hint">Guárdalo en un lugar seguro, como tu correo, Google Drive o una memoria USB. Recomendamos hacerlo una vez al mes. Las fotos no van dentro del archivo: siguen guardadas en línea.</p>
      </div>
      <details class="card more"><summary>Restaurar un respaldo</summary>
        <p>Usa esto solo si perdiste información. Elige un archivo de respaldo y sus datos se cargarán de nuevo. Los registros que ya existan se actualizan con lo del archivo; lo que hayas agregado después no se borra.</p>
        <button class="btn" id="rs">Elegir archivo de respaldo…</button><input type="file" id="rsf" accept=".json" hidden>
      </details>
      <details class="card more"><summary>Opciones avanzadas</summary>
        <p><b>Archivo data.js.</b> Es una copia de los departamentos y datos de contacto que el sitio usa solo si no logra conectarse a la base de datos. No hace falta en el día a día; conviene generarlo y subirlo al hosting de vez en cuando.</p>
        <button class="btn" id="exp">Descargar data.js</button>
        ${hasSample ? `<p style="margin-top:18px"><b>Importar departamentos de muestra.</b> Se encontró <code>js/data.js</code>; puedes cargarlo a la base de datos una sola vez.</p><button class="btn" id="seed">Importar desde data.js</button>` : ""}
      </details>`;
    $("#bk").onclick = downloadBackup;
    $("#exp").onclick = () => {
      download("data.js", Store.exportDataJs(), "text/javascript");
      toast("data.js generado");
    };
    $("#rs").onclick = () => $("#rsf").click();
    $("#rsf").onchange = async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      if (
        !confirm(
          "Se cargarán los datos de este respaldo. Los registros con el mismo ID se actualizarán; no se borra nada de lo que hayas agregado después. ¿Continuar?",
        )
      )
        return;
      try {
        await Store.importJSON(await f.text());
        toast("Respaldo restaurado");
      } catch (x) {
        toast("El archivo no es un respaldo válido");
      }
    };
    if ($("#seed"))
      $("#seed").onclick = async () => {
        await Store.seedFromDataJs();
        toast("Departamentos importados");
        render();
      };
  }

  function render() {
    if (!SEC[state.tab] && !["dashboard", "site", "backup"].includes(state.tab))
      state.tab = "dashboard";
    renderNav();
    if (state.tab === "dashboard") renderDashboard();
    else if (state.tab === "site") renderSite();
    else if (state.tab === "backup") renderBackup();
    else renderList();
  }

  window.addEventListener("hashchange", () => {
    const h = location.hash.slice(1);
    if (h && h !== state.tab) {
      state.tab = h;
      state.q = "";
      state.f = "";
      render();
    }
  });
  /* ---------- Arranque con inicio de sesión ---------- */
  let booted = false;
  async function boot() {
    try {
      await Store.load();
    } catch (e) {
      view.innerHTML = `<p class="empty">No se pudieron cargar los datos. ¿Ejecutaste el archivo setup.sql en Supabase?</p>`;
      return;
    }
    if (!booted) {
      booted = true;
      Store.onChange(() => {
        if (!document.querySelector(".modal") && state.tab !== "site") render();
        else renderNav();
      });
      document.addEventListener("visibilitychange", async () => {
        if (
          !document.hidden &&
          !document.querySelector(".modal") &&
          state.tab !== "site"
        ) {
          try {
            await Store.load();
            render();
          } catch (e) {
            /* sin conexión */
          }
        }
      });
      setInterval(async () => {
        if (
          !document.hidden &&
          !document.querySelector(".modal") &&
          state.tab !== "site"
        ) {
          try {
            await Store.load();
            render();
          } catch (e) {
            /* sin conexión */
          }
        }
      }, 60000);
    }
    render();
  }
  function showLogin() {
    const el = document.createElement("div");
    el.className = "login";
    el.innerHTML = `<form><h2>Administración</h2><p>Inicia sesión para continuar.</p>
      <label class="f">Correo<input name="email" type="email" required autocomplete="username"></label>
      <label class="f">Contraseña<input name="pass" type="password" required autocomplete="current-password"></label>
      <p class="err" id="lerr"></p><button class="btn btn-p" style="width:100%">Entrar</button></form>`;
    document.body.appendChild(el);
    $("form", el).onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target.elements;
      try {
        await Store.signIn(f.email.value, f.pass.value);
        el.remove();
        boot();
      } catch (x) {
        $("#lerr", el).textContent = "Correo o contraseña incorrectos.";
      }
    };
  }
  $("#logout").onclick = async () => {
    await Store.signOut();
    location.reload();
  };
  Store.init()
    .then(async () => {
      (await Store.session()) ? boot() : showLogin();
    })
    .catch(() => {
      view.innerHTML = `<p class="empty">Falta configurar la conexión. Edita <code>js/supabase-config.js</code> con la URL y la anon key de tu proyecto.</p>`;
    });
})();
