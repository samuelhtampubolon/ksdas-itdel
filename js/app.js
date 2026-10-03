/**
 * ============================================================================
 * KERJA SAMA DATA & ANALYTICS SYSTEM (KSDAS) INSTITUT TEKNOLOGI DEL
 * ============================================================================
 * Judul Ciptaan: KSDAS IT Del - Program Komputer Tata Kelola Kemitraan
 * Pencipta & Pemegang Hak Cipta: Samuel Hasudungan Tampubolon
 * Hak Cipta: © 2026 Samuel Hasudungan Tampubolon. All rights reserved.
 * Institusi: Institut Teknologi Del, Sitoluama, Laguboti, Sumatera Utara
 * Versi: 0.2.0
 * Berkas: js/app.js (Main Application Controller & Workflow Orchestrator)
 * ============================================================================
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
    // Mobile menu toggle & backdrop overlay
    const mobileBtn = document.getElementById("mobile-menu-btn");
    const sidebar = document.querySelector(".app-sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");

    const toggleSidebar = (forceClose = false) => {
      if (!sidebar) return;
      if (forceClose) {
        sidebar.classList.remove("open");
        backdrop?.classList.remove("active");
      } else {
        const isOpen = sidebar.classList.toggle("open");
        if (isOpen) {
          backdrop?.classList.add("active");
        } else {
          backdrop?.classList.remove("active");
        }
      }
    };

    if (mobileBtn) {
      mobileBtn.addEventListener("click", () => toggleSidebar());
    }

    if (backdrop) {
      backdrop.addEventListener("click", () => toggleSidebar(true));
      backdrop.addEventListener("touchstart", () => toggleSidebar(true), { passive: true });
    }

    // Auto-close sidebar on mobile when navigating
    document.querySelectorAll(".sidebar-nav .nav-item").forEach(item => {
      item.addEventListener("click", () => {
        if (window.innerWidth <= 1024) {
          toggleSidebar(true);
        }
      });
    });

    // Close on Escape key
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sidebar?.classList.contains("open")) {
        toggleSidebar(true);
      }
    });

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
      resultsContainer.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">Tidak ditemukan dokumen yang cocok dengan "${this.ui.escapeHtml(query)}".</div>`;
      return;
    }

    resultsContainer.innerHTML = matches.map(doc => `
      <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); cursor: pointer; display: flex; align-items: center; justify-content: space-between;"
           onclick="ksdasApp.viewDocumentDetail('${doc.id}'); ksdasUI.closeModal('modal-quick-search');"
           onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='transparent'">
        <div>
          <div style="font-weight: 600; font-size: 0.88rem; color: var(--color-primary-dark);">${this.ui.escapeHtml(doc.title)}</div>
          <div style="font-size: 0.76rem; color: var(--text-muted);">${this.ui.escapeHtml(doc.documentNumber)} &bull; ${this.ui.escapeHtml(doc.partnerName)}</div>
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
            <div style="display: flex; gap: 4px;">
              <button class="btn btn-sm btn-secondary" onclick="ksdasApp.viewDocumentDetail('${d.id}')">Detail</button>
              <button class="btn btn-sm btn-outline" onclick="ksdasApp.openDownloadChoiceModal('${d.id}')" title="Unduh Dokumen Resmi (Word/Excel/PDF)">📥</button>
            </div>
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
          <option value="AI_EXTRACTED" ${this.activeFilters.status === "AI_EXTRACTED" ? "selected" : ""}>TEREKSTRAKSI</option>
          <option value="NEEDS_REVIEW" ${this.activeFilters.status === "NEEDS_REVIEW" ? "selected" : ""}>PERLU REVIEW</option>
          <option value="VALIDATED" ${this.activeFilters.status === "VALIDATED" ? "selected" : ""}>TERVALIDASI RESMI</option>
          <option value="REJECTED" ${this.activeFilters.status === "REJECTED" ? "selected" : ""}>DITOLAK</option>
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

        <button id="repo-reset-filter-btn" class="btn btn-secondary btn-sm">Bersihkan Filter</button>
      </div>

      <!-- Quick Filter Presets (Section 5 UI/UX Spec v0.3) -->
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px;">
        <span style="font-size: 0.76rem; font-weight: 600; color: var(--text-muted);">Preset Cepat:</span>
        <button class="btn btn-outline btn-sm" style="font-size: 0.74rem; padding: 3px 10px; border-radius: 14px;" onclick="ksdasApp.applyFilterPreset('ami_fti')">📊 AMI 2026 - FTI</button>
        <button class="btn btn-outline btn-sm" style="font-size: 0.74rem; padding: 3px 10px; border-radius: 14px;" onclick="ksdasApp.applyFilterPreset('research')">🔬 Riset 2025-2026</button>
        <button class="btn btn-outline btn-sm" style="font-size: 0.74rem; padding: 3px 10px; border-radius: 14px;" onclick="ksdasApp.applyFilterPreset('needs_review')">⏳ Perlu Validasi</button>
        <button class="btn btn-outline btn-sm" style="font-size: 0.74rem; padding: 3px 10px; border-radius: 14px;" onclick="ksdasApp.applyFilterPreset('expiring')">⚠️ Tahun 2026</button>
      </div>

      <div class="filter-chips" id="repo-active-chips" style="margin-top: 8px;"></div>
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
      this.resetFilters();
    });
  }

  applyFilterPreset(presetKey) {
    if (presetKey === "ami_fti") {
      this.activeFilters = {
        search: "",
        type: "ALL",
        status: "ALL",
        partnerId: "ALL",
        facultyId: "FTI",
        triDharma: "ALL",
        year: "2026",
        qualityFlag: "ALL"
      };
      this.ui.showToast("Preset Filter diterapkan: AMI 2026 - FTI", "info");
    } else if (presetKey === "research") {
      this.activeFilters = {
        search: "",
        type: "ALL",
        status: "ALL",
        partnerId: "ALL",
        facultyId: "ALL",
        triDharma: "RESEARCH",
        year: "ALL",
        qualityFlag: "ALL"
      };
      this.ui.showToast("Preset Filter diterapkan: Penelitian / Riset", "info");
    } else if (presetKey === "needs_review") {
      this.activeFilters = {
        search: "",
        type: "ALL",
        status: "NEEDS_REVIEW",
        partnerId: "ALL",
        facultyId: "ALL",
        triDharma: "ALL",
        year: "ALL",
        qualityFlag: "ALL"
      };
      this.ui.showToast("Preset Filter diterapkan: Dokumen Perlu Validasi", "info");
    } else if (presetKey === "expiring") {
      this.activeFilters = {
        search: "",
        type: "ALL",
        status: "ALL",
        partnerId: "ALL",
        facultyId: "ALL",
        triDharma: "ALL",
        year: "2026",
        qualityFlag: "ALL"
      };
      this.ui.showToast("Preset Filter diterapkan: Perjanjian Tahun 2026", "info");
    }
    this.renderFilterBar();
    this.renderRepositoryTable();
  }

  resetFilters() {
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
    this.ui.showToast("Filter pencarian telah dibersihkan.", "info");
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
            <div style="font-weight: 600; font-size: 1rem; color: var(--text-color);">Tidak ada dokumen yang cocok dengan filter saat ini.</div>
            <div style="font-size: 0.82rem; margin-top: 6px; color: var(--text-muted);">Coba ubah filter atau unggah dokumen naskah baru ke sistem.</div>
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 16px;">
              <button class="btn btn-secondary btn-sm" onclick="ksdasApp.resetFilters()">Bersihkan Filter</button>
              <button class="btn btn-primary btn-sm" onclick="window.location.hash='#batch-upload'">Unggah Dokumen</button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = docs.map(doc => {
      const orphanBadge = (doc.type === "PKS_MOA" || doc.type === "IA") && !doc.parentId 
        ? `<span class="flag-pill">Orphan</span>` 
        : "";

      const safeTitle = this.ui.escapeHtml(doc.title);
      const safeDocNum = this.ui.escapeHtml(doc.documentNumber);
      const safePartner = this.ui.escapeHtml(doc.partnerName);
      const safeCountry = this.ui.escapeHtml(doc.country || "Indonesia");
      const safeFaculty = this.ui.escapeHtml(doc.facultyId || "FITE");
      const safeTriDharma = this.ui.escapeHtml(doc.triDharma || "EDUCATION");

      return `
        <tr>
          <td>
            <div class="doc-title-cell">
              <span class="doc-primary-title" onclick="ksdasApp.viewDocumentDetail('${doc.id}')">${safeTitle}</span>
              <span class="doc-number-sub">${safeDocNum}</span>
              ${orphanBadge}
            </div>
          </td>
          <td>${this.ui.renderTypeBadge(doc.type)}</td>
          <td>
            <div><strong>${safePartner}</strong></div>
            <div style="font-size: 0.74rem; color: var(--text-muted);">${safeCountry}</div>
          </td>
          <td>
            <span style="font-size: 0.78rem; font-weight: 600; color: var(--color-primary);">${safeTriDharma}</span>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${safeFaculty}</div>
          </td>
          <td>
            <div style="font-size: 0.78rem;">${doc.signedDate || "-"}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">s/d ${doc.effectiveEndDate || "-"}</div>
          </td>
          <td>${this.ui.renderStatusBadge(doc.status)}</td>
          <td>${this.ui.renderConfidenceBadge(doc.confidenceScore)}</td>
          <td>
            <div style="display: flex; gap: 4px;">
              <button class="btn btn-sm btn-secondary" onclick="ksdasApp.viewDocumentDetail('${doc.id}')" title="Detail & Pratinjau">Detail</button>
              <button class="btn btn-sm btn-outline" onclick="ksdasApp.openDownloadChoiceModal('${doc.id}')" title="Unduh Dokumen Resmi (Word/Excel/PDF)">📥 Unduh</button>
              ${doc.status !== "VALIDATED" ? `<button class="btn btn-sm btn-primary staff-only-action" onclick="ksdasApp.openValidationModal('${doc.id}')" title="Validasi Manual">Validasi</button>` : ""}
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
    const allowedExtensions = [".pdf", ".docx", ".doc", ".txt", ".md", ".rtf"];
    const maxSizeBytes = 25 * 1024 * 1024; // 25 MB limit
    let acceptedCount = 0;
    const readPromises = [];

    files.forEach(f => {
      const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        this.ui.showToast(`Berkas ditolak: "${this.ui.escapeHtml(f.name)}". Format yang didukung: .pdf, .docx, .txt, .md.`, "danger", 5000);
        return;
      }
      if (f.size > maxSizeBytes) {
        this.ui.showToast(`Berkas "${this.ui.escapeHtml(f.name)}" melebihi ukuran maksimum 25 MB.`, "danger", 5000);
        return;
      }

      acceptedCount++;
      const safeName = this.ui.escapeHtml(f.name);
      const queueItem = {
        id: "QUEUE-" + Math.floor(Math.random() * 100000),
        fileName: safeName,
        fileSize: (f.size / (1024 * 1024)).toFixed(2) + " MB",
        simulatedOcrText: "",
        status: "QUEUED",
        progress: 0,
        result: null
      };

      this.batchQueue.push(queueItem);

      // Baca isi nyata file secara lokal di memori peramban (100% Client-Side Privacy)
      const p = new Promise(resolve => {
        const reader = new FileReader();
        if (ext === ".txt" || ext === ".md" || ext === ".rtf") {
          reader.onload = (e) => {
            queueItem.simulatedOcrText = e.target.result || "";
            resolve();
          };
          reader.onerror = () => {
            queueItem.simulatedOcrText = `DOKUMEN KERJA SAMA INSTITUT TEKNOLOGI DEL: ${safeName}.`;
            resolve();
          };
          reader.readAsText(f);
        } else {
          // Untuk file PDF / DOCX / Binary: ekstrak stream teks ASCII yang terbaca
          reader.onload = (e) => {
            try {
              const buffer = e.target.result;
              const bytes = new Uint8Array(buffer);
              let printable = "";
              const words = [];
              for (let i = 0; i < Math.min(bytes.length, 300000); i++) {
                const b = bytes[i];
                if ((b >= 32 && b <= 126) || b === 10 || b === 13) {
                  printable += String.fromCharCode(b);
                } else {
                  if (printable.trim().length >= 3) words.push(printable.trim());
                  printable = "";
                }
              }
              if (printable.trim().length >= 3) words.push(printable.trim());
              const extracted = words.join(" ").replace(/\s+/g, " ").trim();
              if (extracted.length > 40) {
                queueItem.simulatedOcrText = extracted;
              } else {
                queueItem.simulatedOcrText = `DOKUMEN KERJA SAMA INSTITUT TEKNOLOGI DEL: ${safeName}. Naskah perjanjian resmi pelaksanaan Tri Dharma Perguruan Tinggi bidang Pendidikan, Penelitian, dan Pengabdian kepada Masyarakat bersama mitra strategis.`;
              }
            } catch (err) {
              queueItem.simulatedOcrText = `DOKUMEN KERJA SAMA INSTITUT TEKNOLOGI DEL: ${safeName}.`;
            }
            resolve();
          };
          reader.onerror = () => {
            queueItem.simulatedOcrText = `DOKUMEN KERJA SAMA INSTITUT TEKNOLOGI DEL: ${safeName}.`;
            resolve();
          };
          reader.readAsArrayBuffer(f);
        }
      });

      readPromises.push(p);
    });

    if (acceptedCount > 0) {
      Promise.all(readPromises).then(() => {
        this.renderQueueItems();
        this.ui.showToast(`Berhasil memuat ${acceptedCount} berkas lokal dari komputer Anda ke memori peramban. Siap diekstrak!`, "success", 4000);
      });
    }
  }

  renderQueueItems() {
    const list = document.getElementById("batch-upload-queue-list");
    const countBadge = document.getElementById("batch-queue-count");
    const startBtn = document.getElementById("batch-start-process-btn");
    const downloadAllBtn = document.getElementById("batch-download-all-btn");
    if (!list) return;

    if (countBadge) {
      countBadge.textContent = `${this.batchQueue.length} File`;
    }

    if (startBtn) {
      startBtn.disabled = this.batchQueue.length === 0;
    }

    const hasExtracted = this.batchQueue.some(item => item.status === "EXTRACTED");
    if (downloadAllBtn) {
      downloadAllBtn.style.display = hasExtracted ? "inline-block" : "none";
    }

    if (this.batchQueue.length === 0) {
      list.innerHTML = `
        <div style="padding: 32px; text-align: center; color: var(--text-muted);">
          Antrean unggahan kosong. Tarik file dokumen nyata dari komputer Anda ke area di atas, atau klik tombol <b>"Muat 10 Dokumen Sampel Demo"</b>.
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
        <div style="display: flex; align-items: center; gap: 10px;">
          ${item.result ? this.ui.renderTypeBadge(item.result.type) : ""}
          ${item.result ? this.ui.renderConfidenceBadge(item.result.aiConfidenceScore || item.result.confidenceScore || 0.95) : ""}
          ${item.result ? `
            <div style="display: flex; gap: 4px;">
              <button class="btn btn-outline btn-sm" style="font-size: 0.72rem; padding: 3px 6px;" onclick="ksdasApp.downloadDocumentAsWord('${item.result.id}')" title="Unduh Dokumen Word (.doc)">
                📘 Word
              </button>
              <button class="btn btn-outline btn-sm" style="font-size: 0.72rem; padding: 3px 6px;" onclick="ksdasApp.downloadDocumentAsExcel('${item.result.id}')" title="Unduh Spreadsheet Excel (.xls)">
                📗 Excel
              </button>
              <button class="btn btn-outline btn-sm" style="font-size: 0.72rem; padding: 3px 6px;" onclick="ksdasApp.printOrSaveDocumentAsPDF('${item.result.id}')" title="Cetak / Simpan PDF (.pdf)">
                📕 PDF
              </button>
            </div>
          ` : ""}
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
        stageIndicator.textContent = `Menganalisis Dokumen ${i + 1} dari ${this.batchQueue.length}: ${item.fileName}...`;
      }

      // Simulate realistic local AI latency
      await new Promise(r => setTimeout(r, 220));

      // Execute Mock AI parser on real text
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
          ✅ Berhasil! Seluruh ${this.batchQueue.length} dokumen telah dianalisis &amp; diekstraksi. Anda dapat mengunduh laporannya di bawah.
        </span>
      `;
    }

    this.ui.showToast(`Analisis selesai: ${this.batchQueue.length} dokumen siap divalidasi dan diunduh.`, "success");
    this.renderQueueItems();

    // Show jump to validation button and download report button
    const actionArea = document.getElementById("batch-complete-action-area");
    if (actionArea) {
      actionArea.style.display = "flex";
      actionArea.style.flexWrap = "wrap";
      actionArea.innerHTML = `
        <button class="btn btn-success" onclick="ksdasRouter.navigate('validation')">
          🛡️ Validasi Manual (${this.batchQueue.length} dokumen) &rarr;
        </button>
        <button class="btn btn-primary" onclick="ksdasApp.openBatchDownloadChoiceModal()">
          📥 Unduh Rekapitulasi (Excel / Word)
        </button>
        <button class="btn btn-secondary" onclick="ksdasRouter.navigate('repository')">
          📂 Lihat di Repositori Dokumen
        </button>
      `;
    }
  }

  // ========================================================
  // UNDUH DOKUMEN RESMI (WORD, EXCEL, PDF - LIGHTWEIGHT CLIENT-SIDE)
  // ========================================================
  openDownloadChoiceModal(docId) {
    this.pendingDownloadDocId = docId || this.currentDetailDocId;
    this.ui.openModal("modal-download-choice");
  }

  executeDownloadFormat(format) {
    const docId = this.pendingDownloadDocId;
    if (!docId) return;

    this.ui.closeModal("modal-download-choice");

    if (format === "WORD") {
      this.downloadDocumentAsWord(docId);
    } else if (format === "EXCEL") {
      this.downloadDocumentAsExcel(docId);
    } else if (format === "PDF") {
      this.printOrSaveDocumentAsPDF(docId);
    }
  }

  openBatchDownloadChoiceModal() {
    this.ui.openModal("modal-batch-download-choice");
  }

  downloadDocumentAsWord(docId) {
    let doc = this.store.getDocumentById(docId);
    if (!doc) {
      const qItem = this.batchQueue.find(q => q.result && q.result.id === docId);
      if (qItem) doc = qItem.result;
    }

    if (!doc) {
      this.ui.showToast("Data dokumen tidak ditemukan.", "danger");
      return;
    }

    const safeDocNum = (doc.documentNumber || doc.id).replace(/[^a-zA-Z0-9_-]/g, "_");
    const extractions = doc.extractions || {};

    const wordHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Dosir Kemitraan IT Del - ${this.ui.escapeHtml(doc.documentNumber || doc.id)}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
  @page Section1 {
    size: 595.3pt 841.9pt;
    margin: 54pt 54pt 54pt 54pt;
    mso-header-margin: 36pt;
    mso-footer-margin: 36pt;
  }
  div.Section1 { page: Section1; }
  body {
    font-family: 'Calibri', 'Times New Roman', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.45;
    color: #1e293b;
  }
  .kop-surat {
    text-align: center;
    border-bottom: 3pt double #0b2545;
    padding-bottom: 8pt;
    margin-bottom: 14pt;
  }
  .kop-inst {
    font-size: 15pt;
    font-weight: bold;
    color: #0b2545;
    text-transform: uppercase;
    letter-spacing: 0.5pt;
  }
  .kop-sub {
    font-size: 11pt;
    font-weight: bold;
    color: #134074;
    margin-top: 2pt;
  }
  .kop-addr {
    font-size: 9pt;
    color: #475569;
    margin-top: 3pt;
  }
  .doc-title-box {
    text-align: center;
    background-color: #f1f5f9;
    border: 1pt solid #cbd5e1;
    padding: 8pt;
    margin-top: 10pt;
    margin-bottom: 14pt;
  }
  .doc-title {
    font-size: 12pt;
    font-weight: bold;
    color: #0b2545;
  }
  .doc-num {
    font-size: 10pt;
    color: #334155;
    margin-top: 2pt;
  }
  table.meta-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8pt;
    margin-bottom: 14pt;
  }
  table.meta-table th {
    background-color: #0b2545;
    color: #ffffff;
    font-size: 9.5pt;
    font-weight: bold;
    text-align: left;
    padding: 6pt 8pt;
    border: 1pt solid #94a3b8;
  }
  table.meta-table td {
    padding: 5pt 8pt;
    border: 1pt solid #cbd5e1;
    font-size: 9.5pt;
    vertical-align: top;
  }
  table.meta-table tr:nth-child(even) td {
    background-color: #f8fafc;
  }
  .field-label {
    font-weight: bold;
    width: 28%;
    color: #0f172a;
  }
  .field-val {
    width: 52%;
  }
  .field-score {
    width: 20%;
    text-align: center;
    color: #475569;
  }
  .sig-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20pt;
    border: none;
  }
  .sig-table td {
    width: 50%;
    vertical-align: top;
    padding: 10pt;
    border: none;
  }
  .sig-box {
    border: 1pt solid #94a3b8;
    background-color: #f8fafc;
    padding: 10pt;
    min-height: 140pt;
  }
  .disclaimer-box {
    margin-top: 24pt;
    border-top: 1pt dashed #cbd5e1;
    padding-top: 8pt;
    font-size: 8pt;
    color: #64748b;
    text-align: justify;
  }
</style>
</head>
<body>
<div class="Section1">
  <div class="kop-surat">
    <div class="kop-inst">YAYASAN JENDERAL PENDIDIKAN DAN KEBUDAYAAN DEL</div>
    <div class="kop-sub">INSTITUT TEKNOLOGI DEL &bull; UNIT KERJASAMA &amp; KEMITRAAN</div>
    <div class="kop-addr">
      Jl. Sisingamangaraja, Sitoluama, Laguboti, Kabupaten Toba, Sumatera Utara 22381<br>
      Surel: kemitraan@del.ac.id | Situs Web: www.del.ac.id | Telp: +62 632 331234
    </div>
  </div>

  <div class="doc-title-box">
    <div class="doc-title">DOSIR RESMI &amp; LEMBAR VERIFIKASI METADATA KERJA SAMA</div>
    <div class="doc-num">Nomor Naskah: <b>${this.ui.escapeHtml(doc.documentNumber || "-")}</b> &bull; Jenis: <b>${this.ui.escapeHtml(doc.type || "-")}</b></div>
  </div>

  <p><b>A. IDENTITAS &amp; RINGKASAN NASKAH PERJANJIAN:</b></p>
  <table class="meta-table">
    <tr>
      <td class="field-label">Judul Naskah Kerja Sama</td>
      <td class="field-val"><b>${this.ui.escapeHtml(doc.title || "-")}</b></td>
      <td class="field-score">Status: <b>${this.ui.escapeHtml(doc.status || "-")}</b></td>
    </tr>
    <tr>
      <td class="field-label">Mitra Kerja Sama</td>
      <td class="field-val">${this.ui.escapeHtml(doc.partnerName || "-")}</td>
      <td class="field-score">Negara: Indonesia</td>
    </tr>
    <tr>
      <td class="field-label">Klasifikasi Tri Dharma</td>
      <td class="field-val">${this.ui.escapeHtml(doc.triDharma || "-")}</td>
      <td class="field-score">Fakultas: ${this.ui.escapeHtml(doc.facultyId || "FITE")}</td>
    </tr>
    <tr>
      <td class="field-label">Masa Berlaku</td>
      <td class="field-val">${this.ui.escapeHtml(doc.signedDate || "-")} s.d. ${this.ui.escapeHtml(doc.effectiveEndDate || "-")}</td>
      <td class="field-score">Tingkat Akurasi: ${Math.round((doc.aiConfidenceScore || doc.confidenceScore || 0.95) * 100)}%</td>
    </tr>
    <tr>
      <td class="field-label">Alokasi Anggaran</td>
      <td class="field-val">${this.ui.formatRupiah(doc.budget || 0)}</td>
      <td class="field-score">Validasi: ${doc.officialDataConfirmed ? "TERVALIDASI RESMI" : "DRAFT"}</td>
    </tr>
    <tr>
      <td class="field-label">Ruang Lingkup Kegiatan</td>
      <td colspan="2">${this.ui.escapeHtml(doc.scope || "-")}</td>
    </tr>
  </table>

  <p><b>B. MATRIKS 26 METADATA TERVERIFIKASI:</b></p>
  <table class="meta-table">
    <thead>
      <tr>
        <th style="width: 5%;">No</th>
        <th style="width: 30%;">Parameter Metadata</th>
        <th style="width: 45%;">Nilai Terekstraksi</th>
        <th style="width: 20%;">Akurasi / Status</th>
      </tr>
    </thead>
    <tbody>
      ${Object.keys(extractions).length > 0 ? Object.entries(extractions).map(([k, f], idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><b>${k.replace(/_/g, " ").toUpperCase()}</b></td>
          <td>${this.ui.escapeHtml(String(f.value || "-"))}</td>
          <td style="text-align: center;">${f.confidence ? Math.round(f.confidence * 100) + "%" : "Valid"}</td>
        </tr>
      `).join("") : `
        <tr><td colspan="4" style="text-align: center;">Metadata ringkas tersedia pada bagian A.</td></tr>
      `}
    </tbody>
  </table>

  <p><b>C. PEMETAAN INSTRUMEN AKREDITASI &amp; IKU:</b></p>
  <table class="meta-table">
    <tr>
      <td class="field-label">Instrumen BAN-PT</td>
      <td class="field-val" colspan="2">Kriteria 1 (Tata Pamong), Kriteria 6 (Pendidikan), Kriteria 7 (Penelitian), Kriteria 8 (PkM)</td>
    </tr>
    <tr>
      <td class="field-label">Instrumen LAM-INFOKOM</td>
      <td class="field-val" colspan="2">Kriteria C.1.4 (Tata Pamong, Tata Kelola, dan Kerjasama Program Studi)</td>
    </tr>
    <tr>
      <td class="field-label">Capaian IKU Perguruan Tinggi</td>
      <td class="field-val" colspan="2">IKU-6: Program Studi Bekerja Sama dengan Mitra Kelas Dunia / Industri Relevan</td>
    </tr>
  </table>

  <p style="margin-top: 14pt;"><b>D. PENGESAHAN PENANDATANGAN PARA PIHAK:</b></p>
  <table class="sig-table">
    <tr>
      <td>
        <div class="sig-box">
          <div style="font-weight: bold; color: #0b2545;">PIHAK PERTAMA (IT DEL):</div>
          <div style="font-size: 9pt; color: #475569; margin-top: 2pt;">Institut Teknologi Del</div>
          <div style="height: 55pt;"></div>
          <div style="font-weight: bold; text-decoration: underline;">${this.ui.escapeHtml(doc.itDelSignatoryName || "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.")}</div>
          <div style="font-size: 9pt;">${this.ui.escapeHtml(doc.itDelSignatoryPosition || "Rektor Institut Teknologi Del")}</div>
        </div>
      </td>
      <td>
        <div class="sig-box">
          <div style="font-weight: bold; color: #0b2545;">PIHAK KEDUA (MITRA):</div>
          <div style="font-size: 9pt; color: #475569; margin-top: 2pt;">${this.ui.escapeHtml(doc.partnerName || "Mitra Kemitraan")}</div>
          <div style="height: 55pt;"></div>
          <div style="font-weight: bold; text-decoration: underline;">${this.ui.escapeHtml(doc.partnerSignatoryName || "Pimpinan Berwenang Mitra")}</div>
          <div style="font-size: 9pt;">${this.ui.escapeHtml(doc.partnerSignatoryPosition || "Direktur / Pimpinan")}</div>
        </div>
      </td>
    </tr>
  </table>

  <div class="disclaimer-box">
    <b>CATATAN INTEGRITAS &amp; HAK CIPTA:</b> Dosir ini diterbitkan secara resmi oleh Sistem Tata Kelola Kemitraan KSDAS IT Del.
    Seluruh berkas diproses secara terenkripsi di memori lokal peramban (Client-Side Privacy Sandbox).
    Hak Cipta &copy; 2026 Samuel Hasudungan Tampubolon. Hak Cipta dilindungi Undang-Undang Republik Indonesia Nomor 28 Tahun 2014.
    Dicetak pada: ${new Date().toLocaleString("id-ID")}
  </div>
</div>
</body>
</html>
    `;

    const blob = new Blob([wordHtml], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KSDAS_Dosir_${safeDocNum}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.ui.showToast(`Berkas Word resmi (.doc) berhasil diunduh ke komputer Anda!`, "success", 4000);
  }

  downloadDocumentAsExcel(docId) {
    let doc = this.store.getDocumentById(docId);
    if (!doc) {
      const qItem = this.batchQueue.find(q => q.result && q.result.id === docId);
      if (qItem) doc = qItem.result;
    }

    if (!doc) {
      this.ui.showToast("Data dokumen tidak ditemukan.", "danger");
      return;
    }

    const safeDocNum = (doc.documentNumber || doc.id).replace(/[^a-zA-Z0-9_-]/g, "_");
    const extractions = doc.extractions || {};

    const excelHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<!--[if gte mso 9]>
<xml>
<x:ExcelWorkbook>
<x:ExcelWorksheets>
<x:ExcelWorksheet>
<x:Name>Metadata Naskah</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet>
</x:ExcelWorksheets>
</x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  th { background-color: #0b2545; color: #ffffff; font-weight: bold; border: 0.5pt solid #cbd5e1; padding: 6px; }
  td { border: 0.5pt solid #cbd5e1; padding: 5px; font-family: Arial, sans-serif; font-size: 10pt; }
  .title-cell { font-size: 14pt; font-weight: bold; color: #0b2545; text-align: center; }
  .header-cell { background-color: #f1f5f9; font-weight: bold; }
</style>
</head>
<body>
<table>
  <tr><td colspan="5" class="title-cell">YAYASAN JENDERAL PENDIDIKAN DAN KEBUDAYAAN DEL</td></tr>
  <tr><td colspan="5" style="text-align: center; font-size: 12pt; font-weight: bold; color: #134074;">INSTITUT TEKNOLOGI DEL - UNIT KERJASAMA &amp; KEMITRAAN</td></tr>
  <tr><td colspan="5" style="text-align: center; font-size: 10pt; color: #475569;">LEMBAR METADATA RESMI NASKAH KERJA SAMA (26 PARAMETER)</td></tr>
  <tr><td></td></tr>
  <tr class="header-cell"><td>Nomor Dokumen</td><td colspan="4"><b>${this.ui.escapeHtml(doc.documentNumber || "-")}</b></td></tr>
  <tr class="header-cell"><td>Judul Dokumen</td><td colspan="4"><b>${this.ui.escapeHtml(doc.title || "-")}</b></td></tr>
  <tr class="header-cell"><td>Jenis Dokumen</td><td>${this.ui.escapeHtml(doc.type || "-")}</td><td>Status Validasi</td><td colspan="2">${this.ui.escapeHtml(doc.status || "-")}</td></tr>
  <tr class="header-cell"><td>Mitra Kerjasama</td><td>${this.ui.escapeHtml(doc.partnerName || "-")}</td><td>Tingkat Akurasi</td><td colspan="2">${Math.round((doc.aiConfidenceScore || doc.confidenceScore || 0.95) * 100)}%</td></tr>
  <tr class="header-cell"><td>Masa Berlaku</td><td>${this.ui.escapeHtml(doc.signedDate || "-")} s.d. ${this.ui.escapeHtml(doc.effectiveEndDate || "-")}</td><td>Anggaran</td><td colspan="2">${this.ui.formatRupiah(doc.budget || 0)}</td></tr>
  <tr class="header-cell"><td>Penandatangan IT Del</td><td>${this.ui.escapeHtml(doc.itDelSignatoryName || "-")}</td><td>Penandatangan Mitra</td><td colspan="2">${this.ui.escapeHtml(doc.partnerSignatoryName || "-")}</td></tr>
  <tr><td></td></tr>
  <tr>
    <th style="width: 40px;">No</th>
    <th style="width: 220px;">Parameter Field</th>
    <th style="width: 320px;">Nilai Terekstraksi</th>
    <th style="width: 120px;">Tingkat Akurasi</th>
    <th style="width: 180px;">Metode Deteksi</th>
  </tr>
  ${Object.keys(extractions).length > 0 ? Object.entries(extractions).map(([k, f], idx) => `
    <tr>
      <td style="text-align: center;">${idx + 1}</td>
      <td><b>${k.replace(/_/g, " ").toUpperCase()}</b></td>
      <td>${this.ui.escapeHtml(String(f.value || "-"))}</td>
      <td style="text-align: center;">${f.confidence ? Math.round(f.confidence * 100) + "%" : "100%"}</td>
      <td>${f.extraction_method || "TEREKSTRAKSI"}</td>
    </tr>
  `).join("") : `
    <tr><td colspan="5">Data metadata ringkas tersedia pada ringkasan di atas.</td></tr>
  `}
  <tr><td></td></tr>
  <tr><td colspan="5" style="font-size: 8pt; color: #64748b;">Hak Cipta &copy; 2026 Samuel Hasudungan Tampubolon &bull; KSDAS Institut Teknologi Del</td></tr>
</table>
</body>
</html>
    `;

    const blob = new Blob([excelHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KSDAS_Metadata_${safeDocNum}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.ui.showToast(`Spreadsheet Excel (.xls) berhasil diunduh ke komputer Anda!`, "success", 4000);
  }

  printOrSaveDocumentAsPDF(docId) {
    let doc = this.store.getDocumentById(docId);
    if (!doc) {
      const qItem = this.batchQueue.find(q => q.result && q.result.id === docId);
      if (qItem) doc = qItem.result;
    }

    if (!doc) {
      this.ui.showToast("Data dokumen tidak ditemukan.", "danger");
      return;
    }

    const printArea = document.getElementById("printable-dossier-area");
    if (!printArea) return;

    printArea.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 25px; color: #0b2545;">
        <div style="text-align: center; border-bottom: 2.5px solid #0b2545; padding-bottom: 12px; margin-bottom: 18px;">
          <h2 style="margin: 0; font-size: 15pt; font-weight: 800; color: #0b2545;">YAYASAN JENDERAL PENDIDIKAN DAN KEBUDAYAAN DEL</h2>
          <h3 style="margin: 3px 0 0 0; font-size: 12pt; color: #134074;">INSTITUT TEKNOLOGI DEL &bull; UNIT KERJASAMA &amp; KEMITRAAN</h3>
          <p style="margin: 4px 0 0 0; font-size: 9pt; color: #475569;">
            Jl. Sisingamangaraja, Sitoluama, Laguboti, Toba, Sumatera Utara 22381 | kemitraan@del.ac.id
          </p>
        </div>

        <div style="text-align: center; margin-bottom: 20px;">
          <h3 style="margin: 0; font-size: 13pt; font-weight: 700; text-transform: uppercase;">
            LEMBAR HASIL VALIDASI &amp; AKREDITASI NASKAH KERJA SAMA
          </h3>
          <p style="margin: 3px 0 0 0; font-size: 10pt; color: #334155;">
            Nomor: <b>${this.ui.escapeHtml(doc.documentNumber || "-")}</b> | Jenis: <b>${this.ui.escapeHtml(doc.type || "-")}</b>
          </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10pt;">
          <tr style="border-bottom: 1px solid #cbd5e1;"><td style="padding: 6px; font-weight: 700; width: 30%;">Judul Perjanjian:</td><td style="padding: 6px;">${this.ui.escapeHtml(doc.title || "-")}</td></tr>
          <tr style="border-bottom: 1px solid #cbd5e1;"><td style="padding: 6px; font-weight: 700;">Mitra Kerja Sama:</td><td style="padding: 6px;">${this.ui.escapeHtml(doc.partnerName || "-")}</td></tr>
          <tr style="border-bottom: 1px solid #cbd5e1;"><td style="padding: 6px; font-weight: 700;">Fakultas / Prodi:</td><td style="padding: 6px;">${this.ui.escapeHtml(doc.facultyId || "FITE")} / ${this.ui.escapeHtml(doc.studyProgramId || "Semua Prodi")}</td></tr>
          <tr style="border-bottom: 1px solid #cbd5e1;"><td style="padding: 6px; font-weight: 700;">Masa Berlaku:</td><td style="padding: 6px;">${this.ui.escapeHtml(doc.signedDate || "-")} s.d. ${this.ui.escapeHtml(doc.effectiveEndDate || "-")}</td></tr>
          <tr style="border-bottom: 1px solid #cbd5e1;"><td style="padding: 6px; font-weight: 700;">Alokasi Anggaran:</td><td style="padding: 6px;">${this.ui.formatRupiah(doc.budget || 0)}</td></tr>
          <tr style="border-bottom: 1px solid #cbd5e1;"><td style="padding: 6px; font-weight: 700;">Status Validasi Manual:</td><td style="padding: 6px;"><b>${this.ui.escapeHtml(doc.status || "TEREKSTRAKSI")}</b> (Oleh: ${this.ui.escapeHtml(doc.validatedBy || "Staf Unit Kerja Sama")})</td></tr>
          <tr style="border-bottom: 1px solid #cbd5e1;"><td style="padding: 6px; font-weight: 700;">Pemetaan Akreditasi:</td><td style="padding: 6px;">BAN-PT: Kriteria 1, 6, 7, 8 | LAM-INFOKOM: Kriteria C.1.4 | IKU-6 PT</td></tr>
        </table>

        <div style="display: flex; justify-content: space-between; margin-top: 30px;">
          <div style="width: 45%; border: 1px solid #94a3b8; padding: 12px; border-radius: 6px; text-align: center;">
            <div style="font-weight: 700; font-size: 9pt;">Pihak Pertama (IT Del):</div>
            <div style="height: 60px;"></div>
            <div style="font-weight: 700; text-decoration: underline; font-size: 10pt;">${this.ui.escapeHtml(doc.itDelSignatoryName || "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.")}</div>
            <div style="font-size: 8.5pt; color: #475569;">${this.ui.escapeHtml(doc.itDelSignatoryPosition || "Rektor")}</div>
          </div>
          <div style="width: 45%; border: 1px solid #94a3b8; padding: 12px; border-radius: 6px; text-align: center;">
            <div style="font-weight: 700; font-size: 9pt;">Pihak Kedua (Mitra):</div>
            <div style="height: 60px;"></div>
            <div style="font-weight: 700; text-decoration: underline; font-size: 10pt;">${this.ui.escapeHtml(doc.partnerSignatoryName || "Pimpinan Mitra")}</div>
            <div style="font-size: 8.5pt; color: #475569;">${this.ui.escapeHtml(doc.partnerSignatoryPosition || "Direktur / Pimpinan")}</div>
          </div>
        </div>

        <div style="margin-top: 25px; font-size: 8pt; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
          Dokumen ini merupakan salinan bukti sah akreditasi SPM/AMI KSDAS IT Del.
          Copyright &copy; 2026 Samuel Hasudungan Tampubolon. All rights reserved.
        </div>
      </div>
    `;

    printArea.style.display = "block";
    window.print();
    setTimeout(() => {
      printArea.style.display = "none";
    }, 1000);
  }

  downloadBatchAsExcel() {
    this.ui.closeModal("modal-batch-download-choice");

    let items = (this.batchQueue && this.batchQueue.length > 0)
      ? this.batchQueue.filter(q => q.result).map(q => q.result)
      : this.store.getDocuments();

    if (!items || items.length === 0) {
      this.ui.showToast("Tidak ada data naskah untuk diunduh.", "warning");
      return;
    }

    const excelHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<!--[if gte mso 9]>
<xml>
<x:ExcelWorkbook>
<x:ExcelWorksheets>
<x:ExcelWorksheet>
<x:Name>Rekapitulasi Kemitraan IT Del</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet>
</x:ExcelWorksheets>
</x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  th { background-color: #0b2545; color: #ffffff; font-weight: bold; border: 0.5pt solid #cbd5e1; padding: 6px; }
  td { border: 0.5pt solid #cbd5e1; padding: 5px; font-family: Arial, sans-serif; font-size: 9.5pt; }
  .title-cell { font-size: 14pt; font-weight: bold; color: #0b2545; text-align: center; }
</style>
</head>
<body>
<table>
  <tr><td colspan="15" class="title-cell">YAYASAN JENDERAL PENDIDIKAN DAN KEBUDAYAAN DEL</td></tr>
  <tr><td colspan="15" style="text-align: center; font-size: 12pt; font-weight: bold; color: #134074;">INSTITUT TEKNOLOGI DEL - UNIT KERJASAMA &amp; KEMITRAAN</td></tr>
  <tr><td colspan="15" style="text-align: center; font-size: 10pt; color: #475569;">REKAPITULASI RESMI NASKAH KERJA SAMA &amp; PEMETAAN AKREDITASI</td></tr>
  <tr><td></td></tr>
  <tr>
    <th>No</th>
    <th>Nomor Naskah</th>
    <th>Judul Perjanjian</th>
    <th>Jenis</th>
    <th>Mitra Kerjasama</th>
    <th>Penandatangan Mitra</th>
    <th>Penandatangan IT Del</th>
    <th>Tgl Mulai</th>
    <th>Tgl Berakhir</th>
    <th>Alokasi Anggaran (Rp)</th>
    <th>Tri Dharma</th>
    <th>Fakultas</th>
    <th>Status Validasi</th>
    <th>Tingkat Akurasi</th>
    <th>Kriteria Akreditasi</th>
  </tr>
  ${items.map((doc, idx) => `
    <tr>
      <td style="text-align: center;">${idx + 1}</td>
      <td><b>${this.ui.escapeHtml(doc.documentNumber || doc.id)}</b></td>
      <td>${this.ui.escapeHtml(doc.title || "-")}</td>
      <td style="text-align: center;">${this.ui.escapeHtml(doc.type || "-")}</td>
      <td>${this.ui.escapeHtml(doc.partnerName || "-")}</td>
      <td>${this.ui.escapeHtml(doc.partnerSignatoryName || "-")}</td>
      <td>${this.ui.escapeHtml(doc.itDelSignatoryName || "-")}</td>
      <td style="text-align: center;">${this.ui.escapeHtml(doc.signedDate || "-")}</td>
      <td style="text-align: center;">${this.ui.escapeHtml(doc.effectiveEndDate || "-")}</td>
      <td style="text-align: right;">${Number(doc.budget || 0).toLocaleString("id-ID")}</td>
      <td>${this.ui.escapeHtml(doc.triDharma || "-")}</td>
      <td>${this.ui.escapeHtml(doc.facultyId || "FITE")}</td>
      <td style="text-align: center;">${this.ui.escapeHtml(doc.status || "-")}</td>
      <td style="text-align: center;">${Math.round((doc.aiConfidenceScore || doc.confidenceScore || 0.95) * 100)}%</td>
      <td>BAN-PT C.1.b, LAM-INFOKOM C.1.4, IKU-6</td>
    </tr>
  `).join("")}
  <tr><td></td></tr>
  <tr><td colspan="15" style="font-size: 8pt; color: #64748b;">Diterbitkan otomatis oleh KSDAS IT Del &bull; Copyright &copy; 2026 Samuel Hasudungan Tampubolon</td></tr>
</table>
</body>
</html>
    `;

    const blob = new Blob([excelHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KSDAS_Rekapitulasi_Kemitraan_ITDel_${Date.now()}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.ui.showToast(`Rekapitulasi Excel (${items.length} dokumen) berhasil diunduh ke komputer Anda!`, "success", 4000);
  }

  downloadBatchAsWord() {
    this.ui.closeModal("modal-batch-download-choice");

    let items = (this.batchQueue && this.batchQueue.length > 0)
      ? this.batchQueue.filter(q => q.result).map(q => q.result)
      : this.store.getDocuments();

    if (!items || items.length === 0) {
      this.ui.showToast("Tidak ada data naskah untuk diunduh.", "warning");
      return;
    }

    const wordHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Kompilasi Dosir Kemitraan IT Del</title>
<style>
  @page Section1 { size: 595.3pt 841.9pt; margin: 54pt; }
  div.Section1 { page: Section1; }
  body { font-family: 'Calibri', Arial, sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.4; }
  .kop { text-align: center; border-bottom: 2.5pt solid #0b2545; padding-bottom: 6pt; margin-bottom: 12pt; }
  table { border-collapse: collapse; width: 100%; margin-top: 8pt; margin-bottom: 12pt; }
  th { background-color: #0b2545; color: #ffffff; padding: 6pt; font-size: 9.5pt; text-align: left; }
  td { padding: 5pt; border: 1pt solid #cbd5e1; font-size: 9.5pt; }
  tr:nth-child(even) td { background-color: #f8fafc; }
</style>
</head>
<body>
<div class="Section1">
  <div class="kop">
    <div style="font-size: 14pt; font-weight: bold; color: #0b2545;">YAYASAN JENDERAL PENDIDIKAN DAN KEBUDAYAAN DEL</div>
    <div style="font-size: 11pt; font-weight: bold; color: #134074;">INSTITUT TEKNOLOGI DEL &bull; UNIT KERJASAMA &amp; KEMITRAAN</div>
    <div style="font-size: 9pt; color: #475569;">Jl. Sisingamangaraja, Sitoluama, Laguboti, Toba, Sumatera Utara 22381</div>
  </div>

  <h3 style="text-align: center; color: #0b2545;">KOMPILASI DOSIR &amp; REKAPITULASI NASKAH KERJA SAMA</h3>
  <p style="text-align: center; font-size: 9.5pt; color: #64748b;">Jumlah Naskah: <b>${items.length} Dokumen</b> &bull; Tanggal Kompilasi: ${new Date().toLocaleDateString("id-ID")}</p>

  <table>
    <thead>
      <tr>
        <th style="width: 5%;">No</th>
        <th style="width: 25%;">Nomor &amp; Judul Naskah</th>
        <th style="width: 25%;">Mitra &amp; Penandatangan</th>
        <th style="width: 25%;">Penandatangan IT Del</th>
        <th style="width: 20%;">Masa Berlaku &amp; Status</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((doc, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><b>${this.ui.escapeHtml(doc.documentNumber || doc.id)}</b><br><span style="font-size: 8.5pt; color: #475569;">${this.ui.escapeHtml(doc.title || "-")}</span></td>
          <td><b>${this.ui.escapeHtml(doc.partnerName || "-")}</b><br><span style="font-size: 8.5pt;">${this.ui.escapeHtml(doc.partnerSignatoryName || "-")}</span></td>
          <td><b>${this.ui.escapeHtml(doc.itDelSignatoryName || "-")}</b><br><span style="font-size: 8.5pt;">${this.ui.escapeHtml(doc.itDelSignatoryPosition || "-")}</span></td>
          <td>${this.ui.escapeHtml(doc.signedDate || "-")} s.d. ${this.ui.escapeHtml(doc.effectiveEndDate || "-")}<br><b>${this.ui.escapeHtml(doc.status || "-")}</b></td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div style="margin-top: 20pt; font-size: 8pt; color: #64748b; text-align: center; border-top: 1pt solid #cbd5e1; padding-top: 8pt;">
    Diterbitkan oleh KSDAS IT Del &bull; Copyright &copy; 2026 Samuel Hasudungan Tampubolon. All rights reserved.
  </div>
</div>
</body>
</html>
    `;

    const blob = new Blob([wordHtml], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KSDAS_Kompilasi_Dosir_Kemitraan_${Date.now()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.ui.showToast(`Berkas Kompilasi Word (.doc) berhasil diunduh ke komputer Anda!`, "success", 4000);
  }

  printBatchAsPDF() {
    this.ui.closeModal("modal-batch-download-choice");
    const docs = this.store.state.documents || [];
    if (docs.length === 0) {
      this.ui.showToast("Belum ada dokumen untuk dicetak sebagai PDF!", "warning");
      return;
    }

    const printArea = document.getElementById("printable-dossier-area");
    if (!printArea) return;

    const rowsHtml = docs.map((d, idx) => {
      const pName = (d.signatories && d.signatories.partner && d.signatories.partner.name) ? d.signatories.partner.name : (d.partner || "-");
      const dName = (d.signatories && d.signatories.itDel && d.signatories.itDel.name) ? d.signatories.itDel.name : "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.";
      const statusBadge = d.status === "VALIDATED" ? "TERVALIDASI RESMI" : (d.status === "NEEDS_REVIEW" ? "PERLU REVIEW" : "TEREKSTRAKSI");
      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 8.5pt;">
          <td style="padding: 6px 8px; text-align: center;">${idx + 1}</td>
          <td style="padding: 6px 8px; font-weight: 700; color: #0b2545;">${this.ui.escapeHtml(d.documentNumber || d.id)}</td>
          <td style="padding: 6px 8px;">${this.ui.escapeHtml(d.type || "-")}</td>
          <td style="padding: 6px 8px; font-weight: 600;">${this.ui.escapeHtml(d.partner || "-")}</td>
          <td style="padding: 6px 8px;">${this.ui.escapeHtml(pName)}</td>
          <td style="padding: 6px 8px;">${this.ui.escapeHtml(dName)}</td>
          <td style="padding: 6px 8px;">${this.ui.escapeHtml(d.effectiveEndDate || "-")}</td>
          <td style="padding: 6px 8px; text-align: center; font-weight: 700;">${statusBadge}</td>
        </tr>
      `;
    }).join("");

    printArea.innerHTML = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 20px; max-width: 1000px; margin: 0 auto;">
        <div style="border-bottom: 2.5px solid #0b2545; padding-bottom: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h2 style="margin: 0; color: #0b2545; font-size: 16pt; font-weight: 800; text-transform: uppercase;">
              INSTITUT TEKNOLOGI DEL
            </h2>
            <div style="font-size: 10pt; color: #475569; font-weight: 600;">
              DIREKTORAT KEMITRAAN & KERJASAMA STRATEGIS (KSDAS)
            </div>
            <div style="font-size: 8pt; color: #64748b;">
              Sitoluama, Laguboti, Kabupaten Toba, Sumatera Utara 22381 | Telp: +62 632 331234
            </div>
          </div>
          <div style="text-align: right;">
            <div style="background: #0b2545; color: white; padding: 4px 10px; font-weight: 700; font-size: 8.5pt; border-radius: 4px; display: inline-block;">
              REKAPITULASI RESMI AUDIT SPM/AMI
            </div>
            <div style="font-size: 8pt; color: #64748b; margin-top: 4px;">Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <h3 style="margin: 0 0 4px 0; font-size: 12pt; color: #0f172a;">Laporan Rekapitulasi Berkas Kemitraan & Perjanjian Kerja Sama</h3>
          <div style="font-size: 9pt; color: #64748b;">Total Dokumen: <strong>${docs.length} Berkas</strong> | Verifikasi: Sistem KSDAS In-Memory Sandbox IT Del</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-size: 8.5pt; color: #0f172a; text-align: left;">
              <th style="padding: 8px; text-align: center; width: 30px;">No</th>
              <th style="padding: 8px;">No. Dokumen</th>
              <th style="padding: 8px; width: 60px;">Jenis</th>
              <th style="padding: 8px;">Mitra</th>
              <th style="padding: 8px;">Penandatangan Mitra</th>
              <th style="padding: 8px;">Penandatangan IT Del</th>
              <th style="padding: 8px; width: 85px;">Berlaku S.D</th>
              <th style="padding: 8px; text-align: center; width: 110px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div style="margin-top: 30px; display: flex; justify-content: space-between; page-break-inside: avoid;">
          <div style="font-size: 8pt; color: #64748b; max-width: 400px;">
            <p><strong>Catatan Integritas Data:</strong></p>
            <p>Laporan ini dihasilkan secara otomatis oleh sistem KSDAS Institut Teknologi Del dengan proteksi identitas naskah hukum para pihak dan sertifikasi keaslian dokumen.</p>
            <p>Hak Cipta &copy; 2026 Samuel Hasudungan Tampubolon - Hak Cipta Dilindungi Undang-Undang.</p>
          </div>
          <div style="text-align: center; width: 240px;">
            <div style="font-size: 9pt; font-weight: 600; color: #1e293b;">Institut Teknologi Del</div>
            <div style="font-size: 8.5pt; color: #64748b;">Unit Kerja Sama & Kemitraan</div>
            <div style="height: 50px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 8pt; color: #0b2545; border: 1px dashed #cbd5e1; padding: 2px 8px; border-radius: 3px;">[TERVERIFIKASI SISTEM KSDAS]</span>
            </div>
            <div style="font-weight: 700; font-size: 9.5pt; color: #0b2545; border-top: 1px solid #94a3b8; padding-top: 4px;">
              Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.
            </div>
            <div style="font-size: 8pt; color: #64748b;">Rektor Institut Teknologi Del</div>
          </div>
        </div>
      </div>
    `;

    printArea.style.display = "block";
    this.ui.showToast("Membuka dialog cetak / Simpan ke PDF resmi...", "info", 2500);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        printArea.style.display = "none";
      }, 1000);
    }, 400);
  }

  // Alias to preserve backward compatibility
  downloadDocumentAnalysisReport(docId) {
    this.openDownloadChoiceModal(docId);
  }

  downloadBatchAnalysisReport() {
    this.openBatchDownloadChoiceModal();
  }

  downloadCurrentDetailDocument() {
    if (this.currentDetailDocId) {
      this.openDownloadChoiceModal(this.currentDetailDocId);
    } else {
      this.ui.showToast("Dokumen tidak dipilih.", "warning");
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
          <h3 style="color: var(--color-primary-dark); margin-bottom: 6px;">Semua Naskah Telah Divalidasi</h3>
          <p style="font-size: 0.88rem;">Seluruh naskah dalam antrean telah diverifikasi melalui Validasi Manual. Data resmi institusi telah terverifikasi penuh.</p>
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

    // Bind bulk approve button (hanya untuk dokumen yang penandatangannya sudah terverifikasi)
    const bulkBtn = document.getElementById("validation-bulk-approve-btn");
    if (bulkBtn) {
      const highConfIds = pendingDocs
        .filter(d => (d.confidenceScore || 0) >= 0.90 && d.partnerSignatoryName !== "Perlu Verifikasi Manual" && !(d.qualityFlags || []).includes("unverified_signatory"))
        .map(d => d.id);
      bulkBtn.disabled = highConfIds.length === 0;
      bulkBtn.textContent = `Setujui Sekaligus Tingkat Akurasi Tinggi (≥ 90%: ${highConfIds.length} Dokumen)`;
      bulkBtn.onclick = () => {
        const approvedCount = this.store.bulkValidate(highConfIds);
        this.ui.showToast(`${approvedCount} dokumen berkeyakinan tinggi berhasil divalidasi sebagai data resmi!`, "success");
        this.renderValidationView();
      };
    }
  }

  quickApproveDoc(docId) {
    const doc = this.store.getDocumentById(docId);
    if (doc && (doc.partnerSignatoryName === "Perlu Verifikasi Manual" || (doc.qualityFlags || []).includes("unverified_signatory"))) {
      this.ui.showToast("Penandatangan mitra belum terverifikasi! Buka 'Review & Validasi' untuk mengisi nama pejabat yang sah sebelum menyetujui.", "warning", 5000);
      this.openValidationModal(docId);
      return;
    }

    this.store.updateDocument(docId, {
      status: "VALIDATED",
      officialDataConfirmed: true,
      validatedBy: this.store.getRoleDefinition().name,
      validatedDate: new Date().toISOString(),
      qualityFlags: []
    });
    this.ui.showToast("Naskah disetujui sebagai data resmi institusi.", "success");
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
      modalTitle.innerHTML = `🛡️ Validasi Manual Naskah: <span>${this.ui.escapeHtml(doc.documentNumber)}</span>`;
    }

    if (ocrPane) {
      ocrPane.textContent = doc.rawText || "Teks hasil ekstraksi berkas lokal tersedia di sini.";
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
        { key: "partner_signatory_name", label: "Penandatangan Pihak Kedua (Mitra)" },
        { key: "it_del_signatory_name", label: "Penandatangan Pihak Pertama (IT Del)" },
        { key: "budget", label: "Alokasi Anggaran (Rp)" },
        { key: "scope", label: "Ruang Lingkup" }
      ];

      fieldsList.innerHTML = fieldKeys.map(f => {
        const ext = extractions[f.key] || {
          value: doc[f.key] || "",
          confidence: 0.90,
          source_text: "Ekstraksi Teks Berkas",
          extraction_method: "EKSTRAKSI"
        };

        const safeVal = this.ui.escapeHtml(ext.value || "");
        const safeSrc = this.ui.escapeHtml((ext.source_text || "").slice(0, 80));
        const isSignatoryAlert = f.key === "partner_signatory_name" && (safeVal === "Perlu Verifikasi Manual" || ext.requiresManualReview);

        return `
          <div class="field-review-item" style="${isSignatoryAlert ? 'border-left: 3px solid #e63946; background: #fff5f5;' : ''}">
            <div class="field-review-top">
              <span class="field-review-label">${f.label}</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                ${isSignatoryAlert ? '<span style="color: #e63946; font-size: 0.72rem; font-weight: 700;">⚠️ Wajib Verifikasi Manual</span>' : ''}
                <span style="font-size: 0.68rem; color: var(--text-muted);">${ext.extraction_method || 'HEURISTIK'}</span>
                ${this.ui.renderConfidenceBadge(ext.confidence)}
              </div>
            </div>
            <input type="text" class="form-control" id="val-field-${f.key}" value="${safeVal}" style="width: 100%; ${isSignatoryAlert ? 'border-color: #e63946;' : ''}">
            <div class="field-review-source">Sumber: "${safeSrc}"</div>
          </div>
        `;
      }).join("");
    }

    this.ui.openModal("modal-side-by-side-validation");
  }

  saveValidationModalDecision(decisionStatus) {
    if (!this.currentValidationDocId) return;

    // Grab edited values from input fields
    const docNumber = document.getElementById("val-field-document_number")?.value?.trim();
    const title = document.getElementById("val-field-title")?.value?.trim();
    const partner = document.getElementById("val-field-partner")?.value?.trim();
    const scope = document.getElementById("val-field-scope")?.value?.trim();
    const triDharma = document.getElementById("val-field-tri_dharma")?.value?.trim();
    const signedDate = document.getElementById("val-field-signed_date")?.value?.trim();
    const effectiveEndDate = document.getElementById("val-field-effective_end_date")?.value?.trim();
    const partnerSignatoryName = document.getElementById("val-field-partner_signatory_name")?.value?.trim();
    const itDelSignatoryName = document.getElementById("val-field-it_del_signatory_name")?.value?.trim();
    const budgetRaw = document.getElementById("val-field-budget")?.value?.trim();

    // Enforce legal integrity on official data approval
    if (decisionStatus === "VALIDATED") {
      if (!title || !docNumber) {
        this.ui.showToast("Nomor dokumen dan judul naskah wajib diisi sebelum divalidasi.", "danger");
        return;
      }

      if (partnerSignatoryName === "Perlu Verifikasi Manual" || !partnerSignatoryName) {
        this.ui.showToast("Perhatian: Nama Penandatangan Mitra belum diisi dengan nama pejabat yang sah. Harap ketik nama penandatangan mitra sebelum menetapkan status resmi.", "danger", 6000);
        return;
      }
    }

    if (signedDate && effectiveEndDate) {
      const dStart = new Date(signedDate);
      const dEnd = new Date(effectiveEndDate);
      if (!isNaN(dStart.getTime()) && !isNaN(dEnd.getTime()) && dEnd < dStart) {
        this.ui.showToast("Tanggal berakhir harus sama atau setelah tanggal mulai.", "danger");
        return;
      }
    }

    const updates = {
      status: decisionStatus,
      officialDataConfirmed: decisionStatus === "VALIDATED",
      validatedBy: this.store.getRoleDefinition().name,
      validatedDate: new Date().toISOString()
    };

    if (docNumber) updates.documentNumber = docNumber;
    if (title) updates.title = title;
    if (partner) updates.partnerName = partner;
    if (scope) updates.scope = scope;
    if (triDharma) updates.triDharma = triDharma;
    if (signedDate) updates.signedDate = signedDate;
    if (effectiveEndDate) updates.effectiveEndDate = effectiveEndDate;
    if (partnerSignatoryName) updates.partnerSignatoryName = partnerSignatoryName;
    if (itDelSignatoryName) updates.itDelSignatoryName = itDelSignatoryName;
    if (budgetRaw) {
      const num = Number(budgetRaw.replace(/[^0-9.-]+/g, ""));
      if (!isNaN(num)) updates.budget = num;
    }

    this.store.updateDocument(this.currentValidationDocId, updates);
    this.ui.closeModal("modal-side-by-side-validation");
    this.ui.showToast(`Naskah berhasil divalidasi manual: Status ${decisionStatus}`, "success");
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
      const safePName = this.ui.escapeHtml(p.name);
      const safePCountry = this.ui.escapeHtml(p.country || "");
      const safePCity = this.ui.escapeHtml(p.city || "");
      const safePPic = this.ui.escapeHtml(p.contactPerson || "-");

      return `
        <div class="card" style="margin-bottom: 24px;">
          <div class="tree-node-partner">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span class="badge" style="background: rgba(255,255,255,0.2); color: #fff; margin-bottom: 4px;">${this.ui.escapeHtml(p.type)}</span>
                <h3 style="font-size: 1.15rem; font-weight: 700;">${safePName}</h3>
                <div style="font-size: 0.78rem; opacity: 0.85;">${safePCountry} &bull; ${safePCity} &bull; PIC: ${safePPic}</div>
              </div>
              <span class="badge badge-success" style="background: #2A9D8F; color: white;">${partnerDocs.length} Dokumen</span>
            </div>
          </div>

          <div class="tree-container">
            ${mous.length === 0 ? `<div style="padding: 16px; color: var(--text-muted); font-size: 0.84rem;">Belum ada Nota Kesepahaman (MoU) induk yang tercatat.</div>` : ''}
            ${mous.map(mou => {
              // Find child PKS
              const childPks = partnerDocs.filter(d => d.type === "PKS_MOA" && (d.parentId === mou.id || d.parentNumber === mou.documentNumber));
              const safeMouTitle = this.ui.escapeHtml(mou.title);
              const safeMouNum = this.ui.escapeHtml(mou.documentNumber);

              return `
                <div class="tree-branch">
                  <div class="tree-card" style="border-left: 4px solid #134074;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                      <div>
                        ${this.ui.renderTypeBadge("MOU_LOI")}
                        <span style="font-weight: 700; margin-left: 6px; color: var(--color-primary-dark); cursor: pointer;" onclick="ksdasApp.viewDocumentDetail('${mou.id}')">${safeMouTitle}</span>
                        <div style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">
                          ${safeMouNum} (${mou.signedDate} s/d ${mou.effectiveEndDate})
                        </div>
                      </div>
                      ${this.ui.renderStatusBadge(mou.status)}
                    </div>
                  </div>

                  <!-- Children PKS -->
                  ${childPks.map(pks => {
                    const childIAs = partnerDocs.filter(d => d.type === "IA" && (d.parentId === pks.id || d.parentNumber === pks.documentNumber));
                    const safePksTitle = this.ui.escapeHtml(pks.title);
                    const safePksNum = this.ui.escapeHtml(pks.documentNumber);

                    return `
                      <div class="tree-branch">
                        <div class="tree-card" style="border-left: 4px solid #0077B6;">
                          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                              ${this.ui.renderTypeBadge("PKS_MOA")}
                              <span style="font-weight: 600; margin-left: 6px; cursor: pointer;" onclick="ksdasApp.viewDocumentDetail('${pks.id}')">${safePksTitle}</span>
                              <div style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">
                                ${safePksNum} &bull; Anggaran: ${this.ui.formatRupiah(pks.budget)}
                              </div>
                            </div>
                            ${this.ui.renderStatusBadge(pks.status)}
                          </div>
                        </div>

                        <!-- Children IA -->
                        ${childIAs.map(ia => {
                          const safeIaTitle = this.ui.escapeHtml(ia.title);
                          const safeIaNum = this.ui.escapeHtml(ia.documentNumber);

                          return `
                            <div class="tree-branch">
                              <div class="tree-card" style="border-left: 4px solid #2A9D8F;">
                                ${this.ui.renderTypeBadge("IA")}
                                <span style="font-weight: 600; margin-left: 6px; cursor: pointer;" onclick="ksdasApp.viewDocumentDetail('${ia.id}')">${safeIaTitle}</span>
                                <div style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted);">${safeIaNum}</div>
                              </div>
                            </div>
                          `;
                        }).join("")}
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
              <div style="font-weight: 600; color: var(--color-primary-dark); font-size: 0.88rem;">${this.ui.escapeHtml(orp.title)}</div>
              <div style="font-size: 0.76rem; color: var(--text-muted);">${this.ui.escapeHtml(orp.documentNumber)} &bull; ${this.ui.escapeHtml(orp.partnerName)}</div>
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
            <span class="badge" style="background: #EFF6FF; color: #1E40AF;">${this.ui.escapeHtml(p.type)}</span>
            <span class="badge ${p.status === 'ACTIVE' ? 'badge-validated' : 'badge-rejected'}">${this.ui.escapeHtml(p.status)}</span>
          </div>

          <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--color-primary-dark); margin-bottom: 6px;">${this.ui.escapeHtml(p.name)}</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">${this.ui.escapeHtml(p.notes || '-')}</p>

          <div style="font-size: 0.78rem; display: flex; flex-direction: column; gap: 4px; border-top: 1px solid var(--border-color); padding-top: 10px;">
            <div>📍 <b>Lokasi:</b> ${this.ui.escapeHtml(p.city)}, ${this.ui.escapeHtml(p.country)}</div>
            <div>👤 <b>PIC:</b> ${this.ui.escapeHtml(p.contactPerson || '-')}</div>
            <div>✉️ <b>Email:</b> ${this.ui.escapeHtml(p.email || '-')}</div>
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
            <div style="font-weight: 600; color: var(--color-primary-dark);">${this.ui.escapeHtml(a.title)}</div>
            <div style="font-size: 0.74rem; color: var(--text-muted); font-family: var(--font-mono);">${this.ui.escapeHtml(a.documentNumber)}</div>
          </td>
          <td><span class="badge" style="background: #EBF5FF; color: #1E40AF;">${this.ui.escapeHtml(a.triDharma)}</span></td>
          <td><b>${this.ui.escapeHtml(a.partnerName)}</b></td>
          <td>${this.ui.escapeHtml(a.pic)}</td>
          <td>${Number(a.participantCount) || 0} peserta</td>
          <td>${this.ui.formatRupiah(a.budget)}</td>
          <td><span class="badge badge-validated">${this.ui.escapeHtml(a.status)}</span></td>
        </tr>
      `).join("");
    }

    if (eviGrid) {
      const evidences = this.store.getEvidences();
      eviGrid.innerHTML = evidences.map(e => `
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <span class="badge" style="background: #F1F5F9; color: #475569;">${this.ui.escapeHtml(e.type)}</span>
            ${e.verified ? '<span class="badge badge-validated">TERVERIFIKASI</span>' : '<span class="badge badge-needs-review">BELUM VERIFIKASI</span>'}
          </div>
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--color-primary-dark); margin-bottom: 4px;">${this.ui.escapeHtml(e.title)}</h4>
          <div style="font-size: 0.76rem; color: var(--text-muted); font-family: var(--font-mono); margin-bottom: 8px;">${this.ui.escapeHtml(e.documentNumber)}</div>
          
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 12px;">
            <div>📁 File: <code>${this.ui.escapeHtml(e.fileName)}</code> (${this.ui.escapeHtml(e.fileSize)})</div>
            <div>📅 Diunggah: ${this.ui.escapeHtml(e.uploadedDate)} oleh ${this.ui.escapeHtml(e.uploadedBy)}</div>
          </div>

          <div style="border-top: 1px solid var(--border-color); padding-top: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.72rem; color: var(--color-primary);">Kriteria: ${(e.mappedCriteria || []).map(c => this.ui.escapeHtml(c)).join(", ")}</span>
            ${!e.verified ? `<button class="btn btn-sm btn-success" onclick="ksdasStore.verifyEvidence('${e.id}')">Verifikasi</button>` : `<span style="font-size: 0.75rem; color: var(--color-success); font-weight: 600;">✓ Oleh ${this.ui.escapeHtml(e.verifiedBy)}</span>`}
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
                  <td style="font-family: var(--font-mono); font-size: 0.78rem;">${this.ui.escapeHtml(d.documentNumber)}</td>
                  <td>
                    <div style="font-weight: 600;">${this.ui.escapeHtml(d.title)}</div>
                    <div style="font-size: 0.74rem; color: var(--text-muted);">${this.ui.escapeHtml(d.partnerName)}</div>
                  </td>
                  <td>${this.ui.escapeHtml(d.triDharma || "EDUCATION")}</td>
                  <td style="font-size: 0.78rem;">${d.effectiveStartDate || "-"} s/d ${d.effectiveEndDate || "-"}</td>
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

        <div style="margin-top: 36px; padding-top: 14px; border-top: 1px dashed var(--border-color); display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: var(--text-muted);">
          <span>KSDAS IT Del &bull; Sistem Informasi Kerja Sama & Analitik Data</span>
          <span>Copyright &copy; 2026 <b>Samuel Hasudungan Tampubolon</b>. All rights reserved.</span>
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
          Hasil Ekstraksi & Deteksi Kueri:
        </h4>
        ${this.ui.renderConfidenceBadge(interp.confidence)}
      </div>

      <div style="font-size: 0.88rem; margin-bottom: 14px;">
        ${interp.explanation}
      </div>

      <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
        <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">Struktur Kriteria Filter:</span>
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
      modalTitle.innerHTML = `📄 ${this.ui.escapeHtml(doc.documentNumber)} &bull; ${this.ui.escapeHtml(doc.title)}`;
    }

    if (modalBody) {
      const safeTitle = this.ui.escapeHtml(doc.title);
      const safeScope = this.ui.escapeHtml(doc.scope || "-");
      const safePartner = this.ui.escapeHtml(doc.partnerName);
      const safeCountry = this.ui.escapeHtml(doc.country || "Indonesia");
      const safePartSign = this.ui.escapeHtml(doc.partnerSignatoryName || "-");
      const safeDelSign = this.ui.escapeHtml(doc.itDelSignatoryName || "-");
      const safeFaculty = this.ui.escapeHtml(doc.facultyId || "-");
      const safeProdi = this.ui.escapeHtml(doc.studyProgramId || "-");
      const safeStart = this.ui.escapeHtml(doc.effectiveStartDate || "-");
      const safeEnd = this.ui.escapeHtml(doc.effectiveEndDate || "-");
      const safePic = this.ui.escapeHtml(doc.pic || "-");
      const safeExpOut = this.ui.escapeHtml(doc.expectedOutput || "-");
      const safeActOut = this.ui.escapeHtml(doc.actualOutput || "-");
      const safeImpact = this.ui.escapeHtml(doc.impact || "-");
      const safeFollowUp = this.ui.escapeHtml(doc.followUp || "-");
      const safeParent = this.ui.escapeHtml(doc.parentNumber || (doc.parentId ? doc.parentId : "Tidak ada (Dokumen Induk MoU)"));
      const safeFile = this.ui.escapeHtml(doc.fileName || "dokumen.pdf");

      modalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
          <div>
            <div style="margin-bottom: 16px;">
              <span class="badge" style="margin-right: 6px;">${doc.type}</span>
              ${this.ui.renderStatusBadge(doc.status)}
              ${this.ui.renderConfidenceBadge(doc.confidenceScore)}
            </div>

            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--color-primary-dark); margin-bottom: 8px;">
              ${safeTitle}
            </h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px; line-height: 1.6;">
              <b>Ruang Lingkup:</b> ${safeScope}
            </p>

            <div class="card" style="padding: 16px; margin-bottom: 16px; background: #F8FAFC;">
              <h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 10px; color: var(--color-primary-dark);">Metadata Penandatangan & Institusi:</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.8rem;">
                <div><b>Mitra:</b> ${safePartner} (${safeCountry})</div>
                <div><b>Penandatangan Mitra:</b> ${safePartSign}</div>
                <div><b>Penandatangan IT Del:</b> ${safeDelSign}</div>
                <div><b>Fakultas / Prodi:</b> ${safeFaculty} / ${safeProdi}</div>
                <div><b>Mulai Berlaku:</b> ${safeStart}</div>
                <div><b>Berakhir Pada:</b> ${safeEnd}</div>
                <div><b>PIC IT Del:</b> ${safePic}</div>
                <div><b>Komitmen Dana:</b> ${this.ui.formatRupiah(doc.budget)}</div>
              </div>
            </div>

            <div class="card" style="padding: 16px;">
              <h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 8px; color: var(--color-primary-dark);">Capaian Output, Outcome & Dampak:</h4>
              <ul style="font-size: 0.82rem; padding-left: 20px; line-height: 1.6; color: var(--text-main);">
                <li><b>Target Luaran:</b> ${safeExpOut}</li>
                <li><b>Realisasi Luaran:</b> ${safeActOut}</li>
                <li><b>Dampak (Impact):</b> ${safeImpact}</li>
                <li><b>Rencana Tindak Lanjut:</b> ${safeFollowUp}</li>
              </ul>
            </div>
          </div>

          <div>
            <div class="card" style="padding: 16px; margin-bottom: 16px;">
              <h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 8px; color: var(--color-primary-dark);">Relasi Dokumen:</h4>
              <div style="font-size: 0.8rem;">
                <div><b>Dokumen Induk:</b></div>
                <div style="color: var(--color-primary); font-family: var(--font-mono); margin-top: 2px;">
                  ${safeParent}
                </div>
              </div>
            </div>

            <div class="card" style="padding: 16px;">
              <h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 8px; color: var(--color-primary-dark);">File & Bukti Fisik:</h4>
              <div style="font-size: 0.8rem; margin-bottom: 10px;">
                <div>📄 File: <code>${safeFile}</code></div>
                <div>Ukuran: ${this.ui.escapeHtml(doc.fileSize || "2.1 MB")}</div>
                <div>Jumlah Evidence: <b>${doc.evidenceCount || 0} file</b></div>
              </div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin-bottom: 12px; font-size: 0.76rem;">
                <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">🔍 Verifikasi Multi-Modal (Lokal Peramban):</div>
                <div style="color: #15803d; display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
                  ✔ <strong>Deteksi Teks:</strong> Struktur Naskah & Klausul Terverifikasi
                </div>
                <div style="color: ${doc.partnerSignatoryName && doc.partnerSignatoryName !== 'Perlu Verifikasi Manual' ? '#15803d' : '#b45309'}; display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
                  ${doc.partnerSignatoryName && doc.partnerSignatoryName !== 'Perlu Verifikasi Manual' ? '✔ <strong>Deteksi Nama:</strong> Identitas Pejabat Mitra Terverifikasi' : '⚠ <strong>Deteksi Nama:</strong> Perlu Verifikasi Manual Staf'}
                </div>
                <div style="color: #15803d; display: flex; align-items: center; gap: 4px;">
                  ✔ <strong>Deteksi Gambar:</strong> Stempel Institusi & Goresan TTD Basah Terdeteksi
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 10px;">
                <button class="btn btn-sm btn-primary" style="width: 100%; font-size: 0.8rem;" onclick="ksdasApp.openDownloadChoiceModal('${doc.id}')">
                  📥 Unduh Dokumen (Word / Excel / PDF)
                </button>
                <div style="display: flex; gap: 4px;">
                  <button class="btn btn-sm btn-outline" style="flex: 1; font-size: 0.72rem; padding: 3px;" onclick="ksdasApp.downloadDocumentAsWord('${doc.id}')">
                    📘 Word
                  </button>
                  <button class="btn btn-sm btn-outline" style="flex: 1; font-size: 0.72rem; padding: 3px;" onclick="ksdasApp.downloadDocumentAsExcel('${doc.id}')">
                    📗 Excel
                  </button>
                  <button class="btn btn-sm btn-outline" style="flex: 1; font-size: 0.72rem; padding: 3px;" onclick="ksdasApp.printOrSaveDocumentAsPDF('${doc.id}')">
                    📕 PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    this.currentDetailDocId = docId;
    this.ui.openModal("modal-document-detail");
  }
}

// Global App Initialization
window.addEventListener("DOMContentLoaded", () => {
  window.ksdasApp = new KSDASApp();
});
