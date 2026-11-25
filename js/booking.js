// Apache River — Agendar visita: unidad → día → horario → datos → confirmación
(function () {
  const SB = window.SUPABASE_CONFIG;
  const form = document.querySelector('form[data-form="tour"]');
  if (!form || !SB || !SB.url || SB.url.includes("TU-PROYECTO")) return; // sin Supabase, se usa el formulario normal

  const C = window.APACHE_CONFIG || {},
    tc = C.tour || {};
  const T = {
    days: tc.days || "1-5", // 1 = lunes … 7 = domingo
    start: tc.start || "10:00", // primera cita
    end: tc.end || "16:00", // última cita
    step: Number(tc.step) || 30, // minutos entre citas
    tz: tc.tz || "America/Phoenix", // zona horaria de la propiedad
    ahead: 14, // cuántos días abiertos se muestran
    lead: 60, // minutos de anticipación mínima
  };
  const [D1, D2] = T.days.split("-").map(Number);
  const H = {
    apikey: SB.anonKey,
    Authorization: "Bearer " + SB.anonKey,
    "Content-Type": "application/json",
  };

  const lang = () => (document.documentElement.lang === "es" ? "es" : "en");
  const refresh = () => window.applyLanguage && window.applyLanguage();
  const esc = (s) =>
    String(s ?? "").replace(
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
  const bi = (en, es) => `data-en="${esc(en)}" data-es="${esc(es)}"`;
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const nowTz = () =>
    new Date(new Date().toLocaleString("en-US", { timeZone: T.tz }));
  const toMin = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const fmt = (t) => {
    let [h, m] = t.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${pad(m)} ${ap}`;
  };
  const allSlots = () => {
    const o = [];
    for (let m = toMin(T.start); m <= toMin(T.end); m += T.step)
      o.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
    return o;
  };
  const isFuture = (d, s) => {
    const t = new Date(d);
    const [h, m] = s.split(":").map(Number);
    t.setHours(h, m, 0, 0);
    return t - nowTz() > T.lead * 60000;
  };

  function openDays() {
    const out = [],
      base = nowTz();
    base.setHours(0, 0, 0, 0);
    const slots = allSlots();
    for (let i = 0; out.length < T.ahead && i < 90; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const iso = d.getDay() === 0 ? 7 : d.getDay();
      if (iso < D1 || iso > D2) continue;
      if (!slots.some((s) => isFuture(d, s))) continue; // hoy ya no quedan horarios
      out.push(d);
    }
    return out;
  }

  /* ---------- Interfaz: unidad, día y horario van primero ---------- */
  const dateInput = form.querySelector("#tour-date");
  const dateLabel = dateInput.closest("label");
  const timeLabel = form.elements.time.closest("label");
  const unitLabel = form.querySelector("#tour-unit").closest("label");
  const grid = form.querySelector(".form-grid");
  dateLabel.hidden = true;
  timeLabel.hidden = true;
  dateInput.required = false;
  unitLabel.classList.add("field-full");

  const daysBox = document.createElement("div");
  daysBox.className = "field field-full";
  daysBox.innerHTML = `<span ${bi("Choose a day", "Elige un día")}>Choose a day</span><div class="days" id="bk-days"></div>`;
  const slotsBox = document.createElement("div");
  slotsBox.className = "field field-full";
  slotsBox.innerHTML = `<span ${bi("Choose a time", "Elige un horario")}>Choose a time</span><div class="slots" id="bk-slots"><p class="slots-hint" ${bi("Pick a day to see the available times.", "Elige un día para ver los horarios disponibles.")}>Pick a day to see the available times.</p></div>`;
  grid.prepend(unitLabel, daysBox, slotsBox);

  const phoneSpan = form
    .querySelector('[name="phone"]')
    .closest("label")
    .querySelector("span");
  phoneSpan.setAttribute("data-en", "Phone (required)");
  phoneSpan.setAttribute("data-es", "Teléfono (obligatorio)");

  const note = document.createElement("p");
  note.className = "sms-note";
  note.setAttribute(
    "data-en",
    "By booking, you agree to receive a text message about your visit. Message and data rates may apply. Reply STOP to opt out.",
  );
  note.setAttribute(
    "data-es",
    "Al agendar, aceptas recibir un mensaje de texto sobre tu visita. Pueden aplicar tarifas de mensajes y datos. Responde STOP para dejar de recibirlos.",
  );
  form.querySelector('[type="submit"]').before(note);

  const $days = daysBox.querySelector("#bk-days"),
    $slots = slotsBox.querySelector("#bk-slots");
  const sel = { date: null, time: null };

  function renderDays() {
    const L = lang() === "es" ? "es-MX" : "en-US";
    $days.innerHTML = openDays()
      .map((d) => {
        const k = ymd(d);
        return `<button type="button" class="day-chip${sel.date === k ? " is-active" : ""}" data-d="${k}" aria-pressed="${sel.date === k}">
        <small>${esc(d.toLocaleDateString(L, { weekday: "short" }))}</small><b>${d.getDate()}</b><small>${esc(d.toLocaleDateString(L, { month: "short" }))}</small></button>`;
      })
      .join("");
  }

  async function loadSlots(day) {
    sel.time = null;
    $slots.innerHTML = `<p class="slots-hint" ${bi("Loading times…", "Cargando horarios…")}>Loading times…</p>`;
    refresh();
    let taken = [];
    try {
      const r = await fetch(`${SB.url}/rest/v1/rpc/taken_slots`, {
        method: "POST",
        headers: H,
        body: JSON.stringify({ d: day }),
      });
      if (r.ok) taken = await r.json();
    } catch (e) {
      /* si falla, se muestran todos; el servidor evita duplicados */
    }
    if (sel.date !== day) return;
    const d = new Date(day + "T00:00:00");
    const list = allSlots().filter((s) => isFuture(d, s));
    $slots.innerHTML = list.length
      ? list
          .map(
            (s) =>
              `<button type="button" class="slot${taken.includes(s) ? " is-taken" : ""}" data-t="${s}" ${taken.includes(s) ? "disabled" : ""}>${fmt(s)}</button>`,
          )
          .join("")
      : `<p class="slots-hint" ${bi("No times left on this day.", "Ya no hay horarios este día.")}>No times left on this day.</p>`;
    refresh();
  }

  daysBox.addEventListener("click", (e) => {
    const b = e.target.closest("[data-d]");
    if (!b) return;
    sel.date = b.dataset.d;
    dateInput.value = sel.date;
    renderDays();
    loadSlots(sel.date);
  });
  slotsBox.addEventListener("click", (e) => {
    const b = e.target.closest("[data-t]");
    if (!b || b.disabled) return;
    sel.time = b.dataset.t;
    $slots
      .querySelectorAll(".slot")
      .forEach((x) => x.classList.toggle("is-active", x === b));
  });
  document
    .querySelectorAll(".language-button")
    .forEach((b) =>
      b.addEventListener("click", () => setTimeout(renderDays, 0)),
    );
  renderDays();
  refresh();

  /* ---------- Envío ---------- */
  document.addEventListener(
    "submit",
    async (e) => {
      if (e.target !== form) return;
      e.preventDefault();
      e.stopPropagation(); // reemplaza el envío genérico de app.js
      if (form.elements.website && form.elements.website.value) return; // honeypot
      const status = form.querySelector(".form-status"),
        btn = form.querySelector('[type="submit"]');
      const say = (en, es, ok) => {
        status.setAttribute("data-en", en);
        status.setAttribute("data-es", es);
        status.textContent = lang() === "es" ? es : en;
        status.className = "form-status " + (ok ? "is-ok" : "is-error");
      };
      const f = Object.fromEntries(new FormData(form));
      if (!sel.date || !sel.time)
        return say(
          "Please choose a day and a time.",
          "Elige un día y un horario.",
        );
      if (!(f.name || "").trim() || !/^\S+@\S+\.\S+$/.test(f.email || ""))
        return say(
          "Please enter your name and a valid email.",
          "Escribe tu nombre y un correo válido.",
        );
      if ((f.phone || "").replace(/\D/g, "").length < 8)
        return say(
          "Please enter a valid phone number.",
          "Escribe un número de teléfono válido.",
        );

      const id = crypto.randomUUID();
      const row = {
        name: f.name.trim(),
        email: f.email.trim(),
        phone: f.phone.trim(),
        unit: f.unit || "",
        date: sel.date,
        time: sel.time,
        notes: f.message || "",
        status: "pending",
        smsConsent: true,
        language: lang(),
        created: new Date().toISOString(),
        _id: id,
      };
      btn.disabled = true;
      try {
        const r = await fetch(`${SB.url}/rest/v1/tours`, {
          method: "POST",
          headers: { ...H, Prefer: "return=minimal" },
          body: JSON.stringify({ id, data: row }),
        });
        if (r.status === 409) {
          say(
            "Sorry, that time was just taken. Please pick another.",
            "Ese horario acaba de ocuparse. Elige otro, por favor.",
            false,
          );
          loadSlots(sel.date);
          return;
        }
        if (!r.ok) throw new Error("bad response");
        done(row);
      } catch (err) {
        say(
          "Something went wrong. Please try again or contact us directly.",
          "Algo salió mal. Inténtalo de nuevo o contáctanos directamente.",
          false,
        );
      } finally {
        btn.disabled = false;
      }
    },
    true,
  );

  /* ---------- Confirmación ---------- */
  function ics(row, label) {
    const day = row.date.replace(/-/g, ""),
      end = toMin(row.time) + T.step;
    const stamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d+Z$/, "Z");
    const txt = (s) => String(s).replace(/[,;]/g, "\\$&");
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Apache River//Tour//EN",
      "BEGIN:VEVENT",
      `UID:${row._id}@apacheriver`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=${T.tz}:${day}T${row.time.replace(":", "")}00`,
      `DTEND;TZID=${T.tz}:${day}T${pad(Math.floor(end / 60))}${pad(end % 60)}00`,
      "SUMMARY:Visita a Apache River Apartments",
      `DESCRIPTION:${txt("Unidad: " + label)}`,
      `LOCATION:${txt(C.address || "Apache River Apartments")}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
  }
  function done(row) {
    const u = (window.APACHE_UNITS || []).find((x) => x.id === row.unit);
    const long = {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      },
      d = new Date(row.date + "T00:00:00");
    const unitEn = u ? u.name.en : "To be defined",
      unitEs = u ? u.name.es : "Por definir";
    const box = document.createElement("div");
    box.className = "booking-done form-panel";
    box.innerHTML = `<div class="done-mark" aria-hidden="true">✓</div>
      <h3 ${bi("Your visit is booked", "Tu visita está agendada")}>Your visit is booked</h3>
      <p ${bi("We saved your appointment and are sending a text message to your phone. Our team will contact you to confirm it.", "Guardamos tu cita y te estamos enviando un mensaje de texto. Nuestro equipo te contactará para confirmarla.")}>We saved your appointment and are sending a text message to your phone. Our team will contact you to confirm it.</p>
      <dl class="done-list">
        <div><dt ${bi("Date", "Fecha")}>Date</dt><dd ${bi(d.toLocaleDateString("en-US", long), d.toLocaleDateString("es-MX", long))}>${esc(d.toLocaleDateString("en-US", long))}</dd></div>
        <div><dt ${bi("Time", "Hora")}>Time</dt><dd>${fmt(row.time)}</dd></div>
        <div><dt ${bi("Home", "Departamento")}>Home</dt><dd ${bi(unitEn, unitEs)}>${esc(unitEn)}</dd></div>
        <div><dt ${bi("Phone", "Teléfono")}>Phone</dt><dd>${esc(row.phone)}</dd></div>
      </dl>
      <div class="done-actions">
        <button class="button button-gold" type="button" id="bk-ics" ${bi("Add to calendar", "Agregar al calendario")}>Add to calendar</button>
        <a class="button button-outline" href="index.html" ${bi("Back to home", "Volver al inicio")}>Back to home</a>
      </div>`;
    form.hidden = true;
    form.after(box);
    box.querySelector("#bk-ics").onclick = () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(
        new Blob([ics(row, unitEs)], { type: "text/calendar;charset=utf-8" }),
      );
      a.download = "visita-apache-river.ics";
      document.body.appendChild(a);
      a.click();
      a.remove();
    };
    refresh();
    box.scrollIntoView({ behavior: "smooth", block: "center" });
  }
})();
