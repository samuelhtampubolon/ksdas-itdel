/**
 * KSDAS IT DEL - Mock AI Document Processing & Analytics Engine
 * Version: 0.2
 *
 * Implements deterministic document classification, 26-field metadata extraction,
 * entity normalization, relationship suggestion, quality flags calculation,
 * confidence scoring, and natural-language query interpretation.
 *
 * DISCLAIMER: This is a client-side deterministic heuristic engine designed
 * as a functional prototype for the IT Del Cooperation System. It runs entirely
 * offline in the browser without external cloud LLM dependencies.
 */

class KSDASMockAI {
  constructor() {
    this.engineName = "KSDAS Heuristic NLP & Pattern Engine v0.2";
  }

  /**
   * Process a document file or simulated text
   * @param {Object} fileObj - { name, size, text, batchId }
   * @param {Array} existingDocuments - For duplicate detection and relationship inference
   * @returns {Object} Extracted document entity with audit & quality flags
   */
  processDocument(fileObj, existingDocuments = []) {
    const rawText = fileObj.text || fileObj.simulatedOcrText || "";
    const fileName = fileObj.name || fileObj.fileName || "unknown_doc.pdf";

    // A. Classify Document Type
    const classification = this.classifyDocument(fileName, rawText);

    // B. Extract 26 Metadata Fields
    const fieldExtractions = this.extractAllFields(fileName, rawText, classification.type);

    // C. Detect Partner & Normalization
    const partnerInfo = this.inferPartner(fileName, rawText);

    // D. Relationship Suggestion (Parent Linking)
    const relationship = this.inferRelationship(
      classification.type,
      rawText,
      partnerInfo.partnerName,
      existingDocuments
    );

    // E. Calculate Quality Flags & Overall Confidence
    const qualityAnalysis = this.evaluateQualityFlags(
      classification,
      fieldExtractions,
      partnerInfo,
      relationship,
      existingDocuments
    );

    // Assembly
    const docId = "DOC-AI-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    const documentEntity = {
      id: docId,
      batchId: fileObj.batchId || "BATCH-" + new Date().getFullYear(),
      fileName: fileName,
      fileSize: fileObj.size ? this.formatFileSize(fileObj.size) : fileObj.fileSize || "2.1 MB",
      rawText: rawText,
      
      // Core fields
      documentNumber: fieldExtractions.document_number.value,
      title: fieldExtractions.title.value,
      type: classification.type,
      typeConfidence: classification.confidence,

      // Partner
      partnerId: partnerInfo.partnerId,
      partnerName: partnerInfo.partnerName,
      partnerConfidence: partnerInfo.confidence,
      country: fieldExtractions.country.value || "Indonesia",

      // Signatories
      partnerSignatoryName: fieldExtractions.partner_signatory_name.value,
      partnerSignatoryPosition: fieldExtractions.partner_signatory_position.value,
      itDelSignatoryName: fieldExtractions.it_del_signatory_name.value,
      itDelSignatoryPosition: fieldExtractions.it_del_signatory_position.value,

      // Dates
      signedDate: fieldExtractions.signed_date.value,
      effectiveStartDate: fieldExtractions.effective_start_date.value,
      effectiveEndDate: fieldExtractions.effective_end_date.value,

      // Scope & Institutional context
      scope: fieldExtractions.scope.value,
      facultyId: fieldExtractions.faculty.value,
      studyProgramId: fieldExtractions.study_program.value,
      internalUnitId: fieldExtractions.internal_unit.value,
      triDharma: fieldExtractions.tri_dharma.value,

      // Activity, Output, Impact
      activityName: fieldExtractions.activity_name.value,
      pic: fieldExtractions.PIC.value,
      location: fieldExtractions.location.value,
      participantCount: fieldExtractions.participant_count.value,
      budget: fieldExtractions.budget.value,
      fundingSource: fieldExtractions.funding_source.value,
      expectedOutput: fieldExtractions.expected_output.value,
      expectedOutcome: fieldExtractions.expected_outcome.value,
      actualOutput: fieldExtractions.actual_output.value,
      outcome: fieldExtractions.outcome.value,
      impact: fieldExtractions.impact.value,
      followUp: fieldExtractions.follow_up.value,

      // Relationships
      parentId: relationship.suggestedParentId,
      parentNumber: relationship.suggestedParentNumber,
      relationshipConfidence: relationship.confidence,
      relationshipReason: relationship.reason,

      // Status & Quality
      status: "AI_EXTRACTED", // AI never sets official_data directly!
      confidenceScore: qualityAnalysis.overallConfidence,
      qualityFlags: qualityAnalysis.flags,
      hasEvidence: false,
      evidenceCount: 0,

      // Field extraction breakdown with source citations
      extractions: fieldExtractions,
      extractedDate: new Date().toISOString(),
      officialDataConfirmed: false,
      validatedBy: null,
      validatedDate: null
    };

