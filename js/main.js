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

  // Multi-step form functionality
  const formSteps = document.querySelectorAll('.form-step');
  const progressSteps = document.querySelectorAll('.progress-step');
  const nextButtons = document.querySelectorAll('.next-step');
  const prevButtons = document.querySelectorAll('.prev-step');
  let currentStep = 1;

  function updateFormStep(step) {
    formSteps.forEach(s => s.classList.remove('active'));
    progressSteps.forEach(p => {
      p.classList.remove('active', 'completed');
      const stepNum = parseInt(p.dataset.step);
      if (stepNum === step) {
        p.classList.add('active');
      } else if (stepNum < step) {
        p.classList.add('completed');
      }
    });
    
    const activeStep = document.querySelector(`.form-step[data-step="${step}"]`);
    if (activeStep) {
      activeStep.classList.add('active');
    }
    currentStep = step;
  }

  nextButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const currentStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
      const requiredFields = currentStepEl.querySelectorAll('[required]');
      let valid = true;
      
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          valid = false;
          field.style.borderColor = 'var(--pending)';
        } else {
          field.style.borderColor = '';
        }
      });
      
      if (valid && currentStep < 3) {
        updateFormStep(currentStep + 1);
      }
    });
  });

  prevButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentStep > 1) {
        updateFormStep(currentStep - 1);
      }
    });
  });

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
      const subject = encodeURIComponent(`VELCUN Workflow Demo — ${data.plan} Plan`);
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
      { id: 'Accept lower first leg', driver: 'Ohio outbound capacity tightens tomorrow', deadhead: '-$180', hos: '+20%', profit: '$1,850', score: '94%', best: true },
      { id: 'Take highest rate', driver: 'Texas market softens overnight', deadhead: '$2,400', hos: '-8%', profit: '$1,720', score: '87%', best: false },
      { id: 'Hold capacity', driver: 'No reliable outbound signal yet', deadhead: '$0', hos: 'Unknown', profit: '$1,580', score: '72%', best: false },
    ],
    2: [
      { id: 'Accept Miami reefer', driver: 'Receiver delays clearing by morning', deadhead: '+$120', hos: '+14%', profit: '$1,420', score: '91%', best: true },
      { id: 'Wait for Tampa', driver: 'Rate is better but pickup risk is high', deadhead: '+$240', hos: '-3%', profit: '$1,350', score: '84%', best: false },
      { id: 'Stay Atlanta', driver: 'Capacity pressure likely fades by noon', deadhead: '$0', hos: 'Unknown', profit: '$1,200', score: '76%', best: false },
    ],
    3: [
      { id: 'Route through Denver', driver: 'Flatbed demand rises after weather delay', deadhead: '+$80', hos: '+11%', profit: '$1,680', score: '92%', best: true },
      { id: 'Divert to Salt Lake', driver: 'Better current RPM, weaker reload data', deadhead: '+$180', hos: '+2%', profit: '$1,550', score: '85%', best: false },
      { id: 'Reject lane', driver: 'No driver yield or home-time fit', deadhead: '$0', hos: 'Poor', profit: '$1,380', score: '71%', best: false },
    ],
  };

  function renderTrucks(loadId) {
    const trucks = loadTruckData[loadId];
    const target = document.getElementById('demo-trucks');
    if (!target) return;
    target.innerHTML = trucks.map(truck => `
      <div class="demo-truck ${truck.best ? 'demo-truck-best' : ''}">
        ${truck.best ? '<div class="truck-badge">Best Margin Move</div>' : ''}
        <div class="truck-info">
          <span class="truck-id">${truck.id}</span>
          <span class="truck-driver">${truck.driver}</span>
        </div>
        <div class="truck-metrics">
          <div class="metric">
            <span class="metric-label">First Leg</span>
            <span class="metric-value ${truck.deadhead.includes('-') || truck.deadhead.includes('+') ? 'good' : ''}">${truck.deadhead}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Next Leg</span>
            <span class="metric-value ${truck.hos.includes('+') ? 'good' : truck.hos.includes('-') || truck.hos === 'Poor' ? 'warning' : ''}">${truck.hos}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Net Margin</span>
            <span class="metric-value ${parseInt(truck.profit.replace(/[$,]/g, '')) > 1600 ? 'excellent' : ''}">${truck.profit}</span>
          </div>
        </div>
        <div class="truck-score">
          <span class="score-label">Agent Score</span>
          <span class="score-value">${truck.score}</span>
        </div>
      </div>
    `).join('');
  }

  if (demoLoads.length) {
    const firstActive = document.querySelector('.demo-load.active');
    if (firstActive) renderTrucks(firstActive.dataset.load);
    demoLoads.forEach(load => {
      load.addEventListener('click', () => {
        demoLoads.forEach(l => l.classList.remove('active'));
        load.classList.add('active');
        renderTrucks(load.dataset.load);
      });
    });
  }

  // Demo tab switching
  const demoTabs = document.querySelectorAll('.demo-tab');
  const demoContainer = document.querySelector('.demo-container');

  const demoData = {
    lane: { title: 'Available Loads', sub: 'Select a load to see agent recommendations', loads: true },
    settlement: { title: 'Pending Payments', sub: 'Select an invoice to see settlement options', loads: false,
      content: `
        <div class="demo-panel">
          <div class="demo-header"><h3>Pending Invoices</h3><p class="demo-sub">Select an invoice to trigger payment</p></div>
          <div class="demo-loads">
            ${['INV-3841 — $2,400 · Net 30 · Due Jun 28', 'INV-3840 — $1,800 · Net 15 · Due Jun 14', 'INV-3839 — $3,100 · Factored · Pending'].map((inv, i) => `
              <div class="demo-load${i === 0 ? ' active' : ''}" style="cursor:default">
                <div class="load-info"><span class="load-id">${inv}</span></div>
                <div class="load-details"><span>PoD Verified ✓</span><span>Geofence Match ✓</span></div>
              </div>`).join('')}
          </div>
        </div>
        <div class="demo-panel demo-panel-right">
          <div class="demo-header"><h3>Settlement Engine</h3><p class="demo-sub">Autonomous payment triggers</p></div>
          <div class="settlement-card">
            <div class="settlement-status settlement-ready"><span>⚡</span> Ready to Settle</div>
            <div class="settlement-amount">$2,400</div>
            <div class="settlement-detail"><span>Invoice</span><span>INV-3841</span></div>
            <div class="settlement-detail"><span>PoD</span><span>Verified via Geotab Geofence</span></div>
            <div class="settlement-detail"><span>Payment Method</span><span>Escrow → ACH</span></div>
            <div class="settlement-detail"><span>Est. Arrival</span><span>&lt; 2 hours</span></div>
            <div class="settlement-bar"><div class="settlement-bar-fill" style="width:100%"></div></div>
            <p class="settlement-note">No manual audit required. Disbursement triggered automatically.</p>
          </div>
        </div>`
    },
    ingestion: { title: 'Documents', sub: 'Select a document to see parsed data', loads: false,
      content: `
        <div class="demo-panel">
          <div class="demo-header"><h3>Incoming Documents</h3><p class="demo-sub">Rate cons, BOLs, and emails parsed in real time</p></div>
          <div class="demo-loads">
            ${['RC-7721 — Rate Con · ABC Logistics', 'BOL-4438 — BOL · Midwest Freight', 'EML-2091 — Email · "Updated rates"'].map((doc, i) => `
              <div class="demo-load${i === 0 ? ' active' : ''}" style="cursor:default">
                <div class="load-info"><span class="load-id">${doc}</span></div>
                <div class="load-details"><span>Parsed ✓</span><span>${i === 0 ? '3 accessorials' : i === 1 ? '2 stops' : 'rate change'}</span></div>
              </div>`).join('')}
          </div>
        </div>
        <div class="demo-panel demo-panel-right">
          <div class="demo-header"><h3>Semantic Parse Output</h3><p class="demo-sub">Structured data → TMS payload</p></div>
          <div class="parse-card">
            <div class="parse-field"><span>Origin</span><span>Chicago, IL</span></div>
            <div class="parse-field"><span>Destination</span><span>Dallas, TX</span></div>
            <div class="parse-field"><span>Rate</span><span>$2,400</span></div>
            <div class="parse-field"><span>Equipment</span><span>53' Dry Van</span></div>
            <div class="parse-field"><span>Accessorials</span><span>Lumper $75 · TONU $150</span></div>
            <div class="parse-field"><span>Pickup Window</span><span>Jun 12 14:00 - 18:00</span></div>
            <div class="parse-status">✅ Pushed to McLeod TMS</div>
          </div>
        </div>`
    },
    driver: { title: 'Driver Board', sub: 'Match drivers to loads based on pay and home-time preferences', loads: false,
      content: `
        <div class="demo-panel">
          <div class="demo-header"><h3>Available Drivers</h3><p class="demo-sub">Ranked by preference fit + fleet profitability</p></div>
          <div class="demo-loads">
            ${['Mike R. · Home OKC · Guarantee $1,400/wk', 'Sarah K. · Home Dallas · Prefers regional', 'James T. · Home Phoenix · Open OTR'].map((driver, i) => `
              <div class="demo-load${i === 0 ? ' active' : ''}" style="cursor:default">
                <div class="load-info"><span class="load-id">${driver}</span></div>
                <div class="load-details"><span>Retention Score: ${['94%','88%','76%'][i]}</span></div>
              </div>`).join('')}
          </div>
        </div>
        <div class="demo-panel demo-panel-right">
          <div class="demo-header"><h3>Yield Optimization</h3><p class="demo-sub">Driver-first lane matching</p></div>
          <div class="yield-card">
            <div class="yield-row primary">
              <span class="yield-label">Recommended Lane</span>
              <span class="yield-value">OKC → Dallas → OKC</span>
            </div>
            <div class="yield-row">
              <span class="yield-label">Driver Pay</span>
              <span class="yield-value green">$1,450/wk</span>
            </div>
            <div class="yield-row">
              <span class="yield-label">Home Time</span>
              <span class="yield-value green">2 days</span>
            </div>
            <div class="yield-row">
              <span class="yield-label">Fleet Margin</span>
              <span class="yield-value green">$920</span>
            </div>
            <div class="yield-row">
              <span class="yield-label">Driver Score</span>
              <span class="yield-value">94/100</span>
            </div>
            <p class="settlement-note">Pay and home-time weighted alongside equipment utilization.</p>
          </div>
        </div>`
    },
    border: { title: 'Border Timeline', sub: 'Cross-border shipments tracked from origin to delivery', loads: false,
      content: `
        <div class="demo-panel">
          <div class="demo-header"><h3>Active Crossings</h3><p class="demo-sub">Real-time customs and rail handoff tracking</p></div>
          <div class="demo-loads">
            ${['LD-7710 · Laredo → Mexico · Flatbed', 'LD-7709 · Detroit → Ontario · Reefer', 'LD-7708 · El Paso → Juarez · Dry Van'].map((cross, i) => `
              <div class="demo-load${i === 0 ? ' active' : ''}" style="cursor:default">
                <div class="load-info"><span class="load-id">${cross}</span></div>
                <div class="load-details"><span>Status: ${['At Customs','In Transit','Pre-Clearance'][i]}</span></div>
              </div>`).join('')}
          </div>
        </div>
        <div class="demo-panel demo-panel-right">
          <div class="demo-header"><h3>Exception Monitor</h3><p class="demo-sub">12-hour advance alerts</p></div>
          <div class="border-card">
            <div class="border-alert">
              <span class="alert-icon">⚠️</span>
              <span class="alert-text">Missing CBP form — flagged 12hrs before arrival</span>
            </div>
            <div class="border-alert success">
              <span class="alert-icon">✓</span>
              <span class="alert-text">Corrective action sent via API — clearance updated</span>
            </div>
            <div class="border-timeline">
              <div class="border-event"><span>Customs Submitted</span><span>✓</span></div>
              <div class="border-event"><span>Rail Handoff Scheduled</span><span>✓</span></div>
              <div class="border-event"><span>Drayage Confirmed</span><span>⚡</span></div>
            </div>
          </div>
        </div>`
    }
  };

  demoTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      demoTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const demoType = tab.dataset.demo;
      const data = demoData[demoType];
      if (!data) return;

      if (data.loads) {
        demoContainer.innerHTML = `
          <div class="demo-panel">
            <div class="demo-header"><h3>Available Loads</h3><p class="demo-sub">Select a load to see agent recommendations</p></div>
            <div class="demo-loads" id="demo-loads">
              <div class="demo-load active" data-load="1">
                <div class="load-info"><span class="load-id">LD-4821</span><span class="load-route">Chicago, IL -> Dallas, TX</span><span class="load-rate">$2,400</span></div>
                <div class="load-details"><span>53' Dry Van</span><span>1,200 mi</span><span>Pickup: Today 2PM</span></div>
              </div>
              <div class="demo-load" data-load="2">
                <div class="load-info"><span class="load-id">LD-4822</span><span class="load-route">Atlanta, GA -> Miami, FL</span><span class="load-rate">$1,800</span></div>
                <div class="load-details"><span>53' Reefer</span><span>660 mi</span><span>Pickup: Tomorrow 8AM</span></div>
              </div>
              <div class="demo-load" data-load="3">
                <div class="load-info"><span class="load-id">LD-4823</span><span class="load-route">Phoenix, AZ -> Denver, CO</span><span class="load-rate">$2,100</span></div>
                <div class="load-details"><span>53' Flatbed</span><span>600 mi</span><span>Pickup: Today 6PM</span></div>
              </div>
            </div>
          </div>
          <div class="demo-panel demo-panel-right">
            <div class="demo-header"><h3>Agent Recommendations</h3><p class="demo-sub">Ranked by current fit and next-leg margin</p></div>
            <div class="demo-trucks" id="demo-trucks"></div>
          </div>
        `;
        // Re-init lane loads
        const newLoads = demoContainer.querySelectorAll('.demo-load');
        newLoads.forEach(l => l.addEventListener('click', () => {
          newLoads.forEach(x => x.classList.remove('active'));
          l.classList.add('active');
          renderTrucks(l.dataset.load);
        }));
        const first = newLoads[0];
        if (first) renderTrucks(first.dataset.load);
      } else {
        demoContainer.innerHTML = data.content;
      }
    });
  });

  // Per-Truck ROI Calculator
  const fleetScaleSlider = document.getElementById('fleet-scale-slider');
  const fleetScaleValue = document.getElementById('fleet-scale-value');
  const scaleMonthlyProfit = document.getElementById('scale-monthly-profit');
  const scaleAnnualProfit = document.getElementById('scale-annual-profit');
  const scaleRoi = document.getElementById('scale-roi');

  const perTruckNetProfit = 951; // $951 net profit per truck per month
  const velcunCostPerTruck = 899; // $899 per truck per month

  function updatePerTruckScale() {
    if (!fleetScaleSlider) return;
    
    const fleetSize = parseInt(fleetScaleSlider.value);
    fleetScaleValue.textContent = fleetSize;
    
    const monthlyProfit = fleetSize * perTruckNetProfit;
    const annualProfit = monthlyProfit * 12;
    const totalVelcunCost = fleetSize * velcunCostPerTruck;
    const roi = ((annualProfit / totalVelcunCost) * 100).toFixed(0);
    
    scaleMonthlyProfit.textContent = `$${monthlyProfit.toLocaleString()}`;
    scaleAnnualProfit.textContent = `$${annualProfit.toLocaleString()}`;
    scaleRoi.textContent = `${roi}%`;
  }

  if (fleetScaleSlider) {
    fleetScaleSlider.addEventListener('input', updatePerTruckScale);
    updatePerTruckScale();
  }

  // Countdown Timer for Pilot Deadline
  function updateCountdown() {
    const countdownElement = document.getElementById('countdown-timer');
    if (!countdownElement) return;

    // Set deadline to end of current month (June 30, 2026)
    const deadline = new Date('2026-06-30T23:59:59').getTime();
    const now = new Date().getTime();
    const distance = deadline - now;

    if (distance > 0) {
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      countdownElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else {
      countdownElement.textContent = 'Pilot Closed';
    }
  }

  // Update countdown every second
  setInterval(updateCountdown, 1000);
  updateCountdown();

  // Enhanced ROI Calculator
  const roiCalculator = {
    fleetSize: document.getElementById('roi-fleet-size'),
    settlementDelay: document.getElementById('roi-settlement-delay'),
    deadhead: document.getElementById('roi-deadhead'),
    turnover: document.getElementById('roi-turnover'),
    calculateBtn: document.getElementById('calculate-roi'),
    savings: document.getElementById('roi-savings'),
    settlementSavings: document.getElementById('roi-settlement-savings'),
    laneSavings: document.getElementById('roi-lane-savings'),
    ingestionSavings: document.getElementById('roi-ingestion-savings'),
    driverSavings: document.getElementById('roi-driver-savings'),
    borderSavings: document.getElementById('roi-border-savings'),

    calculate() {
      const fleet = parseInt(this.fleetSize.value) || 25;
      const settlementDelay = parseInt(this.settlementDelay.value) || 30;
      const deadheadPct = parseInt(this.deadhead.value) || 15;
      const turnoverPct = parseInt(this.turnover.value) || 30;

      const loadsPerTruckPerMonth = 4;
      const totalLoadsPerMonth = fleet * loadsPerTruckPerMonth;
      const avgRevenuePerLoad = 2000;

      const settlementSavings = fleet * settlementDelay * 15;
      const deadheadReduction = Math.max(0, (deadheadPct - 8) / 100);
      const laneSavings = totalLoadsPerMonth * 12 * avgRevenuePerLoad * deadheadReduction;
      const ingestionSavings = 1.5 * totalLoadsPerMonth * 12 * 50;
      const turnoverReduction = Math.min(turnoverPct * 0.4, 20);
      const driverSavings = fleet * (turnoverReduction / 100) * 8000;
      const borderSavings = fleet * 12 * 200;

      const totalSavings = settlementSavings + laneSavings + ingestionSavings + driverSavings + borderSavings;

      this.savings.textContent = `$${Math.round(totalSavings).toLocaleString()}`;
      this.settlementSavings.textContent = `$${Math.round(settlementSavings).toLocaleString()}`;
      this.laneSavings.textContent = `$${Math.round(laneSavings).toLocaleString()}`;
      this.ingestionSavings.textContent = `$${Math.round(ingestionSavings).toLocaleString()}`;
      this.driverSavings.textContent = `$${Math.round(driverSavings).toLocaleString()}`;
      this.borderSavings.textContent = `$${Math.round(borderSavings).toLocaleString()}`;
    }
  };

  if (roiCalculator.calculateBtn) {
    roiCalculator.calculateBtn.addEventListener('click', () => roiCalculator.calculate());
    [roiCalculator.fleetSize, roiCalculator.settlementDelay, roiCalculator.deadhead, roiCalculator.turnover].forEach(input => {
      input.addEventListener('input', () => roiCalculator.calculate());
    });
    roiCalculator.calculate();
  }

  // Sticky CTA
  const stickyCta = document.getElementById('sticky-cta');
  let hasShownStickyCta = false;

  window.addEventListener('scroll', () => {
    if (!hasShownStickyCta && window.scrollY > 600) {
      stickyCta.classList.add('visible');
      hasShownStickyCta = true;
    }
  });

  // Exit intent popup
  const exitPopup = document.getElementById('exit-popup');
  const popupClose = document.getElementById('popup-close');
  let hasShownExitPopup = false;
  let exitIntentTriggered = false;

  document.addEventListener('mouseleave', (e) => {
    if (e.clientY <= 0 && !hasShownExitPopup && !exitIntentTriggered) {
      exitIntentTriggered = true;
      setTimeout(() => {
        if (!hasShownExitPopup) {
          exitPopup.classList.add('visible');
          hasShownExitPopup = true;
        }
      }, 500);
    }
  });

  if (popupClose) {
    popupClose.addEventListener('click', () => {
      exitPopup.classList.remove('visible');
    });
  }

  if (exitPopup) {
    exitPopup.addEventListener('click', (e) => {
      if (e.target === exitPopup) {
        exitPopup.classList.remove('visible');
      }
    });
  }

  document.querySelectorAll('.popup-cta').forEach(link => {
    link.addEventListener('click', () => {
      exitPopup.classList.remove('visible');
    });
  });

  // Active nav indicator
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a:not(.btn)');

  function updateActiveNav() {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 150;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      link.classList.remove('nav-active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('nav-active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav);
  updateActiveNav();

  // Scroll to top
  const scrollTopBtn = document.getElementById('scroll-top');
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
    });
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();
