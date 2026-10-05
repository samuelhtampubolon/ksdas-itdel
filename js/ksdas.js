"use strict";
(() => {
  // src/lib/ksdas/model.ts
  var EMPTY_FILTERS = {
    q: "",
    year: "",
    partnerId: "",
    documentType: "",
    status: "",
    facultyId: "",
    programId: "",
    tri: "",
    attention: false
  };
  var LEADERSHIP_DIRECTORY = {
    yayasan: {
      pembina: "Jenderal TNI (Purn.) Luhut Binsar Pandjaitan, M.P.A.",
      pengurus: "Intan Simanjuntak"
    },
    rektorat: {
      rektor: {
        name: "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.",
        title: "Rektor Institut Teknologi Del",
        period: "2025–2029"
      },
      wr1: {
        name: "Good Fried Panggabean, S.T., M.T., Ph.D.",
        title: "Wakil Rektor I Bidang Akademik dan Kemahasiswaan"
      },
      wr2: {
        name: "Rosni Lumbantoruan, Ph.D.",
        title: "Wakil Rektor II Bidang Perencanaan, Keuangan, dan Sumber Daya"
      },
      wr3: {
        name: "Dr. Ellyas Alga Nainggolan, S.TP., M.Sc., Ph.D.",
        title: "Wakil Rektor III Bidang Kemitraan, Inovasi, dan Kewirausahaan"
      }
    },
    lembaga: {
      spm: {
        name: "Satuan Penjaminan Mutu (SPM)",
        detail: "Penanggung Jawab SPMI & AMI Siklus PPEPP Sesuai Regulasi Kemdiktisaintek"
      },
      lppm: {
        name: "Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM)",
        detail: "Pusat Kolaborasi Penelitian dan Pengabdian Berbasis Kemitraan Strategis"
      },
      uks: {
        name: "Bagian Kerja Sama dan Kemitraan (UKS)",
        detail: "Unit Pelaksana Administrasi Naskah, Monitoring MoU/PKS/IA, dan Pelaporan LaporKerma"
      }
    },
    fakultas: [
      { id: "FITE", name: "Fakultas Informatika dan Teknik Elektro", dekan: "Indra Hartarto Tambunan, Ph.D." },
      { id: "FTI", name: "Fakultas Teknologi Industri", dekan: "Dr. Fitriani Tupa Ronauli Silalahi, S.Si., M.Si." },
      { id: "FB", name: "Fakultas Bioteknologi", dekan: "Dr. Merry Meryam Martgrita, S.Si., M.Si." },
      { id: "FV", name: "Fakultas Vokasi", dekan: "Riyanthi Angrainy Sianturi, S.Sos., M.Ds." }
    ]
  };

  var FACULTIES = [
    { id: "FITE", name: "Fakultas Informatika dan Teknik Elektro", dekan: "Indra Hartarto Tambunan, Ph.D." },
    { id: "FTI", name: "Fakultas Teknologi Industri", dekan: "Dr. Fitriani Tupa Ronauli Silalahi, S.Si., M.Si." },
    { id: "FB", name: "Fakultas Bioteknologi", dekan: "Dr. Merry Meryam Martgrita, S.Si., M.Si." },
    { id: "FV", name: "Fakultas Vokasi", dekan: "Riyanthi Angrainy Sianturi, S.Sos., M.Ds." }
  ];

  var PROGRAMS = [
    { id: "IF", facultyId: "FITE", name: "S1 Informatika" },
    { id: "SI", facultyId: "FITE", name: "S1 Sistem Informasi" },
    { id: "TE", facultyId: "FITE", name: "S1 Teknik Elektro" },
    { id: "MR", facultyId: "FTI", name: "S1 Manajemen Rekayasa" },
    { id: "TM", facultyId: "FTI", name: "S1 Teknik Metalurgi" },
    { id: "BP", facultyId: "FB", name: "S1 Teknik Bioproses" },
    { id: "TRPL", facultyId: "FV", name: "D4 Teknologi Rekayasa Perangkat Lunak" },
    { id: "D3TI", facultyId: "FV", name: "D3 Teknologi Informasi" },
    { id: "D3TK", facultyId: "FV", name: "D3 Teknologi Komputer" }
  ];

  var UNITS = [
    { id: "UKS", name: "Bagian Kerja Sama dan Kemitraan (UKS)" },
    { id: "LPPM", name: "Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM)" },
    { id: "SPM", name: "Satuan Penjaminan Mutu (SPM / SPMI Kemdiktisaintek)" },
    { id: "WR3", name: "Wakil Rektor III (Kemitraan, Inovasi, & Kewirausahaan)" },
    { id: "PRODI", name: "Program Studi" },
    { id: "FAKULTAS", name: "Fakultas" }
  ];

  var ROLES = [
    {
      id: "STAFF",
      name: "Staf Unit Kerja Sama & Kemitraan (UKS)",
      detail: "Mencatat naskah, memproses OCR/ekstraksi, mengarsipkan dosir, dan sinkronisasi basis data",
      canWrite: true,
      canImport: true
    },
    {
      id: "REKTOR",
      name: "Rektor IT Del (Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.)",
      detail: "Pemegang kebijakan tertinggi, penandatangan MoU institusi, dan pemantau capaian strategis",
      canWrite: true,
      canImport: false
    },
    {
      id: "WR3",
      name: "Wakil Rektor III (Dr. Ellyas Alga Nainggolan, S.TP., M.Sc., Ph.D.)",
      detail: "Koordinator Utama Kemitraan, Kerja Sama, Inovasi, Kewirausahaan, dan Capaian IKU 6",
      canWrite: true,
      canImport: true
    },
    {
      id: "SPM",
      name: "Satuan Penjaminan Mutu (Auditor Mutu Internal / SPMI Kemdiktisaintek)",
      detail: "Melakukan audit mutu kerja sama, pemantauan siklus PPEPP, evaluasi gap MoU-PKS-IA, dan akreditasi",
      canWrite: false,
      canImport: false
    },
    {
      id: "DEKAN_FITE",
      name: "Dekan FITE (Indra Hartarto Tambunan, Ph.D.)",
      detail: "Melihat, menyaring, dan mengevaluasi data kerja sama Fakultas Informatika dan Teknik Elektro",
      facultyId: "FITE",
      canWrite: false,
      canImport: false
    },
    {
      id: "DEKAN_FTI",
      name: "Dekan FTI (Dr. Fitriani Tupa Ronauli Silalahi, S.Si., M.Si.)",
      detail: "Melihat, menyaring, dan mengevaluasi data kerja sama Fakultas Teknologi Industri",
      facultyId: "FTI",
      canWrite: false,
      canImport: false
    },
    {
      id: "DEKAN_FB",
      name: "Dekan FB (Dr. Merry Meryam Martgrita, S.Si., M.Si.)",
      detail: "Melihat, menyaring, dan mengevaluasi data kerja sama Fakultas Bioteknologi",
      facultyId: "FB",
      canWrite: false,
      canImport: false
    },
    {
      id: "DEKAN_FV",
      name: "Dekan Fakultas Vokasi (Riyanthi Angrainy Sianturi, S.Sos., M.Ds.)",
      detail: "Melihat, menyaring, dan mengevaluasi data kerja sama Fakultas Vokasi (D3 TI, D3 TK, D4 TRPL)",
      facultyId: "FV",
      canWrite: false,
      canImport: false
    },
    {
      id: "KAPRODI_IF",
      name: "Kaprodi S1 Informatika",
      detail: "Melihat dan mengusulkan tindak lanjut kerja sama S1 Informatika (IKU 6 & MBKM)",
      programId: "IF",
      canWrite: false,
      canImport: false
    },
    {
      id: "KAPRODI_SI",
      name: "Kaprodi S1 Sistem Informasi",
      detail: "Melihat dan mengusulkan tindak lanjut kerja sama S1 Sistem Informasi (IKU 6 & MBKM)",
      programId: "SI",
      canWrite: false,
      canImport: false
    },
    {
      id: "KAPRODI_MR",
      name: "Kaprodi S1 Manajemen Rekayasa",
      detail: "Melihat dan mengusulkan tindak lanjut kerja sama S1 Manajemen Rekayasa (IKU 6 & Magang Industri)",
      programId: "MR",
      canWrite: false,
      canImport: false
    },
    {
      id: "KAPRODI_BP",
      name: "Kaprodi S1 Teknik Bioproses",
      detail: "Melihat dan mengusulkan tindak lanjut kerja sama S1 Teknik Bioproses (IKU 6 & Riset Industri)",
      programId: "BP",
      canWrite: false,
      canImport: false
    },
    {
      id: "KAPRODI_TRPL",
      name: "Kaprodi D4 Teknologi Rekayasa Perangkat Lunak",
      detail: "Melihat dan mengusulkan kerja sama vokasi industri D4 TRPL",
      programId: "TRPL",
      canWrite: false,
      canImport: false
    }
  ];
  var TYPE_LABEL = {
    MOU_LOI: "MoU / LOI",
    PKS_MOA: "PKS / MoA",
    IA: "IA",
    PROPOSAL: "Proposal",
    LAPORAN: "Laporan"
  };
  var STATUS_LABEL = {
    DRAFT: "Draf",
    AKTIF: "Aktif",
    AKAN_BERAKHIR: "Akan berakhir",
    BERAKHIR: "Berakhir",
    ARSIP: "Arsip"
  };
  var TRI_LABEL = {
    PENDIDIKAN: "Pendidikan",
    PENELITIAN: "Penelitian",
    PENGABDIAN: "Pengabdian"
  };
  var PARTNER_TYPE_LABEL = {
    PERGURUAN_TINGGI: "Perguruan tinggi",
    SEKOLAH: "Sekolah",
    PEMERINTAH: "Pemerintah",
    BUMN: "BUMN",
    SWASTA: "Swasta / industri",
    LAINNYA: "Lainnya"
  };
  var PARENT_OF = {
    PKS_MOA: "MOU_LOI",
    IA: "PKS_MOA",
    PROPOSAL: "IA",
    LAPORAN: "PROPOSAL"
  };
  function typeLabel(t) {
    return t && t in TYPE_LABEL ? TYPE_LABEL[t] : "Belum diisi";
  }
  function facultyName(id) {
    return FACULTIES.find((f) => f.id === id)?.name ?? (id ? id : "\u2014");
  }
  function programName(id) {
    return PROGRAMS.find((p2) => p2.id === id)?.name ?? (id ? id : "\u2014");
  }
  function unitName(id) {
    return UNITS.find((u) => u.id === id)?.name ?? (id ? id : "\u2014");
  }
  function roleById(id) {
    return ROLES.find((r) => r.id === id) ?? ROLES[0];
  }
  function norm(value) {
    return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  }
  function todayISO(today = /* @__PURE__ */ new Date()) {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  function daysUntil(end, today = /* @__PURE__ */ new Date()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(end)) return null;
    const endMs = Date.parse(`${end}T00:00:00`);
    const todayMs = Date.parse(`${todayISO(today)}T00:00:00`);
    if (Number.isNaN(endMs) || Number.isNaN(todayMs)) return null;
    return Math.round((endMs - todayMs) / 864e5);
  }
  function displayStatus(doc, today = /* @__PURE__ */ new Date()) {
    if (doc.status === "ARSIP") return "ARSIP";
    if (doc.status === "DRAFT") return "DRAFT";
    const tracksExpiry = doc.documentType === "MOU_LOI" || doc.documentType === "PKS_MOA" || doc.documentType === "IA";
    if (!tracksExpiry) return doc.status;
    const days = daysUntil(doc.endDate, today);
    if (days !== null && days < 0) return "BERAKHIR";
    if (doc.status === "AKTIF" && days !== null && days <= 180) return "AKAN_BERAKHIR";
    return doc.status;
  }
  function blankNaskah(now = /* @__PURE__ */ new Date()) {
    const stamp = now.toISOString();
    return {
      id: `DOC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      documentType: "",
      documentNumber: "",
      title: "",
      partnerId: "",
      signedDate: "",
      startDate: "",
      endDate: "",
      status: "DRAFT",
      scope: "",
      facultyId: "",
      programId: "",
      unitId: "UKS",
      triDharma: [],
      activityName: "",
      pic: "",
      partnerSignatory: "",
      partnerSignatoryTitle: "",
      itdelSignatory: "",
      itdelSignatoryTitle: "",
      parentId: "",
      location: "",
      budget: "",
      fundingSource: "",
      notes: "",
      fileName: "",
      fileSize: 0,
      fileRef: "",
      fileHash: "",
      uploadedAt: stamp,
      updatedAt: stamp,
      validation: { state: "DRAFT", by: "", at: "" },
      extraction: null,
      provenance: { unitId: "SISTEM" }
    };
  }
  function partnerName(partners, id) {
    return partners.find((p2) => p2.id === id)?.name ?? "\u2014";
  }
  function missingFields(doc) {
    const miss = [];
    if (!doc.documentType) miss.push("Jenis naskah");
    if (!doc.documentNumber.trim()) miss.push("Nomor dokumen");
    if (!doc.title.trim()) miss.push("Judul");
    if (!doc.partnerId) miss.push("Mitra");
    if (!doc.startDate) miss.push("Tanggal mulai");
    const needsEnd = doc.documentType === "MOU_LOI" || doc.documentType === "PKS_MOA" || doc.documentType === "IA";
    if (needsEnd && !doc.endDate) miss.push("Tanggal berakhir");
    if (!doc.facultyId) miss.push("Fakultas");
    if (!doc.partnerSignatory.trim()) miss.push("Penandatangan mitra");
    if (!doc.itdelSignatory.trim()) miss.push("Penandatangan IT Del");
    return miss;
  }
  function dateOrderError(doc) {
    if (doc.startDate && doc.endDate && doc.endDate < doc.startDate) {
      return "Tanggal berakhir harus sama atau setelah tanggal mulai.";
    }
    return "";
  }
  function followUpGaps(docs, today = /* @__PURE__ */ new Date()) {
    const byId = new Map(docs.map((d) => [d.id, d]));
    const gaps = [];
    const push = (documentId, code, message) => {
      if (!gaps.some((g) => g.documentId === documentId && g.code === code)) {
        gaps.push({ documentId, code, message });
      }
    };
    for (const doc of docs) {
      const shown = displayStatus(doc, today);
      const active = shown === "AKTIF" || shown === "AKAN_BERAKHIR";
      if (doc.documentType === "MOU_LOI" && active) {
        const has = docs.some((x) => x.parentId === doc.id && x.documentType === "PKS_MOA");
        if (!has) push(doc.id, "MOU_TANPA_PKS", "MoU yang masih berjalan belum memiliki PKS.");
      }
      if (doc.documentType === "PKS_MOA" && active) {
        const has = docs.some((x) => x.parentId === doc.id && x.documentType === "IA");
        if (!has) push(doc.id, "PKS_TANPA_IA", "PKS yang masih berjalan belum memiliki IA.");
      }
      if (doc.documentType === "IA" && active) {
        const has = docs.some((x) => x.parentId === doc.id && x.documentType === "PROPOSAL");
        if (!has) push(doc.id, "IA_TANPA_PROPOSAL", "IA yang masih berjalan belum memiliki proposal.");
      }
      if (doc.documentType === "PROPOSAL" && doc.status !== "ARSIP") {
        const has = docs.some((x) => x.parentId === doc.id && x.documentType === "LAPORAN");
        if (!has) push(doc.id, "PROPOSAL_TANPA_LAPORAN", "Proposal belum memiliki laporan.");
      }
      const expected = doc.documentType ? PARENT_OF[doc.documentType] : void 0;
      if (expected) {
        if (!doc.parentId) {
          push(doc.id, "TANPA_INDUK", `${typeLabel(doc.documentType)} belum ditautkan ke ${typeLabel(expected)}.`);
        } else {
          const parent = byId.get(doc.parentId);
          if (!parent) push(doc.id, "INDUK_HILANG", "Induk yang ditautkan tidak ditemukan.");
          else if (parent.documentType !== expected) {
            push(
              doc.id,
              "INDUK_TIDAK_SESUAI",
              `Induk berjenis ${typeLabel(parent.documentType)}. Yang diharapkan: ${typeLabel(expected)}.`
            );
          }
        }
      }
    }
    return gaps;
  }
  function needsAttention(doc, gaps, today = /* @__PURE__ */ new Date()) {
    const shown = displayStatus(doc, today);
    return shown === "AKAN_BERAKHIR" || shown === "BERAKHIR" || missingFields(doc).length > 0 || gaps.some((g) => g.documentId === doc.id);
  }
  function scopeDocuments(docs, role) {
    if (role.facultyId) return docs.filter((d) => d.facultyId === role.facultyId);
    if (role.programId) return docs.filter((d) => d.programId === role.programId);
    return docs;
  }
  function filterDocuments(docs, filters, role, partners, today = /* @__PURE__ */ new Date()) {
    let list = scopeDocuments(docs, role);
    const gaps = followUpGaps(docs, today);
    const q = norm(filters.q);
    if (q) {
      list = list.filter((d) => {
        const partner = partnerName(partners, d.partnerId);
        const blob = norm(
          [d.documentNumber, d.title, partner, d.activityName, d.pic, d.fileName, d.scope, facultyName(d.facultyId), programName(d.programId)].join(" ")
        );
        return blob.includes(q);
      });
    }
    if (filters.year) {
      list = list.filter((d) => (d.startDate || d.signedDate).startsWith(filters.year));
    }
    if (filters.partnerId) list = list.filter((d) => d.partnerId === filters.partnerId);
    if (filters.documentType) list = list.filter((d) => d.documentType === filters.documentType);
    if (filters.status) list = list.filter((d) => displayStatus(d, today) === filters.status);
    if (filters.facultyId && !role.facultyId) list = list.filter((d) => d.facultyId === filters.facultyId);
    if (filters.programId && !role.programId) list = list.filter((d) => d.programId === filters.programId);
    if (filters.tri) list = list.filter((d) => Array.isArray(d.triDharma) ? d.triDharma.includes(filters.tri) : String(d.triDharma || "").includes(filters.tri));
    if (filters.attention) list = list.filter((d) => needsAttention(d, gaps, today));
    return list;
  }
  function sortDocuments(docs, key, dir, partners, today = /* @__PURE__ */ new Date()) {
    const sign = dir === "asc" ? 1 : -1;
    const value = (d) => {
      switch (key) {
        case "partner":
          return partnerName(partners, d.partnerId);
        case "status":
          return displayStatus(d, today);
        case "faculty":
          return facultyName(d.facultyId);
        default:
          return String(d[key] ?? "");
      }
    };
    return [...docs].sort((a, b) => value(a).localeCompare(value(b), "id") * sign);
  }
  function parseDocType(value) {
    const n2 = norm(value);
    if (!n2) return "";
    if (/\bmou\b|\bloi\b|kesepahaman|nota kesepakatan/.test(n2)) return "MOU_LOI";
    if (/\bpks\b|\bmoa\b|perjanjian kerja sama|perjanjian kerjasama/.test(n2)) return "PKS_MOA";
    if (/^ia$|\bia\b|implementation arrangement|naskah pelaksanaan/.test(n2)) return "IA";
    if (/proposal/.test(n2)) return "PROPOSAL";
    if (/laporan|\blpj\b/.test(n2)) return "LAPORAN";
    return "";
  }
  function parseDate(value) {
    const s = value.trim();
    if (!s) return "";
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    m = s.match(/^(\d{1,2})[/.\\-](\d{1,2})[/.\\-](\d{4})/);
    if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    return "";
  }
  function parseStoredStatus(value) {
    const n2 = norm(value);
    if (/arsip/.test(n2)) return "ARSIP";
    if (/aktif|berlaku/.test(n2)) return "AKTIF";
    return "DRAFT";
  }
  function parsePartnerType(value) {
    const n2 = norm(value);
    if (/perguruan|universitas|institut|politeknik/.test(n2)) return "PERGURUAN_TINGGI";
    if (/sekolah|\bsmk\b|\bsma\b/.test(n2)) return "SEKOLAH";
    if (/pemerintah|pemkab|pemprov|dinas|kementerian/.test(n2)) return "PEMERINTAH";
    if (/bumn/.test(n2)) return "BUMN";
    if (/swasta|industri|\bpt\b|persero/.test(n2)) return "SWASTA";
    return "LAINNYA";
  }
  function parseTri(value) {
    const parts = value.split(/[;,/|]+/);
    const out = [];
    for (const part of parts.length ? parts : [value]) {
      const n2 = norm(part);
      if (/pendidikan|pengajaran|pembelajaran/.test(n2) && !out.includes("PENDIDIKAN")) out.push("PENDIDIKAN");
      if (/penelitian|riset/.test(n2) && !out.includes("PENELITIAN")) out.push("PENELITIAN");
      if (/pengabdian|pkm|masyarakat/.test(n2) && !out.includes("PENGABDIAN")) out.push("PENGABDIAN");
    }
    return out;
  }
  function matchFaculty(value) {
    const n2 = norm(value);
    if (!n2) return "";
    for (const f of FACULTIES) {
      if (n2 === norm(f.id) || n2 === norm(f.name) || n2.includes(norm(f.name))) return f.id;
    }
    if (n2 === "fv" || n2.includes("vokasi")) return "FV";
    if (n2 === "fite" || n2.includes("teknik elektro") || (n2.includes("informatika") && n2.includes("fakultas"))) return "FITE";
    if (n2 === "fti" || n2.includes("teknologi industri")) return "FTI";
    if (n2 === "fb" || n2.includes("bioteknologi")) return "FB";
    return "";
  }
  function matchProgram(value) {
    const n2 = norm(value);
    if (!n2) return "";
    for (const p2 of PROGRAMS) {
      if (n2 === norm(p2.id) || n2 === norm(p2.name) || n2.includes(norm(p2.name))) return p2.id;
    }
    if (n2.includes("rekayasa perangkat lunak") || n2.includes("trpl")) return "TRPL";
    if (n2.includes("d3 teknologi informasi") || n2.includes("d3 ti") || n2.includes("ti d3")) return "D3TI";
    if (n2.includes("d3 teknologi komputer") || n2.includes("d3 tk") || n2.includes("tk d3")) return "D3TK";
    if (n2.includes("sistem informasi") || n2.includes(" si ") || n2 === "si") return "SI";
    if (n2.includes("teknik elektro") || n2.includes(" elektro ")) return "TE";
    if (n2.includes("informatika") || n2.includes(" if ") || n2 === "if") return "IF";
    if (n2.includes("teknik metalurgi") || n2.includes("metalurgi")) return "TM";
    if (n2.includes("manajemen rekayasa") || n2.includes(" mr ") || n2 === "mr") return "MR";
    if (n2.includes("bioproses") || n2.includes(" bp ") || n2 === "bp") return "BP";
    return "";
  }
  function matchUnit(value) {
    const n2 = norm(value);
    if (!n2) return "";
    for (const u of UNITS) {
      if (n2 === norm(u.id) || n2.includes(norm(u.name))) return u.id;
    }
    if (n2.includes("kerja sama") || n2.includes("kerjasama") || n2.includes("kemitraan") || n2.includes("uks")) return "UKS";
    if (n2.includes("lppm") || n2.includes("penelitian") || n2.includes("pengabdian")) return "LPPM";
    if (n2.includes("spm") || n2.includes("penjaminan mutu") || n2.includes("ami") || n2.includes("spmi")) return "SPM";
    if (n2.includes("wr3") || n2.includes("wakil rektor 3") || n2.includes("wakil rektor iii")) return "WR3";
    if (n2.includes("prodi") || n2.includes("program studi")) return "PRODI";
    if (n2.includes("fakultas")) return "FAKULTAS";
    return "";
  }
  function hintsFromFilename(fileName, partners) {
    const base = fileName.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ");
    const n2 = norm(base);
    const provenance = {};
    const patch = { fileName };
    const kind = parseDocType(base);
    if (kind) {
      patch.documentType = kind;
      provenance.documentType = "SISTEM";
    }
    const num = base.match(/((?:mou|pks|ia|prop|lap)[-_ /]*\d{4}[-_ /]*\d{2,})/i);
    if (num) {
      patch.documentNumber = num[1].replace(/[\s/]+/g, "-").replace(/_+/g, "-").toUpperCase();
      provenance.documentNumber = "SISTEM";
    }
    const hits = partners.filter((p2) => {
      const sn = norm(p2.shortName);
      return sn.length >= 3 && n2.includes(sn);
    }).sort((a, b) => norm(b.shortName).length - norm(a.shortName).length);
    if (hits[0]) {
      patch.partnerId = hits[0].id;
      provenance.partnerId = "SISTEM";
    }
    if (fileName) provenance.fileName = "SISTEM";
    return { patch, provenance };
  }
  function suggestParent(draft, docs) {
    if (!draft.documentType || !draft.partnerId) return null;
    const expected = PARENT_OF[draft.documentType];
    if (!expected) return null;
    const candidates = docs.filter((d) => d.id !== draft.id && d.documentType === expected && d.partnerId === draft.partnerId);
    if (candidates.length !== 1) return null;
    if (draft.parentId === candidates[0].id) return null;
    return {
      id: candidates[0].id,
      number: candidates[0].documentNumber,
      reason: `Hanya ada satu ${typeLabel(expected)} untuk mitra yang sama.`
    };
  }
  var HEADER_ALIASES = {
    nomor: "documentNumber",
    "no dokumen": "documentNumber",
    "nomor dokumen": "documentNumber",
    "nomor naskah": "documentNumber",
    jenis: "documentType",
    "jenis naskah": "documentType",
    "jenis dokumen": "documentType",
    "tipe dokumen": "documentType",
    judul: "title",
    "judul naskah": "title",
    mitra: "partnerName",
    "nama mitra": "partnerName",
    "jenis mitra": "partnerType",
    negara: "country",
    kota: "city",
    "tanggal tandatangan": "signedDate",
    "tanggal tanda tangan": "signedDate",
    ditandatangani: "signedDate",
    "tanggal mulai": "startDate",
    "mulai berlaku": "startDate",
    "tanggal berakhir": "endDate",
    "akhir berlaku": "endDate",
    status: "status",
    "ruang lingkup": "scope",
    lingkup: "scope",
    fakultas: "faculty",
    "program studi": "program",
    prodi: "program",
    unit: "unit",
    "tri dharma": "tri",
    "tridharma": "tri",
    kegiatan: "activityName",
    "nama kegiatan": "activityName",
    pic: "pic",
    "penanggung jawab": "pic",
    "penandatangan mitra": "partnerSignatory",
    "jabatan mitra": "partnerSignatoryTitle",
    "penandatangan it del": "itdelSignatory",
    "jabatan it del": "itdelSignatoryTitle",
    induk: "parentNumber",
    "nomor induk": "parentNumber",
    lokasi: "location",
    anggaran: "budget",
    "sumber dana": "fundingSource",
    catatan: "notes",
    berkas: "fileName",
    "nama berkas": "fileName"
  };
  function parseDelimited(text) {
    const src = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    if (!src.trim()) return [];
    const firstLine = src.split("\n")[0] ?? "";
    const tabs = (firstLine.match(/\t/g) ?? []).length;
    const commas = (firstLine.match(/,/g) ?? []).length;
    const delim = tabs > commas ? "	" : ",";
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (quoted) {
        if (c === '"') {
          if (src[i + 1] === '"') {
            cell += '"';
            i += 1;
          } else quoted = false;
        } else cell += c;
      } else if (c === '"') quoted = true;
      else if (c === delim) {
        row.push(cell.trim());
        cell = "";
      } else if (c === "\n") {
        row.push(cell.trim());
        rows.push(row);
        row = [];
        cell = "";
      } else cell += c;
    }
    if (cell.length || row.length) {
      row.push(cell.trim());
      rows.push(row);
    }
    return rows.filter((r) => r.some((cell2) => cell2 !== ""));
  }
  function mapSheet(rows) {
    if (!rows.length) return { recognized: [], ignored: [], rows: [] };
    const header = rows[0].map((h) => norm(h));
    const keys = header.map((h) => HEADER_ALIASES[h] ?? "");
    const recognized = rows[0].filter((_, i) => keys[i]);
    const ignored = rows[0].filter((_, i) => rows[0][i] && !keys[i]);
    const mapped = [];
    for (let r = 1; r < rows.length; r++) {
      const values = {};
      rows[r].forEach((cell, i) => {
        const key = keys[i];
        if (key && cell) values[key] = cell;
      });
      if (!Object.keys(values).length) continue;
      const warnings = [];
      const blocking = [];
      if (!values.title && !values.documentNumber && !values.partnerName) {
        blocking.push("Baris tidak punya judul, nomor, atau mitra.");
      }
      if (values.startDate && !parseDate(values.startDate) && values.startDate) warnings.push("Tanggal mulai tidak dikenali.");
      if (values.endDate && !parseDate(values.endDate) && values.endDate) warnings.push("Tanggal berakhir tidak dikenali.");
      mapped.push({ line: r + 1, values, warnings, blocking });
    }
    return { recognized, ignored, rows: mapped };
  }
  var TEMPLATE_HEADERS = [
    "Nomor dokumen",
    "Jenis naskah",
    "Judul",
    "Nama mitra",
    "Jenis mitra",
    "Negara",
    "Kota",
    "Tanggal tandatangan",
    "Tanggal mulai",
    "Tanggal berakhir",
    "Status",
    "Ruang lingkup",
    "Fakultas",
    "Program studi",
    "Unit",
    "Tri Dharma",
    "Nama kegiatan",
    "PIC",
    "Penandatangan mitra",
    "Jabatan mitra",
    "Penandatangan IT Del",
    "Jabatan IT Del",
    "Nomor induk",
    "Lokasi",
    "Anggaran",
    "Sumber dana",
    "Catatan",
    "Nama berkas"
  ];
  function templateCsv() {
    const example = [
      "MOU-CONTOH-BARU-001",
      "MoU",
      "Hapus baris ini \u2014 contoh isian",
      "Pemkab Toba",
      "Pemerintah",
      "Indonesia",
      "Balige",
      "2026-02-01",
      "2026-02-01",
      "2028-01-31",
      "Draf",
      "Kerja sama pendidikan",
      "FITE",
      "S1 Informatika",
      "Unit Kerja Sama",
      "Pendidikan",
      "Kuliah tamu contoh",
      "Staf Contoh",
      "Pejabat Contoh Mitra",
      "Bupati Contoh",
      "Pejabat Contoh IT Del",
      "Wakil Rektor Contoh",
      "",
      "Laguboti",
      "",
      "",
      "Data contoh, bukan naskah asli",
      ""
    ];
    return `\uFEFF${TEMPLATE_HEADERS.join(",")}
${example.map(csvCell).join(",")}
`;
  }
  function csvCell(value) {
    if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  }
  function documentsToCsv(docs, partners) {
    const lines = [TEMPLATE_HEADERS.join(",")];
    for (const doc of docs) {
      const partner = partners.find((p2) => p2.id === doc.partnerId);
      const parent = docs.find((d) => d.id === doc.parentId);
      const cells = [
        doc.documentNumber,
        typeLabel(doc.documentType),
        doc.title,
        partner?.name ?? "",
        partner ? PARTNER_TYPE_LABEL[partner.type] : "",
        partner?.country ?? "",
        partner?.city ?? "",
        doc.signedDate,
        doc.startDate,
        doc.endDate,
        STATUS_LABEL[displayStatus(doc)],
        doc.scope,
        facultyName(doc.facultyId) === "\u2014" ? "" : facultyName(doc.facultyId),
        programName(doc.programId) === "\u2014" ? "" : programName(doc.programId),
        unitName(doc.unitId) === "\u2014" ? "" : unitName(doc.unitId),
        (Array.isArray(doc.triDharma) ? doc.triDharma.map((t) => TRI_LABEL[t] || t).join("; ") : String(doc.triDharma || "")),
        doc.activityName,
        doc.pic,
        doc.partnerSignatory,
        doc.partnerSignatoryTitle,
        doc.itdelSignatory,
        doc.itdelSignatoryTitle,
        parent?.documentNumber ?? "",
        doc.location,
        doc.budget,
        doc.fundingSource,
        doc.notes,
        doc.fileName
      ];
      lines.push(cells.map(csvCell).join(","));
    }
    return `\uFEFF${lines.join("\n")}
`;
  }
  function documentsToExcel(docs, partners) {
    let rowsHtml = "";
    docs.forEach((doc, idx) => {
      const partner = partners.find((p) => p.id === doc.partnerId);
      const parent = docs.find((d) => d.id === doc.parentId);
      rowsHtml += `<tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td>${esc(doc.documentNumber || "-")}</td>
        <td>${esc(typeLabel(doc.documentType))}</td>
        <td>${esc(doc.title || "-")}</td>
        <td>${esc(partner?.name || "-")}</td>
        <td>${esc(partner ? PARTNER_TYPE_LABEL[partner.type] : "-")}</td>
        <td>${esc(partner?.city || "-")}, ${esc(partner?.country || "Indonesia")}</td>
        <td>${esc(facultyName(doc.facultyId) === "\u2014" ? "" : facultyName(doc.facultyId))}</td>
        <td>${esc(programName(doc.programId) === "\u2014" ? "" : programName(doc.programId))}</td>
        <td>${esc(unitName(doc.unitId) === "\u2014" ? "" : unitName(doc.unitId))}</td>
        <td>${esc(doc.signedDate || "-")}</td>
        <td>${esc(doc.startDate || "-")}</td>
        <td>${esc(doc.endDate || "-")}</td>
        <td>${esc(STATUS_LABEL[displayStatus(doc)])}</td>
        <td>${esc(Array.isArray(doc.triDharma) ? doc.triDharma.map((t) => TRI_LABEL[t] || t).join("; ") : String(doc.triDharma || ""))}</td>
        <td>${esc(doc.activityName || "-")}</td>
        <td>${esc(doc.pic || "-")}</td>
        <td>${esc(doc.itdelSignatory || "-")}</td>
        <td>${esc(doc.itdelSignatoryTitle || "-")}</td>
        <td>${esc(doc.partnerSignatory || "-")}</td>
        <td>${esc(doc.partnerSignatoryTitle || "-")}</td>
        <td>${esc(parent?.documentNumber || "-")}</td>
        <td>${esc(doc.scope || "-")}</td>
        <td>${esc(doc.location || "-")}</td>
        <td>${esc(doc.budget || "-")}</td>
        <td>${esc(doc.fundingSource || "-")}</td>
        <td>${esc(doc.notes || "-")}</td>
      </tr>`;
    });
    return `\uFEFF<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Naskah KSDAS IT Del</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
    <style>
      th { background-color: #16324f; color: #ffffff; font-family: Segoe UI, sans-serif; font-size: 11pt; padding: 6px 10px; border: 1px solid #333; }
      td { font-family: Segoe UI, sans-serif; font-size: 10pt; padding: 5px 8px; border: 1px solid #ccc; vertical-align: top; }
      .header-title { font-family: Georgia, serif; font-size: 14pt; font-weight: bold; color: #16324f; margin-bottom: 5px; }
    </style></head><body>
    <div class="header-title">REKAPITULASI DOKUMEN KERJA SAMA — INSTITUT TEKNOLOGI DEL</div>
    <p>Tanggal Unduh: ${todayISO()} | Total Data: ${docs.length} Naskah | Sistem Informasi KSDAS IT Del</p>
    <table border="1">
      <thead><tr>
        <th>No</th><th>Nomor Dokumen</th><th>Jenis Naskah</th><th>Judul Naskah</th>
        <th>Mitra Kerja Sama</th><th>Jenis Mitra</th><th>Kota / Negara</th>
        <th>Fakultas</th><th>Program Studi</th><th>Unit Pengelola</th>
        <th>Tgl TTD</th><th>Tgl Mulai</th><th>Tgl Berakhir</th><th>Status</th>
        <th>Tri Dharma</th><th>Nama Kegiatan</th><th>PIC</th>
        <th>Penandatangan IT Del</th><th>Jabatan IT Del</th>
        <th>Penandatangan Mitra</th><th>Jabatan Mitra</th>
        <th>Nomor Induk</th><th>Ruang Lingkup</th><th>Lokasi</th><th>Anggaran</th><th>Sumber Dana</th><th>Catatan</th>
      </tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    </body></html>`;
  }
  function documentsToWord(docs, partners) {
    let rowsHtml = "";
    docs.forEach((doc, idx) => {
      const partner = partners.find((p) => p.id === doc.partnerId);
      rowsHtml += `<tr>
        <td style="text-align:center; width:30px;">${idx + 1}</td>
        <td><b>${esc(doc.documentNumber || "Tanpa Nomor")}</b><br><i>${esc(typeLabel(doc.documentType))}</i><br>${esc(doc.title || "-")}</td>
        <td><b>${esc(partner?.name || "-")}</b><br><small>${esc(partner?.city || "")} (${esc(partner ? PARTNER_TYPE_LABEL[partner.type] : "")})</small></td>
        <td>${esc(facultyName(doc.facultyId))}<br><small>${esc(programName(doc.programId))}</small></td>
        <td>${esc(doc.startDate || "-")} s.d. ${esc(doc.endDate || "-")}</td>
        <td><b>${esc(STATUS_LABEL[displayStatus(doc)])}</b></td>
        <td>${esc(doc.pic || "-")}<br><small>${esc(doc.activityName || "")}</small></td>
      </tr>`;
    });
    return `\uFEFF<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8">
    <style>
      body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.35; margin: 1.5in 1in; }
      .kop { text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 18px; }
      .kop h3 { margin: 0; font-size: 13pt; letter-spacing: 1px; font-weight: bold; }
      .kop h2 { margin: 2px 0; font-size: 16pt; font-weight: bold; }
      .kop p { margin: 2px 0; font-size: 9pt; font-family: Arial, sans-serif; }
      .judul-doc { text-align: center; font-size: 13pt; font-weight: bold; text-decoration: underline; margin-bottom: 4px; }
      .subjudul { text-align: center; font-size: 10pt; margin-top: 0; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th { background-color: #f2f2f2; border: 1px solid #000; padding: 6px; font-size: 10pt; text-align: center; }
      td { border: 1px solid #000; padding: 6px; font-size: 9.5pt; vertical-align: top; }
      .sign-block { margin-top: 35px; width: 100%; border: none; }
      .sign-block td { border: none; padding: 0; }
    </style></head><body>
    <div class="kop">
      <h3>YAYASAN DEL</h3>
      <h2>INSTITUT TEKNOLOGI DEL</h2>
      <p>Jl. Sisingamangaraja, Sitoluama, Laguboti, Toba, Sumatera Utara 22381<br>Telepon: +62 632 331234 | Surel: info@del.ac.id | Laman: www.del.ac.id</p>
    </div>
    <div class="judul-doc">DOSIR REKAPITULASI DOKUMEN KERJA SAMA</div>
    <div class="subjudul">Dicetak pada: ${todayISO()} | Total Data: ${docs.length} Naskah | Unit Kerja Sama IT Del</div>
    <table>
      <thead><tr>
        <th>No</th><th>Nomor & Judul Naskah</th><th>Mitra Kerja Sama</th><th>Fakultas / Prodi</th><th>Masa Berlaku</th><th>Status</th><th>PIC / Kegiatan</th>
      </tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <table class="sign-block">
      <tr>
        <td style="width:60%;"></td>
        <td style="width:40%; text-align:center;">
          Laguboti, ${todayISO()}<br>
          Institut Teknologi Del,<br><br><br><br><br>
          <b><u>Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.</u></b><br>
          Rektor Institut Teknologi Del
        </td>
      </tr>
    </table>
    </body></html>`;
  }
  function analysisToWord(summary, role, docs, partners) {
    return `\uFEFF<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8">
    <style>
      body { font-family: 'Times New Roman', serif; font-size: 11.5pt; line-height: 1.4; margin: 1.5in 1in; }
      .kop { text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 20px; }
      .kop h3 { margin: 0; font-size: 13pt; font-weight: bold; }
      .kop h2 { margin: 2px 0; font-size: 16pt; font-weight: bold; }
      .kop p { margin: 2px 0; font-size: 9pt; font-family: Arial, sans-serif; }
      .doc-title { text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; }
      .doc-meta { text-align: center; font-size: 10pt; margin-bottom: 20px; }
      h3 { font-size: 12pt; font-weight: bold; margin-top: 18px; margin-bottom: 6px; }
      table { width: 100%; border-collapse: collapse; margin: 10px 0; }
      th { background-color: #f2f2f2; border: 1px solid #000; padding: 6px; font-size: 10pt; text-align: left; }
      td { border: 1px solid #000; padding: 6px; font-size: 10pt; }
      .box { border: 1px solid #444; background: #fafafa; padding: 10px 14px; margin: 12px 0; }
      .sign-block { margin-top: 40px; width: 100%; border: none; }
      .sign-block td { border: none; padding: 0; }
    </style></head><body>
    <div class="kop">
      <h3>YAYASAN DEL</h3>
      <h2>INSTITUT TEKNOLOGI DEL</h2>
      <p>Jl. Sisingamangaraja, Sitoluama, Laguboti, Toba, Sumatera Utara 22381<br>Telepon: +62 632 331234 | Surel: info@del.ac.id | Laman: www.del.ac.id</p>
    </div>
    <div class="doc-title">LAPORAN ANALISIS EVALUASI KERJA SAMA</div>
    <div class="doc-meta">Lingkup Evaluasi: <b>${esc(role.name)}</b> | Tanggal: ${todayISO()} | KSDAS IT Del</div>

    <h3>I. RINGKASAN EKSEKUTIF</h3>
    <p>Berdasarkan data operasional naskah kerja sama pada lingkup ${esc(role.name)}, diperoleh rekapitulasi status sebagai berikut:</p>
    <table>
      <thead><tr><th>Kategori Status</th><th>Jumlah Naskah</th><th>Persentase</th><th>Tindak Lanjut Yang Dibutuhkan</th></tr></thead>
      <tbody>
        <tr><td>Total Naskah Dievaluasi</td><td><b>${summary.total}</b></td><td>100%</td><td>Basis portofolio kemitraan aktif</td></tr>
        <tr><td>Aktif (Berjalan Normal)</td><td>${summary.shown.aktif}</td><td>${summary.total ? Math.round(summary.shown.aktif / summary.total * 100) : 0}%</td><td>Pantau pelaksanaan program Tri Dharma</td></tr>
        <tr><td>Akan Berakhir (&le; 180 Hari)</td><td><b style="color:#b25e00;">${summary.shown.akan}</b></td><td>${summary.total ? Math.round(summary.shown.akan / summary.total * 100) : 0}%</td><td>Segera hubungi mitra untuk perpanjangan</td></tr>
        <tr><td>Telah Berakhir</td><td><b style="color:#a80000;">${summary.shown.berakhir}</b></td><td>${summary.total ? Math.round(summary.shown.berakhir / summary.total * 100) : 0}%</td><td>Pindahkan ke arsip atau buat adendum baru</td></tr>
        <tr><td>Draf (Perlu Kelengkapan)</td><td>${summary.shown.draf}</td><td>${summary.total ? Math.round(summary.shown.draf / summary.total * 100) : 0}%</td><td>Lengkapi data penandatangan / tanggal</td></tr>
      </tbody>
    </table>

    <h3>II. DISTRIBUSI MENURUT JENIS NASKAH</h3>
    <table>
      <thead><tr><th>Jenis Naskah Kerja Sama</th><th>Jumlah</th><th>Persentase</th></tr></thead>
      <tbody>
        ${summary.byType.map((item) => `<tr><td>${esc(item.label)}</td><td>${item.count}</td><td>${summary.total ? Math.round(item.count / summary.total * 100) : 0}%</td></tr>`).join("")}
      </tbody>
    </table>

    <h3>III. EVALUASI KESENJANGAN & KONSISTENSI RELASI</h3>
    ${summary.gaps.length ? `
    <div class="box">
      <b>Perhatian Khusus Rantai Dokumen:</b>
      <p>Ditemukan ${summary.gaps.length} kesenjangan relasi naskah yang memerlukan koordinasi pimpinan:</p>
      <ul>
        ${summary.gaps.map((gap) => `<li><b>${esc(gap.message)}</b> (ID Naskah: ${esc(gap.documentId)})</li>`).join("")}
      </ul>
    </div>` : `<p>Seluruh dokumen memiliki keterkaitan hierarki yang konsisten (MoU memiliki PKS, PKS memiliki IA/kegiatan).</p>`}

    <h3>IV. REKOMENDASI PIMPINAN</h3>
    <ol>
      <li>Menugaskan PIC Program Studi terkait untuk memverifikasi ${summary.shown.akan} naskah yang akan berakhir dalam kurun waktu 6 bulan ke depan.</li>
      <li>Mempercepat realisasi implementasi kegiatan (Implementation Arrangement / IA) bagi MoU yang telah ditandatangani namun belum memiliki PKS turunan.</li>
      <li>Menyimpan dokumen fisik asli di Unit Kerja Sama dan memastikan file digital tersimpan di server lokal intranet IT Del.</li>
    </ol>

    <table class="sign-block">
      <tr>
        <td style="width:60%;"></td>
        <td style="width:40%; text-align:center;">
          Laguboti, ${todayISO()}<br>
          Pelapor Analisis Kemitraan,<br><br><br><br><br>
          <b><u>${esc(role.name)}</u></b><br>
          Institut Teknologi Del
        </td>
      </tr>
    </table>
    </body></html>`;
  }
  function amiReportToWord(role, docs, partners) {
    const gaps = followUpGaps(docs);
    const activeDocs = docs.filter((d) => displayStatus(d) === "AKTIF");
    const expiredDocs = docs.filter((d) => displayStatus(d) === "BERAKHIR");
    const warningDocs = docs.filter((d) => displayStatus(d) === "AKAN_BERAKHIR");
    const passiveMous = docs.filter((d) => d.documentType === "MOU_LOI" && displayStatus(d) === "AKTIF" && !state.documents.some((c) => c.parentId === d.id));
    const pksNoIa = docs.filter((d) => d.documentType === "PKS_MOA" && displayStatus(d) === "AKTIF" && !state.documents.some((c) => c.parentId === d.id));

    return `\uFEFF<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8">
    <title>Lembar Hasil Audit Mutu Internal (LH-AMI) Kerja Sama IT Del</title>
    <style>
      body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.35; margin: 1.2in 1in; }
      .kop { text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 16px; }
      .kop h3 { margin: 0; font-size: 12pt; font-weight: bold; }
      .kop h2 { margin: 2px 0; font-size: 15pt; font-weight: bold; }
      .kop p { margin: 2px 0; font-size: 9pt; font-family: Arial, sans-serif; }
      .doc-title { text-align: center; font-size: 13pt; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; }
      .doc-sub { text-align: center; font-size: 10pt; font-style: italic; margin-bottom: 16px; }
      h3 { font-size: 11.5pt; font-weight: bold; margin-top: 16px; margin-bottom: 5px; }
      table { width: 100%; border-collapse: collapse; margin: 8px 0; }
      th { background-color: #eef2f7; border: 1px solid #333; padding: 5px 6px; font-size: 9.5pt; text-align: left; }
      td { border: 1px solid #333; padding: 5px 6px; font-size: 9.5pt; }
      .box { border: 1px solid #555; background: #fafafa; padding: 8px 12px; margin: 10px 0; }
      .sign-table { width: 100%; border: none; margin-top: 35px; }
      .sign-table td { border: none; padding: 4px; text-align: center; vertical-align: top; }
      .badge-kts { color: #b71c1c; font-weight: bold; }
      .badge-ob { color: #e65100; font-weight: bold; }
      .badge-ok { color: #1b5e20; font-weight: bold; }
    </style></head><body>
    <div class="kop">
      <h3>YAYASAN DEL</h3>
      <h2>INSTITUT TEKNOLOGI DEL</h2>
      <p><b>SATUAN PENJAMINAN MUTU (SPM) & BIRO KERJA SAMA</b><br>
      Jl. Sisingamangaraja, Sitoluama, Laguboti, Kabupaten Toba, Sumatera Utara 22381<br>
      Telepon: +62 632 331234 | Surel: spm@del.ac.id | Laman: www.del.ac.id</p>
    </div>
    <div class="doc-title">LEMBAR HASIL AUDIT MUTU INTERNAL (LH-AMI) BIDANG KERJA SAMA</div>
    <div class="doc-sub">Siklus SPMI Kemdiktisaintek (Permendikbudristek No. 53/2023) & Pemenuhan IKU 6 | Tahun Audit: ${new Date().getFullYear()}</div>

    <table style="margin-bottom:12px;">
      <tr><td style="width:25%; font-weight:bold;">Unit Teraudit (Auditee)</td><td style="width:75%;">Bagian Kerja Sama dan Kemitraan (UKS) & Fakultas (FITE, FTI, FB, FV)</td></tr>
      <tr><td style="font-weight:bold;">Standar Penjaminan Mutu</td><td style="width:75%;">Standar Nasional Pendidikan Tinggi (SN Dikti) & Siklus PPEPP Kerja Sama Kemdiktisaintek</td></tr>
      <tr><td style="font-weight:bold;">Tanggal Pelaksanaan Audit</td><td>${todayISO()}</td></tr>
      <tr><td style="font-weight:bold;">Auditor Penjaminan Mutu</td><td>Tim Auditor Internal Satuan Penjaminan Mutu (SPM) IT Del</td></tr>
    </table>

    <h3>I. RESUM KEPATUHAN & STATISTIK MUTU NASKAH</h3>
    <table>
      <thead><tr><th>Indikator Evaluasi SPMI Kerja Sama</th><th>Jumlah</th><th>Persentase</th><th>Status Kepatuhan</th></tr></thead>
      <tbody>
        <tr><td>Total Dosir Naskah Teraudit</td><td>${docs.length}</td><td>100%</td><td>Terdaftar di Sistem KSDAS</td></tr>
        <tr><td>Naskah Berstatus Aktif & Berjalan</td><td>${activeDocs.length}</td><td>${docs.length ? Math.round(activeDocs.length / docs.length * 100) : 0}%</td><td class="badge-ok">Sesuai Standar Mutu</td></tr>
        <tr><td>MoU Pasif / "Tidur" (>180 Hari Tanpa PKS)</td><td>${passiveMous.length}</td><td>${docs.length ? Math.round(passiveMous.length / docs.length * 100) : 0}%</td><td class="badge-kts">Temuan KTS Minor (Segera Dibuatkan PKS)</td></tr>
        <tr><td>PKS Berjalan Belum Memiliki IA / Kegiatan</td><td>${pksNoIa.length}</td><td>${docs.length ? Math.round(pksNoIa.length / docs.length * 100) : 0}%</td><td class="badge-ob">Temuan Observasi (Perlu Rincian Implementasi)</td></tr>
        <tr><td>Naskah Kedaluwarsa (Lewat Masa Berlaku)</td><td>${expiredDocs.length}</td><td>${docs.length ? Math.round(expiredDocs.length / docs.length * 100) : 0}%</td><td class="badge-kts">Temuan KTS Minor/Mayor (Adendum/Perpanjangan)</td></tr>
        <tr><td>Naskah Menjelang Berakhir (&le; 180 Hari)</td><td>${warningDocs.length}</td><td>${docs.length ? Math.round(warningDocs.length / docs.length * 100) : 0}%</td><td class="badge-ob">Peringatan Dini (Kirim Surat Evaluasi Mitra)</td></tr>
      </tbody>
    </table>

    <h3>II. CAPAIAN INDIKATOR KINERJA UTAMA (IKU 6) PER FAKULTAS & PRODI</h3>
    <table>
      <thead><tr><th>Fakultas / Program Studi</th><th>Dekan / Penanggung Jawab</th><th>Total Naskah</th><th>Naskah Industri / Mitra Bereputasi</th><th>Capaian IKU 6</th></tr></thead>
      <tbody>
        ${FACULTIES.map((f) => {
          const fDocs = docs.filter((d) => d.facultyId === f.id);
          const fProdis = PROGRAMS.filter((p) => p.facultyId === f.id);
          const fMitraRep = fDocs.filter((d) => {
            const p = state.partners.find((x) => x.id === d.partnerId);
            return p && (p.type === "SWASTA" || p.type === "BUMN" || p.type === "PERGURUAN_TINGGI");
          }).length;
          return `<tr>
            <td><b>${f.id}</b> - ${esc(f.name)}</td>
            <td>${esc(f.dekan || "-")}</td>
            <td>${fDocs.length}</td>
            <td>${fMitraRep}</td>
            <td>${fDocs.length > 0 ? "Memenuhi Target IKU 6" : "Perlu Peningkatan Kemitraan"}</td>
          </tr>` + fProdis.map((pr) => {
            const prDocs = docs.filter((d) => d.programId === pr.id);
            return `<tr style="font-size:9pt; background:#fafafa;">
              <td style="padding-left:18px;">&bull; ${esc(pr.name)} (${pr.id})</td>
              <td>Kaprodi ${pr.id}</td>
              <td>${prDocs.length}</td>
              <td>${prDocs.filter((d) => displayStatus(d) === "AKTIF").length} Aktif</td>
              <td>${prDocs.length >= 1 ? "✓ Terdata" : "Belum Ada Naskah"}</td>
            </tr>`;
          }).join("");
        }).join("")}
      </tbody>
    </table>

    <h3>III. TEMUAN AUDIT & DAFTAR KESENJANGAN RELASI (RELATIONAL GAPS)</h3>
    ${gaps.length ? `
    <div class="box">
      <b>Rincian Kesenjangan Dokumen (Temuan AMI):</b>
      <ul>
        ${gaps.map((g) => `<li><b>[${esc(g.kind)}]</b> ${esc(g.message)} (ID: ${esc(g.documentId)})</li>`).join("")}
      </ul>
    </div>` : `<p class="badge-ok">✓ Tidak ditemukan kesenjangan relasi. Tata kelola dosir naskah berjalan tertib.</p>`}

    <h3>IV. RENCANA TINDAK LANJUT (RTL) AUDIT MUTU INTERNAL</h3>
    <ol>
      <li><b>Penanganan MoU Pasif:</b> Menginstruksikan UKS dan Dekan Fakultas terkait (FITE, FTI, FB, FV) untuk menghubungi mitra dalam waktu 14 hari kerja guna menyusun draft PKS turunan.</li>
      <li><b>Pelaporan LaporKerma Kemdiktisaintek:</b> Memastikan seluruh naskah yang berstatus aktif dan memiliki IA telah disinkronkan ke platform LaporKerma Kemdiktisaintek sebelum batas akhir pelaporan semesteran.</li>
      <li><b>Pembaruan Dosir Kedaluwarsa:</b> Naskah yang telah berakhir masa berlakunya wajib diputuskan: apakah dilakukan perpanjangan (MoU/PKS Baru / Adendum) atau dipindahkan secara resmi ke arsip non-aktif.</li>
      <li><b>Penguatan IKU 6:</b> Mendorong Program Studi vokasi (TRPL, D3TI, D3TK) dan teknik untuk memperluas kemitraan kurikulum industri terapan dan program magang bersertifikat.</li>
    </ol>

    <table class="sign-table">
      <tr>
        <td style="width:33%;">
          Auditee,<br>
          Kepala Bagian Kerja Sama (UKS)<br><br><br><br>
          <b><u>Staf Unit Kerja Sama IT Del</u></b><br>
          NIP. IT Del UKS
        </td>
        <td style="width:34%;">
          Ketua Tim Auditor,<br>
          Satuan Penjaminan Mutu (SPM)<br><br><br><br>
          <b><u>Auditor SPM IT Del</u></b><br>
          Siklus PPEPP Kemdiktisaintek
        </td>
        <td style="width:33%;">
          Mengetahui & Menyetujui,<br>
          Wakil Rektor III (Kemitraan & Inovasi)<br><br><br><br>
          <b><u>${esc(LEADERSHIP_DIRECTORY.rektorat.wr3.name)}</u></b><br>
          Institut Teknologi Del
        </td>
      </tr>
      <tr>
        <td colspan="3" style="text-align:center; padding-top:25px;">
          Mengesahkan,<br>
          Rektor Institut Teknologi Del<br><br><br><br>
          <b><u>${esc(LEADERSHIP_DIRECTORY.rektorat.rektor.name)}</u></b><br>
          Periode ${esc(LEADERSHIP_DIRECTORY.rektorat.rektor.period)}
        </td>
      </tr>
    </table>
    </body></html>`;
  }

  function amiToCsv(docs, partners) {
    const header = [
      "Nomor Dokumen",
      "Judul Naskah",
      "Jenis",
      "Mitra Kerja Sama",
      "Fakultas",
      "Program Studi",
      "Masa Berlaku",
      "Status Operasional",
      "Status Kepatuhan AMI",
      "Klasifikasi Temuan",
      "Rekomendasi SPMI Kemdiktisaintek"
    ];
    const lines = [header.join(",")];
    for (const d of docs) {
      const p = partnerName(partners, d.partnerId);
      const st = displayStatus(d);
      const hasChild = state.documents.some((c) => c.parentId === d.id);
      let amiStatus = "Sesuai";
      let temuan = "Tidak Ada Temuan";
      let rekomendasi = "Pertahankan pelaksanaan tridharma";

      if (st === "BERAKHIR") {
        amiStatus = "Tidak Patuh";
        temuan = "KTS Minor / Mayor (Kedaluwarsa)";
        rekomendasi = "Perpanjang atau pindahkan ke arsip";
      } else if (st === "AKAN_BERAKHIR") {
        amiStatus = "Perhatian";
        temuan = "Observasi (Menjelang Berakhir)";
        rekomendasi = "Kirim surat permohonan perpanjangan";
      } else if (d.documentType === "MOU_LOI" && !hasChild) {
        amiStatus = "Perhatian";
        temuan = "KTS Minor (MoU Pasif / Belum Ada PKS)";
        rekomendasi = "Dorong prodi menyusun PKS turunan";
      } else if (d.documentType === "PKS_MOA" && !hasChild) {
        amiStatus = "Perhatian";
        temuan = "Observasi (PKS Belum Ada IA/Kegiatan)";
        rekomendasi = "Terbitkan Implementation Arrangement (IA)";
      }

      const row = [
        d.documentNumber,
        d.title,
        typeLabel(d.documentType),
        p,
        facultyName(d.facultyId),
        programName(d.programId),
        `${d.startDate || "-"} s.d. ${d.endDate || "-"}`,
        st,
        amiStatus,
        temuan,
        rekomendasi
      ].map((val) => `"${String(val || "").replace(/"/g, '""')}"`);
      lines.push(row.join(","));
    }
    return lines.join("\r\n");
  }

  function naskahFromValues(values, partners, now = /* @__PURE__ */ new Date()) {
    const doc = blankNaskah(now);
    const warnings = [];
    const set = (key, value) => {
      if (!value) return;
      doc[key] = value;
      doc.provenance[key] = "IMPOR";
    };
    if (values.documentNumber) set("documentNumber", values.documentNumber.trim());
    if (values.title) set("title", values.title.trim());
    const kind = parseDocType(values.documentType ?? "");
    if (values.documentType && !kind) warnings.push("Jenis naskah tidak dikenali. Pilih manual.");
    if (kind) {
      doc.documentType = kind;
      doc.provenance.documentType = "IMPOR";
    }
    const signed = parseDate(values.signedDate ?? "");
    const start = parseDate(values.startDate ?? "");
    const end = parseDate(values.endDate ?? "");
    if (values.signedDate && !signed) warnings.push("Tanggal tandatangan tidak dikenali.");
    if (values.startDate && !start) warnings.push("Tanggal mulai tidak dikenali.");
    if (values.endDate && !end) warnings.push("Tanggal berakhir tidak dikenali.");
    if (signed) set("signedDate", signed);
    if (start) set("startDate", start);
    if (end) set("endDate", end);
    if (values.status) {
      doc.status = parseStoredStatus(values.status);
      doc.provenance.status = "IMPOR";
    }
    if (values.scope) set("scope", values.scope);
    const facultyId = matchFaculty(values.faculty ?? "");
    if (values.faculty && !facultyId) warnings.push("Fakultas tidak cocok dengan master. Pilih manual.");
    if (facultyId) {
      doc.facultyId = facultyId;
      doc.provenance.facultyId = "IMPOR";
    }
    const programId = matchProgram(values.program ?? "");
    if (values.program && !programId) warnings.push("Program studi tidak cocok dengan master. Pilih manual.");
    if (programId) {
      doc.programId = programId;
      doc.provenance.programId = "IMPOR";
    }
    const unitId = matchUnit(values.unit ?? "");
    if (unitId) {
      doc.unitId = unitId;
      doc.provenance.unitId = "IMPOR";
    }
    const tri = parseTri(values.tri ?? "");
    if (tri.length) {
      doc.triDharma = tri;
      doc.provenance.triDharma = "IMPOR";
    }
    if (values.activityName) set("activityName", values.activityName);
    if (values.pic) set("pic", values.pic);
    if (values.partnerSignatory) set("partnerSignatory", values.partnerSignatory);
    if (values.partnerSignatoryTitle) set("partnerSignatoryTitle", values.partnerSignatoryTitle);
    if (values.itdelSignatory) set("itdelSignatory", values.itdelSignatory);
    if (values.itdelSignatoryTitle) set("itdelSignatoryTitle", values.itdelSignatoryTitle);
    if (values.location) set("location", values.location);
    if (values.budget) set("budget", values.budget);
    if (values.fundingSource) set("fundingSource", values.fundingSource);
    if (values.notes) set("notes", values.notes);
    if (values.fileName) set("fileName", values.fileName);
    let partnerDraft = null;
    const pname = (values.partnerName ?? "").trim();
    if (pname) {
      const found = partners.find((p2) => norm(p2.name) === norm(pname) || norm(p2.shortName) === norm(pname));
      if (found) {
        doc.partnerId = found.id;
        doc.provenance.partnerId = "IMPOR";
      } else {
        partnerDraft = {
          id: `PRT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          name: pname,
          shortName: pname,
          type: values.partnerType ? parsePartnerType(values.partnerType) : parsePartnerType(pname),
          country: values.country?.trim() || "Indonesia",
          city: values.city?.trim() || ""
        };
        doc.partnerId = partnerDraft.id;
        doc.provenance.partnerId = "IMPOR";
      }
    }
    if (doc.programId) {
      const program = PROGRAMS.find((item) => item.id === doc.programId);
      if (program && !doc.facultyId) {
        doc.facultyId = program.facultyId;
        doc.provenance.facultyId = "IMPOR";
      } else if (program && doc.facultyId && program.facultyId !== doc.facultyId) {
        warnings.push("Program studi tidak berada di fakultas yang tertulis. Periksa sebelum disimpan.");
      }
    }
    return { doc, partnerDraft, parentNumber: (values.parentNumber ?? "").trim(), warnings };
  }
  function duplicateNumber(docs, number, exceptId = "") {
    const n2 = norm(number);
    if (!n2) return void 0;
    return docs.find((d) => d.id !== exceptId && norm(d.documentNumber) === n2);
  }
  function p(partial) {
    return { country: "Indonesia", city: "", ...partial };
  }
  function n(partial) {
    return { ...blankNaskah(/* @__PURE__ */ new Date("2026-10-03T00:00:00Z")), provenance: {}, fileSize: 0, ...partial };
  }
  function seedPartners() {
    return [
      p({ id: "PRT-TOBA", name: "Pemerintah Kabupaten Toba", shortName: "Pemkab Toba", type: "PEMERINTAH", city: "Balige" }),
      p({ id: "PRT-SUMUT", name: "Pemerintah Provinsi Sumatera Utara", shortName: "Pemprov Sumut", type: "PEMERINTAH", city: "Medan" }),
      p({ id: "PRT-USU", name: "Universitas Sumatera Utara", shortName: "USU", type: "PERGURUAN_TINGGI", city: "Medan" }),
      p({ id: "PRT-ITB", name: "Institut Teknologi Bandung", shortName: "ITB", type: "PERGURUAN_TINGGI", city: "Bandung" }),
      p({ id: "PRT-UI", name: "Universitas Indonesia", shortName: "UI", type: "PERGURUAN_TINGGI", city: "Depok" }),
      p({ id: "PRT-TELKOM", name: "PT Telkom Indonesia (Persero) Tbk", shortName: "Telkom Indonesia", type: "BUMN", city: "Bandung" }),
      p({ id: "PRT-BRI", name: "PT Bank Rakyat Indonesia (Persero) Tbk", shortName: "Bank BRI", type: "BUMN", city: "Jakarta" }),
      p({ id: "PRT-SMK", name: "SMK Negeri 1 Laguboti", shortName: "SMK Laguboti", type: "SEKOLAH", city: "Laguboti" }),
      p({ id: "PRT-DIGITAL", name: "PT Toba Digital Nusantara", shortName: "Toba Digital", type: "SWASTA", city: "Balige" }),
      p({ id: "PRT-BPODT", name: "Badan Pelaksana Otorita Danau Toba", shortName: "BPODT", type: "PEMERINTAH", city: "Balige" }),
      p({ id: "PRT-DISPAR", name: "Dinas Pariwisata Provinsi Sumatera Utara", shortName: "Dispar Sumut", type: "PEMERINTAH", city: "Medan" })
    ];
  }
  function seedDocuments() {
    const base = {
      partnerSignatory: "Pejabat Contoh Mitra",
      partnerSignatoryTitle: "Pimpinan contoh",
      itdelSignatory: "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.",
      itdelSignatoryTitle: "Rektor Institut Teknologi Del",
      pic: "Staf Unit Kerja Sama",
      location: "Laguboti",
      budget: "",
      fundingSource: "",
      notes: "Data contoh untuk uji tampilan. Bukan naskah yang pernah ditandatangani.",
      status: "AKTIF"
    };
    return [
      n({
        ...base,
        id: "DOC-01",
        documentType: "MOU_LOI",
        documentNumber: "MOU-CONTOH-2024-001",
        title: "Contoh \u2014 nota kesepahaman dengan Pemkab Toba",
        partnerId: "PRT-TOBA",
        signedDate: "2024-03-12",
        startDate: "2024-03-12",
        endDate: "2027-03-11",
        scope: "Pendidikan dan pengabdian di Kabupaten Toba",
        facultyId: "FITE",
        programId: "IF",
        unitId: "UKS",
        triDharma: ["PENDIDIKAN", "PENGABDIAN"],
        activityName: "Kuliah tamu dan desa binaan contoh",
        fileName: "MoU_Pemkab_Toba_2024.pdf"
      }),
      n({
        ...base,
        id: "DOC-02",
        documentType: "PKS_MOA",
        documentNumber: "PKS-CONTOH-2024-014",
        title: "Contoh \u2014 PKS pelaksanaan dengan Pemkab Toba",
        partnerId: "PRT-TOBA",
        parentId: "DOC-01",
        signedDate: "2024-08-01",
        startDate: "2024-08-01",
        endDate: "2026-12-20",
        scope: "Pelatihan aparatur desa",
        facultyId: "FITE",
        programId: "IF",
        unitId: "LPPM",
        triDharma: ["PENGABDIAN"],
        activityName: "Pelatihan contoh",
        fileName: "PKS_Pemkab_Toba_2024.pdf"
      }),
      n({
        ...base,
        id: "DOC-03",
        documentType: "IA",
        documentNumber: "IA-CONTOH-2025-003",
        title: "Contoh \u2014 IA pelatihan desa",
        partnerId: "PRT-TOBA",
        parentId: "DOC-02",
        signedDate: "2025-02-01",
        startDate: "2025-02-01",
        endDate: "2026-12-20",
        scope: "Satu kegiatan pelatihan",
        facultyId: "FITE",
        programId: "IF",
        unitId: "LPPM",
        triDharma: ["PENGABDIAN"],
        activityName: "Pelatihan desa contoh",
        fileName: "IA_Pemkab_Toba_2025.pdf"
      }),
      n({
        ...base,
        id: "DOC-04",
        documentType: "PROPOSAL",
        documentNumber: "PROP-CONTOH-2025-011",
        title: "Contoh \u2014 proposal pelatihan desa",
        partnerId: "PRT-TOBA",
        parentId: "DOC-03",
        signedDate: "2025-02-10",
        startDate: "2025-03-01",
        endDate: "2025-06-30",
        scope: "Rencana kegiatan",
        facultyId: "FITE",
        programId: "IF",
        unitId: "PRODI",
        triDharma: ["PENGABDIAN"],
        activityName: "Pelatihan desa contoh",
        fileName: "Proposal_Pelatihan_Desa.docx"
      }),
      n({
        ...base,
        id: "DOC-05",
        documentType: "LAPORAN",
        documentNumber: "LAP-CONTOH-2025-020",
        title: "Contoh \u2014 laporan pelatihan desa",
        partnerId: "PRT-TOBA",
        parentId: "DOC-04",
        signedDate: "2025-07-02",
        startDate: "2025-03-01",
        endDate: "2025-06-30",
        scope: "Laporan pelaksanaan",
        facultyId: "FITE",
        programId: "IF",
        unitId: "PRODI",
        triDharma: ["PENGABDIAN"],
        activityName: "Pelatihan desa contoh",
        fileName: "Laporan_Pelatihan_Desa.pdf"
      }),
      n({
        ...base,
        id: "DOC-06",
        documentType: "MOU_LOI",
        documentNumber: "MOU-CONTOH-2025-006",
        title: "Contoh \u2014 nota kesepahaman dengan USU",
        partnerId: "PRT-USU",
        signedDate: "2025-01-15",
        startDate: "2025-01-15",
        endDate: "2027-01-14",
        scope: "Penelitian bersama",
        facultyId: "FITE",
        programId: "SI",
        unitId: "LPPM",
        triDharma: ["PENELITIAN"],
        activityName: "Riset bersama contoh",
        fileName: "MoU_USU_2025.pdf"
      }),
      n({
        ...base,
        id: "DOC-07",
        documentType: "PKS_MOA",
        documentNumber: "PKS-CONTOH-2025-021",
        title: "Contoh \u2014 PKS riset dengan USU",
        partnerId: "PRT-USU",
        parentId: "DOC-06",
        signedDate: "2025-04-01",
        startDate: "2025-04-01",
        endDate: "2026-11-15",
        scope: "Satu skema riset",
        facultyId: "FITE",
        programId: "SI",
        unitId: "LPPM",
        triDharma: ["PENELITIAN"],
        activityName: "Riset bersama contoh",
        fileName: "PKS_USU_Riset.pdf"
      }),
      n({
        ...base,
        id: "DOC-08",
        documentType: "MOU_LOI",
        documentNumber: "MOU-CONTOH-2025-009",
        title: "Contoh \u2014 nota kesepahaman dengan SMK Laguboti",
        partnerId: "PRT-SMK",
        signedDate: "2025-06-01",
        startDate: "2025-06-01",
        endDate: "2028-05-31",
        scope: "Pengenalan pemrograman",
        facultyId: "FITE",
        programId: "IF",
        unitId: "UKS",
        triDharma: ["PENDIDIKAN"],
        activityName: "",
        fileName: "MoU_SMK_Laguboti.pdf"
      }),
      n({
        ...base,
        id: "DOC-09",
        documentType: "MOU_LOI",
        documentNumber: "MOU-CONTOH-2023-004",
        title: "Contoh \u2014 nota kesepahaman yang sudah lewat masa berlaku",
        partnerId: "PRT-DIGITAL",
        signedDate: "2023-07-01",
        startDate: "2023-07-01",
        endDate: "2026-06-30",
        scope: "Magang contoh",
        facultyId: "FTI",
        programId: "MR",
        unitId: "UKS",
        triDharma: ["PENDIDIKAN"],
        activityName: "Magang contoh",
        fileName: "MoU_Toba_Digital.pdf"
      }),
      n({
        id: "DOC-10",
        documentType: "PKS_MOA",
        documentNumber: "PKS-CONTOH-2026-002",
        title: "Contoh \u2014 PKS yang masih perlu dilengkapi",
        partnerId: "PRT-DISPAR",
        status: "DRAFT",
        signedDate: "",
        startDate: "2026-09-01",
        endDate: "",
        scope: "",
        facultyId: "FB",
        programId: "BP",
        unitId: "LPPM",
        triDharma: ["PENGABDIAN"],
        activityName: "Pendataan flora contoh",
        pic: "",
        partnerSignatory: "",
        partnerSignatoryTitle: "",
        itdelSignatory: "",
        itdelSignatoryTitle: "",
        parentId: "",
        location: "Danau Toba",
        budget: "",
        fundingSource: "",
        notes: "Baris ini sengaja belum lengkap, supaya antrean isian terlihat.",
        fileName: "PKS_Dispar_Sumut_draft.pdf",
        fileSize: 0
      })
    ];
  }
  function seedAudit() {
    return [
      {
        id: "AUD-SEED",
        at: "2026-10-03T02:00:00.000Z",
        actor: "Sistem",
        action: "CONTOH",
        target: "10 naskah",
        detail: "Data contoh dimuat. Bukan arsip produksi."
      }
    ];
  }
  function downloadText(filename, text, mime = "text/plain") {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  function analysisSummary(docs, today = /* @__PURE__ */ new Date()) {
    const byType = Object.keys(TYPE_LABEL).map((type) => ({
      type,
      label: TYPE_LABEL[type],
      count: docs.filter((d) => d.documentType === type).length
    }));
    const years = /* @__PURE__ */ new Map();
    for (const doc of docs) {
      const year = (doc.startDate || doc.signedDate).slice(0, 4);
      if (year) years.set(year, (years.get(year) ?? 0) + 1);
    }
    const shown = {
      aktif: docs.filter((d) => displayStatus(d, today) === "AKTIF").length,
      akan: docs.filter((d) => displayStatus(d, today) === "AKAN_BERAKHIR").length,
      berakhir: docs.filter((d) => displayStatus(d, today) === "BERAKHIR").length,
      draf: docs.filter((d) => displayStatus(d, today) === "DRAFT").length
    };
    return {
      total: docs.length,
      byType,
      years: [...years.entries()].sort((a, b) => a[0].localeCompare(b[0])),
      shown,
      incomplete: docs.filter((d) => missingFields(d).length > 0).length,
      gaps: followUpGaps(docs, today).filter((g) => docs.some((d) => d.id === g.documentId))
    };
  }

  // src/gh-pages/main.ts
  var KEY = "ksdas-pages-v1";
  function initialViewFromHash() {
    try {
      const h = (window.location.hash || "").replace("#", "").toLowerCase();
      if (h === "repository" || h === "naskah") return "naskah";
      if (h === "entri" || h === "pencatatan") return "entri";
      if (h === "analisis") return "analisis";
      if (h === "impor" || h === "migrasi") return "impor";
      if (h === "relasi") return "relasi";
      if (h === "panduan") return "panduan";
      if (h === "penyimpanan" || h === "storage") return "penyimpanan";
    } catch {
    }
    return "beranda";
  }

  function load() {
    const initView = initialViewFromHash();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        return {
          roleId: saved.roleId || "STAFF",
          view: initView !== "beranda" ? initView : (saved.view || "beranda"),
          documents: saved.documents?.length ? saved.documents : seedDocuments(),
          partners: saved.partners?.length ? saved.partners : seedPartners(),
          filters: { ...EMPTY_FILTERS },
          sortKey: "endDate",
          sortDir: "asc",
          editingId: null,
          notice: "",
          selectedIds: [],
          isAnalysingSelected: false,
          aiExtractionResult: null
        };
      }
    } catch {
    }
    return {
      roleId: "STAFF",
      view: initView,
      documents: seedDocuments(),
      partners: seedPartners(),
      filters: { ...EMPTY_FILTERS },
      sortKey: "endDate",
      sortDir: "asc",
      editingId: null,
      notice: "",
      selectedIds: [],
      isAnalysingSelected: false,
      aiExtractionResult: null
    };
  }
  /* ---------------- Jembatan ke mesin ekstraksi dan OCR ---------------- */
  var ocrWorker = null, ocrProgressCb = null;
  function extractEnv() {
    return { JSZip: window.JSZip, pdfjsLib: window.pdfjsLib, document, basePath: "", ocr: ocrRecognize };
  }
  function extractCtx() {
    const L = LEADERSHIP_DIRECTORY;
    return {
      partners: state.partners,
      docs: state.documents,
      leaders: [L.rektorat.rektor, L.rektorat.wr1, L.rektorat.wr2, L.rektorat.wr3, ...L.fakultas.map((f) => ({ name: f.dekan, title: "Dekan " + f.name }))]
    };
  }
  async function ocrRecognize(src, label, onProgress) {
    if (!window.Tesseract) throw new Error("Mesin OCR tidak tersedia pada halaman ini.");
    ocrProgressCb = onProgress;
    const abs = (rel) => new URL(rel, document.baseURI).href;
    if (!ocrWorker) {
      ocrWorker = await window.Tesseract.createWorker(["ind", "eng"], 1, {
        workerPath: abs("js/ocr/worker.min.js"),
        corePath: abs("js/ocr/"),
        langPath: abs("js/ocr/lang"),
        gzip: true,
        logger: (m) => {
          if (ocrProgressCb && m.status === "recognizing text") ocrProgressCb("OCR " + Math.round((m.progress || 0) * 100) + "%", 30 + Math.round((m.progress || 0) * 50));
          else if (ocrProgressCb && m.status) ocrProgressCb("OCR: " + m.status, 20);
        }
      });
    }
    const res = await ocrWorker.recognize(src);
    return { text: res.data.text || "", confidence: res.data.confidence };
  }
  function normalizeDoc(d) {
    const doc = { ...blankNaskah(), ...d };
    if (!Array.isArray(doc.triDharma)) doc.triDharma = parseTri(String(doc.triDharma || ""));
    if (!doc.validation || !doc.validation.state) doc.validation = { state: "VALIDATED", by: "Data awal", at: "" };
    doc.provenance = doc.provenance || {};
    return doc;
  }
  function isEmptyDraft(d) {
    return !d.documentNumber && !d.title && !d.fileName && !d.partnerId && (!d.validation || d.validation.state === "DRAFT");
  }
  /* ---------------- Penyimpanan, memori, dan simulasi ---------------- */
  function pctOf(a, b) { return b ? Math.min(100, Math.round((a / b) * 1000) / 10) : 0; }
  function storageView(role) {
    const st = state.storage;
    const mode = KSDASStore.mode;
    const srv = st && st.server;
    const sim = state.simResult;
    const b = st && st.browser ? st.browser : {};
    const mem = st && st.memory ? st.memory : {};
    const canAct = role.canWrite;
    const act = (id, label, cls = "btn-subtle", write = false) => `<button type="button" id="${id}" class="${cls}" ${write && !canAct ? "disabled" : ""}>${label}</button>`;
    return `
    <h1>Penyimpanan, Storage, dan Memori</h1>
    <p class="muted">Halaman ini mendemonstrasikan bagaimana KSDAS menyimpan data, berkas, audit, dan cadangan, serta memantau pemakaian ruang dan memori. Tombol simulasi memakai data uji sendiri dan tidak menyentuh data naskah.</p>
    <section class="modebanner ${mode === "local-server" ? "m-local" : "m-browser"}" role="status">
      <b>Mode: ${mode === "local-server" ? "Server lokal (KSDAS_ITDel.exe)" : "Peramban (GitHub Pages)"}</b>
      <p>${mode === "local-server"
        ? `Data ditulis ke folder pada disk komputer ini: <code>${esc(srv ? srv.dbDir : (KSDASStore.serverInfo && KSDASStore.serverInfo.dbDir) || "ksdas_local_database")}</code>. Data tetap ada walau peramban dibersihkan.`
        : `Data disimpan di IndexedDB dan localStorage peramban ini. Data tidak dikirim ke server mana pun, dan hilang bila data situs dibersihkan. Untuk penyimpanan berbasis folder di disk, jalankan KSDAS_ITDel.exe.`}
      </p>
    </section>
    <div class="row">${act("st-refresh", "Segarkan data", "btn-primary")}
      ${mode === "browser" ? act("st-persist", "Minta penyimpanan persisten") : act("st-open-folder", "Tampilkan folder basis data")}
    </div>
    ${!st ? `<p role="status">Memuat statistik penyimpanan...</p>` : `
    <div class="cards">
      <div class="card"><h2>Kuota peramban</h2>
        ${b.quota ? `<progress max="100" value="${pctOf(b.usage, b.quota)}" aria-label="Pemakaian kuota"></progress><p><b>${esc(fmtBytes(b.usage))}</b> dari ${esc(fmtBytes(b.quota))} (${pctOf(b.usage, b.quota)}%)</p>` : `<p>Tidak tersedia pada peramban ini.</p>`}
        <p class="small">Persisten: <b>${b.persisted === true ? "Ya" : b.persisted === false ? "Belum" : "—"}</b> &middot; IndexedDB: <b>${b.idb ? "Aktif" : "Tidak tersedia"}</b></p></div>
      <div class="card"><h2>Data aplikasi</h2>
        <p><b>${st.tables[0].rows}</b> naskah, <b>${st.tables[1].rows}</b> mitra</p>
        <p class="small">Ukuran data (JSON): <b>${esc(fmtBytes(st.stateBytes))}</b><br>localStorage: <b>${esc(fmtBytes(b.localStorageBytes))}</b></p></div>
      <div class="card"><h2>Berkas lampiran</h2>
        <p><b>${st.fileCount ?? (srv ? srv.fileCount : 0)}</b> berkas</p>
        <p class="small">Total: <b>${esc(fmtBytes(st.fileBytes ?? (srv ? srv.fileBytes : 0)))}</b></p></div>
      <div class="card"><h2>Audit dan cadangan</h2>
        <p><b>${st.auditCount ?? (srv ? srv.auditCount : 0)}</b> catatan audit</p>
        <p class="small"><b>${st.backupCount ?? (srv ? srv.backupCount : 0)}</b> cadangan</p></div>
      <div class="card"><h2>Memori ${mode === "local-server" ? "(proses server)" : "(peramban)"}</h2>
        ${srv && srv.workingSetBytes != null ? `<p>Working set: <b>${esc(fmtBytes(srv.workingSetBytes))}</b></p><p class="small">Heap terkelola (GC): <b>${esc(fmtBytes(srv.gcBytes))}</b><br>Waktu hidup: <b>${esc(String(srv.uptimeSec))} detik</b></p>` : ""}
        ${mem.jsHeapUsed != null ? `<progress max="100" value="${pctOf(mem.jsHeapUsed, mem.jsHeapLimit)}" aria-label="Heap JavaScript"></progress><p>Heap JS: <b>${esc(fmtBytes(mem.jsHeapUsed))}</b> dari batas ${esc(fmtBytes(mem.jsHeapLimit))}</p>` : `<p class="small">Pengukuran heap JS hanya tersedia di peramban berbasis Chromium.</p>`}
        ${mem.deviceMemoryGB ? `<p class="small">Perkiraan RAM perangkat: ${mem.deviceMemoryGB} GB</p>` : ""}
        <p class="small">Memori simulasi aktif: <b>${mem.simulatedMB || 0} MB</b></p></div>
      ${srv ? `<div class="card"><h2>Disk komputer</h2>
        <progress max="100" value="${pctOf(srv.diskTotalBytes - srv.diskFreeBytes, srv.diskTotalBytes)}" aria-label="Pemakaian disk"></progress>
        <p>Kosong <b>${esc(fmtBytes(srv.diskFreeBytes))}</b> dari ${esc(fmtBytes(srv.diskTotalBytes))}</p>
        <p class="small">Folder basis data: <b>${esc(fmtBytes(srv.dbBytes))}</b></p></div>` : ""}
    </div>

    <section><h2>Tabel basis data</h2>
      <div class="tablewrap"><table><caption class="sr">Tabel basis data dan ukurannya</caption>
        <thead><tr><th scope="col">Tabel</th><th scope="col">Baris</th><th scope="col">Ukuran data</th>${srv ? '<th scope="col">Berkas di disk</th>' : ""}</tr></thead>
        <tbody>${st.tables.map((t) => {
          const f = srv && srv.tables ? srv.tables.find((x) => x.name === t.name) : null;
          return `<tr><td><code>${esc(t.name)}</code></td><td>${t.rows}</td><td>${esc(fmtBytes(t.bytes))}</td>${srv ? `<td>${f ? esc(f.path) + " (" + esc(fmtBytes(f.bytes)) + ")" : "belum ditulis"}</td>` : ""}</tr>`;
        }).join("")}</tbody></table></div>
      ${srv && srv.tree ? `<details><summary>Isi folder basis data (${srv.tree.length} entri)</summary><ul class="tree">${srv.tree.map((e) => `<li><code>${esc(e.path)}</code> ${e.dir ? "" : "(" + esc(fmtBytes(e.bytes)) + ")"}</li>`).join("")}</ul></details>` : ""}
    </section>`}

    <section><h2>Simulasi tulis dan baca</h2>
      <p class="muted">Menulis sejumlah rekaman uji ke ${mode === "local-server" ? "disk lewat server lokal" : "IndexedDB"}, membacanya kembali, lalu mengukur waktu. Hasil bergantung pada perangkat.</p>
      <div class="row">
        <label>Jumlah rekaman <input id="sim-count" type="number" min="1" max="5000" value="${esc(String(state.simCount || 200))}"></label>
        <label>Ukuran per rekaman (KB) <input id="sim-kb" type="number" min="1" max="256" value="${esc(String(state.simKb || 4))}"></label>
        ${act("st-sim-io", "Jalankan simulasi", "btn-primary")}
        ${act("st-sim-clear", "Bersihkan data simulasi")}
      </div>
      ${state.simBusy ? `<p role="status">Menjalankan simulasi...</p>` : ""}
      ${sim ? `<div class="tablewrap"><table><caption class="sr">Hasil simulasi tulis dan baca</caption><thead><tr><th scope="col">Rekaman</th><th scope="col">Total data</th><th scope="col">Waktu tulis</th><th scope="col">Waktu baca</th><th scope="col">Laju tulis</th></tr></thead>
        <tbody><tr><td>${sim.count} &times; ${sim.kb} KB</td><td>${esc(fmtBytes(sim.bytes))}</td><td>${sim.writeMs} ms${sim.serverWriteMs != null ? ` (server ${sim.serverWriteMs} ms)` : ""}</td><td>${sim.readMs} ms</td><td>${sim.writeMs ? (sim.bytes / 1048576 / (sim.writeMs / 1000)).toFixed(1) : "—"} MB/dtk</td></tr></tbody></table></div>` : ""}
    </section>

    <section><h2>Simulasi memori</h2>
      <p class="muted">Mengalokasikan blok memori di ${mode === "local-server" ? "peramban yang menampilkan antarmuka" : "peramban ini"} untuk menunjukkan beda memori kerja (RAM, hilang saat ditutup) dan penyimpanan (disk, tetap ada).</p>
      <div class="row">
        <label>Alokasi (MB) <input id="mem-mb" type="number" min="1" max="256" value="${esc(String(state.memMb || 32))}"></label>
        ${act("st-mem-alloc", "Alokasikan", "btn-primary")}
        ${act("st-mem-release", "Lepaskan")}
      </div>
      ${state.memNote ? `<p role="status">${esc(state.memNote)}</p>` : ""}
    </section>

    <section><h2>Cadangan dan pemulihan</h2>
      <div class="row">
        ${act("st-backup", "Buat cadangan sekarang", "btn-primary", true)}
        ${act("st-drill", "Uji pemulihan (tidak mengubah data)")}
        ${act("st-export", "Ekspor JSON")}
        <label class="btn-subtle filebtn ${canAct ? "" : "dis"}">Impor JSON<input id="st-import" type="file" accept=".json,application/json" hidden ${canAct ? "" : "disabled"}></label>
      </div>
      ${state.drillNote ? `<p role="status" class="${state.drillOk ? "ok" : "bad"}">${esc(state.drillNote)}</p>` : ""}
      ${(state.backups || []).length ? `<div class="tablewrap"><table><caption class="sr">Daftar cadangan</caption><thead><tr><th scope="col">Nama</th><th scope="col">Waktu</th><th scope="col">Ukuran</th><th scope="col">Naskah</th><th scope="col">SHA-256</th><th scope="col"><span class="sr">Aksi</span></th></tr></thead>
        <tbody>${state.backups.slice(0, 10).map((x) => `<tr><td>${esc(x.name)}</td><td>${esc((x.at || "").slice(0, 19).replace("T", " "))}</td><td>${esc(fmtBytes(x.bytes))}</td><td>${x.documents ?? "—"}</td><td><code>${esc((x.sha256 || "").slice(0, 10))}</code></td>
          <td>${canAct ? `<button type="button" class="link" data-restore="${esc(x.name)}">Pulihkan</button>` : ""}</td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">Belum ada cadangan.</p>`}
    </section>

    <section><h2>Catatan audit terbaru</h2>
      ${(state.auditItems || []).length ? `<div class="tablewrap"><table><caption class="sr">Catatan audit</caption><thead><tr><th scope="col">Waktu</th><th scope="col">Pelaku</th><th scope="col">Aksi</th><th scope="col">Objek</th><th scope="col">Rincian</th></tr></thead>
        <tbody>${state.auditItems.slice(0, 20).map((x) => `<tr><td>${esc((x.at || "").slice(0, 19).replace("T", " "))}</td><td>${esc(x.actor || "")}</td><td>${esc(x.action || "")}</td><td>${esc(x.target || "")}</td><td>${esc(x.detail || "")}</td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">Belum ada catatan audit.</p>`}
    </section>
    <p class="muted small">Penyimpanan ini adalah prototipe. Basis data, penyimpanan berkas, dan cadangan produksi ditentukan SDI/TSI/DukTek. Lihat dokumen Runbook Integrasi.</p>`;
  }
  async function refreshStorage(rerender = true) {
    try {
      state.storage = await KSDASStore.stats(state);
      state.backups = await KSDASStore.listBackups().catch(() => []);
      state.auditItems = await KSDASStore.listAudit(30).catch(() => []);
    } catch (e) {
      state.notice = "Gagal membaca statistik penyimpanan: " + String(e && e.message || e);
    }
    if (rerender && state.view === "penyimpanan") render();
  }
  var state = load();
  state.documents = state.documents.map(normalizeDoc);
  seedAudit();
  function save() {
    state.documents = state.documents.filter((d) => !isEmptyDraft(d) || d.id === state.editingId);
    const snap = { roleId: state.roleId, documents: state.documents, partners: state.partners, savedAt: new Date().toISOString() };
    try {
      localStorage.setItem(KEY, JSON.stringify(snap));
    } catch (e) {
      state.notice = "Cache peramban penuh. Data tetap disimpan di penyimpanan utama (IndexedDB atau disk).";
    }
    KSDASStore.saveState(state);
  }
  function esc(value) {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  }
  function render() {
    const root = document.getElementById("app");
    if (!root) return;
    const role = roleById(state.roleId);
    const visible = scopeDocuments(state.documents, role);
    const nav = [
      ["beranda", "Beranda"],
      ["naskah", "Naskah"],
      ...role.canWrite ? [["entri", "Catat"]] : [],
      ...role.canImport ? [["impor", "Impor tabel"]] : [],
      ["relasi", "Relasi"],
      ["analisis", "Analisis"],
      ["spmi", "SPMI & AMI"],
      ["struktur", "Struktur & Pejabat"],
      ["penyimpanan", "Penyimpanan & Memori"],
      ["panduan", "Panduan"]
    ];
    root.innerHTML = `
    <div class="shell">
      <aside>
        <p class="mark">KSDAS</p>
        <p class="sub">Institut Teknologi Del</p>
        ${nav.map(([id, label]) => `<button data-view="${id}" class="${state.view === id ? "on" : ""}">${label}</button>`).join("")}
        <div style="margin: 0.9rem 0; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.15);">
          <a href="https://github.com/samuelhtampubolon/ksdas-itdel/raw/main/KSDAS_ITDel.exe" download="KSDAS_ITDel.exe" class="btn-download-exe" style="width:100%; box-sizing:border-box; justify-content:center; text-align:center;" title="Unduh Program Desktop Portabel Windows">
            ⬇️ Unduh Aplikasi .EXE
          </a>
        </div>
        <p class="foot">Sistem Informasi Kerja Sama IT Del &bull; Server Intranet / Standalone</p>
      </aside>
      <div>
        <header style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.6rem;">
          <label>Peran tampilan
            <select id="role">${ROLES.map((item) => `<option value="${item.id}" ${item.id === role.id ? "selected" : ""}>${esc(item.name)}</option>`).join("")}</select>
          </label>
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <a href="https://github.com/samuelhtampubolon/ksdas-itdel/raw/main/KSDAS_ITDel.exe" download="KSDAS_ITDel.exe" class="btn-download-exe" title="Unduh Biner Desktop Standalone Windows (.EXE)">
              ⬇️ Unduh KSDAS_ITDel.exe (Desktop)
            </a>
          </div>
        </header>
        <main>
          <p class="muted">${esc(role.detail)}. Pengganti peran ini hanya untuk pengujian, bukan SSO.</p>
          ${state.notice ? `<p class="note">${esc(state.notice)}</p>` : ""}
          ${body(role, visible)}
        </main>
      </div>
    </div>`;
    wire(role);
  }
  function body(role, visible) {
    if (state.view === "naskah") return tableView(role, visible);
    if (state.view === "entri") return entryView(role);
    if (state.view === "impor") return importView();
    if (state.view === "relasi") return relationView(visible);
    if (state.view === "analisis") return analysisView(role);
    if (state.view === "spmi") return spmiView(role, visible);
    if (state.view === "struktur") return structureView();
    if (state.view === "penyimpanan") return storageView(role);
    if (state.view === "panduan") return guideView();
    const gaps = followUpGaps(state.documents).filter((gap) => visible.some((doc) => doc.id === gap.documentId));
    const attention = visible.filter((doc) => ["AKAN_BERAKHIR", "BERAKHIR"].includes(displayStatus(doc)) || missingFields(doc).length);
    return `
    <h1>Pencatatan kerja sama</h1>
    <p class="muted">Sistem Informasi Manajemen Kerja Sama Institut Teknologi Del. Dokumen tersimpan aman di server intranet kampus atau basis data terstruktur lokal portabel.</p>
    <div class="download-exe-banner">
      <h3>💻 Aplikasi Desktop Standalone Windows (.EXE)</h3>
      <p>Jalankan KSDAS langsung di laptop atau PC Windows tanpa perlu web server atau koneksi internet. Saat dijalankan atau di-install, aplikasi langsung membangun sistem basis data terstruktur dan terintegrasi di komputer lokal Anda.</p>
      <div class="download-btn-group">
        <a href="https://github.com/samuelhtampubolon/ksdas-itdel/raw/main/KSDAS_ITDel.exe" download="KSDAS_ITDel.exe" class="btn-download-exe">
          ⬇️ Unduh KSDAS_ITDel.exe (Langsung dari GitHub)
        </a>
        <a href="KSDAS_ITDel.exe" download="KSDAS_ITDel.exe" class="btn-subtle" style="font-size:0.85rem; padding:0.4rem 0.8rem; text-decoration:none;">
          ⬇️ Unduh dari Server Lokal/Pages
        </a>
        <a href="https://github.com/samuelhtampubolon/ksdas-itdel" target="_blank" class="btn-subtle" style="font-size:0.85rem; padding:0.4rem 0.8rem; text-decoration:none;">
          🌐 Halaman Repositori GitHub
        </a>
      </div>
    </div>
    <div class="stats">
      <div><span>Naskah terlihat</span><strong>${visible.length}</strong></div>
      <div><span>Masih aktif</span><strong>${visible.filter((d) => displayStatus(d) === "AKTIF").length}</strong></div>
      <div><span>Perlu perhatian</span><strong>${attention.length}</strong></div>
      <div><span>Tindak lanjut</span><strong>${gaps.length}</strong></div>
    </div>
    <section><h2>Yang perlu diperhatikan</h2>
      ${attention.length ? `<ul>${attention.slice(0, 8).map((doc) => `<li><b>${esc(doc.documentNumber)}</b> ${esc(doc.title)} <em>${STATUS_LABEL[displayStatus(doc)]}</em></li>`).join("")}</ul>` : `<p>Tidak ada pada lingkup ini.</p>`}
    </section>
    <section><h2>Tindak lanjut, bukan penilaian mutu</h2>
      ${gaps.length ? `<ul>${gaps.slice(0, 8).map((gap) => `<li>${esc(gap.message)}</li>`).join("")}</ul>` : `<p>Tidak ada kesenjangan relasi.</p>`}
    </section>`;
  }
  function tableView(role, visible) {
    const rows = sortDocuments(filterDocuments(state.documents, state.filters, role, state.partners), state.sortKey, state.sortDir, state.partners);
    const years = [...new Set(visible.map((d) => (d.startDate || "").slice(0, 4)).filter(Boolean))].sort();
    const hasSelection = state.selectedIds && state.selectedIds.length > 0;
    const allChecked = rows.length > 0 && rows.every((r) => state.selectedIds.includes(r.id));
    return `
    <h1>Naskah Kerja Sama</h1>
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
      <p class="muted" style="margin:0;">${rows.length} baris naskah pada lingkup ini. Cari, saring, urutkan kolom, pilih naskah, lalu unduh atau buat analisis.</p>
      <a href="https://github.com/samuelhtampubolon/ksdas-itdel/raw/main/KSDAS_ITDel.exe" download="KSDAS_ITDel.exe" class="btn-download-exe" style="font-size:0.8rem; padding:0.3rem 0.65rem;" title="Unduh Aplikasi Desktop Windows (.EXE)">
        ⬇️ Unduh KSDAS_ITDel.exe (Desktop)
      </a>
    </div>
    <div class="row">
      <input id="q" placeholder="Cari nomor dokumen, judul, mitra, PIC..." value="${esc(state.filters.q)}" />
      <select id="year"><option value="">Semua tahun</option>${years.map((y) => `<option ${state.filters.year === y ? "selected" : ""}>${y}</option>`).join("")}</select>
      <select id="kind"><option value="">Semua jenis</option>${Object.keys(TYPE_LABEL).map((t) => `<option value="${t}" ${state.filters.documentType === t ? "selected" : ""}>${TYPE_LABEL[t]}</option>`).join("")}</select>
      <select id="status-filter">
        <option value="">Semua status</option>
        <option value="AKTIF" ${state.filters.status === "AKTIF" ? "selected" : ""}>Aktif</option>
        <option value="AKAN_BERAKHIR" ${state.filters.status === "AKAN_BERAKHIR" ? "selected" : ""}>Akan berakhir (\u2264 180 hari)</option>
        <option value="BERAKHIR" ${state.filters.status === "BERAKHIR" ? "selected" : ""}>Berakhir</option>
        <option value="DRAFT" ${state.filters.status === "DRAFT" ? "selected" : ""}>Draf</option>
      </select>
      <button id="clear" type="button">Bersihkan</button>
      ${!hasSelection ? `
      <button id="csv" type="button">Unduh CSV</button>
      <button id="excel" type="button">Unduh Excel (.xls)</button>
      <button id="word" type="button">Unduh Word (.doc)</button>
      <button id="go-analisis" type="button" class="btn-primary">Generate Analisis</button>
      ` : ""}
    </div>
    ${hasSelection ? `
    <div class="selection-bar">
      <span><b>${state.selectedIds.length} naskah terpilih</b> dari ${rows.length} naskah di layar</span>
      <div style="display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center;">
        <button id="btn-download-sel-csv" type="button">Unduh CSV</button>
        <button id="btn-download-sel-excel" type="button">Unduh Excel (.xls)</button>
        <button id="btn-download-sel-word" type="button">Unduh Word (.doc)</button>
        <button id="btn-analisis-sel" type="button" class="btn-primary">Generate Analisis Terpilih</button>
        <button id="btn-clear-sel" type="button" class="btn-subtle">Batal Pilih</button>
      </div>
    </div>` : ""}
    ${rows.length === 0 ? `<p>Tidak ada naskah yang cocok dengan kriteria pencarian dan saringan ini.</p>` : `<div class="tablewrap"><table><thead><tr>
      <th style="width:36px; text-align:center;"><input type="checkbox" id="select-all" ${allChecked ? "checked" : ""} title="Pilih Semua Naskah di Layar" /></th>
      <th data-sort="documentNumber">Nomor</th>
      <th data-sort="title">Judul</th>
      <th data-sort="partner">Mitra</th>
      <th data-sort="status">Status</th>
      <th>Validasi</th>
      <th data-sort="endDate">Berakhir</th>
    </tr></thead><tbody>
      ${rows.map((doc) => {
        const isChecked = state.selectedIds.includes(doc.id);
        return `<tr style="${isChecked ? "background:#f4f8fc;" : ""}">
          <td style="text-align:center;"><input type="checkbox" class="doc-select" data-id="${doc.id}" ${isChecked ? "checked" : ""} /></td>
          <td><button data-open="${doc.id}" class="link">${esc(doc.documentNumber || "Tanpa nomor")}</button></td>
          <td>${esc(doc.title)}</td>
          <td>${esc(partnerName(state.partners, doc.partnerId))}</td>
          <td><b>${STATUS_LABEL[displayStatus(doc)]}</b></td>
          <td>${validationBadge(doc)}</td>
          <td>${esc(doc.endDate || "\u2014")}</td>
        </tr>`;
      }).join("")}
    </tbody></table></div>`}
    ${role.facultyId ? `<p class="muted">Fakultas terkunci: ${esc(facultyName(role.facultyId))}</p>` : ""}
    ${role.programId ? `<p class="muted">Prodi terkunci: ${esc(programName(role.programId))}</p>` : ""}`;
  }
  var VALIDATION_LABEL = {
    DRAFT: "Draf manual",
    NEEDS_REVIEW: "Perlu ditinjau",
    VALIDATED: "Tervalidasi",
    CORRECTED: "Tervalidasi (dikoreksi staf)",
    REJECTED: "Ditolak"
  };
  var VALIDATION_ICON = { DRAFT: "✎", NEEDS_REVIEW: "▲", VALIDATED: "✔", CORRECTED: "✔", REJECTED: "✖" };
  var LEVEL_TEXT = { TINGGI: "✔ Keyakinan tinggi", SEDANG: "▲ Sedang, periksa", RENDAH: "⚠ Rendah, periksa" };
  var EXTRACT_ACCEPT = ".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg,.bmp,.webp";
  function validationBadge(doc) {
    const st = doc.validation && doc.validation.state ? doc.validation.state : "VALIDATED";
    return `<span class="vbadge v-${st}">${VALIDATION_ICON[st] || ""} ${esc(VALIDATION_LABEL[st] || st)}</span>`;
  }
  function fmtBytes(n) {
    if (n == null || isNaN(n)) return "—";
    if (n < 1024) return n + " B";
    if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
    if (n < 1073741824) return (n / 1048576).toFixed(1) + " MB";
    return (n / 1073741824).toFixed(2) + " GB";
  }
  function extractedField(doc, key) {
    const f = doc.extraction && doc.extraction.fields ? doc.extraction.fields[key] : null;
    return f || null;
  }
  /** Tanda keyakinan + sumber di bawah input. Bila staf mengubah nilai, ditandai "dikoreksi". */
  function fieldNote(doc, key) {
    const f = extractedField(doc, key);
    if (!f) return "";
    const cur = key === "triDharma" ? (Array.isArray(doc.triDharma) ? doc.triDharma.join("; ") : String(doc.triDharma || "")) : String(doc[key] ?? "");
    const edited = String(f.value) !== cur;
    const where = f.sheet ? `sheet ${esc(f.sheet)}` : (f.page ? `hlm. ${f.page}` : "");
    return `<span class="fnote ${edited ? "fn-edit" : "fn-" + f.level}">${edited ? "✎ Dikoreksi staf" : LEVEL_TEXT[f.level] || ""}</span>
      <details class="fsrc"><summary>Sumber${where ? " (" + where + ")" : ""}</summary>
        <div>Metode: ${esc(f.method || "")}</div>
        <div>Kutipan: <q>${esc(f.source || "")}</q></div>
        ${f.note ? `<div>Catatan: ${esc(f.note)}</div>` : ""}
      </details>`;
  }
  function field(label, control, doc, key) {
    const f = doc && key ? extractedField(doc, key) : null;
    const cls = f ? " has-ex lv-" + f.level : "";
    return `<label class="${cls.trim()}">${label}${control}${doc && key ? fieldNote(doc, key) : ""}</label>`;
  }
  function queueDocs() {
    const ids = state.sessionIds || [];
    return ids.map((id) => state.documents.find((d) => d.id === id)).filter(Boolean);
  }
  function overallLevel(doc) {
    const ex = doc.extraction;
    if (!ex || !ex.fields) return "—";
    const lv = Object.values(ex.fields).map((f) => f.level);
    if (!lv.length) return "—";
    if (lv.includes("RENDAH")) return "Rendah";
    if (lv.includes("SEDANG")) return "Sedang";
    return "Tinggi";
  }
  function canAutoValidate(doc) {
    return doc.validation && doc.validation.state === "NEEDS_REVIEW" && !missingFields(doc).length && !dateOrderError(doc) &&
      overallLevel(doc) === "Tinggi" && !(doc.extraction.flags || []).some((f) => ["new_partner", "partner_similar", "type_conflict", "invalid_date_range", "multi_program", "faculty_program_mismatch", "low_ocr_confidence", "legacy_format"].includes(f.code));
  }
  function entryView(role) {
    const writable = role.canWrite;
    let doc = state.documents.find((item) => item.id === state.editingId) ?? null;
    if (!doc && writable) {
      doc = blankNaskah();
      state.documents = [doc, ...state.documents];
      state.editingId = doc.id;
    }
    const queue = queueDocs();
    const docTriStr = doc ? (Array.isArray(doc.triDharma) ? doc.triDharma.join("; ") : String(doc.triDharma || "")) : "";
    const suggestion = doc ? suggestParent(doc, state.documents) : null;
    const ex = doc && doc.extraction ? doc.extraction : null;
    const parentSug = ex && ex.parent ? ex.parent : null;
    const dis = writable ? "" : "disabled";
    return `
    <h1>Pencatatan Naskah</h1>
    <p class="muted">Unggah dokumen (PDF, Word, Excel, CSV, atau gambar scan). KSDAS membaca isinya dan mengisi kolom formulir sebagai <b>usulan</b>. Nilai yang tidak tertulis di dokumen sengaja dibiarkan kosong, bukan ditebak. Staf memeriksa, melengkapi yang kosong, lalu memvalidasi.</p>
    ${writable ? `
    <div id="entry-dropzone" class="dropzone" tabindex="0" role="button" aria-label="Area unggah dokumen. Tekan Enter untuk memilih berkas, atau seret berkas ke sini.">
      <div class="dz-title">Seret berkas ke sini atau pilih berkas</div>
      <p class="muted">PDF, DOCX, DOC, XLSX, XLS, CSV, TXT, PNG, JPG. Maksimal ${KSDASExtract.MAX_FILES_PER_BATCH} berkas per kelompok, 25 MB per berkas. Beberapa berkas sekaligus diproses berurutan.</p>
      <div class="btnrow">
        <label class="btn-primary filebtn">Pilih berkas dokumen
          <input id="files" type="file" multiple accept="${EXTRACT_ACCEPT}" hidden />
        </label>
        <button id="blank" type="button" class="btn-subtle">Formulir kosong</button>
        <button id="btn-toggle-ai-paste" type="button" class="btn-subtle">Tempel teks naskah</button>
      </div>
      <p class="muted small">Seluruh pemrosesan berjalan di komputer ini. Isi dokumen tidak dikirim ke layanan luar. Isi dokumen dianggap data, bukan perintah.</p>
      ${state.ocrProgress ? `
      <div class="ocr-progress-box" role="status" aria-live="polite">
        <div style="display:flex; justify-content:space-between; font-weight:600;">
          <span id="ocr-progress-status">${esc(state.ocrProgress.status)}</span>
          <span id="ocr-progress-pct">${state.ocrProgress.percent}%</span>
        </div>
        <div class="ocr-progress-bar"><div id="ocr-progress-fill" class="ocr-progress-fill" style="width:${state.ocrProgress.percent}%;"></div></div>
      </div>` : ""}
      <div id="ai-paste-box" style="display:none; margin-top:0.6rem;">
        <label for="ai-ocr-text">Teks naskah</label>
        <textarea id="ai-ocr-text" rows="5" placeholder="Tempelkan teks naskah kerja sama (MoU/PKS/IA) di sini."></textarea>
        <div class="btnrow"><button id="btn-run-ai-extract" type="button" class="btn-primary">Ekstrak dari teks</button></div>
      </div>
      <details class="samples"><summary>Dokumen uji (data fiktif) untuk mencoba</summary>
        <ul>
          ${["MoU_ITDel_Samosir_2026.docx", "PKS_FTI_DanauNusaTeknik_2025.docx", "IA_Magang_DanauNusaTeknik_2025.pdf", "Lembar_Isian_PKS.xlsx", "Daftar_Kerja_Sama.xlsx", "Scan_MoU_Contoh.png"].map((n) => `<li><a href="sample-data/uji/${n}" download>${n}</a></li>`).join("")}
        </ul>
      </details>
    </div>` : `<p class="note">Peran ini hanya dapat melihat. Unggah dan validasi dilakukan oleh Staf Unit Kerja Sama.</p>`}

    ${state.lastBatch ? `
    <section class="batchsum" aria-live="polite">
      <h2>Ringkasan kelompok terakhir</h2>
      <p><b>${state.lastBatch.ok}</b> berkas diproses, <b>${state.lastBatch.rows}</b> baris tabel dibaca, <b>${state.lastBatch.skipped.length}</b> dilewati.</p>
      ${state.lastBatch.skipped.length ? `<ul>${state.lastBatch.skipped.map((s) => `<li>${esc(s.name)}: ${esc(s.reason)}</li>`).join("")}</ul>` : ""}
    </section>` : ""}

    ${queue.length ? `
    <section class="queue">
      <div class="qhead"><h2>Antrean validasi (${queue.length})</h2>
        ${writable ? `<button id="btn-bulk-validate" type="button" class="btn-primary" ${queue.some(canAutoValidate) ? "" : "disabled"}>Validasi semua yang lengkap dan berkeyakinan tinggi (${queue.filter(canAutoValidate).length})</button>` : ""}
      </div>
      <div class="tablewrap"><table>
        <caption class="sr">Antrean naskah hasil ekstraksi yang menunggu validasi staf</caption>
        <thead><tr><th scope="col">Berkas</th><th scope="col">Jenis</th><th scope="col">Nomor</th><th scope="col">Mitra</th><th scope="col">Keyakinan</th><th scope="col">Perlu diisi manual</th><th scope="col">Validasi</th><th scope="col"><span class="sr">Aksi</span></th></tr></thead>
        <tbody>${queue.map((d) => `<tr class="${d.id === state.editingId ? "cur" : ""}">
          <td>${esc(d.fileName || "(tanpa berkas)")}</td>
          <td>${esc(typeLabel(d.documentType))}</td>
          <td>${esc(d.documentNumber || "—")}</td>
          <td>${esc(partnerName(state.partners, d.partnerId))}</td>
          <td>${esc(overallLevel(d))}</td>
          <td>${missingFields(d).length ? esc(missingFields(d).join(", ")) : "Lengkap"}</td>
          <td>${validationBadge(d)}</td>
          <td><button type="button" class="link" data-review="${d.id}">Tinjau</button></td>
        </tr>`).join("")}</tbody>
      </table></div>
    </section>` : ""}

    ${doc ? `
    <section class="review" aria-labelledby="rv-h">
      <div class="qhead">
        <h2 id="rv-h">Tinjau dan lengkapi</h2>
        <div>${validationBadge(doc)}</div>
      </div>
      ${doc.fileName ? `<p class="muted">Berkas sumber: <b>${esc(doc.fileName)}</b> (${esc(fmtBytes(doc.fileSize))})${doc.fileHash ? ` &middot; SHA-256 <code title="${esc(doc.fileHash)}">${esc(doc.fileHash.slice(0, 12))}…</code>` : ""}
        ${doc.fileRef ? ` &middot; <button type="button" class="link" id="btn-dl-original">Unduh berkas asli</button>` : ""}</p>` : ""}
      ${ex && ex.flags && ex.flags.length ? `<div class="flags" role="note"><b>Perlu perhatian:</b><ul>${ex.flags.map((f) => `<li>${esc(f.message)}</li>`).join("")}</ul></div>` : ""}
      ${ex ? `<p class="muted small">Diekstraksi ${esc(ex.at ? ex.at.slice(0, 16).replace("T", " ") : "")} &middot; ${Object.keys(ex.fields || {}).length} field terisi otomatis &middot; ${missingFields(doc).length} field wajib masih kosong.</p>` : ""}
      ${missingFields(doc).length ? `<p class="manual" role="note"><b>Perlu diisi manual:</b> ${esc(missingFields(doc).join(", "))}.</p>` : `<p class="manual ok" role="note">Seluruh field wajib sudah terisi. Periksa kesesuaiannya dengan berkas asli sebelum validasi.</p>`}
      ${parentSug ? `<p class="note">Saran induk: ${parentSug.id ? `<b>${esc(parentSug.number)}</b>` : `nomor <b>${esc(parentSug.number)}</b> (belum ada di basis data)`}. ${esc(parentSug.reason)} ${parentSug.id && doc.parentId !== parentSug.id && writable ? `<button type="button" id="use-parent-ex" class="btn-subtle">Tautkan</button>` : ""}${parentSug.id && doc.parentId === parentSug.id ? " <b>Sudah ditautkan.</b>" : ""}</p>` : ""}
      <form id="form" class="form" novalidate>
        <fieldset ${dis} class="fs">
        <legend class="sr">Data naskah</legend>
        ${field("Jenis naskah", `<select name="documentType">${["", ...Object.keys(TYPE_LABEL)].map((t) => `<option value="${t}" ${doc.documentType === t ? "selected" : ""}>${t ? TYPE_LABEL[t] : "Pilih jenis naskah"}</option>`).join("")}</select>`, doc, "documentType")}
        ${field("Nomor dokumen", `<input name="documentNumber" value="${esc(doc.documentNumber)}" placeholder="Contoh: 014/ITDel/MoU/2026" />`, doc, "documentNumber")}
        ${field("Judul naskah", `<input name="title" value="${esc(doc.title)}" placeholder="Judul kerja sama" />`, doc, "title")}
        ${field("Mitra kerja sama", `<select name="partnerId"><option value="">Pilih mitra</option>${state.partners.map((p2) => `<option value="${esc(p2.id)}" ${doc.partnerId === p2.id ? "selected" : ""}>${esc(p2.name)}${p2.draft ? " (baru, konfirmasi)" : ""}</option>`).join("")}</select>`, doc, "partnerId")}
        ${field("Tanggal tanda tangan", `<input type="date" name="signedDate" value="${esc(doc.signedDate)}" />`, doc, "signedDate")}
        ${field("Tanggal mulai berlaku", `<input type="date" name="startDate" value="${esc(doc.startDate)}" />`, doc, "startDate")}
        ${field("Tanggal berakhir", `<input type="date" name="endDate" value="${esc(doc.endDate)}" />`, doc, "endDate")}
        ${field("Status operasional", `<select name="status">${Object.keys(STATUS_LABEL).filter((k) => k !== "AKAN_BERAKHIR" && k !== "BERAKHIR").map((k) => `<option value="${k}" ${doc.status === k ? "selected" : ""}>${STATUS_LABEL[k]}</option>`).join("")}</select>`)}
        ${field("Fakultas terkait", `<select name="facultyId"><option value="">Pilih fakultas</option>${FACULTIES.map((f) => `<option value="${f.id}" ${doc.facultyId === f.id ? "selected" : ""}>${esc(f.name)}</option>`).join("")}</select>`, doc, "facultyId")}
        ${field("Program studi", `<select name="programId"><option value="">Pilih prodi</option>${PROGRAMS.map((p2) => `<option value="${p2.id}" ${doc.programId === p2.id ? "selected" : ""}>${esc(p2.name)}</option>`).join("")}</select>`, doc, "programId")}
        ${field("Tri Dharma", `<input name="triDharma" value="${esc(docTriStr)}" placeholder="PENDIDIKAN; PENELITIAN; PENGABDIAN" list="tri-list" /><datalist id="tri-list"><option value="PENDIDIKAN"><option value="PENELITIAN"><option value="PENGABDIAN"><option value="PENDIDIKAN; PENELITIAN"><option value="PENDIDIKAN; PENGABDIAN"><option value="PENELITIAN; PENGABDIAN"><option value="PENDIDIKAN; PENELITIAN; PENGABDIAN"></datalist>`, doc, "triDharma")}
        ${field("Unit pengelola", `<select name="unitId"><option value="">Pilih unit</option>${UNITS.map((u) => `<option value="${u.id}" ${doc.unitId === u.id ? "selected" : ""}>${esc(u.name)}</option>`).join("")}</select>`)}
        ${field("Nama kegiatan implementasi", `<input name="activityName" value="${esc(doc.activityName)}" placeholder="Nama kegiatan" />`, doc, "activityName")}
        ${field("Penanggung jawab (PIC)", `<input name="pic" value="${esc(doc.pic)}" placeholder="Nama PIC" />`, doc, "pic")}
        ${field("Penandatangan pihak mitra", `<input name="partnerSignatory" value="${esc(doc.partnerSignatory)}" />`, doc, "partnerSignatory")}
        ${field("Jabatan penandatangan mitra", `<input name="partnerSignatoryTitle" value="${esc(doc.partnerSignatoryTitle)}" />`, doc, "partnerSignatoryTitle")}
        ${field("Penandatangan IT Del", `<input name="itdelSignatory" value="${esc(doc.itdelSignatory)}" />`, doc, "itdelSignatory")}
        ${field("Jabatan penandatangan IT Del", `<input name="itdelSignatoryTitle" value="${esc(doc.itdelSignatoryTitle)}" />`, doc, "itdelSignatoryTitle")}
        ${field("Ruang lingkup", `<input name="scope" value="${esc(doc.scope)}" placeholder="Ruang lingkup kerja sama" />`, doc, "scope")}
        ${field("Lokasi pelaksanaan", `<input name="location" value="${esc(doc.location)}" />`, doc, "location")}
        ${field("Anggaran (bila ada)", `<input name="budget" value="${esc(doc.budget)}" placeholder="Contoh: Rp 50.000.000" />`, doc, "budget")}
        ${field("Sumber dana", `<input name="fundingSource" value="${esc(doc.fundingSource)}" placeholder="APBN, mandiri, mitra" />`, doc, "fundingSource")}
        ${field("Catatan", `<input name="notes" value="${esc(doc.notes)}" />`, doc, "notes")}
        ${suggestion ? `<p class="note" style="grid-column: 1 / -1;">Saran relasi: tautkan ke ${esc(suggestion.number)}. ${esc(suggestion.reason)} <button type="button" id="use-parent" class="btn-subtle">Tautkan</button></p>` : ""}
        </fieldset>
        <div class="btnrow" style="grid-column: 1 / -1;">
          ${writable ? `<button type="submit" id="btn-save" class="btn-subtle" data-act="save">Simpan sebagai draf</button>
          <button type="submit" id="btn-validate" class="btn-primary" data-act="validate">Validasi dan aktifkan</button>
          <button type="button" id="btn-reject" class="btn-subtle">Tolak naskah ini</button>` : ""}
        </div>
      </form>
    </section>` : ""}`;
  }
  function importView() {
    return `
    <h1>Impor & Migrasi Data Kemitraan</h1>
    <p class="muted">Fasilitas pemindahan data dari Google Sheets, Microsoft OneDrive, dan Notion ke server lokal intranet IT Del. Kolom dipetakan secara deterministik. Data baru langsung tercatat di basis data lokal.</p>
    <div style="display:flex; gap:0.6rem; flex-wrap:wrap; align-items:center; margin-bottom: 0.8rem;">
      <label class="drop" style="margin:0; cursor:pointer;">
        Pilih berkas Spreadsheet (XLSX / CSV / TSV / TXT)
        <input id="import-file" type="file" accept=".xlsx,.csv,.tsv,.txt" style="display:none;" />
      </label>
      <button id="template" type="button">Unduh template CSV</button>
    </div>
    <section style="margin: 0.8rem 0; padding: 0.8rem 1rem;">
      <h2>Panduan Cepat Migrasi Data ke Server Lokal KSDAS:</h2>
      <ul>
        <li><b>Dari Google Sheets:</b> Buka dokumen Sheet naskah &rarr; Menu <i>File</i> &rarr; <i>Download</i> &rarr; <i>Comma-separated values (.csv)</i> &rarr; Klik tombol "Pilih berkas Spreadsheet" di atas. Atau cukup blok tabel data di Google Sheets &rarr; Salin (Ctrl+C) &rarr; Tempel di kotak di bawah &rarr; Klik "Baca tempelan".</li>
        <li><b>Dari Microsoft OneDrive / Office 365:</b> Buka Excel di browser OneDrive &rarr; Menu <i>File</i> &rarr; <i>Save As / Export</i> &rarr; <i>Download a copy (.csv)</i> &rarr; Unggah ke form di atas, atau blok range tabel lalu tempel.</li>
        <li><b>Dari Notion:</b> Buka Notion Database Kerja Sama &rarr; Klik menu titik tiga (...) di pojok kanan atas &rarr; Pilih <i>Export</i> &rarr; Format <i>Markdown & CSV</i> &rarr; Buka berkas CSV hasil unduhan atau tempel isinya di bawah.</li>
      </ul>
    </section>
    <textarea id="paste" rows="8" placeholder="Atau tempel tabel baris-kolom dari Google Sheets, OneDrive Excel, atau Notion di sini..."></textarea>
    <button id="read" type="button">Baca tempelan</button>
    <div id="preview"></div>`;
  }
  function relationView(visible) {
    const blocks = state.partners.map((partner) => {
      const docs = visible.filter((d) => d.partnerId === partner.id);
      if (!docs.length) return "";
      const ids = new Set(docs.map((d) => d.id));
      const roots = docs.filter((d) => !d.parentId || !ids.has(d.parentId));
      const draw = (doc) => {
        const children = docs.filter((item) => item.parentId === doc.id);
        return `<li><b>${esc(typeLabel(doc.documentType))}</b> ${esc(doc.documentNumber)} \u2014 ${esc(doc.title)}${children.length ? `<ul>${children.map(draw).join("")}</ul>` : ""}</li>`;
      };
      return `<section><h2>${esc(partner.name)}</h2><ul>${roots.map(draw).join("")}</ul></section>`;
    }).join("");
    return `<h1>Relasi</h1>${blocks || "<p>Tidak ada naskah pada lingkup ini.</p>"}`;
  }
  function analysisView(role) {
    const isSelectedScope = state.isAnalysingSelected && state.selectedIds.length > 0;
    const rows = isSelectedScope
      ? state.documents.filter((d) => state.selectedIds.includes(d.id))
      : filterDocuments(state.documents, state.filters, role, state.partners);
    const summary = analysisSummary(rows);
    return `
    <h1>Analisis Kemitraan</h1>
    <p class="muted">${isSelectedScope ? `Menampilkan analisis khusus untuk <b>${state.selectedIds.length} naskah terpilih</b>.` : `Rekapitulasi deterministik dari saringan yang aktif pada lingkup <b>${esc(role.name)}</b>.`}</p>
    ${isSelectedScope ? `<p><button id="btn-back-all-analisis" type="button" class="btn-subtle">&larr; Kembali ke Analisis Seluruh Naskah Terfilter</button></p>` : ""}
    <div class="stats">
      <div><span>Total Naskah</span><strong>${summary.total}</strong></div>
      <div><span>Masih Aktif</span><strong>${summary.shown.aktif}</strong></div>
      <div><span>Akan Berakhir</span><strong>${summary.shown.akan}</strong></div>
      <div><span>Telah Berakhir</span><strong>${summary.shown.berakhir}</strong></div>
    </div>
    <section>
      <h2>Sebaran Jenis Naskah</h2>
      <ul>${summary.byType.map((item) => `<li><b>${item.label}:</b> ${item.count} naskah (${summary.total ? Math.round(item.count / summary.total * 100) : 0}%)</li>`).join("")}</ul>
    </section>
    <section>
      <h2>Evaluasi Kesenjangan Tindak Lanjut</h2>
      ${summary.gaps.length ? `<ul>${summary.gaps.map((gap) => `<li><b>${esc(gap.message)}</b> (ID: ${esc(gap.documentId)})</li>`).join("")}</ul>` : "<p>Tidak ada kesenjangan relasi. Seluruh rantai dokumen berjalan tertib (MoU memiliki PKS, PKS memiliki IA/kegiatan).</p>"}
    </section>
    <div style="display:flex; gap:0.5rem; margin-top: 1rem; flex-wrap:wrap;">
      <button id="word-analisis" type="button" class="btn-primary">Unduh Laporan Analisis Resmi (.doc)</button>
      <button id="csv2" type="button">Unduh CSV Analisis</button>
    </div>`;
  }
  function guideView() {
    return `
    <h1>Panduan</h1>
    <section><h2>Staf</h2><p>Unggah berkas, lengkapi formulir, atau tempel tabel dari Sheets/Excel/Word. Pembaruan harian dilakukan di KSDAS, bukan di Drive atau Notion.</p></section>
    <section><h2>Dekan dan kaprodi</h2><p>Mencari, menyaring, mengurutkan, dan mengunduh data fakultas atau program studi sendiri, lalu membuat analisis.</p></section>
    <section><h2>WR3</h2><p>Melihat masa berlaku, naskah yang sudah lewat, dan tindak lanjut yang belum ada turunannya.</p></section>
    <section><h2>Server kampus</h2><p>Nama host, basis data, penyimpanan berkas, dan SSO diputuskan SDI/TSI/DukTek. Prototipe ini tidak mengarang nilai itu. Jangan unggah naskah rahasia ke demo publik.</p></section>
    <button id="reset" type="button">Kembalikan data contoh</button>`;
  }

  function spmiView(role, visible) {
    const docs = visible;
    const activeDocs = docs.filter((d) => displayStatus(d) === "AKTIF");
    const expiredDocs = docs.filter((d) => displayStatus(d) === "BERAKHIR");
    const warningDocs = docs.filter((d) => displayStatus(d) === "AKAN_BERAKHIR");
    const passiveMous = docs.filter((d) => d.documentType === "MOU_LOI" && displayStatus(d) === "AKTIF" && !state.documents.some((c) => c.parentId === d.id));
    const pksNoIa = docs.filter((d) => d.documentType === "PKS_MOA" && displayStatus(d) === "AKTIF" && !state.documents.some((c) => c.parentId === d.id));

    return `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
      <div>
        <h1 style="margin:0;">SPMI & Audit Mutu Internal (AMI) Kerja Sama</h1>
        <p class="muted" style="margin:0.25rem 0 0;">Standar Penjaminan Mutu Kemdiktisaintek (Permendikbudristek No. 53/2023), Siklus PPEPP, dan Capaian IKU 6.</p>
      </div>
      <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
        <button id="btn-export-ami-doc" type="button" class="btn-primary" style="font-size:0.85rem; padding:0.4rem 0.8rem;">📄 Unduh Lembar Hasil Audit (.doc)</button>
        <button id="btn-export-ami-csv" type="button" class="btn-subtle" style="font-size:0.85rem; padding:0.4rem 0.8rem;">📊 Unduh Matriks SPMI (.csv)</button>
      </div>
    </div>

    <!-- Banner PPEPP Kemdiktisaintek -->
    <div style="background: linear-gradient(135deg, #0d233a 0%, #1a3a5f 100%); color:#fff; border-radius:8px; padding:1.1rem 1.3rem; margin-bottom:1.2rem; box-shadow:0 3px 10px rgba(0,0,0,0.12);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.6rem;">
        <span style="font-size:0.82rem; letter-spacing:0.5px; text-transform:uppercase; background:rgba(255,255,255,0.15); padding:0.25rem 0.6rem; border-radius:12px; font-weight:600;">
          Kerangka Regulasi Kemdiktisaintek &bull; Permendikbudristek No. 53 Tahun 2023
        </span>
        <span style="font-size:0.85rem; color:#90caf9;">Status Siklus: <b>Aktif & Terkendali (Audit Internal Terjadwal)</b></span>
      </div>
      <h3 style="margin:0 0 0.4rem; font-size:1.15rem; color:#fff;">Siklus PPEPP Penjaminan Mutu Kerja Sama & Kemitraan IT Del</h3>
      <p style="margin:0; font-size:0.88rem; line-height:1.5; color:#e0e0e0;">
        Penjaminan mutu kerja sama di IT Del beroperasi melalui siklus PPEPP terpadu: Penetapan standar mutu dokumen & kriteria mitra, Pelaksanaan naskah tridharma (MoU &rarr; PKS &rarr; IA), Evaluasi berkala melalui Audit Mutu Internal (AMI) untuk mengeliminasi "MoU tidur", Pengendalian melalui Rencana Tindak Lanjut (RTL), dan Peningkatan capaian Indikator Kinerja Utama (IKU 6).
      </p>
      
      <!-- 5 Langkah Siklus PPEPP -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:0.65rem; margin-top:1rem;">
        <div style="background:rgba(255,255,255,0.1); border-radius:6px; padding:0.65rem 0.8rem; border-left:3px solid #64b5f6;">
          <b style="color:#bbdefb; font-size:0.82rem;">1. PENETAPAN (P)</b>
          <p style="margin:0.25rem 0 0; font-size:0.78rem; color:#f5f5f5;">Standar pemilihan mitra bereputasi, format baku dosir naskah, dan pakta integritas tridharma.</p>
        </div>
        <div style="background:rgba(255,255,255,0.1); border-radius:6px; padding:0.65rem 0.8rem; border-left:3px solid #81c784;">
          <b style="color:#c8e6c9; font-size:0.82rem;">2. PELAKSANAAN (P)</b>
          <p style="margin:0.25rem 0 0; font-size:0.78rem; color:#f5f5f5;">Penerbitan PKS maksimal 6 bulan setelah MoU, realisasi IA di prodi (MBKM, magang, riset).</p>
        </div>
        <div style="background:rgba(255,255,255,0.1); border-radius:6px; padding:0.65rem 0.8rem; border-left:3px solid #ffb74d;">
          <b style="color:#ffe0b2; font-size:0.82rem;">3. EVALUASI (E / AMI)</b>
          <p style="margin:0.25rem 0 0; font-size:0.78rem; color:#f5f5f5;">Audit kepatuhan naskah, identifikasi kesenjangan hierarki, deteksi naskah kedaluwarsa.</p>
        </div>
        <div style="background:rgba(255,255,255,0.1); border-radius:6px; padding:0.65rem 0.8rem; border-left:3px solid #e57373;">
          <b style="color:#ffcdd2; font-size:0.82rem;">4. PENGENDALIAN (P / RTL)</b>
          <p style="margin:0.25rem 0 0; font-size:0.78rem; color:#f5f5f5;">Penerbitan Rencana Tindak Lanjut (RTL), adendum perpanjangan, atau penghentian naskah pasif.</p>
        </div>
        <div style="background:rgba(255,255,255,0.1); border-radius:6px; padding:0.65rem 0.8rem; border-left:3px solid #ba68c8;">
          <b style="color:#e1bee7; font-size:0.82rem;">5. PENINGKATAN (P)</b>
          <p style="margin:0.25rem 0 0; font-size:0.78rem; color:#f5f5f5;">Peningkatan kualitas mitra ke skala dunia/industri top, hilirisasi paten, pelaporan LaporKerma.</p>
        </div>
      </div>
    </div>

    <!-- Kartu Statistik Indikator Mutu -->
    <div class="stats" style="margin-bottom:1.2rem;">
      <div><span>Total Naskah Teraudit</span><strong>${docs.length}</strong></div>
      <div><span>Naskah Aktif & Patuh</span><strong style="color:#107c41;">${activeDocs.length}</strong></div>
      <div><span>MoU Pasif / "Tidur"</span><strong style="color:#d9534f;">${passiveMous.length}</strong></div>
      <div><span>PKS Belum Ada IA</span><strong style="color:#f0ad4e;">${pksNoIa.length}</strong></div>
    </div>

    <!-- Capaian IKU 6 Kemdiktisaintek Per Fakultas & Prodi -->
    <section style="margin-bottom:1.2rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.6rem;">
        <h2 style="margin:0; font-size:1.05rem;">🎯 Capaian IKU 6 Kemdiktisaintek (Kemitraan Program Studi)</h2>
        <span style="font-size:0.8rem; background:#e8f4fd; color:#0d47a1; padding:0.2rem 0.55rem; border-radius:10px; font-weight:600;">
          Target: Seluruh 9 Prodi Memiliki Kemitraan Aktif dengan Mitra Bereputasi
        </span>
      </div>
      <p class="muted" style="font-size:0.85rem; margin:0 0 0.6rem;">
        Indikator Kinerja Utama 6 mewajibkan program studi memiliki kemitraan dengan mitra kelas dunia (perusahaan multinasional, BUMN, perguruan tinggi top, atau instansi pemerintah) yang menghasilkan kurikulum bersama, magang bersertifikat, atau riset kolaboratif.
      </p>
      
      <div class="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Fakultas / Program Studi</th>
              <th>Pimpinan Penanggung Jawab</th>
              <th style="text-align:center;">Total Naskah</th>
              <th style="text-align:center;">Naskah Aktif</th>
              <th style="text-align:center;">Mitra Industri / BUMN</th>
              <th>Status Evaluasi IKU 6</th>
            </tr>
          </thead>
          <tbody>
            ${FACULTIES.map((f) => {
              const fDocs = docs.filter((d) => d.facultyId === f.id);
              const fActive = fDocs.filter((d) => displayStatus(d) === "AKTIF").length;
              const fMitraInd = fDocs.filter((d) => {
                const p = state.partners.find((x) => x.id === d.partnerId);
                return p && (p.type === "SWASTA" || p.type === "BUMN");
              }).length;
              const fProdis = PROGRAMS.filter((p) => p.facultyId === f.id);
              return `
              <tr style="background:#f4f7fb; font-weight:600;">
                <td><b>${f.id}</b> — ${esc(f.name)}</td>
                <td>${esc(f.dekan || "Dekan")}</td>
                <td style="text-align:center;">${fDocs.length}</td>
                <td style="text-align:center; color:#107c41;">${fActive}</td>
                <td style="text-align:center;">${fMitraInd}</td>
                <td><span class="badge-status status-aktif" style="font-size:0.75rem;">${fDocs.length > 0 ? "✓ Terpenuhi" : "Perlu Percepatan"}</span></td>
              </tr>
              ` + fProdis.map((pr) => {
                const prDocs = docs.filter((d) => d.programId === pr.id);
                const prActive = prDocs.filter((d) => displayStatus(d) === "AKTIF").length;
                const prMitraInd = prDocs.filter((d) => {
                  const p = state.partners.find((x) => x.id === d.partnerId);
                  return p && (p.type === "SWASTA" || p.type === "BUMN");
                }).length;
                return `
                <tr style="font-size:0.85rem;">
                  <td style="padding-left:1.5rem;">&bull; <b>${esc(pr.name)}</b> (${pr.id})</td>
                  <td class="muted">Kaprodi ${pr.id}</td>
                  <td style="text-align:center;">${prDocs.length}</td>
                  <td style="text-align:center;">${prActive}</td>
                  <td style="text-align:center;">${prMitraInd}</td>
                  <td>${prDocs.length >= 1 ? `<span style="color:#107c41; font-weight:600;">✓ Kemitraan Aktif (${prActive})</span>` : `<span style="color:#d9534f; font-weight:600;">⚠️ Belum Ada Naskah</span>`}</td>
                </tr>`;
              }).join("");
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Matriks Temuan Audit Mutu Internal (AMI) -->
    <section>
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.6rem;">
        <h2 style="margin:0; font-size:1.05rem;">📋 Matriks Temuan Audit & Rencana Tindak Lanjut (RTL)</h2>
        <span class="muted" style="font-size:0.82rem;">Klasifikasi Temuan: KTS Mayor, KTS Minor, Observasi (OB), dan Sesuai</span>
      </div>

      <div class="tablewrap">
        <table>
          <thead>
            <tr>
              <th>No. Dokumen</th>
              <th>Judul Naskah & Mitra</th>
              <th>Jenis</th>
              <th>Masa Berlaku</th>
              <th>Klasifikasi Temuan AMI</th>
              <th>Rekomendasi Tindak Lanjut SPMI</th>
            </tr>
          </thead>
          <tbody>
            ${docs.map((d) => {
              const st = displayStatus(d);
              const p = partnerName(state.partners, d.partnerId);
              const hasChild = state.documents.some((c) => c.parentId === d.id);
              let badgeColor = "#107c41";
              let badgeLabel = "Sesuai Standar";
              let rec = "Pertahankan dan lanjutkan implementasi Tri Dharma perguruan tinggi.";

              if (st === "BERAKHIR") {
                badgeColor = "#d9534f";
                badgeLabel = "KTS Minor: Kedaluwarsa";
                rec = "Lakukan evaluasi manfaat kerja sama. Jika masih strategis, ajukan perpanjangan/adendum. Jika selesai, arsipkan secara resmi.";
              } else if (st === "AKAN_BERAKHIR") {
                badgeColor = "#f0ad4e";
                badgeLabel = "Observasi: Segera Berakhir";
                rec = "Kirim surat permohonan perpanjangan kepada mitra kerja sama dalam kurun waktu 30 hari.";
              } else if (d.documentType === "MOU_LOI" && !hasChild) {
                badgeColor = "#d9534f";
                badgeLabel = "KTS Minor: MoU Pasif / Tidur";
                rec = "MoU belum memiliki turunan PKS. Dekan dan Kaprodi wajib menginisiasi draf PKS teknis bersama mitra.";
              } else if (d.documentType === "PKS_MOA" && !hasChild) {
                badgeColor = "#f0ad4e";
                badgeLabel = "Observasi: PKS Belum Ada IA";
                rec = "Terbitkan Implementation Arrangement (IA) atau surat tugas pelaksanaan kegiatan mahasiswa/dosen.";
              }

              return `
              <tr>
                <td style="font-weight:600; font-size:0.85rem;">${esc(d.documentNumber)}</td>
                <td>
                  <div style="font-weight:600;">${esc(d.title)}</div>
                  <div class="muted" style="font-size:0.8rem;">Mitra: ${esc(p)} | Fakultas: ${esc(facultyName(d.facultyId))}</div>
                </td>
                <td><span class="tag">${esc(typeLabel(d.documentType))}</span></td>
                <td style="font-size:0.82rem;">${esc(d.startDate || "-")} s.d. ${esc(d.endDate || "-")}</td>
                <td>
                  <span style="display:inline-block; font-size:0.75rem; font-weight:700; color:#fff; background:${badgeColor}; padding:0.2rem 0.5rem; border-radius:4px;">
                    ${badgeLabel}
                  </span>
                </td>
                <td style="font-size:0.83rem;">${rec}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>`;
  }

  function structureView() {
    const dir = LEADERSHIP_DIRECTORY;
    return `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
      <div>
        <h1 style="margin:0;">Struktur Organisasi & Pejabat Pimpinan IT Del</h1>
        <p class="muted" style="margin:0.25rem 0 0;">Daftar Lengkap Nama Pejabat Pimpinan Terkini (2025–2026), 4 Fakultas, 9 Program Studi, dan Tata Kelola Biro Kerja Sama.</p>
      </div>
      <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
        <a href="#spmi" class="btn-primary" style="font-size:0.85rem; padding:0.4rem 0.8rem; text-decoration:none;">⚖️ Dasbor SPMI & AMI Kemdiktisaintek</a>
      </div>
    </div>

    <!-- Bagan Yayasan Del & Rektorat -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1rem; margin-bottom:1.2rem;">
      <!-- Kartu Yayasan Del -->
      <div style="background:#fff; border:1px solid #d2d6dc; border-radius:8px; padding:1.1rem; box-shadow:0 1px 4px rgba(0,0,0,0.05); border-top:4px solid #1a3a5f;">
        <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px; font-weight:700; color:#0d233a;">Badan Penyelenggara</span>
        <h3 style="margin:0.2rem 0 0.6rem; color:#0d233a; font-size:1.1rem;">Yayasan Del</h3>
        <p style="margin:0 0 0.35rem; font-size:0.88rem;"><b>Pembina:</b> ${esc(dir.yayasan.pembina)}</p>
        <p style="margin:0; font-size:0.88rem;"><b>Pengurus:</b> ${esc(dir.yayasan.pengurus)}</p>
        <div style="margin-top:0.75rem; padding-top:0.6rem; border-top:1px dashed #e2e8f0; font-size:0.8rem; color:#64748b;">
          Memberikan arahan strategis pengembangan institusi, kemitraan strategis nasional/internasional, dan fasilitas kampus.
        </div>
      </div>

      <!-- Kartu Rektor IT Del -->
      <div style="background:#fff; border:1px solid #d2d6dc; border-radius:8px; padding:1.1rem; box-shadow:0 1px 4px rgba(0,0,0,0.05); border-top:4px solid #107c41;">
        <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px; font-weight:700; color:#107c41;">Pimpinan Tertinggi IT Del</span>
        <h3 style="margin:0.2rem 0 0.4rem; color:#0f5132; font-size:1.1rem;">${esc(dir.rektorat.rektor.name)}</h3>
        <p style="margin:0 0 0.2rem; font-size:0.88rem; font-weight:600;">${esc(dir.rektorat.rektor.title)}</p>
        <p style="margin:0; font-size:0.82rem; color:#64748b;">Periode Jabatan: <b>${esc(dir.rektorat.rektor.period)}</b></p>
        <div style="margin-top:0.75rem; padding-top:0.6rem; border-top:1px dashed #e2e8f0; font-size:0.8rem; color:#64748b;">
          Penanggung jawab umum institusi dan penandatangan utama Nota Kesepahaman (MoU / LOI) antar perguruan tinggi, industri, dan kementerian.
        </div>
      </div>
    </div>

    <!-- Tiga Wakil Rektor IT Del -->
    <h2 style="font-size:1.05rem; margin:1rem 0 0.6rem; color:#0d233a;">🏛️ Jajaran Wakil Rektor Institut Teknologi Del (2025–2026)</h2>
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1rem; margin-bottom:1.2rem;">
      <div style="background:#fff; border:1px solid #d2d6dc; border-radius:8px; padding:1rem; box-shadow:0 1px 3px rgba(0,0,0,0.04); border-left:4px solid #0284c7;">
        <b style="color:#0369a1; font-size:0.82rem;">WAKIL REKTOR I (AKADEMIK & KEMAHASISWAAN)</b>
        <h4 style="margin:0.25rem 0 0.35rem; font-size:1rem; color:#0f172a;">${esc(dir.rektorat.wr1.name)}</h4>
        <p style="margin:0; font-size:0.82rem; color:#475569;">
          Mengkoordinasikan implementasi kurikulum kerja sama, program Merdeka Belajar Kampus Merdeka (MBKM), magang bersertifikat, dan pertukaran mahasiswa.
        </p>
      </div>

      <div style="background:#fff; border:1px solid #d2d6dc; border-radius:8px; padding:1rem; box-shadow:0 1px 3px rgba(0,0,0,0.04); border-left:4px solid #059669;">
        <b style="color:#047857; font-size:0.82rem;">WAKIL REKTOR II (KEUANGAN & SUMBER DAYA)</b>
        <h4 style="margin:0.25rem 0 0.35rem; font-size:1rem; color:#0f172a;">${esc(dir.rektorat.wr2.name)}</h4>
        <p style="margin:0; font-size:0.82rem; color:#475569;">
          Mengelola tata kelola anggaran naskah kerja sama, sarana dan prasarana laboratorium bersama mitra industri, serta sumber daya manusia pendukung.
        </p>
      </div>

      <div style="background:#fff; border:1px solid #d2d6dc; border-radius:8px; padding:1rem; box-shadow:0 1px 3px rgba(0,0,0,0.04); border-left:4px solid #d97706; background:#fffcf5;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <b style="color:#b45309; font-size:0.82rem;">WAKIL REKTOR III (KEMITRAAN & INOVASI)</b>
          <span style="font-size:0.7rem; background:#fef3c7; color:#92400e; padding:0.15rem 0.45rem; border-radius:6px; font-weight:700;">Penanggung Jawab Kemitraan</span>
        </div>
        <h4 style="margin:0.25rem 0 0.35rem; font-size:1rem; color:#0f172a;">${esc(dir.rektorat.wr3.name)}</h4>
        <p style="margin:0; font-size:0.82rem; color:#475569;">
          <b>Pimpinan Pembina Biro Kerja Sama:</b> Membawahi Bagian Kerja Sama dan Kemitraan (UKS), memimpin negosiasi kemitraan strategis, hilirisasi inovasi, kewirausahaan, serta bertanggung jawab terhadap ketercapaian <b>IKU 6 Kemdiktisaintek</b>.
        </p>
      </div>
    </div>

    <!-- Satuan & Lembaga Penunjang -->
    <h2 style="font-size:1.05rem; margin:1rem 0 0.6rem; color:#0d233a;">⚖️ Unit Penjaminan Mutu & Pelaksana Kemitraan</h2>
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1rem; margin-bottom:1.2rem;">
      <div style="background:#fff; border:1px solid #d2d6dc; border-radius:8px; padding:1rem; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
        <h4 style="margin:0 0 0.25rem; font-size:0.95rem; color:#0d233a;">Satuan Penjaminan Mutu (SPM)</h4>
        <p class="muted" style="margin:0 0 0.4rem; font-size:0.82rem;">Penyelenggara SPMI & Auditor Mutu Internal (AMI)</p>
        <p style="margin:0; font-size:0.82rem; color:#334155;">
          Menjalankan audit berkala terhadap seluruh naskah kemitraan, memantau siklus PPEPP, mendeteksi kesenjangan relasi (MoU tanpa PKS), dan memastikan pemenuhan standar SN Dikti / Kemdiktisaintek.
        </p>
      </div>

      <div style="background:#fff; border:1px solid #d2d6dc; border-radius:8px; padding:1rem; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
        <h4 style="margin:0 0 0.25rem; font-size:0.95rem; color:#0d233a;">Bagian Kerja Sama dan Kemitraan (UKS)</h4>
        <p class="muted" style="margin:0 0 0.4rem; font-size:0.82rem;">Unit Pelaksana Operasional Naskah</p>
        <p style="margin:0; font-size:0.82rem; color:#334155;">
          Mengelola arsip dosir fisik dan digital, memproses ekstraksi OCR naskah, memonitor masa berlaku, dan melakukan sinkronisasi data ke sistem LaporKerma Kemdiktisaintek.
        </p>
      </div>

      <div style="background:#fff; border:1px solid #d2d6dc; border-radius:8px; padding:1rem; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
        <h4 style="margin:0 0 0.25rem; font-size:0.95rem; color:#0d233a;">Lembaga Penelitian & Pengabdian (LPPM)</h4>
        <p class="muted" style="margin:0 0 0.4rem; font-size:0.82rem;">Pusat Riset Bersama & PKM Kemitraan</p>
        <p style="margin:0; font-size:0.82rem; color:#334155;">
          Mengkoordinasikan kerja sama penelitian bersama (joint research), publikasi bersama, pengabdian masyarakat di Kawasan Danau Toba, dan hilirisasi paten ke industri mitra.
        </p>
      </div>
    </div>

    <!-- 4 Fakultas & 9 Program Studi IT Del -->
    <h2 style="font-size:1.05rem; margin:1rem 0 0.6rem; color:#0d233a;">🎓 4 Fakultas & 9 Program Studi Institut Teknologi Del</h2>
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1rem; margin-bottom:1.2rem;">
      ${FACULTIES.map((f) => {
        const prodis = PROGRAMS.filter((p) => p.facultyId === f.id);
        return `
        <div style="background:#fff; border:1px solid #d2d6dc; border-radius:8px; padding:1rem; box-shadow:0 1px 3px rgba(0,0,0,0.04); border-top:3px solid #1e3a8a;">
          <span style="font-size:0.75rem; font-weight:700; color:#1e3a8a;">FAKULTAS</span>
          <h4 style="margin:0.2rem 0 0.3rem; font-size:0.95rem; color:#0f172a;">${esc(f.name)} (${f.id})</h4>
          <p style="margin:0 0 0.5rem; font-size:0.85rem; color:#334155;"><b>Dekan:</b> ${esc(f.dekan || "-")}</p>
          <div style="font-size:0.8rem; font-weight:600; color:#475569; margin-bottom:0.3rem;">Program Studi:</div>
          <ul style="margin:0; padding-left:1.2rem; font-size:0.82rem; color:#334155;">
            ${prodis.map((pr) => `<li><b>${esc(pr.name)}</b> (${pr.id})</li>`).join("")}
          </ul>
        </div>`;
      }).join("")}
    </div>

    <!-- Delegasi Penandatanganan & Rantai Komando -->
    <section style="margin-bottom:1rem;">
      <h2 style="font-size:1.05rem; margin:0 0 0.6rem; color:#0d233a;">✒️ Wewenang Penandatanganan Naskah Kerja Sama (Rantai Komando)</h2>
      <div class="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Tingkat Naskah</th>
              <th>Pihak Penandatangan IT Del</th>
              <th>Tupoksi & Lingkup Wewenang</th>
              <th>Pihak Penandatangan Mitra</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>MoU / LOI (Nota Kesepahaman)</b></td>
              <td><b>Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.</b> (Rektor) / WR III atas mandat</td>
              <td>Kesepakatan payung tingkat institusi yang mencakup komitmen tridharma perguruan tinggi.</td>
              <td>Rektor / Direktur Utama / Kepala Daerah / Pimpinan Tertinggi Mitra</td>
            </tr>
            <tr>
              <td><b>PKS / MoA (Perjanjian Kerja Sama)</b></td>
              <td><b>Dekan Fakultas (FITE, FTI, FB, FV)</b> / WR III / Ketua LPPM</td>
              <td>Perjanjian operasional teknis yang mencakup hak, kewajiban, anggaran, dan klausul implementasi.</td>
              <td>Dekan Mitra / Direktur Divisi / Kepala Dinas / Kepala Cabang Mitra</td>
            </tr>
            <tr>
              <td><b>IA (Implementation Arrangement)</b></td>
              <td><b>Ketua Program Studi (Kaprodi)</b> / Kepala Laboratorium / Dosen PIC</td>
              <td>Rincian pelaksanaan teknis per semester: jumlah mahasiswa magang, jadwal riset, materi workshop.</td>
              <td>Manajer Teknis / Supervisor / Koordinator Program Mitra</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>`;
  }

  function wire(role) {
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.onclick = () => {
        state.view = button.dataset.view || "beranda";
        state.notice = "";
        try {
          window.location.hash = state.view;
        } catch {
        }
        render();
      };
    });
    window.onhashchange = () => {
      const h = (window.location.hash || "").replace("#", "").toLowerCase();
      let targetView = "";
      if (h === "repository" || h === "naskah") targetView = "naskah";
      else if (h === "entri" || h === "pencatatan") targetView = "entri";
      else if (h === "analisis") targetView = "analisis";
      else if (h === "spmi" || h === "ami") targetView = "spmi";
      else if (h === "struktur" || h === "pejabat") targetView = "struktur";
      else if (h === "impor" || h === "migrasi") targetView = "impor";
      else if (h === "relasi") targetView = "relasi";
      else if (h === "panduan") targetView = "panduan";
      else if (h === "penyimpanan" || h === "storage") targetView = "penyimpanan";
      else if (h === "beranda") targetView = "beranda";
      if (targetView && state.view !== targetView) {
        state.view = targetView;
        render();
      }
    };
    const roleSelect = document.getElementById("role");
    if (roleSelect) {
      roleSelect.onchange = () => {
        state.roleId = roleSelect.value;
        state.view = "beranda";
        state.filters = { ...EMPTY_FILTERS };
        save();
        render();
      };
    }
    const q = document.getElementById("q");
    if (q) {
      q.oninput = () => {
        state.filters = { ...state.filters, q: q.value };
        render();
        const again = document.getElementById("q");
        if (again) {
          again.focus();
          again.setSelectionRange(q.value.length, q.value.length);
        }
      };
    }
    const year = document.getElementById("year");
    if (year) year.onchange = () => {
      state.filters = { ...state.filters, year: year.value };
      render();
    };
    const kind = document.getElementById("kind");
    if (kind) kind.onchange = () => {
      state.filters = { ...state.filters, documentType: kind.value };
      render();
    };
    const statusFilter = document.getElementById("status-filter");
    if (statusFilter) statusFilter.onchange = () => {
      state.filters = { ...state.filters, status: statusFilter.value };
      render();
    };
    const clear = document.getElementById("clear");
    if (clear) clear.addEventListener("click", () => {
      state.filters = { ...EMPTY_FILTERS };
      state.selectedIds = [];
      render();
    });
    const selectAll = document.getElementById("select-all");
    if (selectAll) {
      selectAll.onchange = () => {
        const rows = filterDocuments(state.documents, state.filters, role, state.partners);
        if (selectAll.checked) {
          state.selectedIds = rows.map((r) => r.id);
        } else {
          state.selectedIds = [];
        }
        render();
      };
    }
    document.querySelectorAll(".doc-select").forEach((cb) => {
      cb.onchange = () => {
        const id = cb.dataset.id;
        if (cb.checked) {
          if (!state.selectedIds.includes(id)) state.selectedIds.push(id);
        } else {
          state.selectedIds = state.selectedIds.filter((x) => x !== id);
        }
        render();
      };
    });
    const clearSel = document.getElementById("btn-clear-sel");
    if (clearSel) clearSel.onclick = () => {
      state.selectedIds = [];
      render();
    };
    document.querySelectorAll("[data-sort]").forEach((th) => {
      th.onclick = () => {
        const key = th.dataset.sort;
        state.sortDir = state.sortKey === key && state.sortDir === "asc" ? "desc" : "asc";
        state.sortKey = key;
        render();
      };
    });
    document.querySelectorAll("[data-open]").forEach((button) => {
      button.onclick = () => {
        state.editingId = button.dataset.open || null;
        state.view = role.canWrite ? "entri" : "entri";
        render();
      };
    });
    const csv = document.getElementById("csv");
    if (csv) csv.addEventListener("click", () => {
      const rows = filterDocuments(state.documents, state.filters, role, state.partners);
      downloadText("ksdas-naskah.csv", documentsToCsv(rows, state.partners), "text/csv");
    });
    const excel = document.getElementById("excel");
    if (excel) excel.addEventListener("click", () => {
      const rows = filterDocuments(state.documents, state.filters, role, state.partners);
      downloadText("ksdas-naskah.xls", documentsToExcel(rows, state.partners), "application/vnd.ms-excel");
    });
    const word = document.getElementById("word");
    if (word) word.addEventListener("click", () => {
      const rows = filterDocuments(state.documents, state.filters, role, state.partners);
      downloadText("dosir-naskah-ksdas.doc", documentsToWord(rows, state.partners), "application/msword");
    });
    const selCsv = document.getElementById("btn-download-sel-csv");
    if (selCsv) selCsv.addEventListener("click", () => {
      const docs = state.documents.filter((d) => state.selectedIds.includes(d.id));
      downloadText("ksdas-naskah-terpilih.csv", documentsToCsv(docs, state.partners), "text/csv");
    });
    const selExcel = document.getElementById("btn-download-sel-excel");
    if (selExcel) selExcel.addEventListener("click", () => {
      const docs = state.documents.filter((d) => state.selectedIds.includes(d.id));
      downloadText("ksdas-naskah-terpilih.xls", documentsToExcel(docs, state.partners), "application/vnd.ms-excel");
    });
    const selWord = document.getElementById("btn-download-sel-word");
    if (selWord) selWord.addEventListener("click", () => {
      const docs = state.documents.filter((d) => state.selectedIds.includes(d.id));
      downloadText("dosir-naskah-terpilih.doc", documentsToWord(docs, state.partners), "application/msword");
    });
    const btnAnalisisSel = document.getElementById("btn-analisis-sel");
    if (btnAnalisisSel) btnAnalisisSel.addEventListener("click", () => {
      state.isAnalysingSelected = true;
      state.view = "analisis";
      render();
    });
    const csv2 = document.getElementById("csv2");
    if (csv2) csv2.addEventListener("click", () => {
      const isSelectedScope = state.isAnalysingSelected && state.selectedIds.length > 0;
      const rows = isSelectedScope
        ? state.documents.filter((d) => state.selectedIds.includes(d.id))
        : filterDocuments(state.documents, state.filters, role, state.partners);
      downloadText("analisis-ksdas.csv", documentsToCsv(rows, state.partners), "text/csv");
    });
    const wordAnalisis = document.getElementById("word-analisis");
    if (wordAnalisis) wordAnalisis.addEventListener("click", () => {
      const isSelectedScope = state.isAnalysingSelected && state.selectedIds.length > 0;
      const rows = isSelectedScope
        ? state.documents.filter((d) => state.selectedIds.includes(d.id))
        : filterDocuments(state.documents, state.filters, role, state.partners);
      const summary = analysisSummary(rows);
      downloadText("laporan-analisis-ksdas.doc", analysisToWord(summary, role, rows, state.partners), "application/msword");
    });
    const btnBack = document.getElementById("btn-back-all-analisis");
    if (btnBack) btnBack.addEventListener("click", () => {
      state.isAnalysingSelected = false;
      render();
    });
    const go = document.getElementById("go-analisis");
    if (go) go.addEventListener("click", () => {
      state.isAnalysingSelected = false;
      state.view = "analisis";
      render();
    });
    const btnAmiDoc = document.getElementById("btn-export-ami-doc");
    if (btnAmiDoc) btnAmiDoc.addEventListener("click", () => {
      const docs = scopeDocuments(state.documents, role);
      downloadText("laporan-hasil-audit-ami-itdel.doc", amiReportToWord(role, docs, state.partners), "application/msword");
    });
    const btnAmiCsv = document.getElementById("btn-export-ami-csv");
    if (btnAmiCsv) btnAmiCsv.addEventListener("click", () => {
      const docs = scopeDocuments(state.documents, role);
      downloadText("matriks-kepatuhan-spmi-itdel.csv", amiToCsv(docs, state.partners), "text/csv");
    });
    /* ---------------- Alur unggah dan ekstraksi ---------------- */
    const setProgress = (status, percent) => {
      state.ocrProgress = { status, percent };
      const el = document.getElementById("ocr-progress-status");
      const bar = document.getElementById("ocr-progress-fill");
      const pct = document.getElementById("ocr-progress-pct");
      if (el) el.textContent = status;
      if (bar) bar.style.width = percent + "%";
      if (pct) pct.textContent = percent + "%";
    };

    async function handleUniversalFileUpload(fileOrFiles) {
      if (!role.canWrite || !fileOrFiles) return;
      if (state.busy) { state.notice = "Masih ada proses ekstraksi yang berjalan. Tunggu hingga selesai."; render(); return; }
      const files = Array.isArray(fileOrFiles) ? fileOrFiles : Array.from(fileOrFiles);
      if (!files.length) return;
      state.busy = true;
      state.view = "entri";
      try { window.location.hash = "entri"; } catch { }
      const batch = { ok: 0, rows: 0, skipped: [] };
      const env = extractEnv();
      let list = files;
      if (list.length > KSDASExtract.MAX_FILES_PER_BATCH) {
        batch.skipped.push({ name: `${list.length - KSDASExtract.MAX_FILES_PER_BATCH} berkas lainnya`, reason: `Melebihi batas ${KSDASExtract.MAX_FILES_PER_BATCH} berkas per kelompok.` });
        list = list.slice(0, KSDASExtract.MAX_FILES_PER_BATCH);
      }
      state.ocrProgress = { status: "Menyiapkan pemrosesan...", percent: 3 };
      state.notice = "";
      render();
      const parsedList = [];
      const seenHash = new Set(state.documents.map((d) => d.fileHash).filter(Boolean));
      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        const base = Math.round((i / list.length) * 90);
        const span = 90 / list.length;
        const prog = (msg, pct) => setProgress(`[${i + 1}/${list.length}] ${file.name}: ${msg}`, Math.min(97, base + Math.round((pct / 100) * span)));
        try {
          prog("memvalidasi berkas", 5);
          const read = await KSDASExtract.readFile(file, env, prog);
          const buf = await file.arrayBuffer();
          const hash = await KSDASStore.hashBuffer(buf);
          if (seenHash.has(hash)) { batch.skipped.push({ name: file.name, reason: "Berkas yang sama persis sudah pernah diunggah." }); continue; }
          seenHash.add(hash);
          const registry = read.sheets ? KSDASExtract.detectRegistry(read.sheets) : null;
          if (registry) { parsedList.push({ file, read, registry, hash }); continue; }
          if (!read.pages.some((p) => (p.text || "").trim().length > 15)) {
            batch.skipped.push({ name: file.name, reason: (read.warnings && read.warnings[0]) || "Tidak ada teks yang dapat dibaca. Isi manual atau gunakan berkas yang lebih jelas." });
            continue;
          }
          prog("menganalisis isi dokumen", 80);
          const result = KSDASExtract.analyze({ pages: read.pages, fileName: file.name }, extractCtx());
          const f = result.fields;
          if (!(f.documentType || f.documentNumber || f.partnerId || f.title)) {
            batch.skipped.push({ name: file.name, reason: "Tidak dikenali sebagai naskah kerja sama (tidak ada jenis, nomor, judul, atau mitra yang terbaca)." });
            continue;
          }
          result.warnings = read.warnings || [];
          parsedList.push({ file, read, result, hash });
        } catch (err) {
          batch.skipped.push({ name: file.name, reason: String(err && err.message || err) });
        }
      }
      // Urutkan menurut hirarki agar induk diproses lebih dulu (MoU, PKS, IA, Proposal, Laporan)
      const order = { MOU_LOI: 0, PKS_MOA: 1, IA: 2, PROPOSAL: 3, LAPORAN: 4 };
      parsedList.sort((a, b) => ((a.result && order[a.result.patch.documentType]) ?? 9) - ((b.result && order[b.result.patch.documentType]) ?? 9));
      const created = [];
      for (const item of parsedList) {
        if (item.registry) {
          const out = await importRegistryRows(item.registry, item.file.name, item.hash);
          batch.rows += out.added;
          out.skipped.forEach((s) => batch.skipped.push(s));
          created.push(...out.docs);
          continue;
        }
        // Analisis ulang dengan basis data terkini agar mitra dan induk yang baru dibuat dalam kelompok ini dikenali
        const fresh = KSDASExtract.analyze({ pages: item.read.pages, fileName: item.file.name }, extractCtx());
        fresh.warnings = item.result.warnings;
        const doc = await createDocFromExtraction(fresh, item.file, item.hash);
        created.push(doc);
        batch.ok += 1;
      }
      state.ocrProgress = null;
      state.busy = false;
      state.lastBatch = batch;
      if (created.length) {
        state.sessionIds = [...created.map((d) => d.id), ...(state.sessionIds || []).filter((id) => !created.some((d) => d.id === id))];
        state.editingId = created[0].id;
      }
      state.notice = created.length
        ? `${created.length} naskah masuk antrean validasi. Data hasil ekstraksi berstatus usulan sampai divalidasi staf.`
        : "Tidak ada naskah yang dapat dibuat. Lihat ringkasan di bawah.";
      KSDASStore.audit("UPLOAD", `${list.length} berkas`, `${created.length} naskah dibuat, ${batch.skipped.length} dilewati`, role.name);
      save();
      render();
    }

    async function createDocFromExtraction(result, file, hash, sourceName) {
      const doc = blankNaskah();
      if (result.partnerDraft) state.partners = [...state.partners, result.partnerDraft];
      for (const [k, v] of Object.entries(result.patch)) {
        if (k === "triDharma") doc.triDharma = parseTri(String(v));
        else doc[k] = v;
      }
      doc.provenance = { ...doc.provenance, ...result.provenance };
      doc.fileName = file ? file.name : (sourceName || "teks-tempel.txt");
      doc.fileSize = file ? file.size : 0;
      doc.fileHash = hash || "";
      doc.status = "DRAFT";
      doc.validation = { state: "NEEDS_REVIEW", by: "", at: "" };
      const parent = resolveParent(doc, result);
      if (parent) {
        doc.extraction = { parent };
        if (parent.id && parent.level === "TINGGI") { doc.parentId = parent.id; parent.linked = true; }
      }
      doc.extraction = {
        ...(doc.extraction || {}),
        at: new Date().toISOString(),
        fields: Object.fromEntries(Object.entries(result.fields).map(([k, f]) => [k, { value: f.value, level: f.level, page: f.page, sheet: f.sheet, source: f.source, method: f.method, note: f.note }])),
        flags: [...result.flags, ...(result.warnings || []).map((m) => ({ code: "reader_warning", message: m }))],
        parent: parent || null,
        overall: result.overall
      };
      if (duplicateNumber(state.documents, doc.documentNumber)) {
        doc.extraction.flags.push({ code: "duplicate_document", message: `Nomor ${doc.documentNumber} sudah dipakai naskah lain. Periksa apakah ini duplikat.` });
      }
      if (file) {
        try {
          const saved = await KSDASStore.putFile(doc.id, file);
          doc.fileRef = saved.ref;
          doc.fileHash = saved.sha256 || doc.fileHash;
        } catch (e) {
          doc.extraction.flags.push({ code: "file_not_stored", message: "Berkas asli tidak dapat disimpan: " + String(e.message || e) });
        }
      }
      state.documents = [doc, ...state.documents];
      return doc;
    }

    function resolveParent(doc, result) {
      const sug = result.parentSuggestion;
      if (sug && sug.id) return { ...sug };
      if (sug && sug.number) {
        const hit = state.documents.find((d) => norm(d.documentNumber) === norm(sug.number));
        if (hit) return { id: hit.id, number: hit.documentNumber, level: "TINGGI", reason: `Dokumen merujuk nomor ${sug.number}.`, page: sug.page, source: sug.source };
      }
      const guess = suggestParent(doc, state.documents);
      if (guess) return { id: guess.id, number: guess.number, level: "SEDANG", reason: guess.reason };
      return sug || null;
    }

    async function importRegistryRows(rows, fileName, hash) {
      const out = { added: 0, skipped: [], docs: [] };
      for (const row of rows) {
        const v = row.values;
        if (!v.title && !v.documentNumber && !v.partnerName) { out.skipped.push({ name: `${fileName} baris ${row.line}`, reason: "Baris tanpa judul, nomor, atau mitra." }); continue; }
        const built = naskahFromValues(v, state.partners);
        if (built.doc.documentNumber && duplicateNumber(state.documents, built.doc.documentNumber)) {
          out.skipped.push({ name: `${fileName} baris ${row.line}`, reason: `Nomor ${built.doc.documentNumber} sudah ada (duplikat).` });
          continue;
        }
        if (built.partnerDraft) state.partners = [...state.partners, { ...built.partnerDraft, draft: true }];
        const doc = built.doc;
        doc.fileName = fileName; doc.fileHash = hash || "";
        doc.status = "DRAFT";
        doc.validation = { state: "NEEDS_REVIEW", by: "", at: "" };
        const ex = KSDASExtract.analyzeRegistryRow(row, fileName);
        doc.extraction = {
          at: new Date().toISOString(), fields: Object.fromEntries(Object.entries(ex.fields).map(([k, f]) => [k, f])),
          flags: built.warnings.map((m) => ({ code: "registry_warning", message: m })), parent: null
        };
        if (built.parentNumber) {
          const parent = state.documents.find((d) => norm(d.documentNumber) === norm(built.parentNumber));
          if (parent) doc.parentId = parent.id;
          else doc.extraction.flags.push({ code: "unresolved_parent", message: `Nomor induk ${built.parentNumber} belum ada di basis data.` });
        }
        state.documents = [doc, ...state.documents];
        out.docs.push(doc);
        out.added += 1;
      }
      return out;
    }

    const files = document.getElementById("files");
    if (files) files.onchange = () => {
      if (files.files && files.files.length) handleUniversalFileUpload(Array.from(files.files));
      files.value = "";
    };
    const blank = document.getElementById("blank");
    if (blank) blank.addEventListener("click", () => {
      const doc = blankNaskah();
      doc.validation = { state: "DRAFT", by: "", at: "" };
      state.documents = [doc, ...state.documents];
      state.editingId = doc.id;
      render();
    });
    const dropZone = document.getElementById("entry-dropzone");
    if (dropZone) {
      dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add("over"); };
      dropZone.ondragleave = () => dropZone.classList.remove("over");
      dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove("over");
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) handleUniversalFileUpload(Array.from(e.dataTransfer.files));
      };
      dropZone.onkeydown = (e) => { if ((e.key === "Enter" || e.key === " ") && e.target === dropZone && files) { e.preventDefault(); files.click(); } };
    }
    const toggleAiPaste = document.getElementById("btn-toggle-ai-paste");
    const aiPasteBox = document.getElementById("ai-paste-box");
    if (toggleAiPaste && aiPasteBox) toggleAiPaste.onclick = () => { aiPasteBox.style.display = aiPasteBox.style.display === "none" ? "block" : "none"; };

    const runAiExtract = document.getElementById("btn-run-ai-extract");
    if (runAiExtract) runAiExtract.onclick = async () => {
      const txt = document.getElementById("ai-ocr-text")?.value || "";
      if (!txt.trim()) return;
      const result = KSDASExtract.analyze({ pages: [{ n: 1, text: txt, method: "TEKS_TEMPEL" }], fileName: "" }, extractCtx());
      const doc = await createDocFromExtraction(result, null, "", "teks-tempel.txt");
      state.sessionIds = [doc.id, ...(state.sessionIds || [])];
      state.editingId = doc.id;
      state.notice = "Teks dianalisis. Hasil berstatus usulan, silakan tinjau.";
      KSDASStore.audit("EXTRACT_TEXT", doc.id, "Ekstraksi dari teks tempel", role.name);
      save();
      render();
    };

    document.querySelectorAll("[data-review]").forEach((b) => {
      b.onclick = () => { state.editingId = b.dataset.review; render(); const r = document.querySelector(".review"); if (r) r.scrollIntoView({ block: "start" }); };
    });
    const bulk = document.getElementById("btn-bulk-validate");
    if (bulk) bulk.onclick = () => {
      const targets = queueDocs().filter(canAutoValidate);
      const now = new Date().toISOString();
      targets.forEach((d) => {
        d.validation = { state: "VALIDATED", by: role.name, at: now };
        d.status = "AKTIF";
        d.updatedAt = now;
        KSDASStore.audit("VALIDATE", d.id, `Validasi massal: ${d.documentNumber}`, role.name);
      });
      state.notice = `${targets.length} naskah divalidasi.`;
      save();
      render();
    };
    const dlOriginal = document.getElementById("btn-dl-original");
    if (dlOriginal) dlOriginal.onclick = async () => {
      const cur = state.documents.find((d) => d.id === state.editingId);
      const blob = cur ? await KSDASStore.getFile(cur.id) : null;
      if (!blob) { state.notice = "Berkas asli tidak ditemukan di penyimpanan."; render(); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = cur.fileName || "berkas"; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      KSDASStore.audit("DOWNLOAD", cur.id, cur.fileName, role.name);
    };
    const useParentEx = document.getElementById("use-parent-ex");
    if (useParentEx) useParentEx.onclick = () => {
      const cur = state.documents.find((d) => d.id === state.editingId);
      if (!cur || !cur.extraction || !cur.extraction.parent) return;
      cur.parentId = cur.extraction.parent.id;
      KSDASStore.audit("LINK", cur.id, `Tautkan ke ${cur.extraction.parent.number}`, role.name);
      save();
      render();
    };
    const btnReject = document.getElementById("btn-reject");
    if (btnReject) btnReject.onclick = () => {
      const cur = state.documents.find((d) => d.id === state.editingId);
      if (!cur) return;
      if (!confirm("Tolak naskah ini? Naskah diarsipkan dan tidak dihitung sebagai naskah aktif.")) return;
      cur.validation = { state: "REJECTED", by: role.name, at: new Date().toISOString() };
      cur.status = "ARSIP";
      KSDASStore.audit("REJECT", cur.id, cur.documentNumber || cur.fileName, role.name);
      state.notice = "Naskah ditolak dan diarsipkan.";
      save();
      render();
    };

    const form = document.getElementById("form");
    if (form) form.onsubmit = (event) => {
      event.preventDefault();
      if (!role.canWrite) return;
      const act = (event.submitter && event.submitter.dataset && event.submitter.dataset.act) || "save";
      const current = state.documents.find((item) => item.id === state.editingId);
      if (!current) return;
      const data = new FormData(form);
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const next = { ...current, updatedAt: now, provenance: { ...(current.provenance || {}) } };
      const keys = ["documentType", "documentNumber", "title", "partnerId", "signedDate", "startDate", "endDate", "status", "facultyId", "programId", "triDharma", "unitId", "activityName", "pic", "partnerSignatory", "partnerSignatoryTitle", "itdelSignatory", "itdelSignatoryTitle", "scope", "location", "budget", "fundingSource", "notes"];
      const exf = (current.extraction && current.extraction.fields) || {};
      let changedExtracted = false;
      for (const key of keys) {
        if (!data.has(key)) continue;
        const value = String(data.get(key) ?? "").trim();
        const before = key === "triDharma" ? (Array.isArray(current.triDharma) ? current.triDharma.join("; ") : "") : String(current[key] ?? "");
        if (key === "triDharma") next.triDharma = parseTri(value);
        else next[key] = value;
        const after = key === "triDharma" ? next.triDharma.join("; ") : value;
        if (exf[key]) {
          const same = String(exf[key].value) === after;
          next.provenance[key] = same ? "EKSTRAKSI" : "MANUAL";
          if (!same) changedExtracted = true;
        } else if (after !== before) next.provenance[key] = "MANUAL";
      }
      const fail = (msg) => { state.notice = msg; render(); };
      const order = dateOrderError(next);
      if (order) return fail(order);
      if (!next.documentNumber.trim() || !next.title.trim()) return fail("Nomor dokumen dan judul wajib diisi.");
      if (duplicateNumber(state.documents, next.documentNumber, next.id)) return fail("Nomor dokumen sudah dipakai naskah lain.");
      const vstate = (current.validation && current.validation.state) || "VALIDATED";
      if (act === "validate") {
        if (missingFields(next).length) return fail(`Belum bisa divalidasi. Masih kosong: ${missingFields(next).join(", ")}.`);
        next.validation = { state: changedExtracted || vstate === "CORRECTED" ? "CORRECTED" : "VALIDATED", by: role.name, at: now };
        if (next.status === "DRAFT" || next.status === "ARSIP") next.status = "AKTIF";
        state.partners = state.partners.map((pt) => pt.id === next.partnerId && pt.draft ? { ...pt, draft: false } : pt);
      } else {
        if (next.status === "AKTIF" && vstate === "NEEDS_REVIEW") return fail("Naskah hasil ekstraksi harus divalidasi lebih dulu. Gunakan tombol Validasi dan aktifkan.");
        if (next.status === "AKTIF" && missingFields(next).length) return fail(`Belum bisa ditandai aktif. Masih kosong: ${missingFields(next).join(", ")}.`);
        if ((vstate === "VALIDATED") && changedExtracted) next.validation = { ...current.validation, state: "CORRECTED" };
      }
      state.documents = state.documents.map((item) => item.id === next.id ? next : item);
      state.notice = act === "validate" ? "Naskah divalidasi dan menjadi data resmi." : "Draf tersimpan.";
      KSDASStore.audit(act === "validate" ? "VALIDATE" : "UPDATE", next.id, `${next.documentNumber || next.title}${changedExtracted ? " (ada koreksi staf atas hasil ekstraksi)" : ""}`, role.name);
      save();
      render();
    };
    const useParent = document.getElementById("use-parent");
    if (useParent) useParent.addEventListener("click", () => {
      const current = state.documents.find((item) => item.id === state.editingId);
      const suggestion = current ? suggestParent(current, state.documents) : null;
      if (!current || !suggestion) return;
      state.documents = state.documents.map((item) => item.id === current.id ? { ...item, parentId: suggestion.id } : item);
      save();
      render();
    });
    const template = document.getElementById("template");
    if (template) template.addEventListener("click", () => downloadText("template-ksdas.csv", templateCsv(), "text/csv"));
    const importFile = document.getElementById("import-file");
    if (importFile) {
      importFile.onchange = () => {
        const file = importFile.files?.[0];
        if (!file) return;
        if (/\.xlsx$/i.test(file.name)) { handleUniversalFileUpload([file]); importFile.value = ""; return; }
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = String(e.target?.result || "");
          const pasteEl = document.getElementById("paste");
          if (pasteEl) pasteEl.value = content;
          document.getElementById("read")?.click();
        };
        reader.readAsText(file);
      };
    }
    const read = document.getElementById("read");
    if (read) read.addEventListener("click", () => {
      const text = document.getElementById("paste").value;
      const mapped = mapSheet(parseDelimited(text));
      const preview = document.getElementById("preview");
      if (!preview) return;
      if (!mapped.rows.length) {
        preview.textContent = "Tabel tidak dikenali. Pastikan baris pertama adalah judul kolom.";
        return;
      }
      preview.innerHTML = `<p>Kolom dikenali: ${esc(mapped.recognized.join(", ") || "tidak ada")}.</p><button id="commit" type="button">Masukkan ke pencatatan</button>`;
      document.getElementById("commit")?.addEventListener("click", () => {
        let partners = [...state.partners];
        let documents = [...state.documents];
        let count = 0;
        for (const row of mapped.rows) {
          if (row.blocking.length) continue;
          const built = naskahFromValues(row.values, partners);
          if (built.doc.documentNumber && duplicateNumber(documents, built.doc.documentNumber)) continue;
          if (built.partnerDraft) partners = [...partners, built.partnerDraft];
          documents = [built.doc, ...documents];
          if (built.parentNumber) {
            const parent = documents.find((item) => item.documentNumber.toLowerCase() === built.parentNumber.toLowerCase());
            if (parent) documents = documents.map((item) => item.id === built.doc.id ? { ...item, parentId: parent.id } : item);
          }
          count += 1;
        }
        state.partners = partners;
        state.documents = documents;
        state.view = "naskah";
        state.notice = `${count} baris masuk.`;
        save();
        render();
      });
    });
    /* ---------------- Halaman Penyimpanan ---------------- */
    if (state.view === "penyimpanan") {
      if (!state.storage && !state.storageLoading) {
        state.storageLoading = true;
        refreshStorage(true).finally(() => { state.storageLoading = false; });
      }
      const $ = (id) => document.getElementById(id);
      const snapshotHash = (docs, partners) => KSDASStore.hash(JSON.stringify({ documents: docs, partners: partners }));
      const done = async (msg) => { state.notice = msg; await refreshStorage(false); render(); };
      if ($("st-refresh")) $("st-refresh").onclick = () => { refreshStorage(true); };
      if ($("st-persist")) $("st-persist").onclick = async () => { const ok = await KSDASStore.requestPersist(); await done(ok ? "Penyimpanan persisten diberikan peramban." : "Peramban belum memberikan penyimpanan persisten."); };
      if ($("st-open-folder")) $("st-open-folder").onclick = async () => { try { await KSDASStore.api("POST", "api/open-folder", {}); state.notice = "Folder basis data dibuka di komputer ini."; } catch (e) { state.notice = "Gagal membuka folder: " + e.message; } render(); };
      if ($("st-sim-io")) $("st-sim-io").onclick = async () => {
        state.simCount = parseInt($("sim-count").value, 10) || 200;
        state.simKb = parseInt($("sim-kb").value, 10) || 4;
        state.simBusy = true; render();
        try {
          state.simResult = await KSDASStore.simulateIO(state.simCount, state.simKb);
          KSDASStore.audit("SIMULASI_IO", "sim", `${state.simCount} rekaman x ${state.simKb} KB`, role.name);
        } catch (e) { state.notice = "Simulasi gagal: " + e.message; }
        state.simBusy = false;
        await done(state.notice || "Simulasi selesai.");
      };
      if ($("st-sim-clear")) $("st-sim-clear").onclick = async () => { await KSDASStore.clearSim(); state.simResult = null; await done("Data simulasi dibersihkan."); };
      if ($("st-mem-alloc")) $("st-mem-alloc").onclick = async () => {
        state.memMb = parseInt($("mem-mb").value, 10) || 32;
        const before = performance.memory ? performance.memory.usedJSHeapSize : null;
        KSDASStore.allocateMemory(state.memMb);
        await new Promise((r) => setTimeout(r, 50));
        const after = performance.memory ? performance.memory.usedJSHeapSize : null;
        state.memNote = before != null ? `Heap JS naik dari ${fmtBytes(before)} menjadi ${fmtBytes(after)}. Memori ini hilang saat halaman ditutup, berbeda dengan data di penyimpanan.` : `${state.memMb} MB dialokasikan. Peramban ini tidak melaporkan ukuran heap.`;
        await done("Memori simulasi dialokasikan.");
      };
      if ($("st-mem-release")) $("st-mem-release").onclick = async () => { KSDASStore.releaseMemory(); state.memNote = "Memori simulasi dilepas. Pengosongan oleh pengumpul sampah dapat tertunda beberapa saat."; await done("Memori simulasi dilepas."); };
      if ($("st-backup")) $("st-backup").onclick = async () => {
        try { const r = await KSDASStore.backup(state); KSDASStore.audit("BACKUP", r.name, `${r.documents} naskah, ${fmtBytes(r.bytes)}`, role.name); await done(`Cadangan ${r.name} dibuat.`); }
        catch (e) { await done("Cadangan gagal: " + e.message); }
      };
      if ($("st-drill")) $("st-drill").onclick = async () => {
        try {
          const before = await snapshotHash(state.documents, state.partners);
          const b = await KSDASStore.backup(state);
          const data = await KSDASStore.restore(b.name, true);
          const after = await snapshotHash(data.documents, data.partners);
          state.drillOk = before === after;
          state.drillNote = state.drillOk
            ? `Uji pemulihan LULUS: ${data.documents.length} naskah dipulihkan dari ${b.name} dan checksum identik (${before.slice(0, 12)}).`
            : "Uji pemulihan GAGAL: checksum hasil pemulihan berbeda dari data saat ini.";
          KSDASStore.audit("RESTORE_DRILL", b.name, state.drillOk ? "lulus" : "gagal", role.name);
        } catch (e) { state.drillOk = false; state.drillNote = "Uji pemulihan GAGAL: " + e.message; }
        await done("");
      };
      document.querySelectorAll("[data-restore]").forEach((b) => {
        b.onclick = async () => {
          if (!role.canWrite || !confirm("Pulihkan data dari cadangan ini? Data saat ini akan diganti (cadangan baru dibuat lebih dulu).")) return;
          try {
            await KSDASStore.backup(state);
            const data = await KSDASStore.restore(b.dataset.restore);
            state.documents = data.documents.map(normalizeDoc);
            state.partners = data.partners;
            KSDASStore.audit("RESTORE", b.dataset.restore, `${data.documents.length} naskah`, role.name);
            save();
            await done(`Data dipulihkan dari ${b.dataset.restore}.`);
          } catch (e) { await done("Pemulihan gagal: " + e.message); }
        };
      });
      if ($("st-export")) $("st-export").onclick = async () => {
        const payload = { schema: "ksdas-export/1", exportedAt: new Date().toISOString(), documents: state.documents, partners: state.partners };
        payload.checksum = await snapshotHash(payload.documents, payload.partners);
        downloadText(`ksdas-ekspor-${todayISO()}.json`, JSON.stringify(payload, null, 2), "application/json");
        KSDASStore.audit("EXPORT", "json", `${state.documents.length} naskah`, role.name);
        state.notice = "Berkas ekspor dibuat beserta checksum integritas.";
        render();
      };
      if ($("st-import")) $("st-import").onchange = async () => {
        const f = $("st-import").files[0];
        if (!f) return;
        try {
          const data = JSON.parse(await f.text());
          if (data.schema !== "ksdas-export/1" || !Array.isArray(data.documents) || !Array.isArray(data.partners)) throw new Error("Berkas bukan ekspor KSDAS yang valid.");
          if (data.documents.some((d) => typeof d.id !== "string" || typeof d.documentNumber !== "string")) throw new Error("Struktur naskah tidak valid.");
          const sum = await snapshotHash(data.documents, data.partners);
          if (data.checksum && data.checksum !== sum) throw new Error("Checksum tidak cocok. Berkas berubah setelah diekspor.");
          const clash = data.documents.filter((d) => state.documents.some((x) => x.id === d.id)).length;
          if (!confirm(`Impor ${data.documents.length} naskah (${clash} berbenturan ID dengan data saat ini)? Data saat ini akan DIGANTI. Cadangan dibuat lebih dulu.`)) return;
          await KSDASStore.backup(state);
          state.documents = data.documents.map(normalizeDoc);
          state.partners = data.partners;
          KSDASStore.audit("IMPORT", f.name, `${data.documents.length} naskah`, role.name);
          save();
          await done(`Impor selesai: ${data.documents.length} naskah.`);
        } catch (e) { await done("Impor ditolak: " + e.message); }
      };
    }
    const reset = document.getElementById("reset");
    if (reset) reset.addEventListener("click", () => {
      if (!confirm("Kembalikan sepuluh data contoh?")) return;
      state.documents = seedDocuments();
      state.partners = seedPartners();
      state.notice = "Data contoh dikembalikan.";
      save();
      render();
    });
  }
  render();
  (async () => {
    try {
      await KSDASStore.init();
      const saved = await KSDASStore.loadState();
      let localAt = "";
      try { localAt = (JSON.parse(localStorage.getItem(KEY) || "{}").savedAt) || ""; } catch { }
      if (saved && saved.documents && (KSDASStore.isServer() || !localAt || (saved.savedAt || "") > localAt)) {
        state.documents = saved.documents.map(normalizeDoc);
        state.partners = saved.partners && saved.partners.length ? saved.partners : state.partners;
        if (saved.roleId) state.roleId = saved.roleId;
        try { localStorage.setItem(KEY, JSON.stringify({ roleId: state.roleId, documents: state.documents, partners: state.partners, savedAt: saved.savedAt })); } catch { }
      } else {
        await KSDASStore.saveState(state, true);
      }
      KSDASStore.audit("SESSION", KSDASStore.mode, "Aplikasi dibuka", "Sistem");
    } catch (e) {
      state.notice = "Penyimpanan tidak dapat diinisialisasi: " + String(e && e.message || e);
    }
    render();
  })();
})();
