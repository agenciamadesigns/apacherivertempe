// Apache River — Definición de secciones, campos y catálogos.
// Para agregar un campo nuevo basta con añadirlo aquí: la tabla y el formulario se actualizan solos.
(function () {
  const L = {
    unitStatus: [
      ["available", "Disponible"],
      ["reserved", "Reservado"],
      ["rented", "Rentado"],
      ["maintenance", "En mantenimiento"],
    ],
    inquiryStatus: [
      ["new", "Nueva"],
      ["contacted", "Contactada"],
      ["closed", "Cerrada"],
    ],
    tourStatus: [
      ["pending", "Pendiente"],
      ["confirmed", "Confirmada"],
      ["done", "Realizada"],
      ["cancelled", "Cancelada"],
    ],
    gallery: [
      ["interior", "Interior"],
      ["exterior", "Exterior"],
      ["common", "Áreas comunes"],
    ],
    time: [
      ["morning", "Mañana"],
      ["afternoon", "Tarde"],
    ],
    active: [
      ["1", "Activa"],
      ["0", "Inactiva"],
    ],
    plan: [
      ["", "Sin plano"],
      ["A1", "Plan A1"],
      ["A2", "Plan A2"],
      ["B", "Plan B"],
    ],
    building: [
      ["", "—"],
      ["1", "Edificio 1"],
      ["2", "Edificio 2"],
    ],
  };
  const money = (v) =>
    v || v === 0 ? "$" + Number(v).toLocaleString("en-US") : "—";
  const thumb = (d) =>
    `<div class="thumb" style="background-image:url('${AdminUtil.esc((d.images || [])[0] || "")}')"></div>`;
  const pill = (list, v) =>
    `<span class="pill ${AdminUtil.esc(v)}">${AdminUtil.esc((list.find((x) => x[0] === String(v)) || [0, v || "—"])[1])}</span>`;

  window.AdminUtil = {
    esc: (s) =>
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
      ),
    money,
    pill,
    lists: L,
    timeLabel: (t) => {
      const m = /^(\d{2}):(\d{2})$/.exec(t || "");
      if (m) {
        const h = +m[1];
        return `${h % 12 || 12}:${m[2]} ${h >= 12 ? "PM" : "AM"}`;
      }
      return t === "afternoon" ? "Tarde" : t === "morning" ? "Mañana" : "—";
    },
  };
  const { esc } = window.AdminUtil;

  // Menú lateral: grupos y secciones
  window.ADMIN_MENU = [
    {
      group: "General",
      items: [
        {
          id: "dashboard",
          label: "Resumen",
          icon: "M3 12l9-8 9 8M5 10v10h14V10",
        },
      ],
    },
    {
      group: "Propiedad",
      items: [
        {
          id: "units",
          label: "Departamentos",
          icon: "M4 21V5l8-3 8 3v16M9 21v-5h6v5M9 9h.01M15 9h.01M9 13h.01M15 13h.01",
        },
        {
          id: "gallery",
          label: "Galería",
          icon: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M9 9h.01",
        },
        {
          id: "promos",
          label: "Depósitos y promociones",
          icon: "M20 12l-8 8-9-9V3h8zM7.5 7.5h.01",
        },
      ],
    },
    {
      group: "Personas",
      items: [
        {
          id: "tenants",
          label: "Inquilinos",
          icon: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-4 3-7 7-7s7 3 7 7M17 4a3.5 3.5 0 0 1 0 7M22 21c0-3-2-5.5-5-6.5",
        },
        {
          id: "inquiries",
          label: "Solicitudes",
          icon: "M4 5h16v11H9l-5 4z",
          badge: "new",
        },
        {
          id: "tours",
          label: "Visitas",
          icon: "M4 5h16v15H4zM4 10h16M9 3v4M15 3v4",
          badge: "pending",
        },
      ],
    },
    {
      group: "Sitio web",
      items: [
        {
          id: "site",
          label: "Contenido del sitio",
          icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2c3 3 4 6 4 10s-1 7-4 10c-3-3-4-6-4-10s1-7 4-10z",
        },
        {
          id: "backup",
          label: "Respaldo",
          icon: "M12 3v12M7 10l5 5 5-5M4 20h16",
        },
      ],
    },
  ];

  // Colecciones editables (CRUD)
  window.ADMIN_SECTIONS = {
    units: {
      title: "Departamentos",
      singular: "departamento",
      status: "status",
      statusList: L.unitStatus,
      search: ["id", "nameEn", "nameEs", "plan"],
      filter: { key: "status", list: L.unitStatus, label: "Todos los estados" },
      fields: [
        ["§", "Identificación"],
        ["id", "ID único (ej. A4)", "text"],
        ["status", "Estado", "select", L.unitStatus],
        ["plan", "Plano (grupo en Residencias)", "select", L.plan],
        ["building", "Edificio", "select", L.building],
        ["nameEn", "Nombre (EN) — opcional, ej. One-bedroom", "text"],
        ["nameEs", "Nombre (ES) — opcional, ej. Una habitación", "text"],
        ["§", "Características"],
        ["beds", "Habitaciones", "number"],
        ["baths", "Baños", "number"],
        ["sqft", "Pies²", "number"],
        [
          "availableFrom",
          "Disponible desde (vacío = disponible ahora)",
          "date",
        ],
        ["descEn", "Descripción (EN)", "area"],
        ["descEs", "Descripción (ES)", "area"],
        ["featEn", "Características EN (una por línea)", "area"],
        ["featEs", "Características ES (una por línea)", "area"],
        ["§", "Renta"],
        ["price", "Renta mensual (USD)", "number"],
        ["deposit", "Depósito (USD)", "number"],
        ["lease", "Plazo del contrato (EN)", "text"],
        ["leaseEs", "Plazo del contrato (ES)", "text"],
        ["§", "Fotografías"],
        ["images", "La primera foto es la portada", "images"],
      ],
      cols: [
        ["", thumb],
        [
          "Unidad",
          (d) =>
            `<b>${esc(d.nameEs || d.nameEn || d.id)}</b><br><small>${esc(d.id)}</small>`,
        ],
        [
          "Plano",
          (d) =>
            d.plan
              ? `Plan ${esc(d.plan)}${d.building ? " · Ed. " + esc(d.building) : ""}`
              : "<small>Sin plano</small>",
        ],
        ["Hab. / Baños", (d) => `${d.beds ?? "—"} / ${d.baths ?? "—"}`],
        ["Renta", (d) => money(d.price)],
        ["Depósito", (d) => money(d.deposit)],
      ],
    },
    gallery: {
      title: "Galería",
      singular: "foto",
      filter: { key: "cat", list: L.gallery, label: "Todas las categorías" },
      search: ["capEs", "capEn"],
      fields: [
        ["images", "Fotografía", "images", 1],
        ["cat", "Categoría", "select", L.gallery],
        ["capEn", "Pie de foto (EN)", "text"],
        ["capEs", "Pie de foto (ES)", "text"],
      ],
      cols: [
        ["", thumb],
        ["Categoría", (d) => pill(L.gallery, d.cat)],
        ["Pie de foto", (d) => esc(d.capEs || d.capEn || "")],
      ],
    },
    promos: {
      title: "Depósitos y promociones",
      singular: "promoción",
      status: "active",
      statusList: L.active,
      search: ["titleEs", "titleEn", "unit"],
      fields: [
        ["titleEn", "Promoción (EN)", "text"],
        ["titleEs", "Promoción (ES)", "text"],
        ["unit", "Unidad (ID; vacío = todas)", "text"],
        ["deposit", "Depósito requerido (USD)", "number"],
        ["until", "Vigente hasta", "date"],
        ["active", "Estado", "select", L.active],
        ["notes", "Condiciones", "area"],
      ],
      cols: [
        ["Promoción", (d) => `<b>${esc(d.titleEs || d.titleEn || "")}</b>`],
        ["Unidad", (d) => esc(d.unit || "Todas")],
        ["Depósito", (d) => money(d.deposit)],
        ["Vigencia", (d) => esc(d.until || "—")],
      ],
    },
    tenants: {
      title: "Inquilinos",
      singular: "inquilino",
      search: ["name", "unit", "email", "phone"],
      fields: [
        ["§", "Contacto"],
        ["name", "Nombre completo", "text"],
        ["unit", "Unidad (ID)", "text"],
        ["phone", "Teléfono", "tel"],
        ["email", "Correo", "email"],
        ["emergency", "Contacto de emergencia", "text"],
        ["§", "Contrato"],
        ["leaseStart", "Inicio", "date"],
        ["leaseEnd", "Fin", "date"],
        ["notes", "Notas", "area"],
      ],
      cols: [
        ["Nombre", (d) => `<b>${esc(d.name || "")}</b>`],
        ["Unidad", (d) => esc(d.unit || "—")],
        [
          "Contacto",
          (d) =>
            `${esc(d.phone || "")}<br><small>${esc(d.email || "")}</small>`,
        ],
        ["Fin de contrato", (d) => esc(d.leaseEnd || "—")],
      ],
    },
    inquiries: {
      title: "Solicitudes de información",
      singular: "solicitud",
      status: "status",
      statusList: L.inquiryStatus,
      search: ["name", "email", "message"],
      filter: {
        key: "status",
        list: L.inquiryStatus,
        label: "Todos los estados",
      },
      sort: "created",
      fields: [
        ["name", "Nombre", "text"],
        ["email", "Correo", "email"],
        ["phone", "Teléfono", "tel"],
        ["topic", "Tema", "text"],
        ["message", "Mensaje", "area"],
        ["status", "Estado", "select", L.inquiryStatus],
        ["notes", "Notas internas", "area"],
      ],
      cols: [
        ["Recibida", (d) => esc((d.created || "").slice(0, 10))],
        [
          "Persona",
          (d) =>
            `<b>${esc(d.name || "")}</b><br><small>${esc(d.email || "")} ${esc(d.phone || "")}</small>`,
        ],
        ["Mensaje", (d) => esc((d.message || "").slice(0, 90))],
      ],
    },
    tours: {
      title: "Programación de visitas",
      singular: "visita",
      status: "status",
      statusList: L.tourStatus,
      search: ["name", "unit", "email"],
      filter: { key: "status", list: L.tourStatus, label: "Todos los estados" },
      sort: "date",
      fields: [
        ["name", "Nombre", "text"],
        ["email", "Correo", "email"],
        ["phone", "Teléfono", "tel"],
        ["unit", "Unidad (ID)", "text"],
        ["date", "Fecha", "date"],
        ["time", "Hora", "time"],
        ["status", "Estado", "select", L.tourStatus],
        ["notes", "Notas", "area"],
      ],
      cols: [
        [
          "Fecha",
          (d) =>
            `<b>${esc(d.date || "—")}</b><br><small>${AdminUtil.timeLabel(d.time)}</small>`,
        ],
        [
          "Persona",
          (d) =>
            `${esc(d.name || "")}<br><small>${esc(d.phone || d.email || "")}</small>`,
        ],
        ["Unidad", (d) => esc(d.unit || "—")],
        [
          "SMS",
          (d) =>
            d.smsSent
              ? "✓ Enviado"
              : d.smsError
                ? `<small title="${esc(d.smsError)}">⚠ Falló</small>`
                : "<small>—</small>",
        ],
      ],
    },
  };

  // Contenido general del sitio
  window.ADMIN_SITE_FIELDS = [
    ["§", "Banner principal (la foto del inicio)"],
    [
      "heroImage",
      "Foto del banner (si no pones foto, se usa la original)",
      "image",
    ],
    ["heroEn", "Título del banner (EN)", "area"],
    ["heroEs", "Título del banner (ES)", "area"],
    ["§", "Sección «Bienvenido a Apache River»"],
    ["welcomeImage", "Foto de la sección (vacío = la original)", "image"],
    ["welcomeEyebrowEn", "Texto pequeño superior (EN)"],
    ["welcomeEyebrowEs", "Texto pequeño superior (ES)"],
    ["welcomeTitleEn", "Título (EN)", "area"],
    ["welcomeTitleEs", "Título (ES)", "area"],
    ["welcomeTextEn", "Párrafo (EN)", "area"],
    ["welcomeTextEs", "Párrafo (ES)", "area"],
    ["§", "Sección «Los detalles hacen la diferencia» · Encabezado"],
    ["detailsEyebrowEn", "Texto pequeño superior (EN)"],
    ["detailsEyebrowEs", "Texto pequeño superior (ES)"],
    ["detailsTitleEn", "Título (EN)", "area"],
    ["detailsTitleEs", "Título (ES)", "area"],
    ["detailsTextEn", "Párrafo (EN)", "area"],
    ["detailsTextEs", "Párrafo (ES)", "area"],
    ["§", "Sección «Los detalles hacen la diferencia» · Tarjeta 1 (la grande)"],
    ["amenity1Image", "Foto de la tarjeta (vacío = la original)", "image"],
    ["amenity1TitleEn", "Título (EN)"],
    ["amenity1TitleEs", "Título (ES)"],
    ["amenity1TextEn", "Descripción (EN)", "area"],
    ["amenity1TextEs", "Descripción (ES)", "area"],
    ["§", "Sección «Los detalles hacen la diferencia» · Tarjeta 2"],
    ["amenity2Image", "Foto de la tarjeta (vacío = la original)", "image"],
    ["amenity2TitleEn", "Título (EN)"],
    ["amenity2TitleEs", "Título (ES)"],
    ["amenity2TextEn", "Descripción (EN)", "area"],
    ["amenity2TextEs", "Descripción (ES)", "area"],
    ["§", "Sección «Los detalles hacen la diferencia» · Tarjeta 3"],
    ["amenity3Image", "Foto de la tarjeta (vacío = la original)", "image"],
    ["amenity3TitleEn", "Título (EN)"],
    ["amenity3TitleEs", "Título (ES)"],
    ["amenity3TextEn", "Descripción (EN)", "area"],
    ["amenity3TextEs", "Descripción (ES)", "area"],
    ["§", "Datos de contacto"],
    ["phone", "Teléfono"],
    ["email", "Correo electrónico"],
    ["address", "Dirección"],
    ["hours", "Horario de oficina"],
    ["formEndpoint", "URL para recibir formularios (opcional)", "text", 1],
    ["§", "Horario para agendar visitas"],
    [
      "tourDays",
      "Días de visita",
      "select",
      [
        ["1-5", "Lunes a viernes"],
        ["1-6", "Lunes a sábado"],
        ["2-6", "Martes a sábado"],
        ["1-7", "Todos los días"],
      ],
    ],
    ["tourStart", "Primera cita del día", "time"],
    ["tourEnd", "Última cita del día", "time"],
    [
      "tourStep",
      "Separación entre citas",
      "select",
      [
        ["30", "30 minutos"],
        ["60", "1 hora"],
        ["15", "15 minutos"],
      ],
    ],
    ["tourTz", "Zona horaria de la propiedad (ej. America/Phoenix)", "text"],
    ["§", "Pie de página"],
    ["tagEn", "Frase del pie de página (EN)"],
    ["tagEs", "Frase del pie de página (ES)"],
  ];
})();
