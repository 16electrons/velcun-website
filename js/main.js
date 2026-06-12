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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form));
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.textContent = "Sending...";
    submitBtn.disabled = true;

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        form.innerHTML = `
          <div class="form-success">
            <h3>Thank you!</h3>
            <p>We've received your inquiry. Our team will reach out within one business day.</p>
          </div>
        `;
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      // Fallback to email if API fails
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
    }
  });

  // Demo interactivity
  const demoLoads = document.querySelectorAll('.demo-load');
  const demoTrucks = document.getElementById('demo-trucks');

  const loadTruckData = {
    1: [
      { id: 'Truck #14', driver: 'Mike R.', deadhead: '45 mi', hos: '8.5 hrs', profit: '$1,850', score: '94%', best: true },
      { id: 'Truck #07', driver: 'Sarah K.', deadhead: '120 mi', hos: '7.2 hrs', profit: '$1,720', score: '87%', best: false },
      { id: 'Truck #23', driver: 'James T.', deadhead: '180 mi', hos: '5.8 hrs', profit: '$1,580', score: '72%', best: false },
    ],
    2: [
      { id: 'Truck #08', driver: 'Lisa M.', deadhead: '35 mi', hos: '9.2 hrs', profit: '$1,420', score: '91%', best: true },
      { id: 'Truck #15', driver: 'Tom W.', deadhead: '95 mi', hos: '8.0 hrs', profit: '$1,350', score: '84%', best: false },
      { id: 'Truck #31', driver: 'Karen D.', deadhead: '150 mi', hos: '6.5 hrs', profit: '$1,200', score: '76%', best: false },
    ],
    3: [
      { id: 'Truck #19', driver: 'John B.', deadhead: '50 mi', hos: '7.8 hrs', profit: '$1,680', score: '92%', best: true },
      { id: 'Truck #04', driver: 'Amy L.', deadhead: '110 mi', hos: '6.9 hrs', profit: '$1,550', score: '85%', best: false },
      { id: 'Truck #27', driver: 'Chris P.', deadhead: '175 mi', hos: '5.2 hrs', profit: '$1,380', score: '71%', best: false },
    ],
  };

  function renderTrucks(loadId) {
    const trucks = loadTruckData[loadId];
    demoTrucks.innerHTML = trucks.map(truck => `
      <div class="demo-truck ${truck.best ? 'demo-truck-best' : ''}">
        ${truck.best ? '<div class="truck-badge">Best Match</div>' : ''}
        <div class="truck-info">
          <span class="truck-id">${truck.id}</span>
          <span class="truck-driver">Driver: ${truck.driver}</span>
        </div>
        <div class="truck-metrics">
          <div class="metric">
            <span class="metric-label">Deadhead</span>
            <span class="metric-value ${parseInt(truck.deadhead) < 60 ? 'good' : parseInt(truck.deadhead) < 150 ? '' : 'warning'}">${truck.deadhead}</span>
          </div>
          <div class="metric">
            <span class="metric-label">HOS</span>
            <span class="metric-value ${parseFloat(truck.hos) > 7 ? 'good' : parseFloat(truck.hos) > 6 ? '' : 'warning'}">${truck.hos}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Profit</span>
            <span class="metric-value ${parseInt(truck.profit.replace(/[$,]/g, '')) > 1600 ? 'excellent' : ''}">${truck.profit}</span>
          </div>
        </div>
        <div class="truck-score">
          <span class="score-label">AI Score</span>
          <span class="score-value">${truck.score}</span>
        </div>
      </div>
    `).join('');
  }

  demoLoads.forEach(load => {
    load.addEventListener('click', () => {
      demoLoads.forEach(l => l.classList.remove('active'));
      load.classList.add('active');
      const loadId = load.dataset.load;
      renderTrucks(loadId);
    });
  });
})();
