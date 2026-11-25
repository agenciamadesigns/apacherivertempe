// Apache River Apartments — navigation, language switching and motion
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
const languageButtons = document.querySelectorAll("[data-language]");

function setLanguage(language) {
  const selectedLanguage = language === "es" ? "es" : "en";
  document.documentElement.lang = selectedLanguage;

  // Queried each time so dynamically rendered content (units, forms) is translated too.
  document.querySelectorAll("[data-en][data-es]").forEach((element) => {
    const translation = element.dataset[selectedLanguage];
    if (translation !== undefined) element.innerHTML = translation; // text comes from the site's own attributes
  });

  languageButtons.forEach((button) => {
    const isActive = button.dataset.language === selectedLanguage;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  try {
    localStorage.setItem("apache-river-language", selectedLanguage);
  } catch (error) {
    /* storage unavailable */
  }
}
window.applyLanguage = () => setLanguage(document.documentElement.lang);

function closeMenu() {
  if (!menuToggle || !mainNav) return;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
  mainNav.classList.remove("is-open");
  document.body.classList.remove("menu-open");
}

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setLanguage(button.dataset.language);
    if (mainNav && mainNav.classList.contains("is-open")) closeMenu();
  });
});

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Open navigation" : "Close navigation",
    );
    mainNav.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });
  mainNav
    .querySelectorAll("a")
    .forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) closeMenu();
  });
}

document.querySelector("#current-year").textContent = new Date().getFullYear();

let savedLanguage = "en";
try {
  savedLanguage = localStorage.getItem("apache-river-language") || "en";
} catch (error) {
  /* default to English */
}
setLanguage(savedLanguage);

// Subtle entrance motion; respects reduced-motion preferences.
const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
if ("IntersectionObserver" in window && !reduceMotion) {
  const revealTargets = document.querySelectorAll(
    ".intro-grid, .section-heading, .amenity-card, .tour-grid, .contact-grid",
  );
  revealTargets.forEach((el) => el.classList.add("reveal-ready"));
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  revealTargets.forEach((el) => revealObserver.observe(el));
}
