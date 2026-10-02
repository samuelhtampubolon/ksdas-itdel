/**
 * KSDAS IT DEL - Main Application Controller
 * Version: 0.2
 * Orchestrates views, reactive updates, batch uploads, validation,
 * analytics, reports, and search.
 */

class KSDASApp {
  constructor() {
    this.store = window.ksdasStore;
    this.ai = window.ksdasAI;
    this.analytics = window.ksdasAnalytics;
    this.ui = window.ksdasUI;
    this.router = window.ksdasRouter;

    // View state
    this.activeFilters = {
      search: "",
      type: "ALL",
      status: "ALL",
      partnerId: "ALL",
      facultyId: "ALL",
      triDharma: "ALL",
      year: "ALL",
      qualityFlag: "ALL"
    };

    this.batchQueue = [];
    this.currentValidationDocId = null;
    this.selectedAccreditationFramework = "BAN-PT-IAPS";
    this.currentReportType = "EXECUTIVE_BRIEF";

    this.init();
  }

  init() {
    this.setupRoleSwitcher();
    this.setupGlobalEventListeners();
    this.setupStoreSubscriptions();
    this.updateNotificationBadge();
    
    // Initial view rendering
    this.onViewActivated(this.router.getCurrentRoute(), this.router.getParams());
  }

  setupStoreSubscriptions() {
    this.store.subscribe("state_changed", () => {
      this.refreshCurrentView();
      this.updateNotificationBadge();
    });

    this.store.subscribe("role_changed", (newRole) => {
      this.ui.showToast(`Mode pengguna diubah ke: ${this.store.getRoleDefinition(newRole).name}`, "info");
      this.updateRoleUI(newRole);
      this.refreshCurrentView();
    });

    this.store.subscribe("data_reset", () => {
      this.ui.showToast("Database demo berhasil di-reset ke kondisi awal.", "success");
      this.refreshCurrentView();
    });

    this.store.subscribe("data_imported", () => {
      this.ui.showToast("Data cadangan berhasil diimpor ke sistem.", "success");
      this.refreshCurrentView();
    });
  }

  setupRoleSwitcher() {
    const roleSelect = document.getElementById("header-role-select");
    if (!roleSelect) return;

    roleSelect.innerHTML = (this.store.state.roles || []).map(r => 
      `<option value="${r.id}" ${r.id === this.store.getCurrentRole() ? "selected" : ""}>${r.name}</option>`
    ).join("");

    roleSelect.addEventListener("change", (e) => {
      this.store.setCurrentRole(e.target.value);
    });

    this.updateRoleUI(this.store.getCurrentRole());
  }

  updateRoleUI(roleId) {
    const roleDef = this.store.getRoleDefinition(roleId);
    const badgeEl = document.getElementById("current-user-role-badge");
    if (badgeEl) {
      badgeEl.textContent = roleDef.name;
    }

    // Role-dependent UI visibility
    const isStaffOrAdmin = ["ADMIN_STAFF", "BUREAU_HEAD", "WR3"].includes(roleId);
    document.querySelectorAll(".staff-only-action").forEach(el => {
      el.style.display = isStaffOrAdmin ? "" : "none";
    });
  }