    return documentEntity;
  }

  /**
   * Classify document type based on filename and contents
   */
  classifyDocument(fileName, text) {
    const fn = fileName.toLowerCase();
    const content = text.toLowerCase();

    if (fn.includes("mou") || fn.includes("loi") || content.includes("nota kesepahaman") || content.includes("memorandum of understanding")) {
      return { type: "MOU_LOI", confidence: 0.98, reason: "Kata kunci 'MoU' atau 'Nota Kesepahaman' terdeteksi." };
    }
    if (fn.includes("pks") || fn.includes("moa") || content.includes("perjanjian kerja sama") || content.includes("memorandum of agreement")) {
      return { type: "PKS_MOA", confidence: 0.96, reason: "Kata kunci 'PKS' atau 'Perjanjian Kerja Sama' terdeteksi." };
    }
    if (fn.includes("ia") || fn.includes("implementation") || content.includes("implementation arrangement")) {
      return { type: "IA", confidence: 0.95, reason: "Frasa 'Implementation Arrangement' terdeteksi." };
    }
    if (fn.includes("prop") || fn.includes("proposal") || content.includes("proposal kegiatan") || content.includes("usulan hibah")) {
      return { type: "PROPOSAL", confidence: 0.93, reason: "Format dan kata kunci proposal teridentifikasi." };
    }
    if (fn.includes("lpj") || fn.includes("laporan") || fn.includes("report") || content.includes("laporan akhir") || content.includes("laporan pertanggungjawaban")) {
      return { type: "FINAL_REPORT", confidence: 0.97, reason: "Kata kunci 'Laporan Akhir' atau 'LPJ' teridentifikasi." };
    }

    return { type: "OTHER", confidence: 0.60, reason: "Format umum dokumen pendukung." };
  }

  /**
   * Extract all 26 fields with value, normalized_value, confidence, source_page, source_text, extraction_method
   */
  extractAllFields(fileName, text, docType) {
    const res = {};
    const content = text || "";

    // 1. document_number
    const numMatch = content.match(/nomor[:\s]+([0-9A-Za-z\/\.\-]+)/i) || 
                     fileName.match(/([0-9]{3}\/[A-Za-z0-9\/\.\-]+)/i);
    res.document_number = {
      value: numMatch ? numMatch[1].trim() : "REG/" + Math.floor(100 + Math.random() * 900) + "/ITDel/" + new Date().getFullYear(),
      normalized_value: numMatch ? numMatch[1].trim().toUpperCase() : null,
      confidence: numMatch ? 0.96 : 0.60,
      source_page: 1,
      source_text: numMatch ? numMatch[0] : "Generated fallback",
      extraction_method: "REGEX_PATTERN"
    };

    // 2. title
    let titleVal = "Kerja Sama Tri Dharma Perguruan Tinggi";
    const titleMatch = content.match(/tentang\s+([^.\n]+)/i);
    if (titleMatch) {
      titleVal = titleMatch[1].trim();
    } else {
      // derive from filename
      titleVal = fileName.replace(/\.[^/.]+$/, "").replace(/^[0-9]+_/, "").replace(/_/g, " ");
    }
    res.title = {
      value: titleVal,
      normalized_value: titleVal.toUpperCase(),
      confidence: titleMatch ? 0.94 : 0.82,
      source_page: 1,
      source_text: titleMatch ? titleMatch[0].slice(0, 100) : fileName,
      extraction_method: "HEURISTIC_PARSER"
    };

    // 3. partner
    const partnerObj = this.inferPartner(fileName, text);
    res.partner = {
      value: partnerObj.partnerName,
      normalized_value: partnerObj.partnerId,
      confidence: partnerObj.confidence,
      source_page: 1,
      source_text: partnerObj.snippet,
      extraction_method: "ENTITY_NORMALIZATION"
    };

    // 4. country
    let countryVal = "Indonesia";
    if (content.toLowerCase().includes("malaysia") || fileName.toLowerCase().includes("malaysia")) countryVal = "Malaysia";
    if (content.toLowerCase().includes("singapore") || content.toLowerCase().includes("singapura")) countryVal = "Singapura";
    if (content.toLowerCase().includes("china")) countryVal = "China";
    res.country = {
      value: countryVal,
      normalized_value: countryVal.toUpperCase(),
      confidence: 0.95,
      source_page: 1,
      source_text: countryVal,
      extraction_method: "REGEX_LOOKUP"
    };

    // 5 & 6. Partner Signatory Name & Position
    let partSignName = "Pimpinan Mitra Kemitraan";
    let partSignPos = "Direktur / Pimpinan";
    if (partnerObj.partnerName.includes("Huawei")) {
      partSignName = "Budi Santoso, Ph.D.";
      partSignPos = "Director of ICT Talent Ecosystem";
    } else if (partnerObj.partnerName.includes("Astra")) {
      partSignName = "Ratna Sari Dewi";
      partSignPos = "Head of CSR & Education Support";
    } else if (partnerObj.partnerName.includes("Mandiri")) {
      partSignName = "Hendra Wijaya";
      partSignPos = "VP Corporate Secretary Bank Mandiri";
    } else if (partnerObj.partnerName.includes("Sumatera Utara") || partnerObj.partnerName.includes("Pemprov")) {
      partSignName = "Dr. Hassanudin";
      partSignPos = "Pj. Gubernur Sumatera Utara";
    } else if (partnerObj.partnerName.includes("UTM") || partnerObj.partnerName.includes("Universiti")) {
      partSignName = "Prof. Datuk Ir. Ts. Dr. Ahmad Fauzi Ismail";
      partSignPos = "Vice-Chancellor UTM";
    }

    res.partner_signatory_name = {
      value: partSignName,
      normalized_value: partSignName,
      confidence: 0.92,
      source_page: 1,
      source_text: `Pihak Kedua: ${partSignName} (${partSignPos})`,
      extraction_method: "SIGNATORY_RESOLVER"
    };

    res.partner_signatory_position = {
      value: partSignPos,
      normalized_value: partSignPos,
      confidence: 0.90,
      source_page: 1,
      source_text: partSignPos,
      extraction_method: "HEURISTIC_PARSER"
    };

    // 7 & 8. IT Del Signatory Name & Position
    let itDelName = "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.";
    let itDelPos = "Rektor Institut Teknologi Del";
    if (docType === "PKS_MOA") {
      if (content.toLowerCase().includes("fite") || fileName.toLowerCase().includes("fite")) {
        itDelName = "Dr. Johannes Harungguan Sianipar, S.T., M.T.";
        itDelPos = "Dekan FITE IT Del";
      } else if (content.toLowerCase().includes("fti") || fileName.toLowerCase().includes("fti")) {
        itDelName = "Dr. Rizal Sinaga, S.T., M.T.";
        itDelPos = "Dekan FTI IT Del";
      } else if (content.toLowerCase().includes("fb") || fileName.toLowerCase().includes("fb") || content.toLowerCase().includes("bioproses")) {
        itDelName = "Dr. Merry M. Sibarani, S.Si., M.Si.";
        itDelPos = "Dekan FB IT Del";
      }
    } else if (docType === "IA" || docType === "PROPOSAL" || docType === "FINAL_REPORT") {
      itDelName = "Yusuf Kurniawan, S.T., M.Sc.";
      itDelPos = "Ketua Program Studi / Pelaksana Kegiatan";
    }

    res.it_del_signatory_name = {
      value: itDelName,
      normalized_value: itDelName,
      confidence: 0.95,
      source_page: 1,
      source_text: `Pihak Pertama: ${itDelName} (${itDelPos})`,
      extraction_method: "ORGANIZATIONAL_HIERARCHY"
    };

    res.it_del_signatory_position = {
      value: itDelPos,
      normalized_value: itDelPos,
      confidence: 0.94,
      source_page: 1,
      source_text: itDelPos,
      extraction_method: "ORGANIZATIONAL_HIERARCHY"
    };

    // 9, 10, 11. Dates
    const yearMatch = fileName.match(/202[3-7]/) || content.match(/202[3-7]/);
    const yr = yearMatch ? yearMatch[0] : "2026";
    const startDate = `${yr}-03-15`;
    const durationYears = docType === "MOU_LOI" ? 5 : (docType === "PKS_MOA" ? 2 : 1);
    const endYr = parseInt(yr) + durationYears;
    const endDate = `${endYr}-03-14`;

    res.signed_date = {
      value: startDate,
      normalized_value: startDate,
      confidence: 0.92,
      source_page: 1,
      source_text: `Tanggal: ${startDate}`,
      extraction_method: "DATE_PARSER"
    };

    res.effective_start_date = {
      value: startDate,
      normalized_value: startDate,
      confidence: 0.92,
      source_page: 1,
      source_text: `Mulai berlaku: ${startDate}`,
      extraction_method: "DATE_PARSER"
    };

    res.effective_end_date = {
      value: endDate,
      normalized_value: endDate,
      confidence: 0.90,
      source_page: 1,
      source_text: `Berakhir: ${endDate}`,
      extraction_method: "DATE_PARSER"
    };

    // 12. Scope
    let scopeText = "Penyelenggaraan program magang terstruktur, riset inovasi dan kuliah umum pakar industri.";
    if (content.includes("Ruang lingkup") || content.includes("Scope:")) {
      const sm = content.match(/(?:Ruang lingkup|Scope:)\s*([^\.\n]+)/i);
      if (sm) scopeText = sm[1].trim();
    }
    res.scope = {
      value: scopeText,
      normalized_value: scopeText,
      confidence: 0.89,
      source_page: 1,
      source_text: scopeText,
      extraction_method: "HEURISTIC_PARSER"
    };

    // 13, 14, 15. Faculty, Study Program, Internal Unit
    let facultyVal = "FITE";
    let prodiVal = "PRODI-IF";
    let unitVal = "UNIT-KERJASAMA";

    if (content.toLowerCase().includes("manajemen rekayasa") || content.toLowerCase().includes("fti") || fileName.toLowerCase().includes("fti")) {
      facultyVal = "FTI";
      prodiVal = "PRODI-MR";
    } else if (content.toLowerCase().includes("bioteknologi") || content.toLowerCase().includes("bioproses") || fileName.toLowerCase().includes("fb")) {
      facultyVal = "FB";
      prodiVal = "PRODI-BP";
    } else if (content.toLowerCase().includes("sistem informasi") || content.toLowerCase().includes("gis")) {
      facultyVal = "FITE";
      prodiVal = "PRODI-SI";
    }

    if (docType === "PROPOSAL" || docType === "FINAL_REPORT") {
      unitVal = "UNIT-LPPM";
    }

    res.faculty = {
      value: facultyVal,
      normalized_value: facultyVal,
      confidence: 0.93,
      source_page: 1,
      source_text: facultyVal,
      extraction_method: "ENTITY_MAPPER"
    };

    res.study_program = {
      value: prodiVal,
      normalized_value: prodiVal,
      confidence: 0.91,
      source_page: 1,
      source_text: prodiVal,
      extraction_method: "ENTITY_MAPPER"
    };

    res.internal_unit = {
      value: unitVal,
      normalized_value: unitVal,
      confidence: 0.90,
      source_page: 1,
      source_text: unitVal,
      extraction_method: "ENTITY_MAPPER"
    };

    // 16. Tri Dharma
    let triVal = "EDUCATION";
    if (content.toLowerCase().includes("riset") || content.toLowerCase().includes("research") || fileName.toLowerCase().includes("riset")) {
      triVal = "RESEARCH";
    } else if (content.toLowerCase().includes("pengabdian") || content.toLowerCase().includes("wisata") || content.toLowerCase().includes("masyarakat")) {
      triVal = "COMMUNITY_SERVICE";
    } else if (content.toLowerCase().includes("sarana") || content.toLowerCase().includes("infrastruktur")) {
      triVal = "INSTITUTIONAL";
    }

    res.tri_dharma = {
      value: triVal,
      normalized_value: triVal,
      confidence: 0.94,
      source_page: 1,
      source_text: `Kategori Tri Dharma: ${triVal}`,
      extraction_method: "CLASSIFICATION_HEURISTIC"
    };

    // 17. activity_name
    res.activity_name = {
      value: `Pelaksanaan ${titleVal.slice(0, 50)}`,
      normalized_value: `Pelaksanaan ${titleVal.slice(0, 50)}`,
      confidence: 0.88,
      source_page: 1,
      source_text: titleVal,
      extraction_method: "NLP_INFERENCE"
    };

    // 18. PIC
    let picVal = "Humasak T. A. Simanjuntak, S.T., M.ISD.";
    if (facultyVal === "FITE") picVal = "Ronal M. Panjaitan, S.Kom., M.T.";
    if (facultyVal === "FTI") picVal = "Yanti N. Simamora, S.T., M.Sc.";
    if (facultyVal === "FB") picVal = "Maria P. Hutapea, S.Si., M.Biotech.";
    res.PIC = {
      value: picVal,
      normalized_value: picVal,
      confidence: 0.89,
      source_page: 1,
      source_text: picVal,
      extraction_method: "ROSTER_LOOKUP"
    };

    // 19. location
    res.location = {
      value: "Kampus Institut Teknologi Del, Sitoluama, Laguboti",
      normalized_value: "IT_DEL_CAMPUS",
      confidence: 0.95,
      source_page: 1,
      source_text: "Kampus Institut Teknologi Del, Sitoluama, Laguboti",
      extraction_method: "REGEX_LOOKUP"
    };

    // 20. participant_count
    const countMatch = content.match(/([0-9]+)\s*(?:mahasiswa|peserta|orang)/i);
    const countVal = countMatch ? parseInt(countMatch[1]) : 50;
    res.participant_count = {
      value: countVal,
      normalized_value: countVal,
      confidence: countMatch ? 0.94 : 0.75,
      source_page: 1,
      source_text: countMatch ? countMatch[0] : "Default estimate",
      extraction_method: "NUMERIC_EXTRACTOR"
    };

    // 21. budget
    const budgetMatch = content.match(/Rp\s*([0-9\.\,]+)/i);
    let budgetVal = 150000000;
    if (budgetMatch) {
      budgetVal = parseInt(budgetMatch[1].replace(/[\.\,]/g, ""));
    }
    res.budget = {
      value: budgetVal,
      normalized_value: budgetVal,
      confidence: budgetMatch ? 0.96 : 0.70,
      source_page: 1,
      source_text: budgetMatch ? budgetMatch[0] : "Estimated allocation",
      extraction_method: "CURRENCY_EXTRACTOR"
    };

    // 22. funding_source
    res.funding_source = {
      value: "PARTNER_GRANT",
      normalized_value: "PARTNER_GRANT",
      confidence: 0.90,
      source_page: 1,
      source_text: "Hibah Mitra Industri",
      extraction_method: "HEURISTIC_PARSER"
    };

    // 23. expected_output
    res.expected_output = {
      value: "Terselenggaranya kegiatan, sertifikasi kompetensi peserta, dan dokumentasi laporan kemajuan.",
      normalized_value: null,
      confidence: 0.87,
      source_page: 1,
      source_text: "Target luaran kegiatan",
      extraction_method: "NLP_INFERENCE"
    };

    // 24. expected_outcome
    res.expected_outcome = {
      value: "Peningkatan relevansi keilmuan dan keterserapan kerja lulusan di industri nasional.",
      normalized_value: null,
      confidence: 0.86,
      source_page: 1,
      source_text: "Capaian pembelajaran lulusan",
      extraction_method: "NLP_INFERENCE"
    };

    // 25. actual_output
    res.actual_output = {
      value: "Peserta terdaftar dan modul pelatihan terlaksana sesuai rencana.",
      normalized_value: null,
      confidence: 0.85,
      source_page: 1,
      source_text: "Dokumen pelaksanaan",
      extraction_method: "NLP_INFERENCE"
    };

    // 26. outcome, impact, follow_up
    res.outcome = {
      value: "Pemenuhan standar IKU Perguruan Tinggi dan penguatan jejaring kemitraan.",
      normalized_value: null,
      confidence: 0.85,
      source_page: 1,
      source_text: "Capaian indikator",
      extraction_method: "NLP_INFERENCE"
    };

    res.impact = {
      value: "Peningkatan akreditasi institusi dan program studi menuju peringkat Unggul.",
      normalized_value: null,
      confidence: 0.88,
      source_page: 1,
      source_text: "Dampak institusional",
      extraction_method: "NLP_INFERENCE"
    };

    res.follow_up = {
      value: "Monitoring kemajuan pelaksanaan dan persiapan penandatanganan dokumen turunan berikutnya.",
      normalized_value: null,
      confidence: 0.88,
      source_page: 1,
      source_text: "Rencana tindak lanjut",
      extraction_method: "NLP_INFERENCE"
    };

    return res;
  }

  /**
   * Infer partner from file name or raw text
   */
  inferPartner(fileName, text) {
    const combined = (fileName + " " + text).toLowerCase();

    if (combined.includes("huawei")) {
      return { partnerId: "PARTNER-001", partnerName: "PT Huawei Tech Investment", confidence: 0.99, snippet: "Huawei" };
    }
    if (combined.includes("astra")) {
      return { partnerId: "PARTNER-002", partnerName: "PT Astra International Tbk", confidence: 0.98, snippet: "Astra" };
    }
    if (combined.includes("microsoft") || combined.includes("azure")) {
      return { partnerId: "PARTNER-003", partnerName: "PT Microsoft Indonesia", confidence: 0.99, snippet: "Microsoft" };
    }
    if (combined.includes("mandiri") || combined.includes("bank mandiri")) {
      return { partnerId: "PARTNER-004", partnerName: "PT Bank Mandiri (Persero) Tbk", confidence: 0.98, snippet: "Bank Mandiri" };
    }
    if (combined.includes("itb") || combined.includes("institut teknologi bandung")) {
      return { partnerId: "PARTNER-005", partnerName: "Institut Teknologi Bandung", confidence: 0.98, snippet: "ITB" };
    }
    if (combined.includes("pemkab toba") || combined.includes("pemerintah kabupaten toba")) {
      return { partnerId: "PARTNER-006", partnerName: "Pemerintah Kabupaten Toba", confidence: 0.97, snippet: "Pemkab Toba" };
    }
    if (combined.includes("pemprov") || combined.includes("sumatera utara") || combined.includes("disbudpar")) {
      return { partnerId: "PARTNER-006B", partnerName: "Pemerintah Provinsi Sumatera Utara", confidence: 0.96, snippet: "Pemprov Sumut" };
    }
    if (combined.includes("nus") || combined.includes("national university of singapore")) {
      return { partnerId: "PARTNER-007", partnerName: "National University of Singapore", confidence: 0.99, snippet: "NUS" };
    }
    if (combined.includes("utm") || combined.includes("universiti teknologi malaysia")) {
      return { partnerId: "PARTNER-007B", partnerName: "Universiti Teknologi Malaysia (UTM)", confidence: 0.97, snippet: "UTM Malaysia" };
    }
    if (combined.includes("toba lestari") || combined.includes("yayasan inovasi")) {
      return { partnerId: "PARTNER-008", partnerName: "Yayasan Inovasi Teknologi Toba Lestari", confidence: 0.94, snippet: "Toba Lestari" };
    }

    return { partnerId: "PARTNER-GEN", partnerName: "Mitra Strategis IT Del", confidence: 0.65, snippet: "Generic Partner" };
  }

  /**
   * Relationship Suggestion:
   * PKS -> MoU
   * IA -> PKS
   * Proposal -> IA
   * FinalReport -> Proposal
   */
  inferRelationship(docType, text, partnerName, existingDocs = []) {
    if (docType === "MOU_LOI") {
      return {
        suggestedParentId: null,
        suggestedParentNumber: null,
        confidence: 1.0,
        reason: "MoU merupakan dokumen induk tingkat paling atas (Root Agreement)."
      };
    }

    // Check if raw text explicitly references another document number
    const refMatch = text.match(/(?:merujuk pada|berdasarkan|mengacu pada|turunan dari)\s+([A-Za-z0-9\/\.\-]+)/i);
    if (refMatch) {
      const refNum = refMatch[1].trim();
      const matchedDoc = existingDocs.find(d => 
        (d.documentNumber && d.documentNumber.includes(refNum)) ||
        (d.id && d.id === refNum)
      );
      if (matchedDoc) {
        return {
          suggestedParentId: matchedDoc.id,
          suggestedParentNumber: matchedDoc.documentNumber,
          confidence: 0.98,
          reason: `Referensi nomor dokumen induk eksplisit ditemukan di isi dokumen: ${refNum}.`
        };
      }
    }

    // Heuristic hierarchy mapping based on partner & target parent type
    let targetParentType = "MOU_LOI";
    if (docType === "PKS_MOA") targetParentType = "MOU_LOI";
    else if (docType === "IA") targetParentType = "PKS_MOA";
    else if (docType === "PROPOSAL") targetParentType = "IA";
    else if (docType === "FINAL_REPORT") targetParentType = "PROPOSAL";

    // Find candidate among existing documents matching partner and parent type
    const candidate = existingDocs.find(d => 
      d.partnerName && partnerName &&
      (d.partnerName.toLowerCase().includes(partnerName.toLowerCase()) || partnerName.toLowerCase().includes(d.partnerName.toLowerCase())) &&
      d.type === targetParentType
    );

    if (candidate) {
      return {
        suggestedParentId: candidate.id,
        suggestedParentNumber: candidate.documentNumber,
        confidence: 0.92,
        reason: `Ditemukan dokumen ${targetParentType} aktif milik mitra yang sama: ${candidate.documentNumber}.`
      };
    }

    // Fallback if no matching parent
    return {
      suggestedParentId: null,
      suggestedParentNumber: null,
      confidence: 0.50,
      reason: `Tidak ditemukan dokumen induk ${targetParentType} yang cocok. Ditandai sebagai calon orphan.`
    };
  }

  /**
   * Quality Flags & Overall Confidence
   */
  evaluateQualityFlags(classification, fields, partner, relationship, existingDocs) {
    const flags = [];
    let score = classification.confidence * 0.4 + partner.confidence * 0.3;

    // Check partner
    if (!partner.partnerName || partner.confidence < 0.7) {
      flags.push("missing_partner");
    }

    // Check duplicate
    const isDup = existingDocs.some(d => d.documentNumber && d.documentNumber === fields.document_number.value);
    if (isDup) {
      flags.push("duplicate_document");
      score -= 0.2;
    }

    // Check signatories
    if (!fields.partner_signatory_name.value || !fields.it_del_signatory_name.value) {
      flags.push("missing_signatory");
    }

    // Check date
    if (!fields.signed_date.value) {
      flags.push("missing_date");
    }

    // Check invalid date range
    if (fields.effective_start_date.value && fields.effective_end_date.value) {
      const start = new Date(fields.effective_start_date.value);
      const end = new Date(fields.effective_end_date.value);
      if (end <= start) {
        flags.push("invalid_date_range");
      }
    }

    // Check orphan
    if (classification.type === "PKS_MOA" && !relationship.suggestedParentId) {
      flags.push("orphan_pks");
    } else if (classification.type === "IA" && !relationship.suggestedParentId) {
      flags.push("orphan_ia");
    } else if (classification.type === "PROPOSAL" && !relationship.suggestedParentId) {
      flags.push("orphan_proposal");
    } else if (classification.type === "FINAL_REPORT" && !relationship.suggestedParentId) {
      flags.push("orphan_report");
    }

    // Pending human validation is standard for AI extracted
    flags.push("pending_validation");

    // Low confidence check
    if (score < 0.75) {
      flags.push("low_ai_confidence");
    }

    return {
      flags: flags,
      overallConfidence: Math.min(0.99, Math.max(0.40, parseFloat(score.toFixed(2))))
    };
  }

  /**
   * Natural Language Query Interpretation
   * e.g. "Tampilkan PKS industri aktif tahun 2026 yang punya kegiatan penelitian"
   */
  interpretNaturalLanguageQuery(queryText) {
    const q = (queryText || "").toLowerCase().trim();
    const result = {
      rawQuery: queryText,
      interpreted_intent: "Pencarian dan pemfilteran repositori dokumen kerja sama",
      filters: {},
      metrics: ["total_documents", "total_budget", "total_participants"],
      dimensions: ["tri_dharma", "partner_type", "faculty"],
      visualization: "TABLE_AND_CHART",
      confidence: 0.94,
      clarification_needed: null,
      explanation: ""
    };

    // 1. Document Type
    if (q.includes("mou") || q.includes("nota kesepahaman")) {
      result.filters.document_type = "MOU_LOI";
    } else if (q.includes("pks") || q.includes("moa") || q.includes("perjanjian")) {
      result.filters.document_type = "PKS_MOA";
    } else if (q.includes("ia") || q.includes("implementation")) {
      result.filters.document_type = "IA";
    } else if (q.includes("proposal")) {
      result.filters.document_type = "PROPOSAL";
    } else if (q.includes("laporan") || q.includes("lpj")) {
      result.filters.document_type = "FINAL_REPORT";
    }

    // 2. Partner Type
    if (q.includes("industri") || q.includes("industry") || q.includes("perusahaan")) {
      result.filters.partner_type = "INDUSTRY";
    } else if (q.includes("universitas") || q.includes("kampus") || q.includes("perguruan tinggi")) {
      result.filters.partner_type = "UNIVERSITY";
    } else if (q.includes("pemerintah") || q.includes("pemda") || q.includes("kementerian")) {
      result.filters.partner_type = "GOVERNMENT";
    } else if (q.includes("bumn")) {
      result.filters.partner_type = "BUMN";
    }

    // 3. Tri Dharma
    if (q.includes("penelitian") || q.includes("riset") || q.includes("research")) {
      result.filters.tri_dharma = "RESEARCH";
    } else if (q.includes("pendidikan") || q.includes("magang") || q.includes("kuliah") || q.includes("beasiswa")) {
      result.filters.tri_dharma = "EDUCATION";
    } else if (q.includes("pengmas") || q.includes("pengabdian") || q.includes("desa")) {
      result.filters.tri_dharma = "COMMUNITY_SERVICE";
    } else if (q.includes("tata kelola") || q.includes("sarana") || q.includes("fasilitas")) {
      result.filters.tri_dharma = "INSTITUTIONAL";
    }

    // 4. Year
    const yearMatch = q.match(/\b(202[0-9])\b/);
    if (yearMatch) {
      result.filters.year = parseInt(yearMatch[1]);
    }

    // 5. Faculty / Prodi
    if (q.includes("fite") || q.includes("informatika") || q.includes("elektro")) {
      result.filters.faculty = "FITE";
    } else if (q.includes("fti") || q.includes("manajemen rekayasa") || q.includes("metalurgi")) {
      result.filters.faculty = "FTI";
    } else if (q.includes("bioteknologi") || q.includes("bioproses") || q.includes("fb")) {
      result.filters.faculty = "FB";
    }

    // 6. Status / Expiry / Orphan
    if (q.includes("aktif") || q.includes("active")) {
      result.filters.status = "ACTIVE";
    } else if (q.includes("kadaluarsa") || q.includes("expired") || q.includes("habis")) {
      result.filters.status = "EXPIRED";
    } else if (q.includes("orphan") || q.includes("belum ditautkan") || q.includes("tanpa induk")) {
      result.filters.quality_flag = "orphan_pks";
    }

    // Explanation
    const filterDesc = Object.entries(result.filters)
      .map(([k, v]) => `<strong>${k}</strong>: <code>${v}</code>`)
      .join(", ");
    result.explanation = filterDesc 
      ? `Filter yang berhasil diinterpretasikan: ${filterDesc}`
      : "Kueri umum: menampilkan semua dokumen kerja sama dengan indikator terkini.";

    return result;
  }

  formatFileSize(bytes) {
    if (!bytes) return "1.5 MB";
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(1) + " MB";
  }
}

// Global singleton instance
window.ksdasAI = new KSDASMockAI();
