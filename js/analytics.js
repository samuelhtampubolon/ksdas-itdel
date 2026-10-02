/**
 * ============================================================================
 * KERJA SAMA DATA & ANALYTICS SYSTEM (KSDAS) INSTITUT TEKNOLOGI DEL
 * ============================================================================
 * Judul Ciptaan: KSDAS IT Del - Program Komputer Tata Kelola Kemitraan
 * Pencipta & Pemegang Hak Cipta: Samuel Hasudungan Tampubolon
 * Hak Cipta: © 2026 Samuel Hasudungan Tampubolon. All rights reserved.
 * Institusi: Institut Teknologi Del, Sitoluama, Laguboti, Sumatera Utara
 * Versi: 0.2.0
 * Berkas: js/analytics.js (Analytics, Metrics & Chart.js Visualization Engine)
 * ============================================================================
 */

class KSDASAnalytics {
  constructor() {
    this.chartInstances = {};
  }

  /**
   * Compute comprehensive dashboard KPIs
   */
  getExecutiveKPIs(documents, partners, activities) {
    const docs = documents || [];
    const pts = partners || [];
    const acts = activities || [];

    const totalPartners = pts.length;
    const activePartners = pts.filter(p => p.status === "ACTIVE").length;

    const totalMoU = docs.filter(d => d.type === "MOU_LOI").length;
    const totalPKS = docs.filter(d => d.type === "PKS_MOA").length;
    const totalIA = docs.filter(d => d.type === "IA").length;
    const totalProposal = docs.filter(d => d.type === "PROPOSAL").length;
    const totalReport = docs.filter(d => d.type === "FINAL_REPORT").length;

    const now = new Date();
    let expiringSoonCount = 0;
    let expiredCount = 0;

    docs.forEach(d => {
      if (d.effectiveEndDate) {
        const end = new Date(d.effectiveEndDate);
        const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) {
          expiredCount++;
        } else if (diffDays <= 90) {
          expiringSoonCount++;
        }
      }
    });

    const pendingValidationCount = docs.filter(d => d.status === "AI_EXTRACTED" || d.status === "NEEDS_REVIEW").length;
    const orphanCount = docs.filter(d => (d.type === "PKS_MOA" || d.type === "IA") && !d.parentId).length;

    // Total Budget
    const totalBudget = docs.reduce((acc, d) => acc + (d.budget || 0), 0);
    const totalParticipants = docs.reduce((acc, d) => acc + (d.participantCount || 0), 0);

