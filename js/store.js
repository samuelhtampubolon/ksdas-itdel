/**
 * ============================================================================
 * KSDAS IT DEL - STORAGE & ADAPTER ENGINE
 * Author: Samuel Hasudungan Tampubolon
 * Copyright: © 2026 Samuel Hasudungan Tampubolon
 * Target: Tim SDI / TSI / DukTek Institut Teknologi Del
 *
 * Catatan untuk Tim SDI/TSI:
 * Arsitektur Store ini menggunakan pola Repository/Adapter.
 * Mode Prototipe saat ini menggunakan localStorage reaktif.
 * Untuk menghubungkan ke Backend PostgreSQL / REST API kampus:
 * 1. Ubah USE_BACKEND_API menjadi true.
 * 2. Sesuaikan API_BASE_URL (default: /api/v1).
 * ============================================================================
 */

const KSDAS_API_CONFIG = {
  USE_BACKEND_API: false, // Set 'true' untuk mode integrasi server kampus IT Del
  API_BASE_URL: "/api/v1",
  TIMEOUT_MS: 10000
};

class KSDASStore {
  constructor() {
    this.apiConfig = KSDAS_API_CONFIG;
    this.STORAGE_KEY = "ksdas_itdel_store_v2";
    this.CURRENT_ROLE_KEY = "ksdas_itdel_current_role";
    this.VERSION = "0.2.0";
    this.subscribers = {};
    this.state = this.loadState();
    this.currentRole = localStorage.getItem(this.CURRENT_ROLE_KEY) || "ADMIN_STAFF";
  }

