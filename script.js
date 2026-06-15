const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealItems = Array.from(document.querySelectorAll(".reveal"));
const sections = Array.from(document.querySelectorAll("[data-section]"));
const navLinks = Array.from(document.querySelectorAll("[data-nav]"));
const counters = Array.from(document.querySelectorAll("[data-count]"));

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
const lerp = (start, end, amount) => start + (end - start) * amount;
const easeOut = (value) => 1 - Math.pow(1 - clamp(value), 3);
const progressFor = (element, start = 0.92, end = 0.12) => {
  const rect = element.getBoundingClientRect();
  const viewport = window.innerHeight || 1;
  const travel = rect.height + viewport * (start - end);
  return clamp((viewport * start - rect.top) / travel);
};

if (!reduceMotion) {
  document.body.classList.add("motion-ready");
}

if (!reduceMotion) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    const current = visible.target.dataset.section;
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.nav === current);
    });
  },
  { threshold: [0.22, 0.45, 0.68], rootMargin: "-18% 0px -42% 0px" }
);

sections.forEach((section) => sectionObserver.observe(section));

const animateCounter = (node) => {
  const target = Number(node.dataset.count || 0);
  const prefix = node.dataset.prefix || "";
  const suffix = node.dataset.suffix || "";
  const duration = 1100;
  const start = performance.now();

  const tick = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    node.textContent = `${prefix}${value}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
};

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.target.dataset.counted) return;
      entry.target.dataset.counted = "true";
      if (reduceMotion) {
        const prefix = entry.target.dataset.prefix || "";
        const suffix = entry.target.dataset.suffix || "";
        entry.target.textContent = `${prefix}${entry.target.dataset.count}${suffix}`;
      } else {
        animateCounter(entry.target);
      }
    });
  },
  { threshold: 0.75 }
);

counters.forEach((counter) => counterObserver.observe(counter));

let ticking = false;

const setTransform = (element, transform) => {
  if (element) element.style.transform = transform;
};

const setOpacity = (element, opacity) => {
  if (element) element.style.opacity = String(clamp(opacity));
};

const choreographHero = () => {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const rect = hero.getBoundingClientRect();
  const viewport = window.innerHeight || 1;
  const progress = clamp(-rect.top / Math.max(rect.height - viewport * 0.45, 1));
  const eased = easeOut(progress);

  setTransform(
    hero.querySelector(".hero-bg"),
    `scale(${lerp(1.18, 1.02, eased).toFixed(4)}) translate3d(0, ${lerp(0, -90, progress).toFixed(2)}px, 0)`
  );
  setTransform(hero.querySelector(".hero-content"), `translate3d(0, ${lerp(0, -78, progress).toFixed(2)}px, 0)`);
  setOpacity(hero.querySelector(".hero-content"), lerp(1, 0.42, progress));
  setTransform(hero.querySelector(".metric-strip"), `translate3d(0, ${lerp(0, -44, progress).toFixed(2)}px, 0)`);
};

const choreographHighlights = () => {
  const section = document.querySelector(".highlights");
  if (!section) return;

  const progress = progressFor(section, 0.96, 0.1);
  const image = section.querySelector(".highlight-image");
  setTransform(
    image,
    `scale(1.12) translate3d(${lerp(-90, 70, progress).toFixed(2)}px, ${lerp(34, -44, progress).toFixed(2)}px, 0)`
  );

  section.querySelectorAll(".feature-tile").forEach((tile, index) => {
    const local = easeOut(clamp(progress * 1.45 - index * 0.17));
    setTransform(tile, `translate3d(0, ${lerp(96, 0, local).toFixed(2)}px, 0) scale(${lerp(0.95, 1, local).toFixed(4)})`);
    setOpacity(tile, lerp(0.18, 1, local));
  });
};

const choreographStickyStory = () => {
  const section = document.querySelector(".story-section");
  if (!section) return;

  const progress = progressFor(section, 0.9, 0.12);
  const eased = easeOut(progress);
  const bg = section.querySelector(".story-bg");
  const copy = section.querySelector(".story-copy");

  setTransform(bg, `scale(${lerp(1.16, 1.02, eased).toFixed(4)}) translate3d(${lerp(42, -38, progress).toFixed(2)}px, 0, 0)`);
  setTransform(copy, `translate3d(${lerp(-84, 0, eased).toFixed(2)}px, ${lerp(42, -22, progress).toFixed(2)}px, 0)`);
  setOpacity(copy, lerp(0.2, 1, easeOut(clamp(progress * 1.7))));

  copy?.querySelectorAll(".proof-row span").forEach((chip, index) => {
    const local = easeOut(clamp(progress * 1.9 - index * 0.12));
    setTransform(chip, `translate3d(0, ${lerp(22, 0, local).toFixed(2)}px, 0)`);
    setOpacity(chip, lerp(0.2, 1, local));
  });
};

const choreographSplitStories = () => {
  document.querySelectorAll(".split-story").forEach((section) => {
    const progress = progressFor(section, 0.96, 0.08);
    const eased = easeOut(progress);
    const direction = section.classList.contains("reverse") ? -1 : 1;

    setTransform(
      section.querySelector(".visual-panel"),
      `translate3d(${lerp(42 * direction, -18 * direction, progress).toFixed(2)}px, ${lerp(76, -34, progress).toFixed(2)}px, 0) scale(${lerp(0.94, 1.02, eased).toFixed(4)})`
    );
    setOpacity(section.querySelector(".visual-panel"), lerp(0.36, 1, eased));
    setTransform(section.querySelector(".copy-panel"), `translate3d(${lerp(-38 * direction, 0, eased).toFixed(2)}px, ${lerp(46, -18, progress).toFixed(2)}px, 0)`);
  });
};

const choreographImpact = () => {
  const section = document.querySelector(".impact");
  if (!section) return;

  const progress = progressFor(section, 0.96, 0.08);
  const bg = section.querySelector(".impact-bg");
  setTransform(bg, `scale(${lerp(1.18, 1.04, easeOut(progress)).toFixed(4)}) translate3d(0, ${lerp(58, -70, progress).toFixed(2)}px, 0)`);
  if (bg) {
    bg.style.filter = `brightness(${lerp(0.58, 0.78, progress).toFixed(3)}) saturate(${lerp(0.42, 1.08, progress).toFixed(3)})`;
  }

  section.querySelectorAll(".project-card").forEach((card, index) => {
    const local = easeOut(clamp(progress * 1.55 - index * 0.14));
    setTransform(card, `translate3d(0, ${lerp(110, 0, local).toFixed(2)}px, 0) scale(${lerp(0.94, 1, local).toFixed(4)})`);
    setOpacity(card, lerp(0.16, 1, local));
  });
};

const choreographAppleFit = () => {
  const section = document.querySelector(".apple-fit");
  if (!section) return;

  const progress = progressFor(section, 0.96, 0.08);
  const eased = easeOut(progress);
  setTransform(
    section.querySelector(".fit-bg"),
    `scale(${lerp(1.2, 1.04, eased).toFixed(4)}) translate3d(${lerp(46, -34, progress).toFixed(2)}px, ${lerp(54, -54, progress).toFixed(2)}px, 0)`
  );
  setTransform(section.querySelector(".fit-copy"), `translate3d(0, ${lerp(90, -18, progress).toFixed(2)}px, 0)`);

  section.querySelectorAll(".fit-points span").forEach((chip, index) => {
    const local = easeOut(clamp(progress * 1.8 - index * 0.12));
    setTransform(chip, `translate3d(${lerp(-28, 0, local).toFixed(2)}px, 0, 0)`);
    setOpacity(chip, lerp(0.18, 1, local));
  });
};

const choreographStack = () => {
  const section = document.querySelector(".stack");
  if (!section) return;

  const progress = progressFor(section, 0.94, 0.08);
  section.querySelectorAll(".stack-group").forEach((group, index) => {
    const local = easeOut(clamp(progress * 1.35 - index * 0.12));
    setTransform(group, `translate3d(0, ${lerp(66, 0, local).toFixed(2)}px, 0)`);
    setOpacity(group, lerp(0.28, 1, local));
  });
};

const updateMotion = () => {
  choreographHero();
  choreographHighlights();
  choreographStickyStory();
  choreographSplitStories();
  choreographImpact();
  choreographAppleFit();
  choreographStack();
  ticking = false;
};

const requestMotionUpdate = () => {
  if (reduceMotion || ticking) return;
  ticking = true;
  requestAnimationFrame(updateMotion);
};

window.addEventListener("scroll", requestMotionUpdate, { passive: true });
window.addEventListener("resize", requestMotionUpdate);
window.addEventListener("load", requestMotionUpdate);
requestMotionUpdate();
