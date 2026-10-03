/**
 * ============================================================================
 * KERJA SAMA DATA & ANALYTICS SYSTEM (KSDAS) INSTITUT TEKNOLOGI DEL
 * ============================================================================
 * Judul Ciptaan: KSDAS IT Del - Program Komputer Tata Kelola Kemitraan
 * Pencipta & Pemegang Hak Cipta: Samuel Hasudungan Tampubolon
 * Hak Cipta: © 2026 Samuel Hasudungan Tampubolon. All rights reserved.
 * Institusi: Institut Teknologi Del, Sitoluama, Laguboti, Sumatera Utara
 * Versi: 0.2.0
 * Berkas: js/components.js (UI Components Library & HTML Sanitizer)
 * ============================================================================
 */

class KSDASUI {
  constructor() {
    this.toastContainer = null;
    this.initToastContainer();
    this.initQuickSearch();
  }

  initToastContainer() {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }
    this.toastContainer = container;
  }

  showToast(message, type = "info", duration = 3500) {
    if (!this.toastContainer) this.initToastContainer();

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let iconSvg = "ℹ️";
    if (type === "success") iconSvg = "✅";
    else if (type === "danger") iconSvg = "⚠️";
    else if (type === "warning") iconSvg = "🔔";

    toast.innerHTML = `
      <span style="font-size: 1.1rem;">${iconSvg}</span>
      <div style="flex: 1;">${message}</div>
    `;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      toast.style.opacity = "0";
      toast.style.transform = "translateX(50px)";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("open");
      document.body.style.overflow = "hidden";
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("open");
      document.body.style.overflow = "";
    }
  }

  closeAllModals() {
    document.querySelectorAll(".modal-overlay.open").forEach(m => m.classList.remove("open"));
    document.body.style.overflow = "";
  }

  initQuickSearch() {
    // Listen for Ctrl+K or Cmd+K
    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        this.openModal("modal-quick-search");
        const input = document.getElementById("quick-search-input");
        if (input) {
          input.value = "";
          input.focus();
        }
      }
      if (e.key === "Escape") {
        this.closeAllModals();
      }
    });
  }

  /**
   * Security: Sanitize and escape HTML strings to prevent XSS
   */
  escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Helper to format currency
   */
  formatRupiah(amount) {
    if (!amount) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Helper to render document type badge
   */
  renderTypeBadge(type) {
    switch (type) {
      case "MOU_LOI":
        return `<span class="badge badge-mou">MoU / LOI</span>`;
      case "PKS_MOA":
        return `<span class="badge badge-pks">PKS / MoA</span>`;
      case "IA":
        return `<span class="badge badge-ia">IA</span>`;
      case "PROPOSAL":
        return `<span class="badge badge-proposal">Proposal</span>`;
      case "FINAL_REPORT":
        return `<span class="badge badge-report">Laporan Akhir</span>`;
      default:
        return `<span class="badge">${type || "OTHER"}</span>`;
    }
  }

  /**
   * Helper to render validation status badge
   */
  renderStatusBadge(status) {
    switch (status) {
      case "AI_EXTRACTED":
        return `<span class="badge badge-ai-extracted">TEREKSTRAKSI</span>`;
      case "NEEDS_REVIEW":
        return `<span class="badge badge-needs-review">PERLU REVIEW</span>`;
      case "VALIDATED":
        return `<span class="badge badge-validated">TERVALIDASI RESMI</span>`;
      case "CORRECTED":
        return `<span class="badge badge-corrected">DIKOREKSI</span>`;
      case "REJECTED":
        return `<span class="badge badge-rejected">DITOLAK</span>`;
      default:
        return `<span class="badge">${status || "DRAFT"}</span>`;
    }
  }

  /**
   * Render confidence badge
   */
  renderConfidenceBadge(score) {
    if (score === undefined || score === null) return "";
    const pct = Math.round(score * 100);
    let cls = "conf-high";
    if (score < 0.70) cls = "conf-low";
    else if (score < 0.85) cls = "conf-mid";

    return `<span class="confidence-indicator ${cls}">${pct}%</span>`;
  }
}

// Global UI singleton
window.ksdasUI = new KSDASUI();
