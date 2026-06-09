(function () {
  const header = document.getElementById("header");
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  const form = document.getElementById("contact-form");
  const billingToggle = document.getElementById("billing-toggle");
  const fleetSlider = document.getElementById("fleet-slider");
  const fleetCount = document.getElementById("fleet-count");
  const planSelect = document.getElementById("plan");

  const PRICES = {
    dispatch: { monthly: 499, annual: 399, min: 5 },
    ecosystem: { monthly: 899, annual: 719, min: 10 },
    enterprise: { monthly: 1199, annual: 959, min: 50 },
  };

  let isAnnual = false;

  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 20);
  });

  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open);
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  document.querySelectorAll("[data-select-plan]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const plan = btn.getAttribute("data-select-plan");
      if (planSelect) planSelect.value = plan;
    });
  });

  const billingLabels = document.querySelectorAll(".billing-label");
  billingLabels[0].classList.add("active");

  billingToggle.addEventListener("click", () => {
    isAnnual = !isAnnual;
    billingToggle.setAttribute("aria-pressed", isAnnual);
    billingLabels.forEach((label) => {
      label.classList.toggle("active", label.dataset.period === (isAnnual ? "annual" : "monthly"));
    });
    updatePrices();
    updateCalculator();
  });

  function updatePrices() {
    document.querySelectorAll(".price-value").forEach((el) => {
      const monthly = parseInt(el.dataset.monthly, 10);
      const annual = parseInt(el.dataset.annual, 10);
      el.textContent = isAnnual ? annual : monthly;
    });
  }

  function updateCalculator() {
    if (!fleetSlider) return;

    const trucks = parseInt(fleetSlider.value, 10);
    fleetCount.textContent = trucks;

    Object.entries(PRICES).forEach(([plan, data]) => {
      const rate = isAnnual ? data.annual : data.monthly;
      const billable = Math.max(trucks, data.min);
      const total = billable * rate;
      const el = document.getElementById(`calc-${plan}`);
      if (el) el.textContent = `$${total.toLocaleString()}`;
    });
  }

  if (fleetSlider) {
    fleetSlider.addEventListener("input", updateCalculator);
    updateCalculator();
  }

  const reveals = document.querySelectorAll(".reveal");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  reveals.forEach((el) => revealObserver.observe(el));

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form));
    const subject = encodeURIComponent(`VELCUN Demo — ${data.plan} Plan`);
    const body = encodeURIComponent(
      `Name: ${data.name}\nCompany: ${data.company}\nEmail: ${data.email}\nFleet Size: ${data.fleet}\nPlan: ${data.plan}\n\n${data.message || ""}`
    );

    window.location.href = `mailto:hello@velcun.com?subject=${subject}&body=${body}`;

    form.innerHTML = `
      <div class="form-success">
        <h3>Thank you!</h3>
        <p>Your email client should open shortly. If it doesn't, reach us at <a href="mailto:hello@velcun.com" style="color: var(--accent)">hello@velcun.com</a>.</p>
      </div>
    `;
  });
})();