  loadState() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === this.VERSION && parsed.documents) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load state from localStorage, falling back to seed data:", e);
    }
    return this.getInitialState();
  }

  getInitialState() {
    const seed = window.KSDAS_SEED_DATA || {};
    const cloned = JSON.parse(JSON.stringify(seed));
    cloned.version = this.VERSION;
    cloned.initializedAt = new Date().toISOString();
    return cloned;
  }

  saveState() {
    try {
      this.state.lastUpdated = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
      this.notify("state_changed", this.state);
    } catch (e) {
      console.error("Error saving state to localStorage:", e);
      if (e.name === "QuotaExceededError" || e.code === 22) {
        if (window.ksdasUI) {
          window.ksdasUI.showToast("Kapasitas penyimpanan lokal browser (localStorage) penuh! Silakan lakukan ekspor cadangan JSON.", "danger", 6000);
        }
      }
    }
  }

  resetDemoData() {
    const fresh = this.getInitialState();
    this.state = fresh;
    this.saveState();
    this.addAuditLog({
      action: "RESET_DEMO_DATA",
      userRole: this.currentRole,
      details: "Database reset to initial IT Del demo state."
    });
    this.notify("data_reset", this.state);
    return true;
  }

  exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state, null, 2));
    const downloadAnchor = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ksdas_itdel_backup_${timestamp}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    this.addAuditLog({
      action: "JSON_EXPORTED",
      userRole: this.currentRole,
      details: `Full database exported (${this.state.documents.length} documents, ${this.state.partners.length} partners).`
    });
  }

  async importJSON(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new Error("Tidak ada file yang dipilih"));
      }

      // Security: File size limit 10 MB for JSON import
      if (file.size > 10 * 1024 * 1024) {
        return reject(new Error("Ukuran berkas JSON cadangan melebihi batas maksimum 10 MB"));
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // Security: Prevent prototype pollution
          const raw = e.target.result;
          if (raw.includes("__proto__") || raw.includes("constructor") || raw.includes("prototype")) {
            console.warn("Peringatan keamanan: String terlarang terdeteksi pada berkas JSON.");
          }

          const imported = JSON.parse(raw);
          if (!imported || typeof imported !== "object" || Array.isArray(imported)) {
            throw new Error("Format JSON tidak valid: Root objek harus berupa JSON Object.");
          }

          if (!Array.isArray(imported.documents) || !Array.isArray(imported.partners)) {
            throw new Error("Format JSON tidak valid: Properti array 'documents' dan 'partners' wajib ada.");
          }

          // Merge safely onto fresh initial state template
          const cleanState = this.getInitialState();
          cleanState.documents = imported.documents;
          cleanState.partners = imported.partners;
          if (Array.isArray(imported.activities)) cleanState.activities = imported.activities;
          if (Array.isArray(imported.evidences)) cleanState.evidences = imported.evidences;
          if (Array.isArray(imported.accreditationFrameworks)) cleanState.accreditationFrameworks = imported.accreditationFrameworks;
          if (Array.isArray(imported.auditLogs)) cleanState.auditLogs = imported.auditLogs;

          cleanState.lastUpdated = new Date().toISOString();
          this.state = cleanState;
          this.saveState();

          this.addAuditLog({
            action: "JSON_IMPORTED",
            userRole: this.currentRole,
            details: `Imported verified state with ${cleanState.documents.length} documents and ${cleanState.partners.length} partners.`
          });
          this.notify("data_imported", this.state);
          resolve(cleanState);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Gagal membaca file JSON"));
      reader.readAsText(file);
    });
  }

  // --- Subscriptions ---
  subscribe(event, callback) {
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }
    this.subscribers[event].push(callback);
    return () => {
      this.subscribers[event] = this.subscribers[event].filter(cb => cb !== callback);
    };
  }

  notify(event, data) {
    if (this.subscribers[event]) {
      this.subscribers[event].forEach(cb => cb(data));
    }
  }

  // --- Role Management ---
  getCurrentRole() {
    return this.currentRole;
  }

  setCurrentRole(roleId) {
    this.currentRole = roleId;
    localStorage.setItem(this.CURRENT_ROLE_KEY, roleId);
    this.notify("role_changed", roleId);
  }

  getRoleDefinition(roleId) {
    const roles = this.state.roles || [];
    return roles.find(r => r.id === (roleId || this.currentRole)) || {
      id: roleId,
      name: roleId,
      permissions: ["view"]
    };
  }

  hasPermission(permission) {
    const roleDef = this.getRoleDefinition(this.currentRole);
    if (!roleDef || !roleDef.permissions) return false;
    return roleDef.permissions.includes(permission) || roleDef.permissions.includes("admin");
  }

  // --- Documents CRUD ---
  getDocuments(filters = {}) {
    let docs = [...(this.state.documents || [])];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      docs = docs.filter(d => 
        (d.title && d.title.toLowerCase().includes(q)) ||
        (d.documentNumber && d.documentNumber.toLowerCase().includes(q)) ||
        (d.partnerName && d.partnerName.toLowerCase().includes(q)) ||
        (d.scope && d.scope.toLowerCase().includes(q)) ||
        (d.pic && d.pic.toLowerCase().includes(q))
      );
    }

    if (filters.type && filters.type !== "ALL") {
      docs = docs.filter(d => d.type === filters.type);
    }

    if (filters.status && filters.status !== "ALL") {
      docs = docs.filter(d => d.status === filters.status);
    }

    if (filters.partnerId && filters.partnerId !== "ALL") {
      docs = docs.filter(d => d.partnerId === filters.partnerId);
    }

    if (filters.facultyId && filters.facultyId !== "ALL") {
      docs = docs.filter(d => d.facultyId === filters.facultyId);
    }

    if (filters.triDharma && filters.triDharma !== "ALL") {
      docs = docs.filter(d => d.triDharma === filters.triDharma);
    }

    if (filters.year && filters.year !== "ALL") {
      const targetYear = parseInt(filters.year);
      docs = docs.filter(d => {
        const dateStr = d.signedDate || d.effectiveStartDate;
        if (!dateStr) return false;
        return new Date(dateStr).getFullYear() === targetYear;
      });
    }

    if (filters.hasEvidence !== undefined && filters.hasEvidence !== "ALL") {
      const wantEvidence = filters.hasEvidence === "true" || filters.hasEvidence === true;
      docs = docs.filter(d => !!d.hasEvidence === wantEvidence);
    }

    if (filters.qualityFlag && filters.qualityFlag !== "ALL") {
      docs = docs.filter(d => d.qualityFlags && d.qualityFlags.includes(filters.qualityFlag));
    }

    // Role-based visibility restrictions if any
    if (this.currentRole === "FACULTY_VIEWER") {
      // Default to FITE for demo
      docs = docs.filter(d => d.facultyId === "FITE");
    } else if (this.currentRole === "PROGRAM_VIEWER") {
      // Default to PRODI-IF for demo
      docs = docs.filter(d => d.studyProgramId === "PRODI-IF");
    }

    return docs.map(d => this.enrichComputedFields(d));
  }

  getDocumentById(id) {
    const doc = (this.state.documents || []).find(d => d.id === id || d.documentNumber === id);
    return doc ? this.enrichComputedFields(doc) : null;
  }

  enrichComputedFields(doc) {
    if (!doc) return doc;
    const now = new Date();
    
    // 1. days_to_expiry & expiry_bucket (Data Dictionary Section T)
    if (doc.effectiveEndDate) {
      const end = new Date(doc.effectiveEndDate);
      const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      doc.days_to_expiry = diff;
      if (diff < 0) doc.expiry_bucket = "EXPIRED";
      else if (diff <= 30) doc.expiry_bucket = "0_30";
      else if (diff <= 90) doc.expiry_bucket = "31_90";
      else if (diff <= 180) doc.expiry_bucket = "91_180";
      else if (diff <= 365) doc.expiry_bucket = "181_365";
      else doc.expiry_bucket = "GT_365";
    } else {
      doc.days_to_expiry = null;
      doc.expiry_bucket = "UNKNOWN";
    }

    // 2. Child relation flags
    const allDocs = this.state.documents || [];
    doc.has_child_pks = allDocs.some(d => d.type === "PKS_MOA" && (d.parentId === doc.id || d.parentNumber === doc.documentNumber));
    doc.has_child_ia = allDocs.some(d => d.type === "IA" && (d.parentId === doc.id || d.parentNumber === doc.documentNumber));
    doc.has_proposal = allDocs.some(d => d.type === "PROPOSAL" && (d.parentId === doc.id || d.parentNumber === doc.documentNumber));
    doc.has_final_report = allDocs.some(d => d.type === "FINAL_REPORT" && (d.parentId === doc.id || d.parentNumber === doc.documentNumber));

    // 3. Activity & Evidence flags
    const activities = this.state.activities || [];
    doc.has_activity = activities.some(a => a.documentId === doc.id || a.documentNumber === doc.documentNumber);
    doc.has_evidence = !!(doc.evidenceCount && doc.evidenceCount > 0);

    // 4. implementation_status
    if (doc.type === "MOU_LOI") {
      doc.implementation_status = doc.has_child_pks ? (doc.has_final_report ? "COMPLETED" : "IN_PROGRESS") : "NOT_STARTED";
    } else if (doc.type === "PKS_MOA") {
      doc.implementation_status = doc.has_final_report ? "COMPLETED" : (doc.has_activity ? "IN_PROGRESS" : "NOT_STARTED");
    } else {
      doc.implementation_status = doc.status === "VALIDATED" ? "COMPLETED" : "IN_PROGRESS";
    }

    return doc;
  }

  addDocument(doc) {
    if (!doc.id) {
      doc.id = "DOC-" + Date.now();
    }
    if (!doc.extractedDate) {
      doc.extractedDate = new Date().toISOString();
    }
    this.state.documents.unshift(doc);
    this.addAuditLog({
      action: "DOCUMENT_CREATED",
      documentNumber: doc.documentNumber || doc.id,
      userRole: this.currentRole,
      details: `Dokumen baru dibuat/disimpan: ${doc.title}`
    });
    this.saveState();
    return doc;
  }

  updateDocument(id, updates) {
    const idx = this.state.documents.findIndex(d => d.id === id);
    if (idx === -1) return null;

    const oldDoc = this.state.documents[idx];
    const updated = { ...oldDoc, ...updates, lastModified: new Date().toISOString() };
    this.state.documents[idx] = updated;

    this.addAuditLog({
      action: updates.status && updates.status !== oldDoc.status ? "STATUS_CHANGED" : "DOCUMENT_UPDATED",
      documentNumber: updated.documentNumber,
      userRole: this.currentRole,
      details: `Perubahan dokumen: ${Object.keys(updates).join(", ")}`
    });

    this.saveState();
    return updated;
  }

  deleteDocument(id) {
    const doc = this.getDocumentById(id);
    this.state.documents = this.state.documents.filter(d => d.id !== id);
    if (doc) {
      this.addAuditLog({
        action: "DOCUMENT_DELETED",
        documentNumber: doc.documentNumber,
        userRole: this.currentRole,
        details: `Dokumen ${doc.documentNumber} dihapus dari repositori.`
      });
    }
    this.saveState();
  }

  bulkValidate(docIds) {
    let count = 0;
    this.state.documents = this.state.documents.map(d => {
      if (docIds.includes(d.id)) {
        count++;
        return {
          ...d,
          status: "VALIDATED",
          officialDataConfirmed: true,
          validatedBy: this.getRoleDefinition(this.currentRole).name,
          validatedDate: new Date().toISOString(),
          qualityFlags: (d.qualityFlags || []).filter(f => f !== "pending_validation")
        };
      }
      return d;
    });

    this.addAuditLog({
      action: "BULK_VALIDATE",
      userRole: this.currentRole,
      details: `${count} dokumen disetujui sekaligus (Bulk Validation).`
    });

    this.saveState();
    return count;
  }

  // --- Partners CRUD ---
  getPartners() {
    return this.state.partners || [];
  }

  getPartnerById(id) {
    return (this.state.partners || []).find(p => p.id === id || p.code === id || p.name === id);
  }

  addPartner(partner) {
    if (!partner.id) {
      partner.id = "PARTNER-" + Date.now();
    }
    this.state.partners.push(partner);
    this.addAuditLog({
      action: "PARTNER_ADDED",
      userRole: this.currentRole,
      details: `Mitra baru didaftarkan: ${partner.name} (${partner.type})`
    });
    this.saveState();
    return partner;
  }

  updatePartner(id, updates) {
    const idx = this.state.partners.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.state.partners[idx] = { ...this.state.partners[idx], ...updates };
    this.saveState();
    return this.state.partners[idx];
  }

  // --- Activities & Evidence ---
  getActivities() {
    return this.state.activities || [];
  }

  addActivity(act) {
    if (!act.id) act.id = "ACT-" + Date.now();
    this.state.activities.push(act);
    this.saveState();
    return act;
  }

  getEvidences() {
    return this.state.evidences || [];
  }

  addEvidence(evi) {
    if (!evi.id) evi.id = "EVI-" + Date.now();
    this.state.evidences.push(evi);
    
    // update document evidence count
    if (evi.documentId) {
      const doc = this.getDocumentById(evi.documentId);
      if (doc) {
        doc.hasEvidence = true;
        doc.evidenceCount = (doc.evidenceCount || 0) + 1;
      }
    }

    this.addAuditLog({
      action: "EVIDENCE_UPLOADED",
      userRole: this.currentRole,
      details: `Evidence '${evi.title}' diunggah untuk dokumen ${evi.documentNumber || evi.documentId}.`
    });

    this.saveState();
    return evi;
  }

  verifyEvidence(eviId) {
    const evi = (this.state.evidences || []).find(e => e.id === eviId);
    if (evi) {
      evi.verified = true;
      evi.verifiedBy = this.getRoleDefinition(this.currentRole).name;
      evi.verifiedDate = new Date().toISOString().split("T")[0];
      this.addAuditLog({
        action: "EVIDENCE_VERIFIED",
        userRole: this.currentRole,
        details: `Evidence '${evi.title}' diverifikasi oleh ${evi.verifiedBy}.`
      });
      this.saveState();
    }
  }

  // --- Accreditation Frameworks ---
  getAccreditationFrameworks() {
    return this.state.accreditationFrameworks || [];
  }

  updateAccreditationIndicator(indicatorId, updates) {
    for (const fw of (this.state.accreditationFrameworks || [])) {
      const ind = (fw.indicators || []).find(i => i.id === indicatorId);
      if (ind) {
        Object.assign(ind, updates);
        this.saveState();
        return ind;
      }
    }
    return null;
  }

  // --- Audit Trail ---
  getAuditLogs() {
    return this.state.auditLogs || [];
  }

  addAuditLog(entry) {
    if (!this.state.auditLogs) this.state.auditLogs = [];
    const logItem = {
      id: "AUDIT-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      userRole: entry.userRole || this.currentRole,
      userName: entry.userName || this.getRoleDefinition(this.currentRole).name,
      action: entry.action || "INFO",
      documentNumber: entry.documentNumber || "-",
      details: entry.details || ""
    };
    this.state.auditLogs.unshift(logItem);
    // keep max 200 logs
    if (this.state.auditLogs.length > 200) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 200);
    }
  }

  // --- Notifications Helper ---
  getNotifications() {
    const list = [];
    const docs = this.state.documents || [];
    const now = new Date();

    // 1. Expiring agreements (< 90 days)
    docs.forEach(d => {
      if (d.effectiveEndDate && (d.type === "MOU_LOI" || d.type === "PKS_MOA")) {
        const end = new Date(d.effectiveEndDate);
        const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        if (diffDays > 0 && diffDays <= 90) {
          list.push({
            id: `exp-${d.id}`,
            type: "WARNING",
            title: `Masa Berlaku Segera Berakhir (${diffDays} hari)`,
            message: `${d.documentNumber} (${d.partnerName}) berakhir pada ${d.effectiveEndDate}.`,
            link: `#repository?search=${encodeURIComponent(d.documentNumber)}`,
            date: d.effectiveEndDate
          });
        } else if (diffDays <= 0) {
          list.push({
            id: `exp-over-${d.id}`,
            type: "DANGER",
            title: `Dokumen Telah Kedaluwarsa`,
            message: `${d.documentNumber} (${d.partnerName}) berakhir ${Math.abs(diffDays)} hari lalu.`,
            link: `#repository?search=${encodeURIComponent(d.documentNumber)}`,
            date: d.effectiveEndDate
          });
        }
      }
    });

    // 2. Pending Human Validation
    const pendingDocs = docs.filter(d => d.status === "AI_EXTRACTED" || d.status === "NEEDS_REVIEW");
    if (pendingDocs.length > 0) {
      list.push({
        id: "pending-validations",
        type: "INFO",
        title: `${pendingDocs.length} Dokumen Menunggu Validasi`,
        message: `Terdapat dokumen hasil ekstraksi AI yang membutuhkan review & approval staf.`,
        link: "#validation",
        date: new Date().toISOString().split("T")[0]
      });
    }

    // 3. Orphan agreements
    const orphans = docs.filter(d => (d.type === "PKS_MOA" || d.type === "IA") && !d.parentId);
    if (orphans.length > 0) {
      list.push({
        id: "orphan-agreements",
        type: "WARNING",
        title: `${orphans.length} Dokumen Belum Ditautkan (Orphan)`,
        message: `PKS atau IA belum memiliki relasi MoU induk. Tautkan melalui Explorer Relasi.`,
        link: "#relationships",
        date: new Date().toISOString().split("T")[0]
      });
    }

    return list;
  }
}

// Global singleton instance
window.ksdasStore = new KSDASStore();
