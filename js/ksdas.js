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
      signedDate: "",
      startDate: "",
      endDate: "",
      status: "DRAFT",
      scope: "",
      facultyId: "",
      programId: "",
      unitId: "",
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
      uploadedAt: stamp,
      updatedAt: stamp,
      provenance: {}
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
    if (filters.tri) list = list.filter((d) => d.triDharma.includes(filters.tri));
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
        doc.triDharma.map((t) => TRI_LABEL[t]).join("; "),
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
      itdelSignatory: "Pejabat Contoh IT Del",
      itdelSignatoryTitle: "Wakil Rektor contoh",
      pic: "Staf Contoh UKS",
      location: "Sitoluama",
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
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        return {
          roleId: saved.roleId || "STAFF",
          view: "beranda",
          documents: saved.documents?.length ? saved.documents : seedDocuments(),
          partners: saved.partners?.length ? saved.partners : seedPartners(),
          filters: { ...EMPTY_FILTERS },
          sortKey: "endDate",
          sortDir: "asc",
          editingId: null,
          notice: ""
        };
      }
    } catch {
    }
    return {
      roleId: "STAFF",
      view: "beranda",
      documents: seedDocuments(),
      partners: seedPartners(),
      filters: { ...EMPTY_FILTERS },
      sortKey: "endDate",
      sortDir: "asc",
      editingId: null,
      notice: ""
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
        <p class="foot">Prototipe pencatatan. Bukan server produksi.</p>
      </aside>
      <div>
        <header>
          <label>Peran tampilan
            <select id="role">${ROLES.map((item) => `<option value="${item.id}" ${item.id === role.id ? "selected" : ""}>${esc(item.name)}</option>`).join("")}</select>
          </label>
        </header>
        <main>
          <p class="muted">${esc(role.detail)}. Pengganti peran ini hanya untuk prototipe, bukan SSO.</p>
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
    <p class="muted">Sepuluh naskah di layar ini hanya contoh. Google Sheets, Drive, OneDrive, dan Notion tidak tersambung. KSDAS di server kampus yang menggantikan berkas tersebar itu.</p>
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
    return `
    <h1>Naskah</h1>
    <p class="muted">${rows.length} baris pada lingkup ini. Cari, saring, urutkan, lalu unduh.</p>
    <div class="row">
      <input id="q" placeholder="Cari nomor, judul, mitra" value="${esc(state.filters.q)}" />
      <select id="year"><option value="">Semua tahun</option>${years.map((y) => `<option ${state.filters.year === y ? "selected" : ""}>${y}</option>`).join("")}</select>
      <select id="kind"><option value="">Semua jenis</option>${Object.keys(TYPE_LABEL).map((t) => `<option value="${t}" ${state.filters.documentType === t ? "selected" : ""}>${TYPE_LABEL[t]}</option>`).join("")}</select>
      <button id="clear" type="button">Bersihkan</button>
      <button id="csv" type="button">Unduh CSV</button>
      <button id="go-analisis" type="button">Buat analisis</button>
    </div>
    ${rows.length === 0 ? `<p>Tidak ada naskah yang cocok dengan saringan ini.</p>` : `<div class="tablewrap"><table><thead><tr><th data-sort="documentNumber">Nomor</th><th data-sort="title">Judul</th><th data-sort="partner">Mitra</th><th data-sort="status">Status</th><th data-sort="endDate">Berakhir</th></tr></thead><tbody>
      ${rows.map((doc) => `<tr><td><button data-open="${doc.id}" class="link">${esc(doc.documentNumber || "Tanpa nomor")}</button></td><td>${esc(doc.title)}</td><td>${esc(partnerName(state.partners, doc.partnerId))}</td><td>${STATUS_LABEL[displayStatus(doc)]}</td><td>${esc(doc.endDate || "\u2014")}</td></tr>`).join("")}
    </tbody></table></div>`}
    ${role.facultyId ? `<p class="muted">Fakultas terkunci: ${esc(facultyName(role.facultyId))}</p>` : ""}
    ${role.programId ? `<p class="muted">Prodi terkunci: ${esc(programName(role.programId))}</p>` : ""}`;
  }
  function entryView(role) {
    const doc = state.documents.find((item) => item.id === state.editingId) ?? null;
    const suggestion = doc ? suggestParent(doc, state.documents) : null;
    return `
    <h1>Catat naskah</h1>
    <p class="muted">Berkas disimpan sebagai lampiran. Isi PDF tidak dibaca. Sistem hanya mengisi jenis, nomor, atau mitra bila nama berkas cocok. Sisanya diisi staf, atau diimpor dari tabel.</p>
    <label class="drop">Unggah berkas <input id="files" type="file" multiple accept=".pdf,.doc,.docx,.txt" /></label>
    <button id="blank" type="button">Form kosong</button>
    ${doc ? `<form id="form" class="form">
        ${field("Jenis", `<select name="documentType">${["", ...Object.keys(TYPE_LABEL)].map((t) => `<option value="${t}" ${doc.documentType === t ? "selected" : ""}>${t ? TYPE_LABEL[t] : "Pilih"}</option>`).join("")}</select>`)}
        ${field("Nomor dokumen", `<input name="documentNumber" value="${esc(doc.documentNumber)}" />`)}
        ${field("Judul", `<input name="title" value="${esc(doc.title)}" />`)}
        ${field("Mitra", `<select name="partnerId"><option value="">Pilih</option>${state.partners.map((p2) => `<option value="${p2.id}" ${doc.partnerId === p2.id ? "selected" : ""}>${esc(p2.name)}</option>`).join("")}</select>`)}
        ${field("Mulai", `<input type="date" name="startDate" value="${esc(doc.startDate)}" />`)}
        ${field("Berakhir", `<input type="date" name="endDate" value="${esc(doc.endDate)}" />`)}
        ${field("Status", `<select name="status"><option value="DRAFT" ${doc.status === "DRAFT" ? "selected" : ""}>Draf</option><option value="AKTIF" ${doc.status === "AKTIF" ? "selected" : ""}>Aktif</option><option value="ARSIP" ${doc.status === "ARSIP" ? "selected" : ""}>Arsip</option></select>`)}
        ${field("Fakultas", `<select name="facultyId"><option value="">Pilih</option>${FACULTIES.map((f) => `<option value="${f.id}" ${doc.facultyId === f.id ? "selected" : ""}>${esc(f.name)}</option>`).join("")}</select>`)}
        ${field("Program studi", `<select name="programId"><option value="">Pilih</option>${PROGRAMS.map((p2) => `<option value="${p2.id}" ${doc.programId === p2.id ? "selected" : ""}>${esc(p2.name)}</option>`).join("")}</select>`)}
        ${field("Unit", `<select name="unitId"><option value="">Pilih</option>${UNITS.map((u) => `<option value="${u.id}" ${doc.unitId === u.id ? "selected" : ""}>${esc(u.name)}</option>`).join("")}</select>`)}
        ${field("Kegiatan", `<input name="activityName" value="${esc(doc.activityName)}" />`)}
        ${field("PIC", `<input name="pic" value="${esc(doc.pic)}" />`)}
        ${field("Penandatangan mitra", `<input name="partnerSignatory" value="${esc(doc.partnerSignatory)}" />`)}
        ${field("Jabatan mitra", `<input name="partnerSignatoryTitle" value="${esc(doc.partnerSignatoryTitle)}" />`)}
        ${field("Penandatangan IT Del", `<input name="itdelSignatory" value="${esc(doc.itdelSignatory)}" />`)}
        ${field("Jabatan IT Del", `<input name="itdelSignatoryTitle" value="${esc(doc.itdelSignatoryTitle)}" />`)}
        ${field("Ruang lingkup", `<input name="scope" value="${esc(doc.scope)}" />`)}
        ${field("Lokasi", `<input name="location" value="${esc(doc.location)}" />`)}
        ${field("Anggaran", `<input name="budget" value="${esc(doc.budget)}" />`)}
        ${field("Sumber dana", `<input name="fundingSource" value="${esc(doc.fundingSource)}" />`)}
        ${field("Catatan", `<input name="notes" value="${esc(doc.notes)}" />`)}
        ${suggestion ? `<p class="note">Saran aturan: tautkan ke ${esc(suggestion.number)}. ${esc(suggestion.reason)} <button type="button" id="use-parent">Pakai saran</button></p>` : ""}
        ${missingFields(doc).length ? `<p class="muted">Masih kosong: ${esc(missingFields(doc).join(", "))}. Draf tetap boleh disimpan.</p>` : ""}
        <button type="submit">Simpan</button>
      </form>` : `<p class="muted">Pilih berkas atau buka form kosong.</p>`}
    ${role.canWrite ? "" : ""}`;
  }
  function field(label, control) {
    return `<label>${label}${control}</label>`;
  }
  function importView() {
    return `
    <h1>Impor dari tabel</h1>
    <p class="muted">Salin tabel dari Google Sheets, Excel, atau Word, lalu tempel. Kolom yang dikenali terisi. Yang tidak ada tetap kosong untuk dilengkapi staf. PDF tidak dibaca.</p>
    <button id="template" type="button">Unduh template CSV</button>
    <textarea id="paste" rows="8" placeholder="Tempel tabel di sini"></textarea>
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
    const rows = filterDocuments(state.documents, state.filters, role, state.partners);
    const summary = analysisSummary(rows);
    return `
    <h1>Analisis</h1>
    <p class="muted">Rekap dari saringan yang aktif. Ini hitungan data, bukan kesimpulan mutu institusi.</p>
    <p>${summary.total} naskah. Aktif ${summary.shown.aktif}, akan berakhir ${summary.shown.akan}, berakhir ${summary.shown.berakhir}, draf ${summary.shown.draf}.</p>
    <ul>${summary.byType.map((item) => `<li>${item.label}: ${item.count}</li>`).join("")}</ul>
    <h2>Tindak lanjut</h2>
    ${summary.gaps.length ? `<ul>${summary.gaps.map((gap) => `<li>${esc(gap.message)}</li>`).join("")}</ul>` : "<p>Tidak ada kesenjangan relasi.</p>"}
    <button id="csv2" type="button">Unduh CSV tampilan ini</button>`;
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
        render();
      };
    });
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
    const clear = document.getElementById("clear");
    if (clear) clear.addEventListener("click", () => {
      state.filters = { ...EMPTY_FILTERS };
      render();
    });
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
    const csv2 = document.getElementById("csv2");
    if (csv2) csv2.addEventListener("click", () => {
      const rows = filterDocuments(state.documents, state.filters, role, state.partners);
      downloadText("analisis-ksdas.csv", documentsToCsv(rows, state.partners), "text/csv");
    });
    const go = document.getElementById("go-analisis");
    if (go) go.addEventListener("click", () => {
      state.view = "analisis";
      render();
    });
    const files = document.getElementById("files");
    if (files) files.onchange = () => {
      const list = [...files.files ?? []];
      const created = list.map((file) => {
        const doc = blankNaskah();
        const hints = hintsFromFilename(file.name, state.partners);
        return { ...doc, ...hints.patch, fileName: file.name, fileSize: file.size, provenance: hints.provenance };
      });
      state.documents = [...created, ...state.documents];
      state.editingId = created[0]?.id ?? null;
      state.notice = "Berkas dicatat sebagai lampiran. Lengkapi formulir. Isi PDF tidak dibaca.";
      save();
      render();
    };
    const blank = document.getElementById("blank");
    if (blank) blank.addEventListener("click", () => {
      const doc = blankNaskah();
      state.documents = [doc, ...state.documents];
      state.editingId = doc.id;
      save();
      render();
    });
    const form = document.getElementById("form");
    if (form) form.onsubmit = (event) => {
      event.preventDefault();
      const current = state.documents.find((item) => item.id === state.editingId);
      if (!current) return;
      const data = new FormData(form);
      const next = { ...current, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      for (const key of ["documentType", "documentNumber", "title", "partnerId", "startDate", "endDate", "status", "facultyId", "programId", "unitId", "activityName", "pic", "partnerSignatory", "partnerSignatoryTitle", "itdelSignatory", "itdelSignatoryTitle", "scope", "location", "budget", "fundingSource", "notes"]) {
        const value = String(data.get(key) ?? "");
        next[key] = value;
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