  setupGlobalEventListeners() {
    // Mobile menu toggle
    const mobileBtn = document.getElementById("mobile-menu-btn");
    const sidebar = document.querySelector(".app-sidebar");
    if (mobileBtn && sidebar) {
      mobileBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
      });
    }

    // Quick search trigger
    const searchTrigger = document.getElementById("header-search-trigger");
    if (searchTrigger) {
      searchTrigger.addEventListener("click", () => {
        this.ui.openModal("modal-quick-search");
        document.getElementById("quick-search-input")?.focus();
      });
    }

    // Quick search input handler
    const quickInput = document.getElementById("quick-search-input");
    if (quickInput) {
      quickInput.addEventListener("input", (e) => {
        this.renderQuickSearchResults(e.target.value);
      });
    }

    // Notification bell trigger
    const notifBtn = document.getElementById("header-notif-btn");
    if (notifBtn) {
      notifBtn.addEventListener("click", () => {
        this.renderNotificationDrawer();
        this.ui.openModal("modal-notifications");
      });
    }

    // Modal close buttons
    document.querySelectorAll("[data-close-modal]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const modalId = e.currentTarget.getAttribute("data-close-modal");
        this.ui.closeModal(modalId);
      });
    });

    // Close modal on backdrop click
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.classList.remove("open");
          document.body.style.overflow = "";
        }
      });
    });
  }

  updateNotificationBadge() {
    const badge = document.getElementById("header-notif-count");
    if (!badge) return;
    const notifs = this.store.getNotifications();
    badge.textContent = notifs.length;
    badge.style.display = notifs.length > 0 ? "flex" : "none";

    const sidebarBadge = document.getElementById("sidebar-validation-badge");
    const pending = (this.store.state.documents || []).filter(d => d.status === "AI_EXTRACTED" || d.status === "NEEDS_REVIEW").length;
    if (sidebarBadge) {
      sidebarBadge.textContent = pending;
      sidebarBadge.style.display = pending > 0 ? "inline-block" : "none";
    }
  }

  renderNotificationDrawer() {
    const listEl = document.getElementById("notification-list-container");
    if (!listEl) return;
    const notifs = this.store.getNotifications();

    if (notifs.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 8px;">🎉</div>
          <p style="font-weight: 600;">Semua Dokumen Terkendali</p>
          <p style="font-size: 0.8rem;">Tidak ada masa berlaku kritis atau dokumen pending saat ini.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = notifs.map(n => `
      <div style="padding: 14px 16px; border-bottom: 1px solid var(--border-color); display: flex; gap: 12px; align-items: flex-start;">
        <span style="font-size: 1.2rem;">${n.type === "DANGER" ? "🔴" : n.type === "WARNING" ? "🟡" : "🔵"}</span>
        <div style="flex: 1;">
          <div style="font-weight: 700; font-size: 0.86rem; color: var(--color-primary-dark);">${n.title}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin: 3px 0;">${n.message}</div>
          <a href="${n.link}" onclick="ksdasUI.closeModal('modal-notifications')" style="font-size: 0.78rem; font-weight: 600; color: var(--color-primary-light);">Lihat Dokumen &rarr;</a>
        </div>
      </div>
    `).join("");
  }

  renderQuickSearchResults(query) {
    const resultsContainer = document.getElementById("quick-search-results");
    if (!resultsContainer) return;
    const q = (query || "").trim().toLowerCase();

    if (!q) {
      resultsContainer.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">Ketik nomor dokumen, nama mitra, atau kata kunci untuk mencari...</div>`;
      return;
    }

    const matches = this.store.getDocuments({ search: q }).slice(0, 8);
    if (matches.length === 0) {
      resultsContainer.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">Tidak ditemukan dokumen yang cocok dengan "${query}".</div>`;
      return;
    }

    resultsContainer.innerHTML = matches.map(doc => `
      <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); cursor: pointer; display: flex; align-items: center; justify-content: space-between;"
           onclick="ksdasApp.viewDocumentDetail('${doc.id}'); ksdasUI.closeModal('modal-quick-search');"
           onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='transparent'">
        <div>
          <div style="font-weight: 600; font-size: 0.88rem; color: var(--color-primary-dark);">${doc.title}</div>
          <div style="font-size: 0.76rem; color: var(--text-muted);">${doc.documentNumber} &bull; ${doc.partnerName}</div>
        </div>
        <div>${this.ui.renderTypeBadge(doc.type)}</div>
      </div>
    `).join("");
  }

  // --- Router Hook ---
  onViewActivated(routeKey, params = {}) {
    if (params && Object.keys(params).length > 0) {
      Object.assign(this.activeFilters, params);
    }

    switch (routeKey) {
      case "dashboard":
        this.renderDashboardView();
        break;
      case "repository":
        this.renderRepositoryView();
        break;
      case "batch-upload":
        this.renderBatchUploadView();
        break;
      case "validation":
        this.renderValidationView();
        break;
      case "relationships":
        this.renderRelationshipsView();
        break;
      case "partners":
        this.renderPartnersView();
        break;
      case "activities":
        this.renderActivitiesView();
        break;
      case "analytics":
        this.renderAnalyticsView();
        break;
      case "accreditation":
        this.renderAccreditationView();
        break;
      case "reports":
        this.renderReportsView();
        break;
      case "nl-query":
        this.renderNLQueryView();
        break;
      case "audit":
        this.renderAuditView();
        break;
      case "settings":
        this.renderSettingsView();
        break;
    }
  }

  refreshCurrentView() {
    this.onViewActivated(this.router.getCurrentRoute(), this.router.getParams());
  }

  // ========================================================
  // 1. DASHBOARD VIEW
  // ========================================================
  renderDashboardView() {
    const docs = this.store.getDocuments();
    const partners = this.store.getPartners();
    const activities = this.store.getActivities();
    const kpis = this.analytics.getExecutiveKPIs(docs, partners, activities);

    // Render KPI Cards
    const kpiContainer = document.getElementById("dashboard-kpi-container");
    if (kpiContainer) {
      kpiContainer.innerHTML = `
        <div class="kpi-card" style="--kpi-accent: #0B2545;">
          <div class="kpi-header">
            <span class="kpi-label">Total Mitra Aktif</span>
            <div class="kpi-icon">🏛️</div>
          </div>
          <div class="kpi-value">${kpis.activePartners} <span style="font-size: 1rem; color: var(--text-muted); font-weight: normal;">/ ${kpis.totalPartners}</span></div>
          <div class="kpi-meta">Mitra industri, kampus & pemda</div>
        </div>

        <div class="kpi-card" style="--kpi-accent: #0077B6;">
          <div class="kpi-header">
            <span class="kpi-label">Nota Kesepahaman (MoU)</span>
            <div class="kpi-icon">📜</div>
          </div>
          <div class="kpi-value">${kpis.totalMoU}</div>
          <div class="kpi-meta">Dokumen payung induk</div>
        </div>

        <div class="kpi-card" style="--kpi-accent: #2A9D8F;">
          <div class="kpi-header">
            <span class="kpi-label">Perjanjian Kerja Sama (PKS)</span>
            <div class="kpi-icon">🤝</div>
          </div>
          <div class="kpi-value">${kpis.totalPKS}</div>
          <div class="kpi-meta">${kpis.totalIA} Implementation Arrangement</div>
        </div>

        <div class="kpi-card" style="--kpi-accent: #E9C46A;">
          <div class="kpi-header">
            <span class="kpi-label">Total Komitmen Anggaran</span>
            <div class="kpi-icon">💰</div>
          </div>
          <div class="kpi-value" style="font-size: 1.4rem;">${this.ui.formatRupiah(kpis.totalBudget)}</div>
          <div class="kpi-meta">${kpis.totalParticipants} penerima manfaat</div>
        </div>

        <div class="kpi-card" style="--kpi-accent: #F4A261;">
          <div class="kpi-header">
            <span class="kpi-label">Masa Berlaku Kritis</span>
            <div class="kpi-icon">⏳</div>
          </div>
          <div class="kpi-value" style="color: ${kpis.expiringSoonCount > 0 ? 'var(--color-warning)' : 'inherit'};">${kpis.expiringSoonCount}</div>
          <div class="kpi-meta">${kpis.expiredCount} dokumen kedaluwarsa</div>
        </div>

        <div class="kpi-card" style="--kpi-accent: #E63946;">
          <div class="kpi-header">
            <span class="kpi-label">Menunggu Validasi</span>
            <div class="kpi-icon">🛡️</div>
          </div>
          <div class="kpi-value" style="color: ${kpis.pendingValidationCount > 0 ? 'var(--color-danger)' : 'inherit'};">${kpis.pendingValidationCount}</div>
          <div class="kpi-meta">${kpis.orphanCount} calon orphan agreement</div>
        </div>
      `;
    }

    // Render Implementation Funnel
    const funnelContainer = document.getElementById("dashboard-funnel-container");
    if (funnelContainer) {
      const funnel = this.analytics.getImplementationFunnel(docs, partners, activities);
      funnelContainer.innerHTML = funnel.map(item => `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.84rem; font-weight: 600; margin-bottom: 4px;">
            <span>${item.stage}</span>
            <span>${item.count} Dokumen (${item.percent}%)</span>
          </div>
          <div style="width: 100%; height: 10px; background: #E2E8F0; border-radius: var(--radius-full); overflow: hidden;">
            <div style="width: ${item.percent}%; height: 100%; background: ${item.color}; border-radius: var(--radius-full); transition: width 0.6s ease;"></div>
          </div>
        </div>
      `).join("");
    }

    // Render Alert Banner if critical
    const alertContainer = document.getElementById("dashboard-alert-banner");
    if (alertContainer) {
      if (kpis.expiringSoonCount > 0 || kpis.orphanCount > 0) {
        alertContainer.style.display = "flex";
        alertContainer.innerHTML = `
          <span style="font-size: 1.3rem;">⚠️</span>
          <div style="flex: 1;">
            <strong>Peringatan Tata Kelola Kemitraan IT Del:</strong>
            Terdapat <b>${kpis.expiringSoonCount} dokumen kerja sama</b> yang akan berakhir dalam 90 hari, dan <b>${kpis.orphanCount} dokumen PKS/IA orphan</b> yang belum tertaut ke MoU induk.
            <div style="margin-top: 6px;">
              <a href="#analytics" class="btn btn-sm btn-secondary" style="margin-right: 8px;">Monitoring Kedaluwarsa</a>
              <a href="#relationships" class="btn btn-sm btn-secondary">Tautkan Parent Orphan</a>
            </div>
          </div>
        `;
      } else {
        alertContainer.style.display = "none";
      }
    }

    // Render Charts
    setTimeout(() => {
      this.analytics.renderAgreementsChart("chart-agreements-trend", docs);
      this.analytics.renderTriDharmaChart("chart-tridharma-distribution", docs);
      this.analytics.renderPartnerTypeChart("chart-partner-type", partners);
      this.analytics.renderFacultyChart("chart-faculty-performance", docs);
    }, 50);

    // Recent Validated Documents
    const recentTable = document.getElementById("dashboard-recent-docs-tbody");
    if (recentTable) {
      const recent = [...docs].slice(0, 6);
      recentTable.innerHTML = recent.map(d => `
        <tr>
          <td>
            <div class="doc-title-cell">
              <span class="doc-primary-title" onclick="ksdasApp.viewDocumentDetail('${d.id}')">${d.title}</span>
              <span class="doc-number-sub">${d.documentNumber}</span>
            </div>
          </td>
          <td>${this.ui.renderTypeBadge(d.type)}</td>
          <td><strong>${d.partnerName}</strong></td>
          <td><span style="font-size: 0.8rem;">${d.signedDate || "-"}</span></td>
          <td>${this.ui.renderStatusBadge(d.status)}</td>
          <td>${this.ui.renderConfidenceBadge(d.confidenceScore)}</td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="ksdasApp.viewDocumentDetail('${d.id}')">Detail</button>
          </td>
        </tr>
      `).join("");
    }
  }

  // ========================================================
  // 2. DOCUMENT REPOSITORY VIEW
  // ========================================================
  renderRepositoryView() {
    this.renderFilterBar();
    this.renderRepositoryTable();
  }

  renderFilterBar() {
    const container = document.getElementById("repository-filter-container");
    if (!container) return;

    const partners = this.store.getPartners();
    const faculties = this.store.state.faculties || [];

    container.innerHTML = `
      <div class="filter-row">
        <input type="text" id="repo-search-input" class="form-control" style="flex: 1; min-width: 220px;" 
               placeholder="Cari judul, nomor dokumen, mitra, PIC..." value="${this.activeFilters.search || ''}">

        <select id="repo-filter-type" class="form-control">
          <option value="ALL">Semua Jenis Dokumen</option>
          <option value="MOU_LOI" ${this.activeFilters.type === "MOU_LOI" ? "selected" : ""}>MoU / LOI</option>
          <option value="PKS_MOA" ${this.activeFilters.type === "PKS_MOA" ? "selected" : ""}>PKS / MoA</option>
          <option value="IA" ${this.activeFilters.type === "IA" ? "selected" : ""}>Implementation Arrangement (IA)</option>
          <option value="PROPOSAL" ${this.activeFilters.type === "PROPOSAL" ? "selected" : ""}>Proposal</option>
          <option value="FINAL_REPORT" ${this.activeFilters.type === "FINAL_REPORT" ? "selected" : ""}>Laporan Akhir / LPJ</option>
        </select>

        <select id="repo-filter-status" class="form-control">
          <option value="ALL">Semua Status Validasi</option>
          <option value="AI_EXTRACTED" ${this.activeFilters.status === "AI_EXTRACTED" ? "selected" : ""}>AI EXTRACTED</option>
          <option value="NEEDS_REVIEW" ${this.activeFilters.status === "NEEDS_REVIEW" ? "selected" : ""}>NEEDS REVIEW</option>
          <option value="VALIDATED" ${this.activeFilters.status === "VALIDATED" ? "selected" : ""}>VALIDATED</option>
          <option value="REJECTED" ${this.activeFilters.status === "REJECTED" ? "selected" : ""}>REJECTED</option>
        </select>

        <select id="repo-filter-partner" class="form-control">
          <option value="ALL">Semua Mitra</option>
          ${partners.map(p => `<option value="${p.id}" ${this.activeFilters.partnerId === p.id ? "selected" : ""}>${p.name}</option>`).join("")}
        </select>

        <select id="repo-filter-tridharma" class="form-control">
          <option value="ALL">Semua Tri Dharma</option>
          <option value="EDUCATION" ${this.activeFilters.triDharma === "EDUCATION" ? "selected" : ""}>Pendidikan</option>
          <option value="RESEARCH" ${this.activeFilters.triDharma === "RESEARCH" ? "selected" : ""}>Penelitian</option>
          <option value="COMMUNITY_SERVICE" ${this.activeFilters.triDharma === "COMMUNITY_SERVICE" ? "selected" : ""}>Pengabdian</option>
          <option value="INSTITUTIONAL" ${this.activeFilters.triDharma === "INSTITUTIONAL" ? "selected" : ""}>Tata Kelola</option>
        </select>

        <select id="repo-filter-year" class="form-control">
          <option value="ALL">Semua Tahun</option>
          <option value="2027" ${this.activeFilters.year === "2027" ? "selected" : ""}>2027</option>
          <option value="2026" ${this.activeFilters.year === "2026" ? "selected" : ""}>2026</option>
          <option value="2025" ${this.activeFilters.year === "2025" ? "selected" : ""}>2025</option>
          <option value="2024" ${this.activeFilters.year === "2024" ? "selected" : ""}>2024</option>
          <option value="2023" ${this.activeFilters.year === "2023" ? "selected" : ""}>2023</option>
        </select>

        <button id="repo-reset-filter-btn" class="btn btn-secondary btn-sm">Reset Filter</button>
      </div>

      <div class="filter-chips" id="repo-active-chips"></div>
    `;

    // Bind event listeners
    const searchInput = document.getElementById("repo-search-input");
    searchInput?.addEventListener("input", (e) => {
      this.activeFilters.search = e.target.value;
      this.renderRepositoryTable();
    });

    ["type", "status", "partner", "tridharma", "year"].forEach(field => {
      const el = document.getElementById(`repo-filter-${field}`);
      el?.addEventListener("change", (e) => {
        if (field === "partner") this.activeFilters.partnerId = e.target.value;
        else if (field === "tridharma") this.activeFilters.triDharma = e.target.value;
        else this.activeFilters[field] = e.target.value;
        this.renderRepositoryTable();
      });
    });

    document.getElementById("repo-reset-filter-btn")?.addEventListener("click", () => {
      this.activeFilters = {
        search: "",
        type: "ALL",
        status: "ALL",
        partnerId: "ALL",
        facultyId: "ALL",
        triDharma: "ALL",
        year: "ALL",
        qualityFlag: "ALL"
      };
      this.renderFilterBar();
      this.renderRepositoryTable();
    });
  }

  renderRepositoryTable() {
    const tbody = document.getElementById("repo-table-tbody");
    const countBadge = document.getElementById("repo-total-count-badge");
    if (!tbody) return;

    const docs = this.store.getDocuments(this.activeFilters);
    if (countBadge) {
      countBadge.textContent = `${docs.length} Dokumen`;
    }

    if (docs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 48px; color: var(--text-muted);">
            <div style="font-size: 2.2rem; margin-bottom: 8px;">📂</div>
            <div style="font-weight: 600;">Tidak ada dokumen yang sesuai dengan kriteria filter.</div>
            <div style="font-size: 0.8rem; margin-top: 4px;">Coba sesuaikan kata kunci pencarian atau reset filter.</div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = docs.map(doc => {
      const orphanBadge = (doc.type === "PKS_MOA" || doc.type === "IA") && !doc.parentId 
        ? `<span class="flag-pill">Orphan</span>` 
        : "";

      return `
        <tr>
          <td>
            <div class="doc-title-cell">
              <span class="doc-primary-title" onclick="ksdasApp.viewDocumentDetail('${doc.id}')">${doc.title}</span>
              <span class="doc-number-sub">${doc.documentNumber}</span>
              ${orphanBadge}
            </div>
          </td>
          <td>${this.ui.renderTypeBadge(doc.type)}</td>
          <td>
            <div><strong>${doc.partnerName}</strong></div>
            <div style="font-size: 0.74rem; color: var(--text-muted);">${doc.country || "Indonesia"}</div>
          </td>
          <td>
            <span style="font-size: 0.78rem; font-weight: 600; color: var(--color-primary);">${doc.triDharma || "EDUCATION"}</span>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${doc.facultyId || "FITE"}</div>
          </td>
          <td>
            <div style="font-size: 0.78rem;">${doc.signedDate || "-"}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">s/d ${doc.effectiveEndDate || "-"}</div>
          </td>
          <td>${this.ui.renderStatusBadge(doc.status)}</td>
          <td>${this.ui.renderConfidenceBadge(doc.confidenceScore)}</td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-sm btn-secondary" onclick="ksdasApp.viewDocumentDetail('${doc.id}')" title="Detail & OCR">Detail</button>
              ${doc.status !== "VALIDATED" ? `<button class="btn btn-sm btn-primary staff-only-action" onclick="ksdasApp.openValidationModal('${doc.id}')" title="Validasi Staf">Validasi</button>` : ""}
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  // ========================================================
  // 3. BATCH UPLOAD VIEW (Scenario A from handoff spec!)
  // ========================================================
  renderBatchUploadView() {
    const queueList = document.getElementById("batch-upload-queue-list");
    const sampleBtn = document.getElementById("batch-load-sample-btn");
    const startBtn = document.getElementById("batch-start-process-btn");
    const dropzone = document.getElementById("batch-upload-dropzone");
    const fileInput = document.getElementById("batch-file-input");

    if (dropzone && fileInput) {
      dropzone.onclick = () => fileInput.click();

      dropzone.ondragover = (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
      };

      dropzone.ondragleave = () => dropzone.classList.remove("dragover");

      dropzone.ondrop = (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer.files.length > 0) {
          this.handleFilesSelected(Array.from(e.dataTransfer.files));
        }
      };

      fileInput.onchange = (e) => {
        if (e.target.files.length > 0) {
          this.handleFilesSelected(Array.from(e.target.files));
        }
      };
    }

    if (sampleBtn) {
      sampleBtn.onclick = () => this.load10SampleDocuments();
    }

    if (startBtn) {
      startBtn.onclick = () => this.runBatchAIProcessing();
    }

    this.renderQueueItems();
  }

  async load10SampleDocuments() {
    try {
      const response = await fetch("sample-data/batch_upload_samples.json");
      const samples = await response.json();
      this.batchQueue = samples.map(s => ({
        ...s,
        id: "QUEUE-" + Math.floor(Math.random() * 10000),
        status: "QUEUED",
        progress: 0,
        result: null
      }));
      this.ui.showToast("10 Dokumen Sampel IT Del berhasil dimuat ke antrean!", "success");
      this.renderQueueItems();
    } catch (e) {
      console.error("Gagal memuat batch_upload_samples.json:", e);
      this.ui.showToast("Gagal memuat data simulasi batch upload", "danger");
    }
  }

  handleFilesSelected(files) {
    files.forEach(f => {
      this.batchQueue.push({
        id: "QUEUE-" + Math.floor(Math.random() * 10000),
        fileName: f.name,
        fileSize: (f.size / (1024 * 1024)).toFixed(1) + " MB",
        simulatedOcrText: `DOKUMEN KERJA SAMA INSTITUT TEKNOLOGI DEL: ${f.name}. Mengatur tentang pelaksanaan Tri Dharma Perguruan Tinggi, pengembangan riset bersama dan magang industri bersertifikat di kampus IT Del.`,
        status: "QUEUED",
        progress: 0,
        result: null
      });
    });
    this.renderQueueItems();
  }

  renderQueueItems() {
    const list = document.getElementById("batch-upload-queue-list");
    const countBadge = document.getElementById("batch-queue-count");
    const startBtn = document.getElementById("batch-start-process-btn");
    if (!list) return;

    if (countBadge) {
      countBadge.textContent = `${this.batchQueue.length} File`;
    }

    if (startBtn) {
      startBtn.disabled = this.batchQueue.length === 0;
    }

    if (this.batchQueue.length === 0) {
      list.innerHTML = `
        <div style="padding: 32px; text-align: center; color: var(--text-muted);">
          Antrean unggahan kosong. Tarik file dokumen ke area di atas atau klik tombol <b>"Muat 10 Dokumen Sampel Demo"</b>.
        </div>
      `;
      return;
    }

    list.innerHTML = this.batchQueue.map(item => `
      <div class="queue-item">
        <div class="queue-item-left">
          <div class="queue-item-icon">PDF</div>
          <div class="queue-item-meta">
            <span class="queue-item-name">${item.fileName}</span>
            <span class="queue-item-size">${item.fileSize} &bull; Status: <b>${item.status}</b></span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          ${item.result ? this.ui.renderTypeBadge(item.result.type) : ""}
          ${item.result ? this.ui.renderConfidenceBadge(item.result.confidenceScore) : ""}
          <span style="font-size: 0.85rem; font-weight: 700;">${item.progress}%</span>
        </div>
      </div>
    `).join("");
  }

  async runBatchAIProcessing() {
    const startBtn = document.getElementById("batch-start-process-btn");
    const progressFill = document.getElementById("batch-overall-progress-fill");
    const stageIndicator = document.getElementById("batch-processing-stage-indicator");
    if (startBtn) startBtn.disabled = true;

    const existingDocs = this.store.getDocuments();
    const batchId = "BATCH-UPLOAD-" + Date.now();

    for (let i = 0; i < this.batchQueue.length; i++) {
      const item = this.batchQueue[i];
      item.status = "PROCESSING";
      this.renderQueueItems();

      if (stageIndicator) {
        stageIndicator.textContent = `Memproses Dokumen ${i + 1} dari ${this.batchQueue.length}: ${item.fileName}...`;
      }

      // Simulate AI latency for realistic demo experience
      await new Promise(r => setTimeout(r, 250));

      // Execute Mock AI
      const processedDoc = this.ai.processDocument({
        name: item.fileName,
        fileSize: item.fileSize,
        text: item.simulatedOcrText,
        batchId: batchId
      }, existingDocs);

      // Save extracted document into store (as AI_EXTRACTED)
      this.store.addDocument(processedDoc);

      item.status = "EXTRACTED";
      item.progress = 100;
      item.result = processedDoc;

      if (progressFill) {
        const pct = Math.round(((i + 1) / this.batchQueue.length) * 100);
        progressFill.style.width = `${pct}%`;
      }
    }

    if (stageIndicator) {
      stageIndicator.innerHTML = `
        <span style="color: var(--color-success); font-weight: 700;">
          ✅ Berhasil! Seluruh ${this.batchQueue.length} dokumen telah diklasifikasikan dan diekstraksi ke status AI_EXTRACTED.
        </span>
      `;
    }

    this.ui.showToast(`Batch processing selesai: ${this.batchQueue.length} dokumen masuk antrean validasi manusia.`, "success");
    this.renderQueueItems();

    // Show jump to validation button
    const actionArea = document.getElementById("batch-complete-action-area");
    if (actionArea) {
      actionArea.style.display = "flex";
      actionArea.innerHTML = `
        <button class="btn btn-success" onclick="ksdasRouter.navigate('validation')">
          Buka Workspace Validasi Manusia (${this.batchQueue.length} dokumen) &rarr;
        </button>
        <button class="btn btn-secondary" onclick="ksdasRouter.navigate('dashboard')">
          Lihat di Dashboard
        </button>
      `;
    }
  }

  // ========================================================
  // 4. HUMAN VALIDATION WORKSPACE
  // ========================================================
  renderValidationView() {
    const listContainer = document.getElementById("validation-queue-list");
    const countBadge = document.getElementById("validation-pending-count");
    if (!listContainer) return;

    const pendingDocs = (this.store.state.documents || []).filter(d => 
      d.status === "AI_EXTRACTED" || d.status === "NEEDS_REVIEW"
    );

    if (countBadge) {
      countBadge.textContent = `${pendingDocs.length} Dokumen`;
    }

    if (pendingDocs.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 48px; color: var(--text-muted); background: #FFFFFF; border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🛡️</div>
          <h3 style="color: var(--color-primary-dark); margin-bottom: 6px;">Semua Dokumen Telah Divalidasi</h3>
          <p style="font-size: 0.88rem;">Tidak ada dokumen AI_EXTRACTED atau NEEDS_REVIEW yang tersisa. Data resmi telah terverifikasi penuh.</p>
          <button class="btn btn-primary" style="margin-top: 16px;" onclick="ksdasRouter.navigate('batch-upload')">Unggah Dokumen Baru</button>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = pendingDocs.map(doc => `
      <div class="card" style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="font-size: 1.8rem;">📄</div>
          <div>
            <div style="font-weight: 700; color: var(--color-primary-dark); font-size: 0.95rem;">${doc.title}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
              ${doc.documentNumber} &bull; <b>${doc.partnerName}</b> &bull; Jenis: ${this.ui.renderTypeBadge(doc.type)}
            </div>
            <div style="margin-top: 6px; display: flex; gap: 6px; align-items: center;">
              ${this.ui.renderStatusBadge(doc.status)}
              ${this.ui.renderConfidenceBadge(doc.confidenceScore)}
              ${(doc.qualityFlags || []).map(f => `<span class="flag-pill">${f}</span>`).join(" ")}
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm" onclick="ksdasApp.openValidationModal('${doc.id}')">
            Review & Validasi Side-by-Side
          </button>
          <button class="btn btn-success btn-sm staff-only-action" onclick="ksdasApp.quickApproveDoc('${doc.id}')">
            Setujui (Approve)
          </button>
        </div>
      </div>
    `).join("");

    // Bind bulk approve button
    const bulkBtn = document.getElementById("validation-bulk-approve-btn");
    if (bulkBtn) {
      const highConfIds = pendingDocs.filter(d => (d.confidenceScore || 0) >= 0.90).map(d => d.id);
      bulkBtn.disabled = highConfIds.length === 0;
      bulkBtn.textContent = `Setujui Sekaligus Confidence Tinggi (≥ 90%: ${highConfIds.length} Dokumen)`;
      bulkBtn.onclick = () => {
        const approvedCount = this.store.bulkValidate(highConfIds);
        this.ui.showToast(`${approvedCount} dokumen berkeyakinan tinggi berhasil divalidasi sebagai data resmi!`, "success");
        this.renderValidationView();
      };
    }
  }

  quickApproveDoc(docId) {
    this.store.updateDocument(docId, {
      status: "VALIDATED",
      officialDataConfirmed: true,
      validatedBy: this.store.getRoleDefinition().name,
      validatedDate: new Date().toISOString(),
      qualityFlags: []
    });
    this.ui.showToast("Dokumen disetujui sebagai data resmi IT Del.", "success");
    this.renderValidationView();
  }

  openValidationModal(docId) {
    this.currentValidationDocId = docId;
    const doc = this.store.getDocumentById(docId);
    if (!doc) return;

    const modalTitle = document.getElementById("validation-modal-title");
    const ocrPane = document.getElementById("validation-modal-ocr-text");
    const fieldsList = document.getElementById("validation-modal-fields-list");

    if (modalTitle) {
      modalTitle.innerHTML = `🛡️ Validasi Staf: <span>${doc.documentNumber}</span>`;
    }

    if (ocrPane) {
      ocrPane.innerHTML = doc.rawText || "Teks hasil OCR simulasi tidak tersedia.";
    }

    if (fieldsList) {
      const extractions = doc.extractions || {};
      const fieldKeys = [
        { key: "document_number", label: "Nomor Dokumen" },
        { key: "title", label: "Judul Perjanjian" },
        { key: "partner", label: "Nama Mitra" },
        { key: "tri_dharma", label: "Tri Dharma" },
        { key: "signed_date", label: "Tanggal Penandatanganan" },
        { key: "effective_end_date", label: "Masa Berlaku Berakhir" },
        { key: "partner_signatory_name", label: "Penandatangan Mitra" },
        { key: "it_del_signatory_name", label: "Penandatangan IT Del" },
        { key: "budget", label: "Alokasi Anggaran (Rp)" },
        { key: "scope", label: "Ruang Lingkup" }
      ];

      fieldsList.innerHTML = fieldKeys.map(f => {
        const ext = extractions[f.key] || {
          value: doc[f.key] || "",
          confidence: 0.90,
          source_text: "Ekstraksi Heuristik",
          extraction_method: "NLP"
        };

        return `
          <div class="field-review-item">
            <div class="field-review-top">
              <span class="field-review-label">${f.label}</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 0.68rem; color: var(--text-muted);">${ext.extraction_method || 'HEURISTIC'}</span>
                ${this.ui.renderConfidenceBadge(ext.confidence)}
              </div>
            </div>
            <input type="text" class="form-control" id="val-field-${f.key}" value="${ext.value || ''}" style="width: 100%;">
            <div class="field-review-source">Sumber: "${(ext.source_text || '').slice(0, 80)}"</div>
          </div>
        `;
      }).join("");
    }

    this.ui.openModal("modal-side-by-side-validation");
  }

  saveValidationModalDecision(decisionStatus) {
    if (!this.currentValidationDocId) return;

    const updates = {
      status: decisionStatus,
      officialDataConfirmed: decisionStatus === "VALIDATED",
      validatedBy: this.store.getRoleDefinition().name,
      validatedDate: new Date().toISOString()
    };

    // Grab edited values from input fields
    const docNumber = document.getElementById("val-field-document_number")?.value;
    const title = document.getElementById("val-field-title")?.value;
    const partner = document.getElementById("val-field-partner")?.value;
    const scope = document.getElementById("val-field-scope")?.value;

    if (docNumber) updates.documentNumber = docNumber;
    if (title) updates.title = title;
    if (partner) updates.partnerName = partner;
    if (scope) updates.scope = scope;

    this.store.updateDocument(this.currentValidationDocId, updates);
    this.ui.closeModal("modal-side-by-side-validation");
    this.ui.showToast(`Dokumen berhasil diperbarui: Status ${decisionStatus}`, "success");
    this.renderValidationView();
  }

  // ========================================================
  // 5. RELATIONSHIPS & HIERARCHY TREE
  // ========================================================
  renderRelationshipsView() {
    const treeContainer = document.getElementById("relationships-tree-container");
    const orphanList = document.getElementById("relationships-orphan-list");
    if (!treeContainer) return;

    const partners = this.store.getPartners();
    const docs = this.store.getDocuments();

    // Render tree per partner
    treeContainer.innerHTML = partners.map(p => {
      const partnerDocs = docs.filter(d => d.partnerId === p.id || d.partnerName === p.name);
      const mous = partnerDocs.filter(d => d.type === "MOU_LOI");

      return `
        <div class="card" style="margin-bottom: 24px;">
          <div class="tree-node-partner">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span class="badge" style="background: rgba(255,255,255,0.2); color: #fff; margin-bottom: 4px;">${p.type}</span>
                <h3 style="font-size: 1.15rem; font-weight: 700;">${p.name}</h3>
                <div style="font-size: 0.78rem; opacity: 0.85;">${p.country} &bull; ${p.city} &bull; PIC: ${p.contactPerson || '-'}</div>
              </div>
              <span class="badge badge-success" style="background: #2A9D8F; color: white;">${partnerDocs.length} Dokumen</span>
            </div>
          </div>

          <div class="tree-container">
            ${mous.length === 0 ? `<div style="padding: 16px; color: var(--text-muted); font-size: 0.84rem;">Belum ada Nota Kesepahaman (MoU) induk yang tercatat.</div>` : ''}
            ${mous.map(mou => {
              // Find child PKS
              const childPks = partnerDocs.filter(d => d.type === "PKS_MOA" && (d.parentId === mou.id || d.parentNumber === mou.documentNumber));

              return `
                <div class="tree-branch">
                  <div class="tree-card" style="border-left: 4px solid #134074;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                      <div>
                        ${this.ui.renderTypeBadge("MOU_LOI")}
                        <span style="font-weight: 700; margin-left: 6px; color: var(--color-primary-dark); cursor: pointer;" onclick="ksdasApp.viewDocumentDetail('${mou.id}')">${mou.title}</span>
                        <div style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">
                          ${mou.documentNumber} (${mou.signedDate} s/d ${mou.effectiveEndDate})
                        </div>
                      </div>
                      ${this.ui.renderStatusBadge(mou.status)}
                    </div>
                  </div>

                  <!-- Children PKS -->
                  ${childPks.map(pks => {
                    const childIAs = partnerDocs.filter(d => d.type === "IA" && (d.parentId === pks.id || d.parentNumber === pks.documentNumber));
                    return `
                      <div class="tree-branch">
                        <div class="tree-card" style="border-left: 4px solid #0077B6;">
                          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                              ${this.ui.renderTypeBadge("PKS_MOA")}
                              <span style="font-weight: 600; margin-left: 6px; cursor: pointer;" onclick="ksdasApp.viewDocumentDetail('${pks.id}')">${pks.title}</span>
                              <div style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">
                                ${pks.documentNumber} &bull; Anggaran: ${this.ui.formatRupiah(pks.budget)}
                              </div>
                            </div>
                            ${this.ui.renderStatusBadge(pks.status)}
                          </div>
                        </div>

                        <!-- Children IA -->
                        ${childIAs.map(ia => `
                          <div class="tree-branch">
                            <div class="tree-card" style="border-left: 4px solid #2A9D8F;">
                              ${this.ui.renderTypeBadge("IA")}
                              <span style="font-weight: 600; margin-left: 6px; cursor: pointer;" onclick="ksdasApp.viewDocumentDetail('${ia.id}')">${ia.title}</span>
                              <div style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted);">${ia.documentNumber}</div>
                            </div>
                          </div>
                        `).join("")}
                      </div>
                    `;
                  }).join("")}
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;
    }).join("");

    // Render orphan documents list
    if (orphanList) {
      const orphans = docs.filter(d => (d.type === "PKS_MOA" || d.type === "IA") && !d.parentId);
      if (orphans.length === 0) {
        orphanList.innerHTML = `<div style="padding: 16px; color: var(--text-muted); font-size: 0.85rem;">Tidak ada dokumen orphan. Seluruh hierarki PKS dan IA telah tertaut dengan valid.</div>`;
      } else {
        orphanList.innerHTML = orphans.map(orp => `
          <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-weight: 600; color: var(--color-primary-dark); font-size: 0.88rem;">${orp.title}</div>
              <div style="font-size: 0.76rem; color: var(--text-muted);">${orp.documentNumber} &bull; ${orp.partnerName}</div>
            </div>
            <button class="btn btn-sm btn-primary staff-only-action" onclick="ksdasApp.openLinkParentModal('${orp.id}')">
              Tautkan ke MoU Induk
            </button>
          </div>
        `).join("");
      }
    }
  }

  openLinkParentModal(docId) {
    const doc = this.store.getDocumentById(docId);
    if (!doc) return;

    const modalDocName = document.getElementById("link-parent-doc-title");
    const parentSelect = document.getElementById("link-parent-select");
    const docIdHidden = document.getElementById("link-parent-target-doc-id");

    if (modalDocName) modalDocName.textContent = `${doc.documentNumber} (${doc.title})`;
    if (docIdHidden) docIdHidden.value = docId;

    if (parentSelect) {
      // Find candidate parent MoUs for the same partner
      const candidates = this.store.getDocuments({ type: "MOU_LOI" });
      parentSelect.innerHTML = `
        <option value="">-- Pilih Dokumen Induk (MoU) --</option>
        ${candidates.map(c => `
          <option value="${c.id}" ${c.partnerName === doc.partnerName ? 'selected' : ''}>
            ${c.documentNumber} - ${c.partnerName} (${c.title})
          </option>
        `).join("")}
      `;
    }

    this.ui.openModal("modal-link-parent");
  }

  saveParentLinkDecision() {
    const docId = document.getElementById("link-parent-target-doc-id")?.value;
    const parentId = document.getElementById("link-parent-select")?.value;

    if (!docId || !parentId) {
      this.ui.showToast("Pilih dokumen induk yang valid!", "warning");
      return;
    }

    const parentDoc = this.store.getDocumentById(parentId);
    if (!parentDoc) return;

    this.store.updateDocument(docId, {
      parentId: parentDoc.id,
      parentNumber: parentDoc.documentNumber,
      qualityFlags: []
    });

    this.ui.closeModal("modal-link-parent");
    this.ui.showToast("Hierarki dokumen berhasil ditautkan!", "success");
    this.renderRelationshipsView();
  }

  // ========================================================
  // 6. MASTER PARTNERS VIEW
  // ========================================================
  renderPartnersView() {
    const grid = document.getElementById("partners-cards-grid");
    if (!grid) return;

    const partners = this.store.getPartners();
    grid.innerHTML = partners.map(p => `
      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <span class="badge" style="background: #EFF6FF; color: #1E40AF;">${p.type}</span>
            <span class="badge ${p.status === 'ACTIVE' ? 'badge-validated' : 'badge-rejected'}">${p.status}</span>
          </div>

          <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--color-primary-dark); margin-bottom: 6px;">${p.name}</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">${p.notes || '-'}</p>

          <div style="font-size: 0.78rem; display: flex; flex-direction: column; gap: 4px; border-top: 1px solid var(--border-color); padding-top: 10px;">
            <div>📍 <b>Lokasi:</b> ${p.city}, ${p.country}</div>
            <div>👤 <b>PIC:</b> ${p.contactPerson || '-'}</div>
            <div>✉️ <b>Email:</b> ${p.email || '-'}</div>
          </div>
        </div>

        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.8rem; font-weight: 600; color: var(--color-primary-light);">
            ${p.totalAgreements || 0} Kerjasama Aktif
          </span>
          <button class="btn btn-sm btn-secondary" onclick="ksdasRouter.navigate('repository', { partnerId: '${p.id}' })">
            Lihat Dokumen
          </button>
        </div>
      </div>
    `).join("");
  }

  // ========================================================
  // 7. ACTIVITIES & EVIDENCE VIEW
  // ========================================================
  renderActivitiesView() {
    const actTbody = document.getElementById("activities-table-tbody");
    const eviGrid = document.getElementById("evidences-cards-grid");

    if (actTbody) {
      const acts = this.store.getActivities();
      actTbody.innerHTML = acts.map(a => `
        <tr>
          <td>
            <div style="font-weight: 600; color: var(--color-primary-dark);">${a.title}</div>
            <div style="font-size: 0.74rem; color: var(--text-muted); font-family: var(--font-mono);">${a.documentNumber}</div>
          </td>
          <td><span class="badge" style="background: #EBF5FF; color: #1E40AF;">${a.triDharma}</span></td>
          <td><b>${a.partnerName}</b></td>
          <td>${a.pic}</td>
          <td>${a.participantCount} peserta</td>
          <td>${this.ui.formatRupiah(a.budget)}</td>
          <td><span class="badge badge-validated">${a.status}</span></td>
        </tr>
      `).join("");
    }

    if (eviGrid) {
      const evidences = this.store.getEvidences();
      eviGrid.innerHTML = evidences.map(e => `
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <span class="badge" style="background: #F1F5F9; color: #475569;">${e.type}</span>
            ${e.verified ? '<span class="badge badge-validated">TERVERIFIKASI</span>' : '<span class="badge badge-needs-review">BELUM VERIFIKASI</span>'}
          </div>
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--color-primary-dark); margin-bottom: 4px;">${e.title}</h4>
          <div style="font-size: 0.76rem; color: var(--text-muted); font-family: var(--font-mono); margin-bottom: 8px;">${e.documentNumber}</div>
          
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 12px;">
            <div>📁 File: <code>${e.fileName}</code> (${e.fileSize})</div>
            <div>📅 Diunggah: ${e.uploadedDate} oleh ${e.uploadedBy}</div>
          </div>

          <div style="border-top: 1px solid var(--border-color); padding-top: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.72rem; color: var(--color-primary);">Kriteria: ${(e.mappedCriteria || []).join(", ")}</span>
            ${!e.verified ? `<button class="btn btn-sm btn-success" onclick="ksdasStore.verifyEvidence('${e.id}')">Verifikasi</button>` : `<span style="font-size: 0.75rem; color: var(--color-success); font-weight: 600;">✓ Oleh ${e.verifiedBy}</span>`}
          </div>
        </div>
      `).join("");
    }
  }

  // ========================================================
  // 8. IN-DEPTH ANALYTICS & CROSS TABULATION
  // ========================================================
  renderAnalyticsView() {
    const docs = this.store.getDocuments();
    const acts = this.store.getActivities();

    // Cross Tabulation Matrix
    const matrixContainer = document.getElementById("analytics-crosstab-tbody");
    if (matrixContainer) {
      const matrix = this.analytics.getCrossTabulation(docs);
      matrixContainer.innerHTML = `
        <tr>
          <td><strong>Fakultas Informatika & Elektro (FITE)</strong></td>
          <td style="text-align: center;">${matrix.FITE.EDUCATION}</td>
          <td style="text-align: center;">${matrix.FITE.RESEARCH}</td>
          <td style="text-align: center;">${matrix.FITE.COMMUNITY_SERVICE}</td>
          <td style="text-align: center;">${matrix.FITE.INSTITUTIONAL}</td>
          <td style="text-align: center; font-weight: 700; background: #F8FAFC;">${matrix.FITE.total}</td>
        </tr>
        <tr>
          <td><strong>Fakultas Teknologi Industri (FTI)</strong></td>
          <td style="text-align: center;">${matrix.FTI.EDUCATION}</td>
          <td style="text-align: center;">${matrix.FTI.RESEARCH}</td>
          <td style="text-align: center;">${matrix.FTI.COMMUNITY_SERVICE}</td>
          <td style="text-align: center;">${matrix.FTI.INSTITUTIONAL}</td>
          <td style="text-align: center; font-weight: 700; background: #F8FAFC;">${matrix.FTI.total}</td>
        </tr>
        <tr>
          <td><strong>Fakultas Bioteknologi (FB)</strong></td>
          <td style="text-align: center;">${matrix.FB.EDUCATION}</td>
          <td style="text-align: center;">${matrix.FB.RESEARCH}</td>
          <td style="text-align: center;">${matrix.FB.COMMUNITY_SERVICE}</td>
          <td style="text-align: center;">${matrix.FB.INSTITUTIONAL}</td>
          <td style="text-align: center; font-weight: 700; background: #F8FAFC;">${matrix.FB.total}</td>
        </tr>
        <tr style="font-weight: 700; background: #EFF6FF;">
          <td>Total Agregat</td>
          <td style="text-align: center;">${matrix.totals.EDUCATION}</td>
          <td style="text-align: center;">${matrix.totals.RESEARCH}</td>
          <td style="text-align: center;">${matrix.totals.COMMUNITY_SERVICE}</td>
          <td style="text-align: center;">${matrix.totals.INSTITUTIONAL}</td>
          <td style="text-align: center; font-size: 1rem; color: var(--color-primary-dark);">${matrix.totals.grandTotal}</td>
        </tr>
      `;
    }

    // Expiry Monitoring Table
    const expiryTbody = document.getElementById("analytics-expiry-tbody");
    if (expiryTbody) {
      const records = this.analytics.getExpiryMonitoring(docs);
      expiryTbody.innerHTML = records.map(r => `
        <tr>
          <td>
            <div style="font-weight: 600; color: var(--color-primary-dark);">${r.title}</div>
            <div style="font-size: 0.74rem; color: var(--text-muted); font-family: var(--font-mono);">${r.documentNumber}</div>
          </td>
          <td><b>${r.partnerName}</b></td>
          <td>${this.ui.renderTypeBadge(r.type)}</td>
          <td>${r.effectiveEndDate}</td>
          <td><span class="badge ${r.badgeClass}">${r.statusText}</span></td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="ksdasApp.viewDocumentDetail('${r.id}')">Review</button>
          </td>
        </tr>
      `).join("");
    }

    // Follow-up Gaps Table
    const gapTbody = document.getElementById("analytics-gaps-tbody");
    if (gapTbody) {
      const gaps = this.analytics.getFollowUpGaps(docs, acts);
      if (gaps.length === 0) {
        gapTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 24px; color: var(--text-muted);">Tidak ada kesenjangan follow-up kerja sama. Semua MoU memiliki PKS turunan.</td></tr>`;
      } else {
        gapTbody.innerHTML = gaps.map(g => `
          <tr>
            <td>
              <div style="font-weight: 600; color: var(--color-primary-dark);">${g.title}</div>
              <div style="font-size: 0.74rem; color: var(--text-muted); font-family: var(--font-mono);">${g.docNumber} (${g.partnerName})</div>
            </td>
            <td><span class="flag-pill ${g.severity === 'HIGH' ? '' : 'flag-warning'}">${g.severity}</span></td>
            <td style="font-size: 0.84rem;">${g.message}</td>
            <td style="font-size: 0.8rem; color: var(--color-primary-light); font-weight: 600;">${g.recommendation}</td>
          </tr>
        `).join("");
      }
    }
  }

  // ========================================================
  // 9. ACCREDITATION & AMI WORKSPACE (Configurable!)
  // ========================================================
  renderAccreditationView() {
    const frameworkSelect = document.getElementById("accreditation-framework-select");
    const indicatorTbody = document.getElementById("accreditation-indicators-tbody");
    if (!indicatorTbody) return;

    const frameworks = this.store.getAccreditationFrameworks();
    if (frameworkSelect) {
      frameworkSelect.innerHTML = frameworks.map(fw => 
        `<option value="${fw.id}" ${fw.id === this.selectedAccreditationFramework ? "selected" : ""}>${fw.name} (${fw.organization})</option>`
      ).join("");

      frameworkSelect.onchange = (e) => {
        this.selectedAccreditationFramework = e.target.value;
        this.renderAccreditationView();
      };
    }

    const currentFw = frameworks.find(f => f.id === this.selectedAccreditationFramework) || frameworks[0];
    if (!currentFw) return;

    indicatorTbody.innerHTML = (currentFw.indicators || []).map(ind => `
      <tr>
        <td><strong style="color: var(--color-primary);">${ind.code}</strong></td>
        <td>
          <div style="font-weight: 700; color: var(--color-primary-dark);">${ind.name}</div>
          <div style="font-size: 0.76rem; color: var(--text-muted);">${ind.criterion}</div>
        </td>
        <td style="font-size: 0.8rem; max-width: 280px;">${ind.requiredEvidence}</td>
        <td style="text-align: center;">
          <span class="badge" style="background: #E0F2FE; color: #0369A1;">${ind.linkedDocumentCount} Dokumen</span>
        </td>
        <td style="text-align: center;">
          <span class="badge" style="background: #DCFCE7; color: #166534;">${ind.linkedEvidenceCount} Bukti</span>
        </td>
        <td>
          <span class="badge badge-validated">MEMENUHI (MET)</span>
        </td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="ksdasApp.filterByAccreditationCode('${ind.code}')">
            Filter Data
          </button>
        </td>
      </tr>
    `).join("");
  }

  filterByAccreditationCode(code) {
    this.router.navigate("repository", { search: code });
    this.ui.showToast(`Memfilter repositori untuk kriteria ${code}`, "info");
  }

  // ========================================================
  // 10. REPORT GENERATOR VIEW
  // ========================================================
  renderReportsView() {
    const reportSelect = document.getElementById("report-type-selector");
    const container = document.getElementById("report-preview-container");
    if (!container) return;

    if (reportSelect) {
      reportSelect.value = this.currentReportType;
      reportSelect.onchange = (e) => {
        this.currentReportType = e.target.value;
        this.renderReportsView();
      };
    }

    const docs = this.store.getDocuments();
    const partners = this.store.getPartners();
    const kpis = this.analytics.getExecutiveKPIs(docs, partners, this.store.getActivities());

    container.innerHTML = `
      <div class="report-paper">
        <div class="report-header-banner">
          <div class="report-logo-group">
            <div class="brand-logo" style="width: 44px; height: 44px; font-size: 1.3rem;">ITD</div>
            <div>
              <h2 style="font-size: 1.3rem; font-weight: 800; color: var(--color-primary-dark); text-transform: uppercase;">
                Institut Teknologi Del
              </h2>
              <div style="font-size: 0.84rem; color: var(--text-muted);">Unit Kerja Sama & Hubungan Alumni &bull; KSDAS System</div>
            </div>
          </div>
          <div style="text-align: right; font-size: 0.78rem; color: var(--text-muted);">
            <div><b>Status Laporan:</b> RESMI (TERVERIFIKASI)</div>
            <div><b>Tanggal Cetak:</b> ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>

        <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--color-primary); margin-bottom: 8px;">
          ${this.currentReportType === 'EXECUTIVE_BRIEF' ? 'Laporan Eksekutif Capaian Kemitraan Strategis' : 'Paket Data Pemetaan Kemitraan & Akreditasi'}
        </h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 24px;">
          Dokumen rekapitulasi data kerjasama tri dharma perguruan tinggi, implementasi riil dan dampak institusional.
        </p>

        <div class="report-meta-grid">
          <div class="card" style="padding: 14px;">
            <span class="card-subtitle">TOTAL MITRA AKTIF</span>
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--color-primary-dark);">${kpis.activePartners} Lembaga</div>
          </div>
          <div class="card" style="padding: 14px;">
            <span class="card-subtitle">TOTAL MOU & PKS AKTIF</span>
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--color-primary-dark);">${kpis.totalMoU + kpis.totalPKS} Dokumen</div>
          </div>
          <div class="card" style="padding: 14px;">
            <span class="card-subtitle">TOTAL DANA KERJA SAMA</span>
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--color-primary-dark);">${this.ui.formatRupiah(kpis.totalBudget)}</div>
          </div>
          <div class="card" style="padding: 14px;">
            <span class="card-subtitle">MAHASISWA & DOSEN TERLIBAT</span>
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--color-primary-dark);">${kpis.totalParticipants} Orang</div>
          </div>
        </div>

        <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 12px; color: var(--color-primary-dark);">Daftar Perjanjian Kerja Sama Unggulan:</h4>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nomor Dokumen</th>
                <th>Mitra & Judul Kerjasama</th>
                <th>Tri Dharma</th>
                <th>Masa Berlaku</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${docs.slice(0, 8).map(d => `
                <tr>
                  <td style="font-family: var(--font-mono); font-size: 0.78rem;">${d.documentNumber}</td>
                  <td>
                    <div style="font-weight: 600;">${d.title}</div>
                    <div style="font-size: 0.74rem; color: var(--text-muted);">${d.partnerName}</div>
                  </td>
                  <td>${d.triDharma}</td>
                  <td style="font-size: 0.78rem;">${d.effectiveStartDate} s/d ${d.effectiveEndDate}</td>
                  <td>${this.ui.renderStatusBadge(d.status)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 48px; display: flex; justify-content: space-between; font-size: 0.84rem;">
          <div style="text-align: center;">
            <div>Mengetahui,</div>
            <div style="margin-top: 50px; font-weight: 700;">Humasak T. A. Simanjuntak, S.T., M.ISD.</div>
            <div style="color: var(--text-muted);">Kepala Unit Kerja Sama IT Del</div>
          </div>
          <div style="text-align: center;">
            <div>Disahkan oleh,</div>
            <div style="margin-top: 50px; font-weight: 700;">Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.</div>
            <div style="color: var(--text-muted);">Rektor Institut Teknologi Del</div>
          </div>
        </div>
      </div>
    `;
  }

  // ========================================================
  // 11. NATURAL LANGUAGE QUERY
  // ========================================================
  renderNLQueryView() {
    const executeBtn = document.getElementById("nl-execute-btn");
    const inputEl = document.getElementById("nl-query-input");
    const resultBox = document.getElementById("nl-result-container");

    if (executeBtn && inputEl) {
      executeBtn.onclick = () => {
        const queryText = inputEl.value;
        if (!queryText.trim()) return;

        const interpretation = this.ai.interpretNaturalLanguageQuery(queryText);
        this.renderNLInterpretationResult(interpretation);
      };

      inputEl.onkeydown = (e) => {
        if (e.key === "Enter") {
          executeBtn.click();
        }
      };
    }
  }

  setNLQueryExample(text) {
    const input = document.getElementById("nl-query-input");
    if (input) {
      input.value = text;
      const executeBtn = document.getElementById("nl-execute-btn");
      if (executeBtn) executeBtn.click();
    }
  }

  renderNLInterpretationResult(interp) {
    const box = document.getElementById("nl-result-container");
    if (!box) return;

    box.style.display = "block";
    box.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--color-primary-dark);">
          Hasil Interpretasi AI Document Engine:
        </h4>
        ${this.ui.renderConfidenceBadge(interp.confidence)}
      </div>

      <div style="font-size: 0.88rem; margin-bottom: 14px;">
        ${interp.explanation}
      </div>

      <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
        <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">Konseptual Filter JSON:</span>
        <pre style="font-family: var(--font-mono); font-size: 0.8rem; margin-top: 6px; color: #0B2545;">${JSON.stringify(interp.filters, null, 2)}</pre>
      </div>

      <div style="display: flex; gap: 10px;">
        <button class="btn btn-primary" onclick="ksdasApp.applyNLFiltersAndNavigate(${JSON.stringify(interp.filters).replace(/"/g, '&quot;')})">
          Terapkan Filter & Eksekusi di Repositori &rarr;
        </button>
      </div>
    `;
  }

  applyNLFiltersAndNavigate(filters) {
    const navParams = {};
    if (filters.document_type) navParams.type = filters.document_type;
    if (filters.status) navParams.status = filters.status === "ACTIVE" ? "VALIDATED" : "ALL";
    if (filters.tri_dharma) navParams.triDharma = filters.tri_dharma;
    if (filters.year) navParams.year = filters.year.toString();
    if (filters.faculty) navParams.facultyId = filters.faculty;

    this.router.navigate("repository", navParams);
    this.ui.showToast("Filter kueri bahasa alami diterapkan ke Repositori Dokumen!", "success");
  }

  // ========================================================
  // 12. AUDIT TRAIL VIEW
  // ========================================================
  renderAuditView() {
    const tbody = document.getElementById("audit-table-tbody");
    if (!tbody) return;

    const logs = this.store.getAuditLogs();
    tbody.innerHTML = logs.map(log => `
      <tr>
        <td style="font-family: var(--font-mono); font-size: 0.75rem; white-space: nowrap;">
          ${log.timestamp ? new Date(log.timestamp).toLocaleString('id-ID') : '-'}
        </td>
        <td><span class="badge" style="background: #EFF6FF; color: #1E40AF;">${log.action}</span></td>
        <td>
          <div style="font-weight: 600; font-size: 0.82rem;">${log.userName || log.userRole}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${log.userRole}</div>
        </td>
        <td style="font-family: var(--font-mono); font-size: 0.76rem;">${log.documentNumber || '-'}</td>
        <td style="font-size: 0.82rem;">${log.details}</td>
      </tr>
    `).join("");
  }

  // ========================================================
  // 13. SETTINGS & DATA MANAGEMENT VIEW
  // ========================================================
  renderSettingsView() {
    const statsEl = document.getElementById("settings-storage-stats");
    if (statsEl) {
      const raw = localStorage.getItem(this.store.STORAGE_KEY) || "";
      const kb = (raw.length * 2 / 1024).toFixed(1);
      statsEl.innerHTML = `
        <div><b>Versi Skema:</b> v${this.store.VERSION}</div>
        <div><b>Penggunaan localStorage:</b> ${kb} KB</div>
        <div><b>Total Dokumen:</b> ${(this.store.state.documents || []).length} entitas</div>
        <div><b>Total Mitra:</b> ${(this.store.state.partners || []).length} lembaga</div>
      `;
    }
  }

  // --- Document Detail Modal ---
  viewDocumentDetail(docId) {
    const doc = this.store.getDocumentById(docId);
    if (!doc) return;

    const modalTitle = document.getElementById("detail-modal-title");
    const modalBody = document.getElementById("detail-modal-body");

    if (modalTitle) {
      modalTitle.innerHTML = `📄 ${doc.documentNumber} &bull; ${doc.title}`;
    }

    if (modalBody) {
      modalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
          <div>
            <div style="margin-bottom: 16px;">
              <span class="badge" style="margin-right: 6px;">${doc.type}</span>
              ${this.ui.renderStatusBadge(doc.status)}
              ${this.ui.renderConfidenceBadge(doc.confidenceScore)}
            </div>

            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--color-primary-dark); margin-bottom: 8px;">
              ${doc.title}
            </h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px; line-height: 1.6;">
              <b>Ruang Lingkup:</b> ${doc.scope || '-'}
            </p>

            <div class="card" style="padding: 16px; margin-bottom: 16px; background: #F8FAFC;">
              <h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 10px; color: var(--color-primary-dark);">Metadata Penandatangan & Institusi:</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.8rem;">
                <div><b>Mitra:</b> ${doc.partnerName} (${doc.country || 'Indonesia'})</div>
                <div><b>Penandatangan Mitra:</b> ${doc.partnerSignatoryName || '-'}</div>
                <div><b>Penandatangan IT Del:</b> ${doc.itDelSignatoryName || '-'}</div>
                <div><b>Fakultas / Prodi:</b> ${doc.facultyId || '-'} / ${doc.studyProgramId || '-'}</div>
                <div><b>Mulai Berlaku:</b> ${doc.effectiveStartDate || '-'}</div>
                <div><b>Berakhir Pada:</b> ${doc.effectiveEndDate || '-'}</div>
                <div><b>PIC IT Del:</b> ${doc.pic || '-'}</div>
                <div><b>Komitmen Dana:</b> ${this.ui.formatRupiah(doc.budget)}</div>
              </div>
            </div>

            <div class="card" style="padding: 16px;">
              <h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 8px; color: var(--color-primary-dark);">Capaian Output, Outcome & Dampak:</h4>
              <ul style="font-size: 0.82rem; padding-left: 20px; line-height: 1.6; color: var(--text-main);">
                <li><b>Target Luaran:</b> ${doc.expectedOutput || '-'}</li>
                <li><b>Realisasi Luaran:</b> ${doc.actualOutput || '-'}</li>
                <li><b>Dampak (Impact):</b> ${doc.impact || '-'}</li>
                <li><b>Rencana Tindak Lanjut:</b> ${doc.followUp || '-'}</li>
              </ul>
            </div>
          </div>

          <div>
            <div class="card" style="padding: 16px; margin-bottom: 16px;">
              <h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 8px; color: var(--color-primary-dark);">Relasi Dokumen:</h4>
              <div style="font-size: 0.8rem;">
                <div><b>Dokumen Induk:</b></div>
                <div style="color: var(--color-primary); font-family: var(--font-mono); margin-top: 2px;">
                  ${doc.parentNumber || (doc.parentId ? doc.parentId : 'Tidak ada (Dokumen Induk MoU)')}
                </div>
              </div>
            </div>

            <div class="card" style="padding: 16px;">
              <h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 8px; color: var(--color-primary-dark);">File & Bukti Fisik:</h4>
              <div style="font-size: 0.8rem; margin-bottom: 10px;">
                <div>📄 File: <code>${doc.fileName || 'dokumen.pdf'}</code></div>
                <div>Ukuran: ${doc.fileSize || '2.1 MB'}</div>
                <div>Jumlah Evidence: <b>${doc.evidenceCount || 0} file</b></div>
              </div>
              <button class="btn btn-sm btn-secondary" style="width: 100%;" onclick="ksdasUI.showToast('Mengunduh salinan berkas...', 'info')">
                Unduh Salinan Berkas
              </button>
            </div>
          </div>
        </div>
      `;
    }

    this.ui.openModal("modal-document-detail");
  }
}

// Global App Initialization
window.addEventListener("DOMContentLoaded", () => {
  window.ksdasApp = new KSDASApp();
});
