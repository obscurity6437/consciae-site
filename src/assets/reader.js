(() => {
  const contents = document.querySelector(".contents");
  if (!contents) return;

  const compact = window.matchMedia("(max-width: 900px)");
  const links = [...contents.querySelectorAll("[data-toc-link]")];
  const sections = [...document.querySelectorAll("[data-reading-section]")];

  // The complete contents remains available when JavaScript is disabled.
  function adaptContents() {
    contents.open = !compact.matches;
  }

  adaptContents();
  compact.addEventListener("change", adaptContents);

  for (const link of links) {
    link.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (compact.matches) {
        contents.open = false;
        // Keep keyboard focus out of the now-closed menu. Native fragment
        // navigation still owns the URL, history and scrolling.
        document.getElementById(link.hash.slice(1))?.focus({ preventScroll: true });
      }
    });
  }

  contents.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && compact.matches && contents.open) {
      contents.open = false;
      contents.querySelector("summary").focus();
    }
  });

  let pending = false;
  function updateCurrentSection() {
    pending = false;
    const threshold = Math.min(window.innerHeight * 0.25, 180);
    let current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= threshold) current = section;
    }
    for (const link of links) {
      if (link.hash === `#${current.id}`) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    }
  }

  function scheduleUpdate() {
    if (!pending) {
      pending = true;
      window.requestAnimationFrame(updateCurrentSection);
    }
  }

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  window.addEventListener("pageshow", scheduleUpdate);
  updateCurrentSection();
})();
