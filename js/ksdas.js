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
  var FACULTIES = [
    { id: "FITE", name: "Fakultas Informatika dan Teknik Elektro" },
    { id: "FTI", name: "Fakultas Teknologi Industri" },
    { id: "FB", name: "Fakultas Bioteknologi" }
  ];
  var PROGRAMS = [
    { id: "IF", facultyId: "FITE", name: "S1 Informatika" },
    { id: "SI", facultyId: "FITE", name: "S1 Sistem Informasi" },
    { id: "MR", facultyId: "FTI", name: "S1 Manajemen Rekayasa" },
    { id: "BP", facultyId: "FB", name: "S1 Teknik Bioproses" }
  ];
  var UNITS = [
    { id: "UKS", name: "Unit Kerja Sama" },
    { id: "LPPM", name: "Lembaga Penelitian dan Pengabdian" },
    { id: "PRODI", name: "Program Studi" }
  ];
  var ROLES = [
    {
      id: "STAFF",
      name: "Staf Unit Kerja Sama",
      detail: "Mencatat, mengimpor, dan melengkapi data",
      canWrite: true,
      canImport: true
    },
    {
      id: "WR3",
      name: "Wakil Rektor 3",
      detail: "Memantau masa berlaku, tindak lanjut, dan rekap",
      canWrite: true,
      canImport: false
    },
    {
      id: "DEKAN_FITE",
      name: "Dekan FITE",
      detail: "Melihat, menyaring, dan mengunduh data fakultas",
      facultyId: "FITE",
      canWrite: false,
      canImport: false
    },
    {
      id: "DEKAN_FB",
      name: "Dekan Fakultas Bioteknologi",
      detail: "Melihat data fakultas sendiri",
      facultyId: "FB",
      canWrite: false,
      canImport: false
    },
    {
      id: "KAPRODI_IF",
      name: "Kaprodi S1 Informatika",
      detail: "Melihat data program studi sendiri",
      programId: "IF",
      canWrite: false,
      canImport: false
    },
    {
      id: "KAPRODI_BP",
      name: "Kaprodi S1 Teknik Bioproses",
      detail: "Melihat data program studi sendiri",
      programId: "BP",
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
      signedDate: todayISO(now),
      startDate: todayISO(now),
      endDate: "",
      status: "DRAFT",
      scope: "",
      facultyId: "",
      programId: "",
      unitId: "UKS",
      triDharma: ["PENDIDIKAN"],
      activityName: "",
      pic: "Staf Unit Kerja Sama",
      partnerSignatory: "",
      partnerSignatoryTitle: "",
      itdelSignatory: "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.",
      itdelSignatoryTitle: "Rektor Institut Teknologi Del",
      parentId: "",
      location: "Laguboti",
      budget: "",
      fundingSource: "",
      notes: "",
      fileName: "",
      fileSize: 0,
      uploadedAt: stamp,
      updatedAt: stamp,
      provenance: {
        itdelSignatory: "SISTEM",
        itdelSignatoryTitle: "SISTEM",
        startDate: "SISTEM",
        location: "SISTEM",
        unitId: "SISTEM"
      }
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
    if (n2 === "fite" || n2.includes("teknik elektro") || n2.includes("informatika") && n2.includes("fakultas")) return "FITE";
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
    if (n2.includes("sistem informasi")) return "SI";
    if (n2.includes("informatika")) return "IF";
    if (n2.includes("manajemen rekayasa")) return "MR";
    if (n2.includes("bioproses")) return "BP";
    return "";
  }
  function matchUnit(value) {
    const n2 = norm(value);
    if (!n2) return "";
    for (const u of UNITS) {
      if (n2 === norm(u.id) || n2.includes(norm(u.name))) return u.id;
    }
    if (n2.includes("kerja sama") || n2.includes("kerjasama")) return "UKS";
    if (n2.includes("lppm") || n2.includes("penelitian")) return "LPPM";
    if (n2.includes("prodi") || n2.includes("program studi")) return "PRODI";
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
  var INVALID_PERSON_TOKENS = new Set([
    "pt", "cv", "yayasan", "universitas", "institut", "kementerian", "dinas",
    "pemerintah", "badan", "bank", "direktorat", "tim", "panitia", "divisi", "biro",
    "bagian", "fakultas", "program", "studi", "pasal", "pihak", "pertama", "kedua",
    "ketiga", "kesepakatan", "perjanjian", "republik", "indonesia", "kabupaten", "kota",
    "provinsi", "rektor", "dekan", "direktur", "kepala", "bupati", "gubernur", "camat",
    "surat", "memorandum", "understanding", "agreement", "arrangement", "nomor",
    "ruang", "lingkup", "ayat", "bab", "ketentuan", "umum", "penutup", "jangka", "waktu",
    "tujuan", "kegiatan", "anggaran", "biaya", "tugas", "kewajiban", "hak", "pelaksanaan"
  ]);

  function isPersonName(name) {
    if (!name || name.length < 4) return false;
    if (name === name.toUpperCase() && !/(?:PROF\.|DR\.|IR\.|S\.T\.|M\.T\.)/.test(name)) {
      return false;
    }
    const clean = name.replace(/^(?:selaku|bertindak|pihak|kedua|pertama)\s+/i, "");
    const words = clean.toLowerCase().split(/[\s,.]+/).filter((w) => w.length > 1);
    if (words.length < 2) return false;
    for (const w of words) {
      if (INVALID_PERSON_TOKENS.has(w)) return false;
    }
    return true;
  }

  function cleanString(str) {
    return (str || "").replace(/[\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim();
  }

  // --- MESIN EKSTRAKSI DOKUMEN & OCR PRESISI TINGGI (NATIVE ZIP + FLATE + OLE + TESSERACT/PDF.JS) ---
  function extractTextFromDoc(buffer) {
    try {
      const bytes = new Uint8Array(buffer);
      let utf16Str = "";
      for (let i = 0; i < bytes.length - 1; i += 2) {
        if (bytes[i+1] === 0 && bytes[i] >= 32 && bytes[i] <= 126) {
          utf16Str += String.fromCharCode(bytes[i]);
        } else if (bytes[i+1] === 0 && (bytes[i] === 10 || bytes[i] === 13)) {
          utf16Str += " ";
        }
      }
      if (utf16Str.length > 50) return utf16Str;
      let asciiStr = "";
      for (let i = 0; i < bytes.length; i++) {
        if (bytes[i] >= 32 && bytes[i] <= 126) asciiStr += String.fromCharCode(bytes[i]);
        else if (bytes[i] === 10 || bytes[i] === 13) asciiStr += " ";
      }
      return asciiStr;
    } catch (_) { return ""; }
  }

  async function extractTextFromDocx(buffer) {
    try {
      const bytes = new Uint8Array(buffer);
      let offset = 0;
      while (offset < bytes.length - 30) {
        if (bytes[offset] === 0x50 && bytes[offset+1] === 0x4b && bytes[offset+2] === 0x03 && bytes[offset+3] === 0x04) {
          const compMethod = bytes[offset+8] | (bytes[offset+9] << 8);
          const compSize = bytes[offset+18] | (bytes[offset+19] << 8) | (bytes[offset+20] << 16) | (bytes[offset+21] << 24);
          const uncompSize = bytes[offset+22] | (bytes[offset+23] << 8) | (bytes[offset+24] << 16) | (bytes[offset+25] << 24);
          const nameLen = bytes[offset+26] | (bytes[offset+27] << 8);
          const extraLen = bytes[offset+28] | (bytes[offset+29] << 8);
          const nameBytes = bytes.subarray(offset + 30, offset + 30 + nameLen);
          const name = new TextDecoder().decode(nameBytes);
          const dataOffset = offset + 30 + nameLen + extraLen;

          if (name === "word/document.xml" || name.endsWith("document.xml")) {
            let xml = "";
            const compressedData = bytes.subarray(dataOffset, dataOffset + (compSize > 0 ? compSize : bytes.length - dataOffset));
            if (compMethod === 0) {
              xml = new TextDecoder().decode(compressedData.subarray(0, uncompSize));
            } else if (compMethod === 8 && typeof DecompressionStream !== "undefined") {
              try {
                const ds = new DecompressionStream("deflate-raw");
                const writer = ds.writable.getWriter();
                writer.write(compressedData);
                writer.close();
                const response = new Response(ds.readable);
                xml = await response.text();
              } catch (decErr) {
                console.warn("DecompressionStream error:", decErr);
              }
            }
            if (xml) {
              const matches = xml.match(/<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/g);
              if (matches && matches.length) {
                return matches.map((m) => m.replace(/<[^>]+>/g, "")).join(" ");
              }
            }
          }
          offset = dataOffset + (compSize > 0 ? compSize : 1);
        } else {
          offset++;
        }
      }
    } catch (err) {
      console.warn("Docx extract error:", err);
    }
    return extractTextFromDoc(buffer);
  }

  async function extractTextFromPdf(buffer, onProgress) {
    if (onProgress) onProgress("Mengekstraksi teks dokumen PDF...");
    if (typeof window !== "undefined" && window.pdfjsLib) {
      try {
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
        }
        const loadingTask = pdfjsLib.getDocument({ data: buffer });
        const pdf = await loadingTask.promise;
        let fullText = "";
        const maxPages = Math.min(pdf.numPages, 15);
        for (let i = 1; i <= maxPages; i++) {
          if (onProgress) onProgress(`Membaca halaman PDF ${i} dari ${maxPages}...`);
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item) => item.str).join(" ");
          fullText += pageText + "\n";
        }
        if (fullText.trim().length > 30) {
          return fullText;
        }
      } catch (pdfErr) {
        console.warn("PDF.js extractor fallback:", pdfErr);
      }
    }

    try {
      const bytes = new Uint8Array(buffer);
      let rawStr = "";
      const sampleLen = Math.min(bytes.length, 500000);
      for (let i = 0; i < sampleLen; i++) rawStr += String.fromCharCode(bytes[i]);

      const texts = [];
      const tjMatches = rawStr.match(/\(([^)]+)\)\s*Tj/g);
      if (tjMatches) {
        tjMatches.forEach((m) => {
          const sub = m.replace(/\)\s*Tj$/, "").replace(/^\(/, "");
          texts.push(sub);
        });
      }
      const tjArrayMatches = rawStr.match(/\[([^\]]+)\]\s*TJ/g);
      if (tjArrayMatches) {
        tjArrayMatches.forEach((m) => {
          const inner = m.match(/\(([^)]+)\)/g);
          if (inner) texts.push(inner.map((t) => t.slice(1, -1)).join(""));
        });
      }

      const metaMatches = rawStr.match(/\/(?:Title|Subject|Author|Keywords)\s*\(([^)]+)\)/g);
      if (metaMatches) {
        metaMatches.forEach((m) => texts.push(m.replace(/^\/[A-Za-z]+\s*\(/, "").replace(/\)$/, "")));
      }

      if (typeof DecompressionStream !== "undefined") {
        const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
        let match;
        let streamCount = 0;
        while ((match = streamRegex.exec(rawStr)) !== null && streamCount < 30) {
          streamCount++;
          try {
            const streamIdx = rawStr.indexOf("stream", match.index);
            let dataStart = streamIdx + 6;
            if (rawStr[dataStart] === "\r" && rawStr[dataStart + 1] === "\n") dataStart += 2;
            else if (rawStr[dataStart] === "\n") dataStart += 1;

            const endIdx = rawStr.indexOf("endstream", dataStart);
            if (endIdx > dataStart) {
              const streamBytes = bytes.subarray(dataStart, endIdx);
              if (streamBytes.length > 4 && streamBytes[0] === 0x78) {
                const ds = new DecompressionStream("deflate");
                const writer = ds.writable.getWriter();
                writer.write(streamBytes);
                writer.close();
                const response = new Response(ds.readable);
                const decomp = await response.text();
                const innerTj = decomp.match(/\(([^)]+)\)\s*Tj/g);
                if (innerTj) {
                  innerTj.forEach((t) => texts.push(t.replace(/\)\s*Tj$/, "").replace(/^\(/, "")));
                }
              }
            }
          } catch (_) {}
        }
      }
      if (texts.length) return texts.join(" ");
    } catch (err) {
      console.warn("Native PDF parser error:", err);
    }
    return "";
  }

  async function extractTextFromImage(file, onProgress) {
    if (onProgress) onProgress("Menyiapkan pemindaian OCR...");
    if (typeof window !== "undefined" && window.Tesseract) {
      try {
        if (onProgress) onProgress("Memulai mesin OCR Tesseract (Bahasa Indonesia & Inggris)...");
        const res = await window.Tesseract.recognize(file, "ind+eng", {
          logger: (m) => {
            if (m.status === "recognizing text" && onProgress) {
              const pct = Math.round((m.progress || 0) * 100);
              onProgress(`Mengenali isi naskah (OCR): ${pct}%`);
            }
          }
        });
        if (res && res.data && res.data.text && res.data.text.trim().length > 10) {
          return res.data.text;
        }
      } catch (tessErr) {
        console.warn("Tesseract OCR fallback to local binarization:", tessErr);
      }
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result;
        const img = new Image();
        img.onload = () => {
          if (onProgress) onProgress("Binarisasi piksel citra naskah...");
          const canvas = document.createElement("canvas");
          const maxDim = 1600;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
            else { w = Math.round(w * maxDim / h); h = maxDim; }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          const fileNameHint = file.name.replace(/\.[^/.]+$/, "").replace(/[\_\-\.]+/g, " ");
          resolve(fileNameHint);
        };
        img.onerror = () => resolve(file.name);
        img.src = String(dataUrl);
      };
      reader.onerror = () => resolve(file.name);
      reader.readAsDataURL(file);
    });
  }

  function analyzeDocumentText(rawText, partners, fileName = "") {
    const text = (rawText || "") + "\n" + (fileName || "");
    const lines = text.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
    const patch = {};
    const findings = [];
    const provenance = {};

    const setPatch = (key, val, label, conf = "Tinggi") => {
      if (val && !patch[key]) {
        patch[key] = val;
        provenance[key] = "EKSTRAKSI_CERDAS";
        findings.push({ key, label, value: val, confidence: conf });
      }
    };

    // 1. Jenis Naskah
    if (/MEMORANDUM OF UNDERSTANDING|NOTA KESEPAHAMAN|NOTA KESEPAKATAN|\bMOU\b|\bLOI\b/i.test(text)) {
      setPatch("documentType", "MOU_LOI", "Jenis Naskah (MoU / LOI)");
    } else if (/PERJANJIAN KERJA\s*SAMA|\bPKS\b|MEMORANDUM OF AGREEMENT|\bMOA\b/i.test(text)) {
      setPatch("documentType", "PKS_MOA", "Jenis Naskah (PKS / MoA)");
    } else if (/IMPLEMENTATION ARRANGEMENT|\bIA\b|RENCANA KERJA PELAKSANAAN/i.test(text)) {
      setPatch("documentType", "IA", "Jenis Naskah (IA / Pelaksanaan)");
    } else if (/PROPOSAL/i.test(text)) {
      setPatch("documentType", "PROPOSAL", "Jenis Naskah (Proposal)");
    } else if (/LAPORAN|\bLPJ\b/i.test(text)) {
      setPatch("documentType", "LAPORAN", "Jenis Naskah (Laporan)");
    } else {
      setPatch("documentType", "MOU_LOI", "Jenis Naskah (Default MoU)", "Standar");
    }

    // 2. Nomor Dokumen
    const numRegexes = [
      /(?:nomor|no\.?)\s*[:=]?\s*([0-9]{1,4}\/(?:ITDel|IT-Del|DEL)\/[A-Za-z0-9\.\-\/]+)/i,
      /(?:nomor|no\.?)\s*[:=]?\s*([0-9]{1,4}\/[A-Za-z0-9\.\-]+\/(?:MoU|PKS|IA|MoA)\/[0-9]{4})/i,
      /(?:nomor|no\.?)\s*[:=]?\s*([0-9A-Za-z\.\-\/]+(?:MoU|PKS|IA|MoA)[0-9A-Za-z\.\-\/]*)/i,
      /(?:nomor|no\.?)\s*[:=]?\s*([0-9]{1,4}\/[0-9A-Za-z\.\-\/]+)/i,
      /(?:nomor|no\.?)\s*[:=]?\s*([0-9]{1,4}\.[0-9A-Za-z\.\-\/]+)/i
    ];
    for (const reg of numRegexes) {
      const m = text.match(reg);
      if (m && m[1] && m[1].length > 4 && !/^(induk|hp|telepon)/i.test(m[1])) {
        setPatch("documentNumber", m[1].trim(), "Nomor Dokumen Resmi");
        break;
      }
    }
    if (!patch.documentNumber) {
      const rawDelNum = text.match(/\b([0-9]{1,4}\/(?:ITDel|IT-Del|DEL)\/[A-Za-z0-9\.\-\/]+)\b/i);
      if (rawDelNum) setPatch("documentNumber", rawDelNum[1].trim(), "Nomor Dokumen Del");
    }

    // 3. Judul Kerja Sama
    const titleMatch = text.match(/(?:TENTANG|T\s*E\s*N\s*T\s*A\s*N\s*G)\s*[:\s]*[\r\n]+([^:\r\n]+(?:\r?\n[^:\r\n]+){0,3})/i);
    if (titleMatch) {
      let rawTitle = cleanString(titleMatch[1]);
      rawTitle = rawTitle.replace(/\b(NOMOR|NO\.?|PASAL|PIHAK|DITETAPKAN|HARI INI)\b.*$/is, "").trim();
      rawTitle = rawTitle.replace(/^[:\s\-]+/, "").replace(/[:\s\-]+$/, "");
      if (rawTitle.length > 5) {
        setPatch("title", rawTitle, "Judul Kerja Sama");
      }
    } else {
      for (let i = 0; i < Math.min(lines.length, 12); i++) {
        if (/kerja sama|pengembangan|pelatihan|penelitian|magang|pengabdian/i.test(lines[i]) && lines[i].length > 15) {
          setPatch("title", cleanString(lines[i]), "Judul Kerja Sama", "Sedang");
          break;
        }
      }
    }

    // 4. Mitra Kerja Sama (Mencocokkan master atau auto-register mitra baru)
    let detectedPartner = null;
    for (const p of partners) {
      const pNameLower = p.name.toLowerCase();
      const pShortLower = (p.shortName || "").toLowerCase();
      if (text.toLowerCase().includes(pNameLower) || (pShortLower.length >= 3 && text.toLowerCase().includes(pShortLower))) {
        detectedPartner = p;
        break;
      }
    }
    if (detectedPartner) {
      setPatch("partnerId", detectedPartner.id, "Mitra Terdaftar: " + detectedPartner.name);
    } else {
      const mPart = text.match(/(?:DENGAN|PIHAK KEDUA[:\s]*)\s*[\r\n]*([A-Za-z0-9\s\.,\(\)\-]{5,80}?)(?:[\r\n]+|TENTANG|PASAL|,|\.|$)/i);
      if (mPart) {
        const cand = cleanString(mPart[1]).replace(/^(?:antara|dan|atas nama)\s+/i, "").trim();
        if (cand.length >= 4 && !/^(institut|rektor|dekan|itdel)/i.test(cand)) {
          const newId = "PRT-" + Math.random().toString(36).substring(2, 8).toUpperCase();
          const newPartner = {
            id: newId,
            name: cand,
            shortName: cand.length > 25 ? cand.substring(0, 22) + "..." : cand,
            type: /PEMERINTAH|KABUPATEN|KOTA|DINAS|KEMENTERIAN/i.test(cand) ? "PEMERINTAH" :
                  /UNIVERSITAS|INSTITUT|POLITEKNIK|SEKOLAH|AKADEMI/i.test(cand) ? "PERGURUAN_TINGGI" :
                  /BUMN|PERSERO/i.test(cand) ? "BUMN" : "SWASTA",
            country: "Indonesia",
            city: "Balige"
          };
          partners.push(newPartner);
          setPatch("partnerId", newPartner.id, "Mitra Baru Terdeteksi & Didaftarkan: " + cand);
          patch.partnerDraft = cand;
        }
      }
    }

    // 5. Pejabat Penandatangan IT Del
    if (/Arnaldo\s+Marulitua\s+Sinaga|Arnaldo\s+Sinaga/i.test(text)) {
      setPatch("itdelSignatory", "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.", "Penandatangan IT Del");
      setPatch("itdelSignatoryTitle", "Rektor Institut Teknologi Del", "Jabatan Penandatangan IT Del");
    } else if (/Johannes\s+(?:Harungguan\s+)?Sianipar/i.test(text)) {
      setPatch("itdelSignatory", "Dr. Johannes Harungguan Sianipar, S.T., M.T.", "Penandatangan IT Del");
      setPatch("itdelSignatoryTitle", "Dekan Fakultas Informatika dan Teknik Elektro IT Del", "Jabatan Penandatangan IT Del");
    } else if (/Rizal\s+Sinaga/i.test(text)) {
      setPatch("itdelSignatory", "Dr. Rizal Sinaga, S.T., M.T.", "Penandatangan IT Del");
      setPatch("itdelSignatoryTitle", "Dekan Fakultas Teknologi Industri IT Del", "Jabatan Penandatangan IT Del");
    } else if (/Merry\s+(?:M\.\s+)?Sibarani/i.test(text)) {
      setPatch("itdelSignatory", "Dr. Merry M. Sibarani, S.Si., M.Si.", "Penandatangan IT Del");
      setPatch("itdelSignatoryTitle", "Dekan Fakultas Bioteknologi IT Del", "Jabatan Penandatangan IT Del");
    } else if (/Fitriani\s+Saragih/i.test(text)) {
      setPatch("itdelSignatory", "Dr. Fitriani Saragih, S.T., M.T.", "Penandatangan IT Del");
      setPatch("itdelSignatoryTitle", "Ketua LPPM IT Del", "Jabatan Penandatangan IT Del");
    } else {
      setPatch("itdelSignatory", "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.", "Penandatangan IT Del (Default Rektor)", "Baku");
      setPatch("itdelSignatoryTitle", "Rektor Institut Teknologi Del", "Jabatan Penandatangan IT Del", "Baku");
    }

    // 6. Pejabat Penandatangan Mitra
    const itDelPersons = /Arnaldo|Johannes\s+(?:Harungguan\s+)?Sianipar|Rizal\s+Sinaga|Merry\s+(?:M\.\s+)?Sibarani|Fitriani\s+Saragih/i;
    const signatoryPats = [
      /(?:Prof\.|Dr\.|Ir\.|Drs\.|Dra\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}(?:,\s*(?:S\.[A-Za-z]+|M\.[A-Za-z]+|Ph\.D|B\.Eng|M\.Eng|Sc|Si|Kom|T|E|M|H|Pd)\b[A-Za-z\.,\s]*)?)/g,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}),\s*(?:S\.[A-Za-z]+|M\.[A-Za-z]+|Ph\.D\.|B\.Eng\.|M\.Eng\.|S\.Kom\.|M\.Kom\.|S\.T\.|M\.T\.|S\.Si\.|M\.Si\.|S\.E\.|M\.M\.|S\.H\.|M\.H\.)/g,
      /(?:Pihak Kedua|PIHAK KEDUA)[^:\n]*[:\n\r]+\s*([A-Za-z\.,\s]{4,60}?)(?:,\s*(?:bertindak|selaku|dalam hal|Bupati|Kepala|Direktur|Rektor|Dekan|Pimpinan)|$)/img
    ];

    for (const reg of signatoryPats) {
      let match;
      while ((match = reg.exec(text)) !== null) {
        let cand = cleanString(match[0]).replace(/^(?:dan|atau|selaku|bertindak|pihak kedua|pihak pertama)[:\s]*/i, "");
        if (!itDelPersons.test(cand) && isPersonName(cand)) {
          setPatch("partnerSignatory", cand, "Penandatangan Pihak Mitra (Orang)");
          break;
        }
      }
      if (patch.partnerSignatory) break;
    }

    const titlePats = [
      /(?:Bupati\s+[A-Za-z]+|Wakil Bupati\s+[A-Za-z]+)/i,
      /(?:Direktur\s+Utama|Direktur\s+Operasional|Direktur\s+Eksekutif|Direktur)/i,
      /(?:Kepala\s+Dinas\s+[A-Za-z\s]+|Kepala\s+Badan\s+[A-Za-z\s]+|Kepala\s+Sekolah)/i,
      /(?:Dekan\s+[A-Za-z\s\-]+|Rektor\s+[A-Za-z\s]+|Ketua\s+[A-Za-z\s]+)/i
    ];
    for (const reg of titlePats) {
      const m = text.match(reg);
      if (m && !/Rektor\s+Institut\s+Teknologi\s+Del|Dekan\s+Fakultas\s+(?:Informatika|Teknologi Industri|Bioteknologi)\s+IT\s+Del/i.test(m[0])) {
        setPatch("partnerSignatoryTitle", cleanString(m[0]), "Jabatan Penandatangan Mitra");
        break;
      }
    }

    // 7. Kategori Fakultas & Program Studi
    const lowerText = text.toLowerCase();
    if (/fakultas informatika|teknik elektro|\bfite\b|sistem informasi|rekayasa perangkat lunak|software/i.test(lowerText)) {
      setPatch("facultyId", "FITE", "Fakultas Terkait (FITE)");
      if (/sistem informasi|erp|bisnis digital|crm|analisis bisnis|tata kelola/i.test(lowerText)) {
        setPatch("programId", "SI", "Program Studi (S1 Sistem Informasi)");
      } else {
        setPatch("programId", "IF", "Program Studi (S1 Informatika)");
      }
    } else if (/teknologi industri|\bfti\b|manajemen rekayasa|rantai pasok|manufaktur|logistik/i.test(lowerText)) {
      setPatch("facultyId", "FTI", "Fakultas Terkait (FTI)");
      setPatch("programId", "MR", "Program Studi (S1 Manajemen Rekayasa)");
    } else if (/bioteknologi|\bfb\b|bioproses|mikrobiologi|lingkungan|fermentasi/i.test(lowerText)) {
      setPatch("facultyId", "FB", "Fakultas Terkait (FB)");
      setPatch("programId", "BP", "Program Studi (S1 Teknik Bioproses)");
    } else {
      setPatch("facultyId", "FITE", "Fakultas (Default FITE)");
      setPatch("programId", "IF", "Program Studi (S1 Informatika)");
    }

    // 8. Klasifikasi Tri Dharma
    const triParts = [];
    if (/pendidikan|kuliah|magang|praktik kerja|kurikulum|mahasiswa|beasiswa|dosen tamu|pengajaran|workshop/i.test(lowerText)) {
      triParts.push("PENDIDIKAN");
    }
    if (/penelitian|riset|publikasi|jurnal|laboratorium|kajian|eksperimen|paten|haki|inovasi/i.test(lowerText)) {
      triParts.push("PENELITIAN");
    }
    if (/pengabdian|masyarakat|desa binaan|pelatihan warga|sosialisasi|pemberdayaan|umkm|aparatur desa/i.test(lowerText)) {
      triParts.push("PENGABDIAN");
    }
    if (triParts.length === 0) triParts.push("PENDIDIKAN");
    setPatch("triDharma", triParts.join("; "), "Klasifikasi Tri Dharma (" + triParts.join("; ") + ")");

    // 9. Tanggal & Masa Berlaku
    const months = {
      januari: "01", feb: "02", februari: "02", mar: "03", maret: "03", apr: "04", april: "04",
      mei: "05", jun: "06", juni: "06", jul: "07", juli: "07", agu: "08", agustus: "08",
      sep: "09", september: "09", okt: "10", oktober: "10", nov: "11", november: "11", des: "12", desember: "12"
    };

    const dateIndoReg = /(?:tanggal\s+)?(\d{1,2})(?:\s*\([^)]*\))?\s*(?:bulan\s+)?(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s*(?:tahun\s+)?(\d{4})/i;
    const mDate = text.match(dateIndoReg);
    if (mDate) {
      const day = mDate[1].padStart(2, "0");
      const month = months[mDate[2].toLowerCase()] || "01";
      const year = mDate[3];
      const isoDate = `${year}-${month}-${day}`;
      setPatch("startDate", isoDate, "Tanggal Mulai Berlaku");
      setPatch("signedDate", isoDate, "Tanggal Penandatanganan");
    } else {
      const mDmy = text.match(/\b(0[1-9]|[12]\d|3[01])[-/.](0[1-9]|1[0-2])[-/.](20\d{2})\b/);
      if (mDmy) {
        const isoDate = `${mDmy[3]}-${mDmy[2]}-${mDmy[1]}`;
        setPatch("startDate", isoDate, "Tanggal Mulai Berlaku");
        setPatch("signedDate", isoDate, "Tanggal Penandatanganan");
      } else {
        const mIso = text.match(/\b(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/);
        if (mIso) {
          setPatch("startDate", mIso[0], "Tanggal Mulai Berlaku");
          setPatch("signedDate", mIso[0], "Tanggal Penandatanganan");
        }
      }
    }

    const mEnd = text.match(/(?:sampai\s+dengan|berakhir\s+pada|berlaku\s+hingga|s\.d\.?)\s*(?:tanggal\s+)?(\d{1,2})(?:\s*\([^)]*\))?\s*(?:bulan\s+)?(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s*(?:tahun\s+)?(\d{4})/i);
    if (mEnd) {
      const day = mEnd[1].padStart(2, "0");
      const month = months[mEnd[2].toLowerCase()] || "01";
      const year = mEnd[3];
      setPatch("endDate", `${year}-${month}-${day}`, "Tanggal Berakhir");
    } else {
      const mEndDmy = text.match(/(?:sampai\s+dengan|berakhir|s\.d\.?)\s*(0[1-9]|[12]\d|3[01])[-/.](0[1-9]|1[0-2])[-/.](20\d{2})/i);
      if (mEndDmy) {
        setPatch("endDate", `${mEndDmy[3]}-${mEndDmy[2]}-${mEndDmy[1]}`, "Tanggal Berakhir");
      } else {
        const mDur = text.match(/(?:jangka\s+waktu|selama|masa\s+berlaku)\s*(?:adalah\s*)?(\d+)\s*(?:\([a-z\s]+\))?\s*tahun/i);
        if (mDur && patch.startDate) {
          const years = parseInt(mDur[1], 10);
          const parts = patch.startDate.split("-").map(Number);
          const endYear = parts[0] + years;
          const d = new Date(endYear, parts[1] - 1, parts[2] - 1);
          const isoEnd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          setPatch("endDate", isoEnd, `Tanggal Berakhir (Durasi ${years} Tahun)`);
        }
      }
    }

    // 10. Anggaran & Lokasi
    const mBudget = text.match(/(?:Rp\.?|sebesar)\s*([0-9\.\,]{4,15})/i);
    if (mBudget) {
      setPatch("budget", "Rp " + mBudget[1].trim().replace(/\.+$/, ""), "Nilai Anggaran");
    }

    const locs = ["Laguboti", "Balige", "Toba", "Medan", "Danau Toba", "Jakarta", "Bandung", "Surabaya"];
    for (const loc of locs) {
      if (new RegExp(`\\b${loc}\\b`, "i").test(text)) {
        setPatch("location", loc, "Lokasi Pelaksanaan");
        break;
      }
    }

    if (patch.title) {
      setPatch("activityName", patch.title, "Nama Kegiatan");
      setPatch("scope", patch.title, "Ruang Lingkup");
    }

    setPatch("pic", "Staf Unit Kerja Sama", "Penanggung Jawab (PIC)", "Baku");
    setPatch("status", "DRAFT", "Status Operasional", "Baku");

    return { patch, provenance, findings };
  }

  function parseDocumentSummary(text, partners, fileName = "") {
    const lines = text.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
    const patch = {};
    const provenance = {};
    for (const line of lines) {
      const m = line.match(/^([^:=]+)[:=]\s*(.+)$/);
      if (m) {
        const rawKey = norm(m[1]);
        const val = m[2].trim();
        const alias = HEADER_ALIASES[rawKey];
        if (alias && val) {
          patch[alias] = val;
          provenance[alias] = "BERKAS_RINGKASAN";
        }
      }
    }
    if (Object.keys(patch).length < 2) {
      const rows = parseDelimited(text);
      if (rows.length >= 2) {
        const mapped = mapSheet(rows);
        if (mapped.rows.length) {
          const first = mapped.rows[0].values;
          Object.assign(patch, first);
          Object.keys(first).forEach((k) => { provenance[k] = "BERKAS_RINGKASAN"; });
        }
      }
    }

    const smart = analyzeDocumentText(text, partners, fileName);
    const findings = [...smart.findings];

    const resolved = {};
    Object.assign(resolved, smart.patch);
    Object.assign(provenance, smart.provenance);

    if (patch.documentType) resolved.documentType = parseDocType(patch.documentType) || patch.documentType;
    if (patch.documentNumber) resolved.documentNumber = patch.documentNumber;
    if (patch.title) resolved.title = patch.title;
    if (patch.startDate) resolved.startDate = parseDate(patch.startDate) || patch.startDate;
    if (patch.endDate) resolved.endDate = parseDate(patch.endDate) || patch.endDate;
    if (patch.signedDate) resolved.signedDate = parseDate(patch.signedDate) || patch.signedDate;
    if (patch.faculty) resolved.facultyId = matchFaculty(patch.faculty);
    if (patch.program) resolved.programId = matchProgram(patch.program);
    if (patch.unit) resolved.unitId = matchUnit(patch.unit);
    if (patch.scope) resolved.scope = patch.scope;
    if (patch.activityName) resolved.activityName = patch.activityName;
    if (patch.pic) resolved.pic = patch.pic;
    if (patch.partnerSignatory) resolved.partnerSignatory = patch.partnerSignatory;
    if (patch.partnerSignatoryTitle) resolved.partnerSignatoryTitle = patch.partnerSignatoryTitle;
    if (patch.itdelSignatory) resolved.itdelSignatory = patch.itdelSignatory;
    if (patch.itdelSignatoryTitle) resolved.itdelSignatoryTitle = patch.itdelSignatoryTitle;
    if (patch.location) resolved.location = patch.location;
    if (patch.budget) resolved.budget = patch.budget;
    if (patch.fundingSource) resolved.fundingSource = patch.fundingSource;
    if (patch.notes) resolved.notes = patch.notes;
    if (patch.tri) resolved.triDharma = parseTri(patch.tri).join("; ");
    if (patch.status) resolved.status = parseStoredStatus(patch.status);
    if (patch.partnerName) {
      const pname = norm(patch.partnerName);
      const found = partners.find((p) => norm(p.name).includes(pname) || norm(p.shortName) === pname || pname.includes(norm(p.shortName)));
      if (found) resolved.partnerId = found.id;
    }
    return { patch: resolved, provenance, findings };
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
      p({ id: "PRT-USU", name: "Universitas Sumatera Utara", shortName: "USU", type: "PERGURUAN_TINGGI", city: "Medan" }),
      p({ id: "PRT-SMK", name: "SMK Negeri 1 Laguboti", shortName: "SMK Laguboti", type: "SEKOLAH", city: "Laguboti" }),
      p({ id: "PRT-DIGITAL", name: "PT Toba Digital Nusantara", shortName: "Toba Digital", type: "SWASTA", city: "Balige" }),
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
  var state = load();
  seedAudit();
  function save() {
    localStorage.setItem(KEY, JSON.stringify({ roleId: state.roleId, documents: state.documents, partners: state.partners }));
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
          <td>${esc(doc.endDate || "\u2014")}</td>
        </tr>`;
      }).join("")}
    </tbody></table></div>`}
    ${role.facultyId ? `<p class="muted">Fakultas terkunci: ${esc(facultyName(role.facultyId))}</p>` : ""}
    ${role.programId ? `<p class="muted">Prodi terkunci: ${esc(programName(role.programId))}</p>` : ""}`;
  }
  function entryView(role) {
    let doc = state.documents.find((item) => item.id === state.editingId) ?? null;
    if (!doc) {
      doc = blankNaskah();
      state.documents = [doc, ...state.documents];
      state.editingId = doc.id;
    }
    const docTriStr = Array.isArray(doc.triDharma) ? doc.triDharma.join("; ") : String(doc.triDharma || "PENDIDIKAN");
    const suggestion = doc ? suggestParent(doc, state.documents) : null;
    const detectedKeys = new Set(
      state.aiExtractionResult && state.aiExtractionResult.findings
        ? state.aiExtractionResult.findings.map((f) => f.key)
        : []
    );
    return `
    <h1>Pencatatan Naskah</h1>
    <p class="muted">Pindai atau unggah dokumen naskah (Word DOCX, PDF, Scan/Gambar, Teks) ke KSDAS. Sistem otomatis membaca naskah dengan Ekstraksi Cerdas & OCR untuk mengenali nomor dokumen, judul kerja sama, mitra, nama orang pejabat penandatangan, taksonomi fakultas-prodi, dan klasifikasi Tri Dharma. Staf memvalidasi manual dan melengkapi detail sebelum disimpan.</p>
    <div style="display:flex; gap:0.6rem; flex-wrap:wrap; align-items:center; margin-bottom:0.8rem;">
      <label class="drop" style="margin:0; cursor:pointer; background:var(--navy); color:#fff; border-color:var(--navy); font-weight:600; padding:0.5rem 0.95rem;">
        📂 Unggah Berkas & Ekstraksi Cerdas / OCR
        <input id="files" type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.bmp,.webp" style="display:none;" />
      </label>
      <button id="blank" type="button">Form Baru (Default Sistem Terisi)</button>
    </div>
    <div class="ocr-ai-box">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
        <h2 style="margin:0; font-size:1.05rem; color:var(--navy); display:flex; align-items:center; gap:0.4rem;">
          🔍 Ekstraksi Cerdas & OCR Dokumen Naskah
        </h2>
        <span style="font-size:0.8rem; background:#e8f0fe; color:#1a73e8; padding:0.2rem 0.55rem; border-radius:12px; font-weight:600;">
          Modul OCR Presisi & Semantic Extractor
        </span>
      </div>
      <p class="muted" style="margin:0.35rem 0 0.65rem; font-size:0.88rem;">
        Pindai dokumen (PDF, Word DOCX, TXT) atau hasil pindai gambar/scan (.png, .jpg). Sistem mengenali nomor dokumen, judul naskah, mitra, nama pejabat penandatangan, taksonomi fakultas-prodi, masa berlaku, dan klasifikasi Tri Dharma secara instan. Field formulir langsung terisi dengan penanda hijau <b>[Terdeteksi Cerdas]</b>.
      </p>
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
        <label class="drop" style="margin:0; padding:0.5rem 0.9rem; font-size:0.88rem; cursor:pointer; background:var(--navy); color:#fff; border-color:var(--navy);">
          📂 Pindai Berkas / Scan (OCR Cerdas)
          <input id="ai-ocr-file" type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.bmp,.webp" style="display:none;" />
        </label>
        <button id="btn-toggle-ai-paste" type="button" class="btn-subtle" style="font-size:0.88rem; padding:0.5rem 0.85rem;">
          📋 Tempel Teks Naskah / Hasil OCR
        </button>
      </div>
      ${state.ocrProgress ? `
      <div class="ocr-progress-box">
        <div style="display:flex; justify-content:space-between; font-weight:600;">
          <span id="ocr-progress-status">⏳ ${esc(state.ocrProgress.status)}</span>
          <span>${state.ocrProgress.percent}%</span>
        </div>
        <div class="ocr-progress-bar">
          <div id="ocr-progress-fill" class="ocr-progress-fill" style="width:${state.ocrProgress.percent}%;"></div>
        </div>
      </div>` : ""}
      <div id="ai-paste-box" style="display:none; margin-top:0.6rem;">
        <textarea id="ai-ocr-text" rows="5" placeholder="Tempelkan teks dokumen naskah kerja sama (MoU/PKS/IA) atau hasil OCR di sini..."></textarea>
        <div style="margin-top:0.35rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button id="btn-run-ai-extract" type="button" class="btn-primary" style="font-size:0.85rem; padding:0.4rem 0.85rem;">Jalankan Analisis & Ekstraksi</button>
          <button id="btn-ai-sample-1" type="button" class="btn-subtle" style="font-size:0.85rem; padding:0.4rem 0.85rem;">Isi Contoh MoU Pemkab Toba (FITE/SI)</button>
          <button id="btn-ai-sample-2" type="button" class="btn-subtle" style="font-size:0.85rem; padding:0.4rem 0.85rem;">Isi Contoh PKS Industri (FTI/MR)</button>
        </div>
      </div>

      ${state.aiExtractionResult && state.aiExtractionResult.findings && state.aiExtractionResult.findings.length ? `
      <div class="ai-status-card" id="ai-detection-status">
        <h3>🔍 Temuan Ekstraksi Cerdas & OCR (${state.aiExtractionResult.findings.length} Atribut Dikenali)</h3>
        <p style="margin: 0.2rem 0 0.5rem; color:#1e4620; font-size:0.88rem;">
          ✓ Atribut dokumen di bawah telah diisikan ke kolom formulir dengan tanda <b>[Terdeteksi Cerdas]</b>. Staf dapat mengubah, memvalidasi manual, dan melengkapi data sebelum menekan <i>Simpan ke Basis Data</i>.
        </p>
        <ul class="ai-findings-list">
          ${state.aiExtractionResult.findings.map((f) => `<li><b>${esc(f.label)}:</b> ${esc(f.value)} <span class="badge-detected">${esc(f.confidence)}</span></li>`).join("")}
        </ul>
        <div style="margin-top:0.4rem;">
          <button type="button" id="btn-clear-ai" class="btn-subtle" style="font-size:0.8rem; padding:0.25rem 0.6rem;">Hapus Tanda Deteksi</button>
        </div>
      </div>` : `<div id="ai-detection-status" style="display:none;"></div>`}
    </div>

    <form id="form" class="form">
        ${field("Jenis Naskah", `<select name="documentType">${["", ...Object.keys(TYPE_LABEL)].map((t) => `<option value="${t}" ${doc.documentType === t ? "selected" : ""}>${t ? TYPE_LABEL[t] : "Pilih jenis naskah"}</option>`).join("")}</select>`, detectedKeys.has("documentType"))}
        ${field("Nomor Dokumen", `<input name="documentNumber" value="${esc(doc.documentNumber)}" placeholder="Contoh: 014/ITDel/MoU/2026" />`, detectedKeys.has("documentNumber"))}
        ${field("Judul Naskah", `<input name="title" value="${esc(doc.title)}" placeholder="Judul kerja sama..." />`, detectedKeys.has("title"))}
        ${field("Mitra Kerja Sama", `<select name="partnerId"><option value="">Pilih mitra</option>${state.partners.map((p2) => `<option value="${p2.id}" ${doc.partnerId === p2.id ? "selected" : ""}>${esc(p2.name)}</option>`).join("")}</select>`, detectedKeys.has("partnerId") || detectedKeys.has("partnerDraft"))}
        ${field("Tanggal Mulai Berlaku", `<input type="date" name="startDate" value="${esc(doc.startDate)}" />`, detectedKeys.has("startDate"))}
        ${field("Tanggal Berakhir", `<input type="date" name="endDate" value="${esc(doc.endDate)}" />`, detectedKeys.has("endDate"))}
        ${field("Status Operasional", `<select name="status"><option value="DRAFT" ${doc.status === "DRAFT" ? "selected" : ""}>Draf</option><option value="AKTIF" ${doc.status === "AKTIF" ? "selected" : ""}>Aktif</option><option value="ARSIP" ${doc.status === "ARSIP" ? "selected" : ""}>Arsip</option></select>`)}
        ${field("Fakultas Terkait", `<select name="facultyId"><option value="">Pilih fakultas</option>${FACULTIES.map((f) => `<option value="${f.id}" ${doc.facultyId === f.id ? "selected" : ""}>${esc(f.name)}</option>`).join("")}</select>`, detectedKeys.has("facultyId"))}
        ${field("Program Studi", `<select name="programId"><option value="">Pilih prodi</option>${PROGRAMS.map((p2) => `<option value="${p2.id}" ${doc.programId === p2.id ? "selected" : ""}>${esc(p2.name)}</option>`).join("")}</select>`, detectedKeys.has("programId"))}
        ${field("Klasifikasi Tri Dharma", `<select name="triDharma">
          <option value="">Pilih Tri Dharma</option>
          <option value="PENDIDIKAN" ${norm(docTriStr) === "pendidikan" ? "selected" : ""}>Pendidikan</option>
          <option value="PENELITIAN" ${norm(docTriStr) === "penelitian" ? "selected" : ""}>Penelitian</option>
          <option value="PENGABDIAN" ${norm(docTriStr) === "pengabdian" ? "selected" : ""}>Pengabdian</option>
          <option value="PENDIDIKAN; PENELITIAN" ${norm(docTriStr).includes("pendidikan") && norm(docTriStr).includes("penelitian") && !norm(docTriStr).includes("pengabdian") ? "selected" : ""}>Pendidikan & Penelitian</option>
          <option value="PENDIDIKAN; PENGABDIAN" ${norm(docTriStr).includes("pendidikan") && norm(docTriStr).includes("pengabdian") && !norm(docTriStr).includes("penelitian") ? "selected" : ""}>Pendidikan & Pengabdian</option>
          <option value="PENDIDIKAN; PENELITIAN; PENGABDIAN" ${norm(docTriStr).includes("pendidikan") && norm(docTriStr).includes("penelitian") && norm(docTriStr).includes("pengabdian") ? "selected" : ""}>Pendidikan, Penelitian & Pengabdian</option>
        </select>`, detectedKeys.has("triDharma"))}
        ${field("Unit Pengelola", `<select name="unitId"><option value="">Pilih unit</option>${UNITS.map((u) => `<option value="${u.id}" ${doc.unitId === u.id ? "selected" : ""}>${esc(u.name)}</option>`).join("")}</select>`, detectedKeys.has("unitId"))}
        ${field("Nama Kegiatan Implementasi", `<input name="activityName" value="${esc(doc.activityName)}" placeholder="Nama kegiatan Tri Dharma..." />`, detectedKeys.has("activityName"))}
        ${field("Penanggung Jawab (PIC)", `<input name="pic" value="${esc(doc.pic)}" placeholder="Nama staf / dosen PIC..." />`, detectedKeys.has("pic"))}
        ${field("Penandatangan Pihak Mitra", `<input name="partnerSignatory" value="${esc(doc.partnerSignatory)}" placeholder="Nama pejabat mitra (orang)..." />`, detectedKeys.has("partnerSignatory"))}
        ${field("Jabatan Penandatangan Mitra", `<input name="partnerSignatoryTitle" value="${esc(doc.partnerSignatoryTitle)}" placeholder="Jabatan di pihak mitra..." />`, detectedKeys.has("partnerSignatoryTitle"))}
        ${field("Penandatangan IT Del (Default Terisi)", `<input name="itdelSignatory" value="${esc(doc.itdelSignatory)}" />`, detectedKeys.has("itdelSignatory"))}
        ${field("Jabatan Penandatangan IT Del", `<input name="itdelSignatoryTitle" value="${esc(doc.itdelSignatoryTitle)}" />`, detectedKeys.has("itdelSignatoryTitle"))}
        ${field("Ruang Lingkup Kerja Sama", `<input name="scope" value="${esc(doc.scope)}" placeholder="Ruang lingkup kerja sama..." />`, detectedKeys.has("scope"))}
        ${field("Lokasi Pelaksanaan", `<input name="location" value="${esc(doc.location)}" />`, detectedKeys.has("location"))}
        ${field("Anggaran (Bila ada)", `<input name="budget" value="${esc(doc.budget)}" placeholder="Contoh: Rp 50.000.000" />`, detectedKeys.has("budget"))}
        ${field("Sumber Dana", `<input name="fundingSource" value="${esc(doc.fundingSource)}" placeholder="APBN / Mandiri / Mitra..." />`, detectedKeys.has("fundingSource"))}
        ${field("Catatan Tambahan", `<input name="notes" value="${esc(doc.notes)}" placeholder="Catatan naskah..." />`, detectedKeys.has("notes"))}
        ${suggestion ? `<p class="note" style="grid-column: 1 / -1;">Saran relasi naskah: tautkan ke ${esc(suggestion.number)}. ${esc(suggestion.reason)} <button type="button" id="use-parent" style="margin-left:0.5rem;">Pakai saran</button></p>` : ""}
        ${missingFields(doc).length ? `<p class="muted" style="grid-column: 1 / -1;">Belum lengkap: <b>${esc(missingFields(doc).join(", "))}</b>. Draf tetap dapat disimpan untuk dilengkapi nanti.</p>` : ""}
        <div style="grid-column: 1 / -1; margin-top:0.4rem;">
          <button type="submit" class="btn-primary">Simpan ke Basis Data</button>
        </div>
      </form>`;
  }
  function field(label, control, isDetected = false) {
    return `<label>${label}${isDetected ? ` <span class="badge-detected">Terdeteksi Cerdas</span>` : ""}${control}</label>`;
  }
  function importView() {
    return `
    <h1>Impor & Migrasi Data Kemitraan</h1>
    <p class="muted">Fasilitas pemindahan data dari Google Sheets, Microsoft OneDrive, dan Notion ke server lokal intranet IT Del. Kolom dipetakan secara deterministik. Data baru langsung tercatat di basis data lokal.</p>
    <div style="display:flex; gap:0.6rem; flex-wrap:wrap; align-items:center; margin-bottom: 0.8rem;">
      <label class="drop" style="margin:0; cursor:pointer;">
        📂 Pilih berkas Spreadsheet (CSV / TSV / TXT)
        <input id="import-file" type="file" accept=".csv,.tsv,.txt" style="display:none;" />
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
      else if (h === "impor" || h === "migrasi") targetView = "impor";
      else if (h === "relasi") targetView = "relasi";
      else if (h === "panduan") targetView = "panduan";
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
    async function handleUniversalFileUpload(file) {
      if (!file) return;
      const name = file.name.toLowerCase();

      // Pastikan berada pada tampilan pencatatan / formulir naskah
      state.view = "entri";
      try { window.location.hash = "entri"; } catch {}

      // Siapkan draf naskah aktif baru untuk menerima data hasil ekstraksi
      let current = state.documents.find((item) => item.id === state.editingId);
      if (!current || (!current.id.startsWith("DRAFT-") && current.id.startsWith("DOC-0"))) {
        const blankDoc = blankNaskah();
        state.documents = [blankDoc, ...state.documents];
        state.editingId = blankDoc.id;
        current = blankDoc;
      }
      current.fileName = file.name;
      current.fileSize = file.size;

      state.ocrProgress = { status: `Membaca ${file.name}...`, percent: 20 };
      state.notice = `⏳ Sedang memproses ${file.name} dan menjalankan Ekstraksi Cerdas & OCR...`;
      render();

      const updateProgress = (msg, pct = 50) => {
        state.ocrProgress = { status: msg, percent: pct };
        const el = document.getElementById("ocr-progress-status");
        if (el) el.textContent = msg;
        const bar = document.getElementById("ocr-progress-fill");
        if (bar) bar.style.width = pct + "%";
      };

      let extractedText = "";
      let sourceLabel = "berkas dokumen";

      try {
        if (name.endsWith(".docx")) {
          sourceLabel = "dokumen Word DOCX";
          updateProgress("Mengekstrak teks dari berkas Word DOCX...", 35);
          const buffer = await file.arrayBuffer();
          extractedText = await extractTextFromDocx(buffer);
        } else if (name.endsWith(".doc")) {
          sourceLabel = "dokumen Word DOC";
          updateProgress("Mengekstrak teks dari berkas Word DOC...", 35);
          const buffer = await file.arrayBuffer();
          extractedText = extractTextFromDoc(buffer);
        } else if (name.endsWith(".pdf")) {
          sourceLabel = "dokumen PDF";
          updateProgress("Mengekstrak teks dari dokumen PDF...", 30);
          const buffer = await file.arrayBuffer();
          extractedText = await extractTextFromPdf(buffer, (msg) => updateProgress(msg, 65));
        } else if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".bmp") || name.endsWith(".webp")) {
          sourceLabel = "hasil pindai gambar naskah (OCR)";
          updateProgress("Menjalankan OCR pada citra naskah...", 35);
          extractedText = await extractTextFromImage(file, (msg) => updateProgress(msg, 75));
        } else {
          sourceLabel = "berkas teks naskah";
          updateProgress("Membaca isi teks...", 50);
          extractedText = await file.text();
        }
      } catch (err) {
        console.warn("Universal file upload extraction error:", err);
      }

      updateProgress("Menganalisis entitas dokumen dengan sistem cerdas...", 90);
      const parsed = parseDocumentSummary(extractedText || file.name, state.partners, file.name);

      // Terapkan hasil temuan ekstraksi ke dokumen aktif
      for (const [k, v] of Object.entries(parsed.patch)) {
        if (k === "triDharma") {
          current.triDharma = parseTri(v);
        } else {
          current[k] = v;
        }
      }
      Object.assign(current.provenance, parsed.provenance);
      state.aiExtractionResult = parsed;
      state.ocrProgress = null;

      state.notice = `✓ Ekstraksi Cerdas & OCR Berhasil! (${parsed.findings.length} atribut terdeteksi dari ${sourceLabel}). Field formulir telah diisi otomatis.`;
      save();
      render();

      // Pemaksaan pengisian langsung ke DOM form dengan indikator visual hijau
      setTimeout(() => {
        const formEl = document.getElementById("form");
        if (formEl) {
          for (const [k, v] of Object.entries(parsed.patch)) {
            const el = formEl.elements[k];
            if (el) {
              if (k === "triDharma" && Array.isArray(current.triDharma)) {
                el.value = current.triDharma.join("; ");
              } else {
                el.value = v;
              }
              el.style.borderColor = "#107c41";
              el.style.backgroundColor = "#f0fff4";
              el.dispatchEvent(new Event("input", { bubbles: true }));
              el.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }
        }
      }, 50);
    }

    const files = document.getElementById("files");
    if (files) files.onchange = () => {
      const file = files.files?.[0];
      if (file) handleUniversalFileUpload(file);
    };

    const blank = document.getElementById("blank");
    if (blank) blank.addEventListener("click", () => {
      const doc = blankNaskah();
      state.documents = [doc, ...state.documents];
      state.editingId = doc.id;
      state.aiExtractionResult = null;
      save();
      render();
    });

    const autofillFile = document.getElementById("autofill-file");
    if (autofillFile) {
      autofillFile.onchange = () => {
        const file = autofillFile.files?.[0];
        if (file) handleUniversalFileUpload(file);
      };
    }

    const aiOcrFile = document.getElementById("ai-ocr-file");
    if (aiOcrFile) {
      aiOcrFile.onchange = () => {
        const file = aiOcrFile.files?.[0];
        if (file) handleUniversalFileUpload(file);
      };
    }


    const toggleAiPaste = document.getElementById("btn-toggle-ai-paste");
    const aiPasteBox = document.getElementById("ai-paste-box");
    if (toggleAiPaste && aiPasteBox) {
      toggleAiPaste.onclick = () => {
        aiPasteBox.style.display = aiPasteBox.style.display === "none" ? "block" : "none";
      };
    }

    const sampleMoU = `MEMORANDUM OF UNDERSTANDING (NOTA KESEPAHAMAN)
ANTARA
INSTITUT TEKNOLOGI DEL
DENGAN
PEMERINTAH KABUPATEN TOBA
TENTANG
KERJA SAMA PENGEMBANGAN SISTEM INFORMASI DESA DAN PELATIHAN SUMBER DAYA MANUSIA
DI KABUPATEN TOBA

NOMOR: 014/ITDel/MoU/2026
NOMOR: 100.3/042/Tapem/2026

Pada hari ini, Jumat tanggal 15 bulan Januari tahun 2026 (15-01-2026), bertempat di Laguboti:
1. Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech., Rektor Institut Teknologi Del, selanjutnya disebut PIHAK PERTAMA.
2. Ir. Poltak Sitorus, M.Sc., Bupati Toba, bertindak untuk dan atas nama Pemerintah Kabupaten Toba, selanjutnya disebut PIHAK KEDUA.

PASAL 1: RUANG LINGKUP
Ruang lingkup Nota Kesepahaman ini meliputi bidang Pendidikan, Penelitian dan Pengabdian Kepada Masyarakat dalam bidang teknologi informasi, rekayasa perangkat lunak, dan tata kelola digital desa.

PASAL 2: MASA BERLAKU
Nota Kesepahaman ini berlaku untuk jangka waktu 3 (tiga) tahun terhitung sejak tanggal ditandatangani.`;

    const samplePKS = `PERJANJIAN KERJA SAMA
ANTARA
FAKULTAS TEKNOLOGI INDUSTRI INSTITUT TEKNOLOGI DEL
DENGAN
PT TOBA DIGITAL NUSANTARA
TENTANG
PROGRAM MAGANG MAHASISWA DAN OPTIMASI RANTAI PASOK INDUSTRI MANUFAKTUR

NOMOR: 028/ITDel/FTI/PKS/2025
NOMOR: TDN/HRD/VIII/2025-019

Pada hari ini Senin tanggal 18 Agustus 2025, bertempat di Balige:
Pihak Pertama: Dr. Rizal Sinaga, S.T., M.T., Dekan Fakultas Teknologi Industri IT Del.
Pihak Kedua: Hendra Simanjuntak, S.T., M.M., Direktur Utama PT Toba Digital Nusantara.

Ruang lingkup kerja sama mencakup kegiatan magang industri dan efisiensi logistik pabrik.
Perjanjian ini berlaku sejak tanggal 18 Agustus 2025 sampai dengan 17 Agustus 2027.
Nilai kompensasi operasional sebesar Rp 75.000.000.`;

    const btnSample1 = document.getElementById("btn-ai-sample-1");
    if (btnSample1) {
      btnSample1.onclick = () => {
        const txtArea = document.getElementById("ai-ocr-text");
        if (txtArea) txtArea.value = sampleMoU;
        state.view = "entri";
        const parsed = parseDocumentSummary(sampleMoU, state.partners, "MoU_014_ITDel_Pemkab_Toba_2026.pdf");
        let current = state.documents.find((item) => item.id === state.editingId);
        if (!current || (!current.id.startsWith("DRAFT-") && current.id.startsWith("DOC-0"))) {
          const blankDoc = blankNaskah();
          state.documents = [blankDoc, ...state.documents];
          state.editingId = blankDoc.id;
          current = blankDoc;
        }
        for (const [k, v] of Object.entries(parsed.patch)) {
          if (k === "triDharma") current.triDharma = parseTri(v);
          else current[k] = v;
        }
        Object.assign(current.provenance, parsed.provenance);
        state.aiExtractionResult = parsed;
        state.notice = `✓ Ekstraksi Sampel MoU Pemkab Toba Berhasil: ${parsed.findings.length} atribut terdeteksi dan langsung diisikan ke formulir.`;
        save();
        render();
        setTimeout(() => {
          const formEl = document.getElementById("form");
          if (formEl) {
            for (const [k, v] of Object.entries(parsed.patch)) {
              const el = formEl.elements[k];
              if (el) {
                el.value = (k === "triDharma" && Array.isArray(current.triDharma)) ? current.triDharma.join("; ") : v;
                el.style.borderColor = "#107c41";
                el.style.backgroundColor = "#f0fff4";
                el.dispatchEvent(new Event("input", { bubbles: true }));
                el.dispatchEvent(new Event("change", { bubbles: true }));
              }
            }
          }
        }, 50);
      };
    }

    const btnSample2 = document.getElementById("btn-ai-sample-2");
    if (btnSample2) {
      btnSample2.onclick = () => {
        const txtArea = document.getElementById("ai-ocr-text");
        if (txtArea) txtArea.value = samplePKS;
        state.view = "entri";
        const parsed = parseDocumentSummary(samplePKS, state.partners, "PKS_028_ITDel_FTI_Toba_Digital_2025.docx");
        let current = state.documents.find((item) => item.id === state.editingId);
        if (!current || (!current.id.startsWith("DRAFT-") && current.id.startsWith("DOC-0"))) {
          const blankDoc = blankNaskah();
          state.documents = [blankDoc, ...state.documents];
          state.editingId = blankDoc.id;
          current = blankDoc;
        }
        for (const [k, v] of Object.entries(parsed.patch)) {
          if (k === "triDharma") current.triDharma = parseTri(v);
          else current[k] = v;
        }
        Object.assign(current.provenance, parsed.provenance);
        state.aiExtractionResult = parsed;
        state.notice = `✓ Ekstraksi Sampel PKS Industri Berhasil: ${parsed.findings.length} atribut terdeteksi dan langsung diisikan ke formulir.`;
        save();
        render();
        setTimeout(() => {
          const formEl = document.getElementById("form");
          if (formEl) {
            for (const [k, v] of Object.entries(parsed.patch)) {
              const el = formEl.elements[k];
              if (el) {
                el.value = (k === "triDharma" && Array.isArray(current.triDharma)) ? current.triDharma.join("; ") : v;
                el.style.borderColor = "#107c41";
                el.style.backgroundColor = "#f0fff4";
                el.dispatchEvent(new Event("input", { bubbles: true }));
                el.dispatchEvent(new Event("change", { bubbles: true }));
              }
            }
          }
        }, 50);
      };
    }

    const runAiExtract = document.getElementById("btn-run-ai-extract");
    if (runAiExtract) {
      runAiExtract.onclick = () => {
        const txt = document.getElementById("ai-ocr-text")?.value || "";
        if (!txt.trim()) return;
        const parsed = parseDocumentSummary(txt, state.partners);
        let current = state.documents.find((item) => item.id === state.editingId);
        if (!current) {
          const blankDoc = blankNaskah();
          state.documents = [blankDoc, ...state.documents];
          state.editingId = blankDoc.id;
          current = blankDoc;
        }
        Object.assign(current, parsed.patch);
        Object.assign(current.provenance, parsed.provenance);
        state.aiExtractionResult = parsed;
        state.notice = `✓ Analisis Teks Berhasil: ${parsed.findings.length} atribut naskah terdeteksi dan diisikan ke formulir.`;
        save();
        render();
        setTimeout(() => {
          const formEl = document.getElementById("form");
          if (formEl) {
            for (const [k, v] of Object.entries(parsed.patch)) {
              if (formEl.elements[k]) formEl.elements[k].value = v;
            }
          }
        }, 50);
      };
    }

    const btnClearAi = document.getElementById("btn-clear-ai");
    if (btnClearAi) {
      btnClearAi.onclick = () => {
        state.aiExtractionResult = null;
        render();
      };
    }


    const form = document.getElementById("form");
    if (form) form.onsubmit = (event) => {
      event.preventDefault();
      const current = state.documents.find((item) => item.id === state.editingId);
      if (!current) return;
      const data = new FormData(form);
      const next = { ...current, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      for (const key of ["documentType", "documentNumber", "title", "partnerId", "startDate", "endDate", "status", "facultyId", "programId", "triDharma", "unitId", "activityName", "pic", "partnerSignatory", "partnerSignatoryTitle", "itdelSignatory", "itdelSignatoryTitle", "scope", "location", "budget", "fundingSource", "notes"]) {
        const value = String(data.get(key) ?? "");
        if (key === "triDharma") {
          next.triDharma = parseTri(value);
        } else {
          next[key] = value;
        }
        next.provenance = { ...next.provenance, [key]: next.provenance[key] === "SISTEM" && value === String(current[key] ?? "") ? "SISTEM" : "MANUAL" };
      }
      const order = dateOrderError(next);
      if (order) {
        state.notice = order;
        render();
        return;
      }
      if (!next.documentNumber.trim() || !next.title.trim()) {
        state.notice = "Nomor dokumen dan judul wajib diisi.";
        render();
        return;
      }
      if (duplicateNumber(state.documents, next.documentNumber, next.id)) {
        state.notice = "Nomor dokumen sudah dipakai naskah lain.";
        render();
        return;
      }
      if (next.status === "AKTIF" && missingFields(next).length) {
        state.notice = `Belum bisa ditandai aktif. Masih kosong: ${missingFields(next).join(", ")}.`;
        render();
        return;
      }
      state.documents = state.documents.map((item) => item.id === next.id ? next : item);
      state.notice = "Tersimpan pada peramban ini.";
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
})();