    return {
      totalPartners,
      activePartners,
      totalMoU,
      totalPKS,
      totalIA,
      totalProposal,
      totalReport,
      totalDocuments: docs.length,
      expiringSoonCount,
      expiredCount,
      pendingValidationCount,
      orphanCount,
      totalBudget,
      totalParticipants,
      totalActivities: acts.length
    };
  }

  /**
   * Compute Funnel progression: Partners -> MoU -> PKS -> IA -> Activity -> Final Report
   */
  getImplementationFunnel(documents, partners, activities) {
    const docs = documents || [];
    const pts = partners || [];
    const acts = activities || [];

    const partnersCount = pts.length || 1;
    const mouCount = docs.filter(d => d.type === "MOU_LOI").length;
    const pksCount = docs.filter(d => d.type === "PKS_MOA").length;
    const iaCount = docs.filter(d => d.type === "IA").length;
    const actCount = acts.length;
    const repCount = docs.filter(d => d.type === "FINAL_REPORT").length;

    return [
      { stage: "Mitra Terdaftar", count: partnersCount, percent: 100, color: "#134074" },
      { stage: "MoU / LOI", count: mouCount, percent: Math.min(100, Math.round((mouCount / partnersCount) * 100)), color: "#0077B6" },
      { stage: "PKS / MoA", count: pksCount, percent: Math.min(100, Math.round((pksCount / Math.max(1, mouCount)) * 100)), color: "#2A9D8F" },
      { stage: "IA (Arrangement)", count: iaCount, percent: Math.min(100, Math.round((iaCount / Math.max(1, pksCount)) * 100)), color: "#E9C46A" },
      { stage: "Aktivitas Riil", count: actCount, percent: Math.min(100, Math.round((actCount / Math.max(1, iaCount)) * 100)), color: "#F4A261" },
      { stage: "Laporan / LPJ", count: repCount, percent: Math.min(100, Math.round((repCount / Math.max(1, actCount)) * 100)), color: "#E76F51" }
    ];
  }

  /**
   * Compute Yearly Trend for MoU, PKS, IA
   */
  getAgreementsByYear(documents) {
    const years = [2023, 2024, 2025, 2026, 2027];
    const data = {
      labels: years.map(y => y.toString()),
      mou: [0, 0, 0, 0, 0],
      pks: [0, 0, 0, 0, 0],
      ia: [0, 0, 0, 0, 0]
    };

    (documents || []).forEach(d => {
      const dateStr = d.signedDate || d.effectiveStartDate;
      if (!dateStr) return;
      const y = new Date(dateStr).getFullYear();
      const idx = years.indexOf(y);
      if (idx !== -1) {
        if (d.type === "MOU_LOI") data.mou[idx]++;
        else if (d.type === "PKS_MOA") data.pks[idx]++;
        else if (d.type === "IA") data.ia[idx]++;
      }
    });

    return data;
  }

  /**
   * Compute Tri Dharma Distribution
   */
  getTriDharmaDistribution(documents) {
    const counts = {
      EDUCATION: 0,
      RESEARCH: 0,
      COMMUNITY_SERVICE: 0,
      INSTITUTIONAL: 0
    };

    (documents || []).forEach(d => {
      if (d.triDharma && counts[d.triDharma] !== undefined) {
        counts[d.triDharma]++;
      } else {
        counts.EDUCATION++;
      }
    });

    return {
      labels: ["Pendidikan & Pengajaran", "Penelitian & Inovasi", "Pengabdian Masyarakat", "Tata Kelola & Fasilitas"],
      data: [counts.EDUCATION, counts.RESEARCH, counts.COMMUNITY_SERVICE, counts.INSTITUTIONAL],
      colors: ["#134074", "#2A9D8F", "#E9C46A", "#8DA9C4"]
    };
  }

  /**
   * Compute Partner Type Distribution
   */
  getPartnerTypeDistribution(partners) {
    const counts = {
      INDUSTRY: 0,
      UNIVERSITY: 0,
      GOVERNMENT: 0,
      BUMN: 0,
      NGO: 0
    };

    (partners || []).forEach(p => {
      if (p.type && counts[p.type] !== undefined) {
        counts[p.type]++;
      } else {
        counts.INDUSTRY++;
      }
    });

    return {
      labels: ["Industri Swasta", "Perguruan Tinggi", "Pemerintah / Pemda", "BUMN", "Yayasan / NGO"],
      data: [counts.INDUSTRY, counts.UNIVERSITY, counts.GOVERNMENT, counts.BUMN, counts.NGO],
      colors: ["#0B2545", "#0077B6", "#2A9D8F", "#F4A261", "#8DA9C4"]
    };
  }

  /**
   * Compute Faculty Performance
   */
  getFacultyDistribution(documents) {
    const counts = {
      FITE: 0,
      FTI: 0,
      FB: 0
    };

    (documents || []).forEach(d => {
      if (d.facultyId && counts[d.facultyId] !== undefined) {
        counts[d.facultyId]++;
      }
    });

    return {
      labels: ["FITE (Informatika & Elektro)", "FTI (Teknologi Industri)", "FB (Bioteknologi)"],
      data: [counts.FITE, counts.FTI, counts.FB],
      colors: ["#134074", "#0077B6", "#2A9D8F"]
    };
  }

  /**
   * Compute Expiry Monitoring Table & Gaps
   */
  getExpiryMonitoring(documents) {
    const now = new Date();
    const records = [];

    (documents || []).forEach(d => {
      if (!d.effectiveEndDate) return;
      const end = new Date(d.effectiveEndDate);
      const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

      let urgency = "NORMAL";
      let statusText = "Aktif (> 90 hari)";
      let badgeClass = "badge-success";

      if (diffDays <= 0) {
        urgency = "EXPIRED";
        statusText = `Kedaluwarsa (${Math.abs(diffDays)} hari lalu)`;
        badgeClass = "badge-danger";
      } else if (diffDays <= 30) {
        urgency = "CRITICAL";
        statusText = `Kritis (< 30 hari: ${diffDays} hari)`;
        badgeClass = "badge-danger";
      } else if (diffDays <= 60) {
        urgency = "HIGH";
        statusText = `Perlu Perhatian (${diffDays} hari)`;
        badgeClass = "badge-warning";
      } else if (diffDays <= 90) {
        urgency = "MEDIUM";
        statusText = `Mendekati Akhir (${diffDays} hari)`;
        badgeClass = "badge-info";
      }

      records.push({
        id: d.id,
        documentNumber: d.documentNumber,
        title: d.title,
        partnerName: d.partnerName,
        type: d.type,
        effectiveEndDate: d.effectiveEndDate,
        diffDays: diffDays,
        urgency: urgency,
        statusText: statusText,
        badgeClass: badgeClass
      });
    });

    // Sort by diffDays ascending (most urgent first)
    records.sort((a, b) => a.diffDays - b.diffDays);
    return records;
  }

  /**
   * Follow-up Gap Detection:
   * MoUs with 0 PKS
   * PKS with 0 Activities
   */
  getFollowUpGaps(documents, activities) {
    const docs = documents || [];
    const acts = activities || [];
    const gaps = [];

    // Check MoUs with zero PKS
    const mous = docs.filter(d => d.type === "MOU_LOI");
    mous.forEach(m => {
      const childPks = docs.filter(d => d.parentId === m.id || (d.parentNumber && d.parentNumber === m.documentNumber));
      if (childPks.length === 0) {
        gaps.push({
          type: "MOU_WITHOUT_PKS",
          severity: "HIGH",
          docNumber: m.documentNumber,
          partnerName: m.partnerName,
          title: m.title,
          message: "MoU belum memiliki Perjanjian Kerja Sama (PKS) turunan. Potensi kerja sama pasif/dorman.",
          recommendation: "Hubungi PIC mitra untuk merancang draft PKS implementasi."
        });
      }
    });

    // Check PKS with zero activity
    const pksList = docs.filter(d => d.type === "PKS_MOA");
    pksList.forEach(p => {
      const relatedActs = acts.filter(a => a.documentId === p.id || a.documentNumber === p.documentNumber);
      if (relatedActs.length === 0) {
        gaps.push({
          type: "PKS_WITHOUT_ACTIVITY",
          severity: "MEDIUM",
          docNumber: p.documentNumber,
          partnerName: p.partnerName,
          title: p.title,
          message: "PKS belum memiliki catatan aktivitas riil Tri Dharma atau laporan kegiatan yang tercatat.",
          recommendation: "Koordinasikan dengan fakultas/prodi pelaksana untuk menginput kegiatan."
        });
      }
    });

    return gaps;
  }

  /**
   * Cross Tabulation: Tri Dharma vs Faculty
   */
  getCrossTabulation(documents) {
    const faculties = ["FITE", "FTI", "FB"];
    const triDharmas = ["EDUCATION", "RESEARCH", "COMMUNITY_SERVICE", "INSTITUTIONAL"];

    const matrix = {
      FITE: { EDUCATION: 0, RESEARCH: 0, COMMUNITY_SERVICE: 0, INSTITUTIONAL: 0, total: 0 },
      FTI: { EDUCATION: 0, RESEARCH: 0, COMMUNITY_SERVICE: 0, INSTITUTIONAL: 0, total: 0 },
      FB: { EDUCATION: 0, RESEARCH: 0, COMMUNITY_SERVICE: 0, INSTITUTIONAL: 0, total: 0 },
      totals: { EDUCATION: 0, RESEARCH: 0, COMMUNITY_SERVICE: 0, INSTITUTIONAL: 0, grandTotal: 0 }
    };

    (documents || []).forEach(d => {
      const f = d.facultyId || "FITE";
      const t = d.triDharma || "EDUCATION";
      if (matrix[f] && matrix[f][t] !== undefined) {
        matrix[f][t]++;
        matrix[f].total++;
        matrix.totals[t]++;
        matrix.totals.grandTotal++;
      }
    });

    return matrix;
  }

  // --- Chart.js Rendering Wrappers ---
  renderAgreementsChart(canvasId, documents) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (this.chartInstances[canvasId]) {
      this.chartInstances[canvasId].destroy();
    }

    const data = this.getAgreementsByYear(documents);
    this.chartInstances[canvasId] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "MoU / LOI",
            data: data.mou,
            backgroundColor: "#0B2545",
            borderRadius: 4
          },
          {
            label: "PKS / MoA",
            data: data.pks,
            backgroundColor: "#0077B6",
            borderRadius: 4
          },
          {
            label: "Implementation Arrangement (IA)",
            data: data.ia,
            backgroundColor: "#2A9D8F",
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          tooltip: {
            callbacks: {
              afterBody: (context) => `Total Tahun ${context[0].label}: ${data.mou[context[0].dataIndex] + data.pks[context[0].dataIndex] + data.ia[context[0].dataIndex]} dokumen`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  renderTriDharmaChart(canvasId, documents) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (this.chartInstances[canvasId]) {
      this.chartInstances[canvasId].destroy();
    }

    const data = this.getTriDharmaDistribution(documents);
    this.chartInstances[canvasId] = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: data.labels,
        datasets: [{
          data: data.data,
          backgroundColor: data.colors,
          borderWidth: 2,
          borderColor: "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" }
        },
        cutout: "65%"
      }
    });
  }

  renderPartnerTypeChart(canvasId, partners) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (this.chartInstances[canvasId]) {
      this.chartInstances[canvasId].destroy();
    }

    const data = this.getPartnerTypeDistribution(partners);
    this.chartInstances[canvasId] = new Chart(ctx, {
      type: "polarArea",
      data: {
        labels: data.labels,
        datasets: [{
          data: data.data,
          backgroundColor: data.colors.map(c => c + "cc"),
          borderColor: "#ffffff",
          borderWidth: 1.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" }
        }
      }
    });
  }

  renderFacultyChart(canvasId, documents) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (this.chartInstances[canvasId]) {
      this.chartInstances[canvasId].destroy();
    }

    const data = this.getFacultyDistribution(documents);
    this.chartInstances[canvasId] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.labels,
        datasets: [{
          label: "Jumlah Dokumen Kerja Sama",
          data: data.data,
          backgroundColor: data.colors,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }
}

// Global singleton instance
window.ksdasAnalytics = new KSDASAnalytics();
