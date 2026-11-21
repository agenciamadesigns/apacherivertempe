/* APACHE RIVER APARTMENTS — site data
   Phase 1: edit this file by hand.
   Phase 2: the CMS will generate/serve this same structure.
   Unit statuses match the CMS categories: available | rented | reserved | maintenance
   (units in "maintenance" are never shown on the public site). */

window.APACHE_CONFIG = {
  phone: "",         // e.g. "+52 662 000 0000"
  email: "",         // e.g. "info@apacheriver.com"  (used as fallback for forms)
  address: "",
  hours: "",         // e.g. "Mon–Fri 9am–6pm"
  formEndpoint: ""   // e.g. a Formspree URL; until Phase 2 provides one
};

/* SAMPLE content — replace with real photos, text and numbers.
   Per unit: images[] (first = cover), description, features[], price, deposit, sqft, lease.
   Leave a value as null to show "Price on request" / "Contact us". */
(function () {
  const P = [
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80"
  ];
  const photos = (i) => [0, 1, 2, 3, 4].map((k) => P[(i + k) % P.length]);
  const DESC = {
    en: "A bright, welcoming home designed for everyday comfort. Open living spaces, generous natural light and a calm layout make it easy to settle in from day one.",
    es: "Un hogar luminoso y acogedor pensado para la comodidad de todos los días. Espacios abiertos, abundante luz natural y una distribución tranquila que te harán sentir en casa desde el primer día."
  };
  const FEATURES = [
    { en: "Bright, open living area", es: "Sala luminosa y abierta" },
    { en: "Fully equipped kitchen", es: "Cocina equipada" },
    { en: "Air conditioning", es: "Aire acondicionado" },
    { en: "Generous storage", es: "Amplio espacio de guardado" },
    { en: "Private entrance", es: "Entrada privada" },
    { en: "Access to community spaces", es: "Acceso a áreas comunes" }
  ];
  const mk = (i, id, en, es, beds, baths, status, availableFrom) => ({
    id, name: { en, es }, beds, baths, sqft: null, price: null, deposit: null, lease: null,
    status, availableFrom, image: P[i % P.length], images: photos(i), description: DESC, features: FEATURES
  });

  window.APACHE_UNITS = [
    mk(0, "A1", "One-bedroom, Plan A1", "Una habitación, Plano A1", 1, 1, "available", "now"),
    mk(1, "A2", "One-bedroom, Plan A2", "Una habitación, Plano A2", 1, 1, "available", "2027-01-15"),
    mk(2, "A3", "One-bedroom, Plan A3", "Una habitación, Plano A3", 1, 1, "reserved", null),
    mk(3, "B1", "Two-bedroom, Plan B1", "Dos habitaciones, Plano B1", 2, 2, "available", "now"),
    mk(4, "B2", "Two-bedroom, Plan B2", "Dos habitaciones, Plano B2", 2, 2, "rented", null),
    mk(5, "C1", "One-bedroom, Plan C1", "Una habitación, Plano C1", 1, 1, "maintenance", null)
  ];
})();