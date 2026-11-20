/* =========================================================
   Save Every Drop – Main Application Logic
   Runs 100% locally in the browser using localStorage.
   ========================================================= */

(function () {
  "use strict";

  // LocalStorage keys
  const STORAGE_KEYS = {
    REPORTS: "sed_reports_v1",
    SURVEYS: "sed_surveys_v1",
    ACTIONS: "sed_actions_v1",
    DEMO_CLEARED: "sed_demo_cleared_v1",
    DATA_MODE: "sed_data_mode_v1",
    SESSION_TIPS: "sed_session_tips_v1"
  };

  // App state
  let state = {
    reports: [],
    surveys: [],
    actions: [],
    sessionTipIds: [],
    pendingPhotoDataUrl: ""
  };

  // Chart.js instances (destroyed before re-rendering to avoid overlap)
  const charts = {
    categories: null,
    reports: null,
    survey: null,
    beforeAfter: null
  };

  // ==================== Initialization ====================

  document.addEventListener("DOMContentLoaded", () => {
    loadState();
    setupNavigation();
    setupReportForm();
    setupAwarenessTips();
    setupSurveyForm();
    setupAdminControls();
    setupModal();
    renderAll();

    // Respect URL hash on initial load if valid
    const initialHash = window.location.hash.replace("#", "");
    if (initialHash && document.getElementById(`view-${initialHash}`)) {
      switchView(initialHash, false);
    }
  });

  // ==================== State & LocalStorage ====================

  function safeParse(raw, fallback) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function safeSave(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      return false;
    }
  }

  function loadState() {
    const configMode = PROJECT_CONFIG.useDemoDataByDefault ? "demo" : "actual";
    const savedMode = localStorage.getItem(STORAGE_KEYS.DATA_MODE);

    const existingReports = safeParse(localStorage.getItem(STORAGE_KEYS.REPORTS), null);
    const existingSurveys = safeParse(localStorage.getItem(STORAGE_KEYS.SURVEYS), null);
    const existingActions = safeParse(localStorage.getItem(STORAGE_KEYS.ACTIONS), null);
    const demoCleared = localStorage.getItem(STORAGE_KEYS.DEMO_CLEARED) === "true";

    // First-time load or config mode changed in data.js
    if (!existingReports || !existingSurveys || !existingActions || savedMode !== configMode) {
      const userReports = Array.isArray(existingReports)
        ? existingReports.filter((r) => !r.isDemo)
        : [];
      const userSurveys = Array.isArray(existingSurveys)
        ? existingSurveys.filter((s) => !s.isDemo)
        : [];
      const userActions = Array.isArray(existingActions)
        ? existingActions.filter((a) => !a.isDemo)
        : [];

      const includeDemo = PROJECT_CONFIG.useDemoDataByDefault && !(savedMode === configMode && demoCleared);

      state.reports = mergeUniqueById([
        ...userReports,
        ...ACTUAL_REPORTS.map((r) => ({ ...r, isDemo: false })),
        ...(includeDemo ? DEMO_REPORTS.map((r) => ({ ...r, isDemo: true })) : [])
      ]);

      state.surveys = mergeUniqueById([
        ...userSurveys,
        ...ACTUAL_SURVEYS.map((s) => ({ ...s, isDemo: false })),
        ...(includeDemo ? DEMO_SURVEYS.map((s) => ({ ...s, isDemo: true })) : [])
      ]);

      state.actions = mergeUniqueById([
        ...userActions,
        ...(includeDemo ? DEMO_ACTIONS.map((a) => ({ ...a, isDemo: true })) : [])
      ]);

      localStorage.setItem(STORAGE_KEYS.DATA_MODE, configMode);
      localStorage.setItem(STORAGE_KEYS.DEMO_CLEARED, includeDemo ? "false" : "true");
      persistState();
    } else {
      state.reports = existingReports;
      state.surveys = existingSurveys;
      state.actions = existingActions;
    }

    state.sessionTipIds = safeParse(localStorage.getItem(STORAGE_KEYS.SESSION_TIPS), []);
  }

  function mergeUniqueById(items) {
    const seen = new Set();
    return items.filter((item) => {
      if (!item || !item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  function persistState() {
    const ok1 = safeSave(STORAGE_KEYS.REPORTS, state.reports);
    const ok2 = safeSave(STORAGE_KEYS.SURVEYS, state.surveys);
    const ok3 = safeSave(STORAGE_KEYS.ACTIONS, state.actions);
    safeSave(STORAGE_KEYS.SESSION_TIPS, state.sessionTipIds);
    return ok1 && ok2 && ok3;
  }

  function hasAnyDemoData() {
    return (
      state.reports.some((r) => r.isDemo) ||
      state.surveys.some((s) => s.isDemo) ||
      state.actions.some((a) => a.isDemo)
    );
  }

  // ==================== Navigation ====================

  function setupNavigation() {
    const menuToggle = document.getElementById("menu-toggle");
    const mainNav = document.getElementById("main-nav");

    menuToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.querySelectorAll("[data-nav]").forEach((trigger) => {
      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        const target = trigger.getAttribute("data-nav");
        switchView(target, true);
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });

    window.addEventListener("hashchange", () => {
      const target = window.location.hash.replace("#", "") || "home";
      if (document.getElementById(`view-${target}`)) {
        switchView(target, false);
      }
    });
  }

  function switchView(viewName, updateHash) {
    document.querySelectorAll(".view").forEach((section) => {
      section.classList.toggle("active", section.id === `view-${viewName}`);
    });

    document.querySelectorAll(".nav-link").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-nav") === viewName);
    });

    if (updateHash) {
      history.replaceState(null, "", `#${viewName}`);
    }

    if (viewName === "dashboard") {
      renderCharts();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ==================== Report Water Wastage Form ====================

  function setupReportForm() {
    const form = document.getElementById("report-form");
    const photoInput = document.getElementById("report-photo");
    const previewWrap = document.getElementById("photo-preview-wrap");
    const previewImg = document.getElementById("photo-preview-img");
    const removePhotoBtn = document.getElementById("remove-photo-btn");
    const feedback = document.getElementById("report-feedback");

    photoInput.addEventListener("change", () => {
      const file = photoInput.files && photoInput.files[0];
      if (!file) {
        clearPhotoPreview();
        return;
      }

      if (!file.type.startsWith("image/")) {
        showAlert(feedback, "Please choose a valid image file.", "error");
        photoInput.value = "";
        clearPhotoPreview();
        return;
      }

      compressImage(file, 640, 0.72)
        .then((dataUrl) => {
          state.pendingPhotoDataUrl = dataUrl;
          previewImg.src = dataUrl;
          previewWrap.classList.remove("hidden");
        })
        .catch(() => {
          showAlert(feedback, "Could not process the selected image. You may still submit without a photo.", "error");
          clearPhotoPreview();
        });
    });

    removePhotoBtn.addEventListener("click", () => {
      photoInput.value = "";
      clearPhotoPreview();
    });

    form.addEventListener("reset", () => {
      clearPhotoPreview();
      feedback.classList.add("hidden");
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const location = document.getElementById("report-location").value.trim();
      const issueType = document.getElementById("report-type").value.trim();
      const description = document.getElementById("report-description").value.trim();

      if (!location || !issueType || !description) {
        showAlert(feedback, "Please fill in the location, issue type, and description.", "error");
        return;
      }

      const newReport = {
        id: generateId("R"),
        date: getTodayISO(),
        location,
        issueType,
        description,
        photoDataUrl: state.pendingPhotoDataUrl || "",
        status: "Open",
        isDemo: false
      };

      state.reports.unshift(newReport);

      if (!persistState()) {
        // Fallback if browser storage is full because of photo size
        newReport.photoDataUrl = "";
        persistState();
        showAlert(
          feedback,
          `Report ${newReport.id} saved without the photo due to browser storage limits.`,
          "success"
        );
      } else {
        showAlert(
          feedback,
          `Thank you! Report ${newReport.id} has been recorded as Actual Data and added to the Admin / Data section.`,
          "success"
        );
      }

      form.reset();
      clearPhotoPreview();
      renderAll();
      showToast(`Report ${newReport.id} submitted.`);
    });

    function clearPhotoPreview() {
      state.pendingPhotoDataUrl = "";
      previewImg.src = "";
      previewWrap.classList.add("hidden");
    }
  }

  function compressImage(file, maxWidth, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const scale = Math.min(1, maxWidth / img.width);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ==================== Awareness Section ====================

  function setupAwarenessTips() {
    const tipsGrid = document.getElementById("tips-grid");

    tipsGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".tip-action-btn");
      if (!btn) return;

      const card = btn.closest(".tip-card");
      const tipId = card.getAttribute("data-tip-id");
      const tipTitle = card.getAttribute("data-tip-title");

      const alreadyCommitted = state.sessionTipIds.includes(tipId);

      if (alreadyCommitted) {
        // Remove latest actual pledge for this tip
        state.sessionTipIds = state.sessionTipIds.filter((id) => id !== tipId);
        const idx = state.actions.findIndex((a) => !a.isDemo && a.tipId === tipId);
        if (idx !== -1) state.actions.splice(idx, 1);
        showToast("Action commitment removed.");
      } else {
        state.sessionTipIds.push(tipId);
        state.actions.unshift({
          id: generateId("A"),
          tipId,
          title: tipTitle,
          date: getTodayISO(),
          isDemo: false
        });
        showToast("Water-saving action recorded!");
      }

      persistState();
      renderAll();
    });
  }

  function renderAwarenessTips() {
    const cards = document.querySelectorAll(".tip-card");
    let committedCount = 0;

    cards.forEach((card) => {
      const tipId = card.getAttribute("data-tip-id");
      const btn = card.querySelector(".tip-action-btn");
      const isCommitted = state.sessionTipIds.includes(tipId);

      card.classList.toggle("committed", isCommitted);
      btn.textContent = isCommitted ? "Action Committed ✓" : "Commit to This Action";
      if (isCommitted) committedCount++;
    });

    const progressText = document.getElementById("pledge-progress-text");
    const progressBar = document.getElementById("pledge-progress-bar");
    progressText.textContent = `${committedCount} of ${cards.length} actions practiced`;
    progressBar.style.width = `${(committedCount / cards.length) * 100}%`;
  }

  // ==================== Quick Survey Form ====================

  function setupSurveyForm() {
    const form = document.getElementById("survey-form");
    const feedback = document.getElementById("survey-feedback");

    form.addEventListener("reset", () => {
      feedback.classList.add("hidden");
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const awareness = document.getElementById("q1-awareness").value.trim();
      const noticeWastage = document.getElementById("q2-notice").value.trim();
      const reportLeaks = document.getElementById("q3-report").value.trim();
      const remindersInfluence = document.getElementById("q4-reminders").value.trim();
      const suggestion = document.getElementById("q5-suggestion").value.trim();

      if (!awareness || !noticeWastage || !reportLeaks || !remindersInfluence || !suggestion) {
        showAlert(feedback, "Please answer all 5 questions before submitting.", "error");
        return;
      }

      const newSurvey = {
        id: generateId("S"),
        date: getTodayISO(),
        awareness,
        noticeWastage,
        reportLeaks,
        remindersInfluence,
        suggestion,
        isDemo: false
      };

      state.surveys.unshift(newSurvey);
      persistState();
      form.reset();

      showAlert(
        feedback,
        `Thank you for participating! Survey response ${newSurvey.id} has been saved as Actual Data.`,
        "success"
      );
      renderAll();
      showToast(`Survey response ${newSurvey.id} recorded.`);
    });
  }

  // ==================== Admin Controls & CSV Export ====================

  function setupAdminControls() {
    document.getElementById("export-reports-btn").addEventListener("click", exportReportsCSV);
    document.getElementById("export-surveys-btn").addEventListener("click", exportSurveysCSV);

    document.getElementById("clear-demo-btn").addEventListener("click", () => {
      if (!hasAnyDemoData()) {
        showToast("Demo data is already cleared.");
        return;
      }
      state.reports = state.reports.filter((r) => !r.isDemo);
      state.surveys = state.surveys.filter((s) => !s.isDemo);
      state.actions = state.actions.filter((a) => !a.isDemo);
      localStorage.setItem(STORAGE_KEYS.DEMO_CLEARED, "true");
      persistState();
      renderAll();
      showToast("Demo data cleared. Actual submitted data was kept.");
    });

    document.getElementById("restore-demo-btn").addEventListener("click", () => {
      state.reports = mergeUniqueById([
        ...state.reports,
        ...DEMO_REPORTS.map((r) => ({ ...r, isDemo: true }))
      ]);
      state.surveys = mergeUniqueById([
        ...state.surveys,
        ...DEMO_SURVEYS.map((s) => ({ ...s, isDemo: true }))
      ]);
      state.actions = mergeUniqueById([
        ...state.actions,
        ...DEMO_ACTIONS.map((a) => ({ ...a, isDemo: true }))
      ]);
      localStorage.setItem(STORAGE_KEYS.DEMO_CLEARED, "false");
      persistState();
      renderAll();
      showToast("Demo data restored.");
    });

    document.getElementById("clear-all-btn").addEventListener("click", () => {
      const confirmed = window.confirm(
        "Are you sure you want to delete ALL reports, survey responses, and action pledges from this browser?"
      );
      if (!confirmed) return;

      state.reports = [];
      state.surveys = [];
      state.actions = [];
      state.sessionTipIds = [];
      localStorage.setItem(STORAGE_KEYS.DEMO_CLEARED, "true");
      persistState();
      renderAll();
      showToast("All local data cleared.");
    });

    // Event delegation for report status toggle & photo preview
    document.getElementById("reports-table-body").addEventListener("click", (e) => {
      const statusBtn = e.target.closest("[data-action='toggle-status']");
      if (statusBtn) {
        const id = statusBtn.getAttribute("data-id");
        const report = state.reports.find((r) => r.id === id);
        if (report) {
          report.status = report.status === "Open" ? "Resolved" : "Open";
          persistState();
          renderAll();
          showToast(`Report ${report.id} marked as ${report.status}.`);
        }
        return;
      }

      const photoBtn = e.target.closest("[data-action='view-photo']");
      if (photoBtn) {
        const id = photoBtn.getAttribute("data-id");
        const report = state.reports.find((r) => r.id === id);
        if (report && report.photoDataUrl) {
          openPhotoModal(report.photoDataUrl, `${report.id} – ${report.location} (${report.issueType})`);
        }
      }
    });
  }

  function exportReportsCSV() {
    if (state.reports.length === 0) {
      showToast("No reports available to export.");
      return;
    }

    const headers = ["ID", "Date", "Data Source", "Location", "Issue Type", "Description", "Has Photo", "Status"];
    const rows = state.reports.map((r) => [
      r.id,
      r.date,
      r.isDemo ? "Demo Data" : "Actual Data",
      r.location,
      r.issueType,
      r.description,
      r.photoDataUrl ? "Yes" : "No",
      r.status
    ]);

    downloadCSV("save-every-drop-reports.csv", headers, rows);
    showToast("Reports exported as CSV.");
  }

  function exportSurveysCSV() {
    if (state.surveys.length === 0) {
      showToast("No survey responses available to export.");
      return;
    }

    const headers = [
      "ID",
      "Date",
      "Data Source",
      "Q1 Awareness",
      "Q2 Notice Wastage",
      "Q3 Report Leaks",
      "Q4 Reminders Influence",
      "Q5 Improvement Suggestion"
    ];
    const rows = state.surveys.map((s) => [
      s.id,
      s.date,
      s.isDemo ? "Demo Data" : "Actual Data",
      s.awareness,
      s.noticeWastage,
      s.reportLeaks,
      s.remindersInfluence,
      s.suggestion
    ]);

    downloadCSV("save-every-drop-surveys.csv", headers, rows);
    showToast("Survey responses exported as CSV.");
  }

  function downloadCSV(filename, headers, rows) {
    const csvCell = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;
    const csvContent = [headers, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ==================== Rendering UI ====================

  function renderAll() {
    renderGlobalBanner();
    renderHomeKPIs();
    renderAwarenessTips();
    renderAdminTables();
    renderCharts();
  }

  function renderGlobalBanner() {
    const strip = document.getElementById("global-data-banner");
    const text = document.getElementById("global-data-banner-text");
    const homeBadge = document.getElementById("home-data-badge");
    const dashBadge = document.getElementById("dashboard-data-badge");

    const demoActive = hasAnyDemoData();
    const hasActual =
      state.reports.some((r) => !r.isDemo) ||
      state.surveys.some((s) => !s.isDemo) ||
      state.actions.some((a) => !a.isDemo);

    if (demoActive) {
      strip.classList.remove("actual-only");
      text.textContent = hasActual
        ? "Demo Mode Active: Showing clearly labeled Demo Data alongside your submitted Actual Data."
        : "Demo Mode Active: Currently displaying sample Demo Data. Submit forms or clear demo data in Admin.";
      homeBadge.textContent = hasActual ? "Demo + Actual Data" : "Demo Data";
      dashBadge.textContent = hasActual ? "Demo + Actual Data" : "Demo Data";
      homeBadge.classList.remove("actual");
      dashBadge.classList.remove("actual");
    } else {
      strip.classList.add("actual-only");
      text.textContent = "Actual Data Mode: Demo data is cleared. Only real collected entries are shown.";
      homeBadge.textContent = "Actual Data Only";
      dashBadge.textContent = "Actual Data Only";
      homeBadge.classList.add("actual");
      dashBadge.classList.add("actual");
    }
  }

  function renderHomeKPIs() {
    const actualReports = state.reports.filter((r) => !r.isDemo).length;
    const demoReports = state.reports.filter((r) => r.isDemo).length;

    const actualSurveys = state.surveys.filter((s) => !s.isDemo).length;
    const demoSurveys = state.surveys.filter((s) => s.isDemo).length;

    const actualActions = state.actions.filter((a) => !a.isDemo).length;
    const demoActions = state.actions.filter((a) => a.isDemo).length;

    document.getElementById("kpi-reports").textContent = state.reports.length;
    document.getElementById("kpi-reports-sub").textContent = `${actualReports} actual · ${demoReports} demo`;

    document.getElementById("kpi-surveys").textContent = state.surveys.length;
    document.getElementById("kpi-surveys-sub").textContent = `${actualSurveys} actual · ${demoSurveys} demo`;

    document.getElementById("kpi-actions").textContent = state.actions.length;
    document.getElementById("kpi-actions-sub").textContent = `${actualActions} actual · ${demoActions} demo`;
  }

  function renderAdminTables() {
    const actualReports = state.reports.filter((r) => !r.isDemo).length;
    const actualSurveys = state.surveys.filter((s) => !s.isDemo).length;

    document.getElementById("admin-total-reports").textContent = state.reports.length;
    document.getElementById("admin-actual-reports").textContent = actualReports;
    document.getElementById("admin-total-surveys").textContent = state.surveys.length;
    document.getElementById("admin-actual-surveys").textContent = actualSurveys;
    document.getElementById("admin-total-actions").textContent = state.actions.length;

    // Render Reports Table
    const reportsBody = document.getElementById("reports-table-body");
    if (state.reports.length === 0) {
      reportsBody.innerHTML = `<tr><td colspan="8" class="empty-row">No water wastage reports recorded yet.</td></tr>`;
    } else {
      reportsBody.innerHTML = state.reports
        .map((r) => {
          const sourceBadge = r.isDemo
            ? `<span class="badge badge-demo">Demo Data</span>`
            : `<span class="badge badge-actual">Actual Data</span>`;

          const statusClass = r.status === "Resolved" ? "status-resolved" : "status-open";
          const photoCell = r.photoDataUrl
            ? `<button type="button" class="thumb-btn" data-action="view-photo" data-id="${escapeHTML(r.id)}" title="View full photo">
                 <img src="${r.photoDataUrl}" alt="Report photo" />
               </button>`
            : `<span class="small-muted">None</span>`;

          return `
            <tr>
              <td><strong>${escapeHTML(r.id)}</strong></td>
              <td>${escapeHTML(r.date)}</td>
              <td>${sourceBadge}</td>
              <td>${escapeHTML(r.location)}</td>
              <td>${escapeHTML(r.issueType)}</td>
              <td>${escapeHTML(r.description)}</td>
              <td>${photoCell}</td>
              <td>
                <button type="button" class="status-btn ${statusClass}" data-action="toggle-status" data-id="${escapeHTML(r.id)}">
                  ${escapeHTML(r.status)}
                </button>
              </td>
            </tr>
          `;
        })
        .join("");
    }

    // Render Survey Table
    const surveysBody = document.getElementById("surveys-table-body");
    if (state.surveys.length === 0) {
      surveysBody.innerHTML = `<tr><td colspan="8" class="empty-row">No survey responses recorded yet.</td></tr>`;
    } else {
      surveysBody.innerHTML = state.surveys
        .map((s) => {
          const sourceBadge = s.isDemo
            ? `<span class="badge badge-demo">Demo Data</span>`
            : `<span class="badge badge-actual">Actual Data</span>`;

          return `
            <tr>
              <td><strong>${escapeHTML(s.id)}</strong></td>
              <td>${escapeHTML(s.date)}</td>
              <td>${sourceBadge}</td>
              <td>${escapeHTML(s.awareness)}</td>
              <td>${escapeHTML(s.noticeWastage)}</td>
              <td>${escapeHTML(s.reportLeaks)}</td>
              <td>${escapeHTML(s.remindersInfluence)}</td>
              <td>${escapeHTML(s.suggestion)}</td>
            </tr>
          `;
        })
        .join("");
    }
  }

  // ==================== Charts (Chart.js) ====================

  function setChartBadge(elId, hasDemo, hasActual) {
    const el = document.getElementById(elId);
    el.className = "badge";
    if (hasDemo && hasActual) {
      el.textContent = "Demo + Actual Data";
      el.classList.add("badge-mixed");
    } else if (hasDemo) {
      el.textContent = "Demo Data";
      el.classList.add("badge-demo");
    } else if (hasActual) {
      el.textContent = "Actual Data";
      el.classList.add("badge-actual");
    } else {
      el.textContent = "No Data";
      el.classList.add("badge-demo");
    }
  }

  function renderCharts() {
    const offlineNotice = document.getElementById("chart-offline-notice");

    if (typeof window.Chart === "undefined") {
      offlineNotice.classList.remove("hidden");
      return;
    }
    offlineNotice.classList.add("hidden");

    const reportHasDemo = state.reports.some((r) => r.isDemo);
    const reportHasActual = state.reports.some((r) => !r.isDemo);
    const surveyHasDemo = state.surveys.some((s) => s.isDemo);
    const surveyHasActual = state.surveys.some((s) => !s.isDemo);

    // 1. Issue Categories Chart
    setChartBadge("badge-chart-categories", reportHasDemo, reportHasActual);
    const emptyCategories = document.getElementById("empty-chart-categories");
    if (charts.categories) charts.categories.destroy();

    if (state.reports.length === 0) {
      emptyCategories.classList.remove("hidden");
    } else {
      emptyCategories.classList.add("hidden");
      const categoryLabels = [
        "Leaking tap",
        "Tap left running",
        "Water cooler issue",
        "Toilet/washroom wastage",
        "Other"
      ];
      const categoryCounts = categoryLabels.map(
        (label) => state.reports.filter((r) => r.issueType === label).length
      );

      charts.categories = new Chart(document.getElementById("chart-categories"), {
        type: "doughnut",
        data: {
          labels: categoryLabels,
          datasets: [
            {
              data: categoryCounts,
              backgroundColor: ["#0284c7", "#0f766e", "#38bdf8", "#f59e0b", "#64748b"],
              borderWidth: 2,
              borderColor: "#ffffff"
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 12 } } }
          }
        }
      });
    }

    // 2. Number of Reports Chart (Source & Status)
    setChartBadge("badge-chart-reports", reportHasDemo, reportHasActual);
    const emptyReports = document.getElementById("empty-chart-reports");
    if (charts.reports) charts.reports.destroy();

    if (state.reports.length === 0) {
      emptyReports.classList.remove("hidden");
    } else {
      emptyReports.classList.add("hidden");
      const actualOpen = state.reports.filter((r) => !r.isDemo && r.status === "Open").length;
      const actualResolved = state.reports.filter((r) => !r.isDemo && r.status === "Resolved").length;
      const demoOpen = state.reports.filter((r) => r.isDemo && r.status === "Open").length;
      const demoResolved = state.reports.filter((r) => r.isDemo && r.status === "Resolved").length;

      charts.reports = new Chart(document.getElementById("chart-reports"), {
        type: "bar",
        data: {
          labels: ["Actual Data", "Demo Data"],
          datasets: [
            {
              label: "Open",
              data: [actualOpen, demoOpen],
              backgroundColor: "#0284c7",
              borderRadius: 6
            },
            {
              label: "Resolved",
              data: [actualResolved, demoResolved],
              backgroundColor: "#15803d",
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } }
          },
          plugins: {
            legend: { position: "bottom" }
          }
        }
      });
    }

    // 3. Survey Responses Chart
    setChartBadge("badge-chart-survey", surveyHasDemo, surveyHasActual);
    const emptySurvey = document.getElementById("empty-chart-survey");
    if (charts.survey) charts.survey.destroy();

    if (state.surveys.length === 0) {
      emptySurvey.classList.remove("hidden");
    } else {
      emptySurvey.classList.add("hidden");

      const highAware = state.surveys.filter(
        (s) => s.awareness === "Very aware" || s.awareness === "Moderately aware"
      ).length;
      const noticeOften = state.surveys.filter(
        (s) => s.noticeWastage === "Frequently" || s.noticeWastage === "Sometimes"
      ).length;
      const usuallyReport = state.surveys.filter(
        (s) => s.reportLeaks === "Yes, always" || s.reportLeaks === "Sometimes"
      ).length;
      const remindersPositive = state.surveys.filter(
        (s) => s.remindersInfluence === "Yes, definitely" || s.remindersInfluence === "Probably yes"
      ).length;

      charts.survey = new Chart(document.getElementById("chart-survey"), {
        type: "bar",
        data: {
          labels: [
            "Aware of Wastage",
            "Notice Wastage",
            "Report Leaks",
            "Reminders Would Help"
          ],
          datasets: [
            {
              label: "Number of Students",
              data: [highAware, noticeOften, usuallyReport, remindersPositive],
              backgroundColor: ["#0369a1", "#0891b2", "#d97706", "#0f766e"],
              borderRadius: 6
            }
          ]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    // 4. Awareness Before vs. After Chart
    const emptyBeforeAfter = document.getElementById("empty-chart-before-after");
    const beforeAfterSub = document.getElementById("before-after-sub");
    if (charts.beforeAfter) charts.beforeAfter.destroy();

    const useActualBA = Boolean(ACTUAL_BEFORE_AFTER && Array.isArray(ACTUAL_BEFORE_AFTER.labels));
    const useDemoBA = !useActualBA && hasAnyDemoData();

    if (useActualBA) {
      setChartBadge("badge-chart-before-after", false, true);
      beforeAfterSub.textContent = "Measured pre-intervention vs. post-intervention student survey results.";
      emptyBeforeAfter.classList.add("hidden");
      drawBeforeAfterChart(ACTUAL_BEFORE_AFTER);
    } else if (useDemoBA) {
      setChartBadge("badge-chart-before-after", true, false);
      beforeAfterSub.textContent = "Demo Data preview — replace ACTUAL_BEFORE_AFTER in data.js once real pre/post surveys are completed.";
      emptyBeforeAfter.classList.add("hidden");
      drawBeforeAfterChart(DEMO_BEFORE_AFTER);
    } else {
      setChartBadge("badge-chart-before-after", false, false);
      beforeAfterSub.textContent = "Awaiting real baseline and follow-up survey metrics.";
      emptyBeforeAfter.classList.remove("hidden");
    }
  }

  function drawBeforeAfterChart(dataset) {
    charts.beforeAfter = new Chart(document.getElementById("chart-before-after"), {
      type: "bar",
      data: {
        labels: dataset.labels,
        datasets: [
          {
            label: "Before Intervention (%)",
            data: dataset.before,
            backgroundColor: "#94a3b8",
            borderRadius: 6
          },
          {
            label: "After Intervention (%)",
            data: dataset.after,
            backgroundColor: "#0f766e",
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, max: 100, ticks: { callback: (v) => `${v}%` } }
        },
        plugins: {
          legend: { position: "bottom" }
        }
      }
    });
  }

  // ==================== Photo Modal & Utilities ====================

  function setupModal() {
    const modal = document.getElementById("photo-modal");
    const closeBtn = document.getElementById("modal-close");
    const backdrop = document.getElementById("modal-backdrop");

    const closeModal = () => modal.classList.add("hidden");

    closeBtn.addEventListener("click", closeModal);
    backdrop.addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) {
        closeModal();
      }
    });
  }

  function openPhotoModal(src, caption) {
    document.getElementById("modal-img").src = src;
    document.getElementById("modal-caption").textContent = caption;
    document.getElementById("photo-modal").classList.remove("hidden");
  }

  function showAlert(el, message, type) {
    el.textContent = message;
    el.className = `alert ${type === "error" ? "alert-error" : "alert-success"}`;
    el.classList.remove("hidden");
  }

  let toastTimer = null;
  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.add("hidden");
    }, 2800);
  }

  function generateId(prefix) {
    const shortNum = String(Date.now()).slice(-4);
    return `${prefix}-${shortNum}`;
  }

  function getTodayISO() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function escapeHTML(str) {
    return String(str ?? "")
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "'");
  }
})();