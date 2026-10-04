using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Text.RegularExpressions;
using System.Web.Script.Serialization;
using System.Windows.Forms;

namespace KsdasItDelDesktop
{
    public class NaskahItem
    {
        public string id { get; set; }
        public string documentType { get; set; }
        public string documentNumber { get; set; }
        public string title { get; set; }
        public string partnerName { get; set; }
        public string partnerType { get; set; }
        public string signedDate { get; set; }
        public string startDate { get; set; }
        public string endDate { get; set; }
        public string status { get; set; }
        public string scope { get; set; }
        public string faculty { get; set; }
        public string program { get; set; }
        public string unit { get; set; }
        public string triDharma { get; set; }
        public string activityName { get; set; }
        public string pic { get; set; }
        public string partnerSignatory { get; set; }
        public string partnerSignatoryTitle { get; set; }
        public string itdelSignatory { get; set; }
        public string itdelSignatoryTitle { get; set; }
        public string location { get; set; }
        public string budget { get; set; }
        public string fundingSource { get; set; }
        public string notes { get; set; }
        public string fileName { get; set; }
        public string parentNumber { get; set; }
    }

    public class SmartExtractionResult
    {
        public NaskahItem Item { get; set; }
        public List<string> Findings { get; set; }
        public string SummaryText { get; set; }

        public SmartExtractionResult()
        {
            Item = new NaskahItem();
            Findings = new List<string>();
        }
    }

    public static class SmartDocumentEngine
    {
        private static readonly string[] InvalidPersonTokens = new string[]
        {
            "pt", "cv", "yayasan", "universitas", "institut", "kementerian", "dinas",
            "pemerintah", "badan", "bank", "direktorat", "tim", "panitia", "divisi", "biro",
            "bagian", "fakultas", "program", "studi", "pasal", "pihak", "pertama", "kedua",
            "ketiga", "kesepakatan", "perjanjian", "republik", "indonesia", "kabupaten", "kota",
            "provinsi", "rektor", "dekan", "direktur", "kepala", "bupati", "gubernur", "camat",
            "surat", "memorandum", "understanding", "agreement", "arrangement", "nomor",
            "ruang", "lingkup", "ayat", "bab", "ketentuan", "umum", "penutup", "jangka", "waktu",
            "tujuan", "kegiatan", "anggaran", "biaya", "tugas", "kewajiban", "hak", "pelaksanaan"
        };

        public static bool IsPersonName(string name)
        {
            if (string.IsNullOrEmpty(name) || name.Length < 4) return false;
            if (name == name.ToUpper() && !Regex.IsMatch(name, @"(PROF\.|DR\.|IR\.|S\.T\.|M\.T\.)"))
                return false;

            string clean = Regex.Replace(name, @"^(?:selaku|bertindak|pihak\s+kedua|pihak\s+pertama)\s+", "", RegexOptions.IgnoreCase);
            string[] words = clean.Split(new char[] { ' ', ',', '.', ':' }, StringSplitOptions.RemoveEmptyEntries);
            if (words.Length < 2) return false;

            foreach (string w in words)
            {
                string lw = w.ToLower();
                foreach (string inv in InvalidPersonTokens)
                {
                    if (lw == inv) return false;
                }
            }
            return true;
        }

        public static SmartExtractionResult ProcessFile(string filePath, List<NaskahItem> existingDocs)
        {
            string ext = Path.GetExtension(filePath).ToLower();
            string text = "";

            if (ext == ".txt" || ext == ".csv" || ext == ".tsv")
            {
                try { text = File.ReadAllText(filePath, Encoding.UTF8); } catch {}
            }
            else if (ext == ".docx")
            {
                text = ExtractTextFromDocx(filePath);
            }
            else if (ext == ".pdf")
            {
                text = ExtractTextFromPdf(filePath);
            }
            else if (ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".bmp")
            {
                text = ExtractTextFromImage(filePath);
            }

            if (string.IsNullOrEmpty(text))
            {
                text = Path.GetFileNameWithoutExtension(filePath);
            }

            return AnalyzeText(text, filePath, existingDocs);
        }

        private static string ExtractTextFromDocx(string filePath)
        {
            try
            {
                StringBuilder sb = new StringBuilder();
                using (ZipArchive archive = ZipFile.OpenRead(filePath))
                {
                    foreach (ZipArchiveEntry entry in archive.Entries)
                    {
                        if (Regex.IsMatch(entry.FullName, @"^word/(?:header\d*|document|footer\d*)\.xml$", RegexOptions.IgnoreCase))
                        {
                            using (Stream s = entry.Open())
                            using (StreamReader reader = new StreamReader(s, Encoding.UTF8))
                            {
                                string xml = reader.ReadToEnd();
                                string formatted = xml.Replace("</w:p>", "\n");
                                MatchCollection mc = Regex.Matches(formatted, @"<w:t(?:\s+[^>]*)?>([\s\S]*?)</w:t>");
                                foreach (Match m in mc)
                                {
                                    sb.Append(m.Groups[1].Value);
                                }
                                sb.AppendLine();
                            }
                        }
                    }
                }
                if (sb.Length > 20) return sb.ToString();
            }
            catch {}
            return Path.GetFileNameWithoutExtension(filePath);
        }

        private static string ExtractTextFromPdf(string filePath)
        {
            try
            {
                byte[] raw = File.ReadAllBytes(filePath);
                string str = Encoding.Default.GetString(raw);
                StringBuilder sb = new StringBuilder();

                MatchCollection mcTj = Regex.Matches(str, @"\(([^)]+)\)\s*Tj");
                foreach (Match m in mcTj)
                {
                    sb.Append(m.Groups[1].Value).Append(" ");
                }

                MatchCollection mcTjArr = Regex.Matches(str, @"\[([^\]]+)\]\s*TJ");
                foreach (Match m in mcTjArr)
                {
                    MatchCollection inners = Regex.Matches(m.Groups[1].Value, @"\(([^)]+)\)");
                    foreach (Match inn in inners)
                    {
                        sb.Append(inn.Groups[1].Value);
                    }
                    sb.Append(" ");
                }

                if (sb.Length > 20) return sb.ToString();

                MatchCollection words = Regex.Matches(str, @"[A-Za-z0-9\/\.\-\s,]{6,}");
                foreach (Match w in words)
                {
                    string val = w.Value;
                    if (Regex.IsMatch(val, @"(del|mou|pks|ia|toba|kerja\s*sama|rektor)", RegexOptions.IgnoreCase))
                    {
                        sb.Append(val).Append(" ");
                    }
                }
                return sb.ToString();
            }
            catch {}
            return Path.GetFileNameWithoutExtension(filePath);
        }

        private static string ExtractTextFromImage(string filePath)
        {
            try
            {
                string companionTxt = Path.ChangeExtension(filePath, ".txt");
                if (File.Exists(companionTxt))
                {
                    return File.ReadAllText(companionTxt, Encoding.UTF8);
                }
                using (Bitmap bmp = new Bitmap(filePath))
                {
                    return string.Format("{0} Resolusi {1}x{2}", Path.GetFileNameWithoutExtension(filePath), bmp.Width, bmp.Height);
                }
            }
            catch {}
            return Path.GetFileNameWithoutExtension(filePath);
        }

        public static SmartExtractionResult AnalyzeText(string text, string filePath, List<NaskahItem> existingDocs)
        {
            SmartExtractionResult result = new SmartExtractionResult();
            NaskahItem doc = new NaskahItem
            {
                id = "DOC-" + Guid.NewGuid().ToString().Substring(0, 6).ToUpper(),
                fileName = Path.GetFileName(filePath),
                startDate = DateTime.Today.ToString("yyyy-MM-dd"),
                signedDate = DateTime.Today.ToString("yyyy-MM-dd"),
                location = "Laguboti",
                itdelSignatory = "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.",
                itdelSignatoryTitle = "Rektor Institut Teknologi Del",
                unit = "UKS",
                triDharma = "Pendidikan",
                pic = "Staf Unit Kerja Sama",
                status = "AKTIF"
            };

            // 1. Jenis Naskah
            if (Regex.IsMatch(text, @"(MEMORANDUM OF UNDERSTANDING|NOTA KESEPAHAMAN|NOTA KESEPAKATAN|\bMOU\b)", RegexOptions.IgnoreCase))
            {
                doc.documentType = "MoU / LOI";
                result.Findings.Add("✓ Jenis Naskah: MoU / LOI (Nota Kesepahaman)");
            }
            else if (Regex.IsMatch(text, @"(PERJANJIAN KERJA\s*SAMA|\bPKS\b|MEMORANDUM OF AGREEMENT|\bMOA\b)", RegexOptions.IgnoreCase))
            {
                doc.documentType = "PKS / MoA";
                result.Findings.Add("✓ Jenis Naskah: PKS / MoA (Perjanjian Kerja Sama)");
            }
            else if (Regex.IsMatch(text, @"(IMPLEMENTATION ARRANGEMENT|\bIA\b|RENCANA KERJA)", RegexOptions.IgnoreCase))
            {
                doc.documentType = "IA";
                result.Findings.Add("✓ Jenis Naskah: IA (Implementation Arrangement)");
            }
            else if (Regex.IsMatch(text, @"PROPOSAL", RegexOptions.IgnoreCase))
            {
                doc.documentType = "Proposal";
                result.Findings.Add("✓ Jenis Naskah: Proposal");
            }
            else if (Regex.IsMatch(text, @"LAPORAN", RegexOptions.IgnoreCase))
            {
                doc.documentType = "Laporan";
                result.Findings.Add("✓ Jenis Naskah: Laporan");
            }
            else
            {
                doc.documentType = "MoU / LOI";
            }

            // 2. Nomor Dokumen
            string[] numPats = new string[]
            {
                @"(?:nomor|no\.?)\s*[:=]?\s*([0-9]{1,4}\/(?:ITDel|IT-Del|DEL)\/[A-Za-z0-9\.\-\/]+)",
                @"(?:nomor|no\.?)\s*[:=]?\s*([0-9]{1,4}\/[A-Za-z0-9\.\-]+\/(?:MoU|PKS|IA|MoA)\/[0-9]{4})",
                @"(?:nomor|no\.?)\s*[:=]?\s*([0-9A-Za-z\.\-\/]+(?:MoU|PKS|IA|MoA)[0-9A-Za-z\.\-\/]*)",
                @"(?:nomor|no\.?)\s*[:=]?\s*([0-9]{1,4}\/[A-Za-z0-9\.\-\/]+)"
            };
            foreach (string np in numPats)
            {
                Match m = Regex.Match(text, np, RegexOptions.IgnoreCase);
                if (m.Success && m.Groups[1].Value.Length > 4 && !Regex.IsMatch(m.Groups[1].Value, @"^(induk|hp|telepon)", RegexOptions.IgnoreCase))
                {
                    doc.documentNumber = m.Groups[1].Value.Trim();
                    result.Findings.Add("✓ Nomor Dokumen: " + doc.documentNumber);
                    break;
                }
            }
            if (string.IsNullOrEmpty(doc.documentNumber))
            {
                doc.documentNumber = "DRAF-" + DateTime.Today.ToString("yyyyMM") + "-001";
            }

            // 3. Judul Kerja Sama
            Match tm = Regex.Match(text, @"(?:TENTANG|T\s*E\s*N\s*T\s*A\s*N\s*G)\s*[:\s]*[\r\n]*([^:\r\n]+(?:\r?\n[^:\r\n]+)?)", RegexOptions.IgnoreCase);
            if (tm.Success)
            {
                string rawTitle = Regex.Replace(tm.Groups[1].Value, @"[\r\n]+", " ").Trim();
                rawTitle = Regex.Replace(rawTitle, @"\b(NOMOR|NO\.?)\s*[:=].*$", "", RegexOptions.IgnoreCase).Trim();
                if (rawTitle.Length > 5)
                {
                    doc.title = rawTitle;
                    result.Findings.Add("✓ Judul Naskah: " + doc.title);
                }
            }
            if (string.IsNullOrEmpty(doc.title))
            {
                doc.title = "Kerja Sama Kemitraan Strategis IT Del";
            }

            // 4. Mitra
            if (existingDocs != null)
            {
                foreach (NaskahItem ex in existingDocs)
                {
                    if (!string.IsNullOrEmpty(ex.partnerName) && text.IndexOf(ex.partnerName, StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        doc.partnerName = ex.partnerName;
                        doc.partnerType = ex.partnerType;
                        result.Findings.Add("✓ Mitra Terdaftar: " + doc.partnerName);
                        break;
                    }
                }
            }
            if (string.IsNullOrEmpty(doc.partnerName))
            {
                Match pm = Regex.Match(text, @"(?:DENGAN|PIHAK KEDUA[:\s]*)\s*[\r\n]*([A-Z0-9\s\.,]{6,60})");
                if (pm.Success)
                {
                    string cand = pm.Groups[1].Value.Trim();
                    if (Regex.IsMatch(cand, @"(PEMERINTAH|UNIVERSITAS|INSTITUT|PT\s+|CV\s+|DINAS|KEMENTERIAN)", RegexOptions.IgnoreCase))
                    {
                        doc.partnerName = cand;
                        result.Findings.Add("✓ Mitra Terdeteksi: " + doc.partnerName);
                    }
                }
            }
            if (string.IsNullOrEmpty(doc.partnerName))
            {
                doc.partnerName = "Mitra Kerja Sama IT Del";
            }

            // 5. Pejabat IT Del
            if (Regex.IsMatch(text, @"(Arnaldo\s+Marulitua\s+Sinaga|Arnaldo\s+Sinaga)", RegexOptions.IgnoreCase))
            {
                doc.itdelSignatory = "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.";
                doc.itdelSignatoryTitle = "Rektor Institut Teknologi Del";
                result.Findings.Add("✓ Penandatangan IT Del: " + doc.itdelSignatory + " (Rektor)");
            }
            else if (Regex.IsMatch(text, @"(Johannes\s+(?:Harungguan\s+)?Sianipar)", RegexOptions.IgnoreCase))
            {
                doc.itdelSignatory = "Dr. Johannes Harungguan Sianipar, S.T., M.T.";
                doc.itdelSignatoryTitle = "Dekan FITE IT Del";
                result.Findings.Add("✓ Penandatangan IT Del: " + doc.itdelSignatory + " (Dekan FITE)");
            }
            else if (Regex.IsMatch(text, @"(Rizal\s+Sinaga)", RegexOptions.IgnoreCase))
            {
                doc.itdelSignatory = "Dr. Rizal Sinaga, S.T., M.T.";
                doc.itdelSignatoryTitle = "Dekan FTI IT Del";
                result.Findings.Add("✓ Penandatangan IT Del: " + doc.itdelSignatory + " (Dekan FTI)");
            }
            else if (Regex.IsMatch(text, @"(Merry\s+(?:M\.\s+)?Sibarani)", RegexOptions.IgnoreCase))
            {
                doc.itdelSignatory = "Dr. Merry M. Sibarani, S.Si., M.Si.";
                doc.itdelSignatoryTitle = "Dekan FB IT Del";
                result.Findings.Add("✓ Penandatangan IT Del: " + doc.itdelSignatory + " (Dekan FB)");
            }
            else
            {
                result.Findings.Add("✓ Penandatangan IT Del (Baku): " + doc.itdelSignatory + " (Rektor)");
            }

            // 6. Penandatangan Mitra (Orang Terverifikasi)
            string[] sigPats = new string[]
            {
                @"(?:Prof\.|Dr\.|Ir\.|Drs\.|Dra\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}(?:,\s*(?:S\.[A-Za-z]+|M\.[A-Za-z]+|Ph\.D|B\.Eng|M\.Eng|Sc|Si|Kom|T|E|M|H|Pd)\b[A-Za-z\.,\s]*)?)",
                @"([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}),\s*(?:S\.[A-Za-z]+|M\.[A-Za-z]+|Ph\.D\.|B\.Eng\.|M\.Eng\.|S\.Kom\.|M\.Kom\.|S\.T\.|M\.T\.|S\.Si\.|M\.Si\.|S\.E\.|M\.M\.|S\.H\.|M\.H\.)"
            };
            foreach (string sp in sigPats)
            {
                MatchCollection mc = Regex.Matches(text, sp);
                foreach (Match m in mc)
                {
                    string cand = m.Value.Trim();
                    if (!Regex.IsMatch(cand, @"(Arnaldo|Johannes|Rizal|Merry|Fitriani)", RegexOptions.IgnoreCase) && IsPersonName(cand))
                    {
                        doc.partnerSignatory = cand;
                        result.Findings.Add("✓ Penandatangan Mitra (Orang): " + doc.partnerSignatory);
                        break;
                    }
                }
                if (!string.IsNullOrEmpty(doc.partnerSignatory)) break;
            }

            Match jm = Regex.Match(text, @"(Bupati\s+[A-Za-z]+|Direktur\s+Utama|Direktur|Kepala\s+Dinas\s+[A-Za-z\s]+|Kepala\s+Sekolah|Dekan|Rektor)", RegexOptions.IgnoreCase);
            if (jm.Success && !Regex.IsMatch(jm.Value, @"Rektor\s+Institut\s+Teknologi\s+Del", RegexOptions.IgnoreCase))
            {
                doc.partnerSignatoryTitle = jm.Value.Trim();
                result.Findings.Add("✓ Jabatan Mitra: " + doc.partnerSignatoryTitle);
            }

            // 7. Fakultas & Prodi
            string lower = text.ToLower();
            int scoreFITE = 0, scoreFTI = 0, scoreFB = 0;
            string[] fiteWords = new string[] { "informatika", "software", "pemrograman", "komputer", "sistem informasi", "erp", "cyber", "jaringan", "teknik elektro" };
            string[] ftiWords = new string[] { "manajemen rekayasa", "industri", "rantai pasok", "supply chain", "manufaktur", "logistik", "pabrik" };
            string[] fbWords = new string[] { "bioproses", "bioteknologi", "flora", "fauna", "mikrobiologi", "limbah", "danau toba", "pangan" };

            foreach (string w in fiteWords) if (lower.Contains(w)) scoreFITE++;
            foreach (string w in ftiWords) if (lower.Contains(w)) scoreFTI++;
            foreach (string w in fbWords) if (lower.Contains(w)) scoreFB++;

            if (scoreFITE >= scoreFTI && scoreFITE >= scoreFB && scoreFITE > 0)
            {
                doc.faculty = "FITE";
                doc.program = lower.Contains("sistem informasi") || lower.Contains("erp") ? "S1 Sistem Informasi" : "S1 Informatika";
                result.Findings.Add(string.Format("✓ Fakultas & Prodi: FITE ({0})", doc.program));
            }
            else if (scoreFTI > scoreFITE && scoreFTI >= scoreFB)
            {
                doc.faculty = "FTI";
                doc.program = "S1 Manajemen Rekayasa";
                result.Findings.Add("✓ Fakultas & Prodi: FTI (S1 Manajemen Rekayasa)");
            }
            else if (scoreFB > scoreFITE && scoreFB > scoreFTI)
            {
                doc.faculty = "FB";
                doc.program = "S1 Teknik Bioproses";
                result.Findings.Add("✓ Fakultas & Prodi: FB (S1 Teknik Bioproses)");
            }
            else
            {
                doc.faculty = "FITE";
                doc.program = "S1 Informatika";
            }

            // 8. Tri Dharma
            List<string> tri = new List<string>();
            if (Regex.IsMatch(lower, @"(pendidikan|kuliah|magang|kurikulum|mahasiswa)")) tri.Add("Pendidikan");
            if (Regex.IsMatch(lower, @"(penelitian|riset|publikasi|jurnal|laboratorium)")) tri.Add("Penelitian");
            if (Regex.IsMatch(lower, @"(pengabdian|masyarakat|desa binaan|pelatihan warga)")) tri.Add("Pengabdian");
            if (tri.Count > 0)
            {
                doc.triDharma = string.Join("; ", tri.ToArray());
                result.Findings.Add("✓ Tri Dharma: " + doc.triDharma);
            }

            // 9. Tanggal & Masa Berlaku
            Match dm = Regex.Match(text, @"(?:tanggal\s+)?(\d{1,2})(?:\s*\([^)]*\))?\s*(?:bulan\s+)?(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s*(?:tahun\s+)?(\d{4})", RegexOptions.IgnoreCase);
            if (dm.Success)
            {
                int day = int.Parse(dm.Groups[1].Value);
                string mName = dm.Groups[2].Value.ToLower();
                int year = int.Parse(dm.Groups[3].Value);
                int month = 1;
                if (mName.StartsWith("jan")) month = 1;
                else if (mName.StartsWith("feb")) month = 2;
                else if (mName.StartsWith("mar")) month = 3;
                else if (mName.StartsWith("apr")) month = 4;
                else if (mName.StartsWith("mei")) month = 5;
                else if (mName.StartsWith("jun")) month = 6;
                else if (mName.StartsWith("jul")) month = 7;
                else if (mName.StartsWith("agu")) month = 8;
                else if (mName.StartsWith("sep")) month = 9;
                else if (mName.StartsWith("okt")) month = 10;
                else if (mName.StartsWith("nov")) month = 11;
                else if (mName.StartsWith("des")) month = 12;

                DateTime dt = new DateTime(year, month, day);
                doc.startDate = dt.ToString("yyyy-MM-dd");
                doc.signedDate = dt.ToString("yyyy-MM-dd");
                result.Findings.Add("✓ Mulai Berlaku: " + doc.startDate);
            }
            else
            {
                Match dmy = Regex.Match(text, @"\b(0[1-9]|[12]\d|3[01])[-/.](0[1-9]|1[0-2])[-/.](20\d{2})\b");
                if (dmy.Success)
                {
                    doc.startDate = string.Format("{0}-{1}-{2}", dmy.Groups[3].Value, dmy.Groups[2].Value, dmy.Groups[1].Value);
                    doc.signedDate = doc.startDate;
                    result.Findings.Add("✓ Mulai Berlaku: " + doc.startDate);
                }
            }

            Match mEnd = Regex.Match(text, @"(?:sampai\s+dengan|berakhir\s+pada|berlaku\s+hingga|s\.d\.?)\s*(?:tanggal\s+)?(\d{1,2})(?:\s*\([^)]*\))?\s*(?:bulan\s+)?(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s*(?:tahun\s+)?(\d{4})", RegexOptions.IgnoreCase);
            if (mEnd.Success)
            {
                int day = int.Parse(mEnd.Groups[1].Value);
                string mName = mEnd.Groups[2].Value.ToLower();
                int year = int.Parse(mEnd.Groups[3].Value);
                int month = 1;
                if (mName.StartsWith("jan")) month = 1;
                else if (mName.StartsWith("feb")) month = 2;
                else if (mName.StartsWith("mar")) month = 3;
                else if (mName.StartsWith("apr")) month = 4;
                else if (mName.StartsWith("mei")) month = 5;
                else if (mName.StartsWith("jun")) month = 6;
                else if (mName.StartsWith("jul")) month = 7;
                else if (mName.StartsWith("agu")) month = 8;
                else if (mName.StartsWith("sep")) month = 9;
                else if (mName.StartsWith("okt")) month = 10;
                else if (mName.StartsWith("nov")) month = 11;
                else if (mName.StartsWith("des")) month = 12;

                DateTime dt = new DateTime(year, month, day);
                doc.endDate = dt.ToString("yyyy-MM-dd");
                result.Findings.Add("✓ Berakhir: " + doc.endDate);
            }
            else
            {
                Match durMatch = Regex.Match(text, @"(?:jangka\s+waktu|selama)\s+(\d+)\s*(?:\([a-z\s]+\))?\s*tahun", RegexOptions.IgnoreCase);
                if (durMatch.Success)
                {
                    int yrs = int.Parse(durMatch.Groups[1].Value);
                    DateTime st;
                    if (DateTime.TryParse(doc.startDate, out st))
                    {
                        DateTime ed = st.AddYears(yrs).AddDays(-1);
                        doc.endDate = ed.ToString("yyyy-MM-dd");
                        result.Findings.Add(string.Format("✓ Berakhir: {0} (Durasi {1} Tahun)", doc.endDate, yrs));
                    }
                }
            }
            if (string.IsNullOrEmpty(doc.endDate))
            {
                DateTime st;
                if (DateTime.TryParse(doc.startDate, out st))
                {
                    doc.endDate = st.AddYears(3).AddDays(-1).ToString("yyyy-MM-dd");
                }
            }

            // 10. Anggaran & Lokasi
            Match bm = Regex.Match(text, @"(?:Rp\.?|sebesar)\s*([0-9\.\,]{4,15})", RegexOptions.IgnoreCase);
            if (bm.Success)
            {
                doc.budget = "Rp " + bm.Groups[1].Value.Trim();
                result.Findings.Add("✓ Anggaran: " + doc.budget);
            }

            string[] locs = new string[] { "Laguboti", "Balige", "Toba", "Medan", "Danau Toba", "Jakarta" };
            foreach (string l in locs)
            {
                if (Regex.IsMatch(text, @"\b" + l + @"\b", RegexOptions.IgnoreCase))
                {
                    doc.location = l;
                    result.Findings.Add("✓ Lokasi: " + doc.location);
                    break;
                }
            }

            doc.scope = doc.title;
            doc.activityName = doc.title;

            result.Item = doc;
            return result;
        }
    }

    public class OcrResultDialog : Form
    {
        public bool ProceedToForm { get; private set; }

        public OcrResultDialog(SmartExtractionResult result, string fileName)
        {
            Text = "Hasil Ekstraksi Cerdas & Engine OCR Dokumen";
            Size = new Size(680, 560);
            StartPosition = FormStartPosition.CenterParent;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            Panel topPanel = new Panel { Dock = DockStyle.Top, Height = 75, BackColor = Color.FromArgb(240, 246, 252), Padding = new Padding(15, 12, 15, 10) };
            Label lblTitle = new Label { Text = "🔍 Temuan Ekstraksi Cerdas Dokumen", Font = new Font("Segoe UI", 11f, FontStyle.Bold), ForeColor = Color.FromArgb(22, 50, 79), AutoSize = true, Location = new Point(14, 10) };
            Label lblSub = new Label { Text = string.Format("Berkas: {0} | {1} Atribut Berhasil Diidentifikasi", Path.GetFileName(fileName), result.Findings.Count), AutoSize = true, Location = new Point(15, 38), ForeColor = Color.FromArgb(60, 80, 100) };
            topPanel.Controls.Add(lblTitle);
            topPanel.Controls.Add(lblSub);

            ListBox listFindings = new ListBox { Dock = DockStyle.Fill, Font = new Font("Segoe UI", 9.5f), ItemHeight = 22 };
            foreach (string f in result.Findings)
            {
                listFindings.Items.Add(f);
            }

            Panel bottomPanel = new Panel { Dock = DockStyle.Bottom, Height = 90, BackColor = Color.FromArgb(248, 249, 250), Padding = new Padding(15) };
            Label lblNote = new Label
            {
                Text = "ℹ️ Nilai di atas telah disiapkan ke formulir. Staf Unit Kerja Sama memeriksa, melengkapi detail lebih lanjut, dan memverifikasi data sebelum disimpan.",
                ForeColor = Color.FromArgb(30, 70, 30),
                Font = new Font("Segoe UI", 8.5f, FontStyle.Italic),
                Dock = DockStyle.Top,
                Height = 35
            };

            Button btnProceed = new Button
            {
                Text = "✓ Lanjutkan ke Formulir Validasi Staf",
                DialogResult = DialogResult.OK,
                Width = 260,
                Height = 34,
                Location = new Point(275, 42),
                BackColor = Color.FromArgb(22, 50, 79),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold)
            };
            btnProceed.Click += (s, e) => { ProceedToForm = true; };

            Button btnCancel = new Button
            {
                Text = "Batal",
                DialogResult = DialogResult.Cancel,
                Width = 100,
                Height = 34,
                Location = new Point(545, 42)
            };

            bottomPanel.Controls.Add(btnProceed);
            bottomPanel.Controls.Add(btnCancel);
            bottomPanel.Controls.Add(lblNote);

            Controls.Add(listFindings);
            Controls.Add(bottomPanel);
            Controls.Add(topPanel);
        }
    }

    public class Program
    {
        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }

    public class MainForm : Form
    {
        private List<NaskahItem> _documents = new List<NaskahItem>();
        private string _baseDir;
        private string _dbDir;
        private string _tablesDir;
        private string _schemaDir;
        private string _dosirDir;
        private string _backupsDir;
        private string _dbPath;
        private string _relationalDocsPath;
        private string _mitraPath;
        private string _fakultasProdiPath;
        private string _auditPath;
        private DataGridView _grid;
        private TextBox _searchBox;
        private ComboBox _typeCombo;
        private ComboBox _statusCombo;
        private ToolStripStatusLabel _statusLabel;

        public MainForm()
        {
            _baseDir = AppDomain.CurrentDomain.BaseDirectory;
            _dbDir = Path.Combine(_baseDir, "ksdas_local_database");
            _tablesDir = Path.Combine(_dbDir, "tables");
            _schemaDir = Path.Combine(_dbDir, "schema");
            _dosirDir = Path.Combine(_dbDir, "dosir_lampiran");
            _backupsDir = Path.Combine(_dbDir, "backups");
            _dbPath = Path.Combine(_baseDir, "ksdas_desktop_database.json");
            _relationalDocsPath = Path.Combine(_tablesDir, "naskah_kerjasama.json");
            _mitraPath = Path.Combine(_tablesDir, "mitra_institusi.json");
            _fakultasProdiPath = Path.Combine(_tablesDir, "fakultas_prodi.json");
            _auditPath = Path.Combine(_tablesDir, "audit_trail_log.json");

            bool isNew = EnsureStructuredDatabase();
            InitializeUi();
            LoadData();

            if (isNew)
            {
                MessageBox.Show(
                    "Selamat Datang di KSDAS IT Del!\n\n" +
                    "Sistem Basis Data Terstruktur & Terintegrasi Lokal telah berhasil dibangun otomatis di komputer Anda.\n\n" +
                    "Direktori Basis Data:\n" + _dbDir + "\n\n" +
                    "Tabel Terintegrasi:\n" +
                    "• tables/naskah_kerjasama.json (Relasional Dokumen)\n" +
                    "• tables/mitra_institusi.json (Master Mitra Kampus & Industri)\n" +
                    "• tables/fakultas_prodi.json (Taksonomi Fakultas & Prodi)\n" +
                    "• tables/audit_trail_log.json (Log Audit Transaksi Mutlak)\n" +
                    "• schema/ksdas_relational_schema.sql (Skema SQL DDL)\n\n" +
                    "Semua mutasi data tersimpan secara persisten offline.",
                    "Basis Data Lokal Terstruktur Berhasil Dibangun",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information
                );
            }
        }

        private bool EnsureStructuredDatabase()
        {
            bool createdNow = false;
            try
            {
                if (!Directory.Exists(_dbDir)) { Directory.CreateDirectory(_dbDir); createdNow = true; }
                if (!Directory.Exists(_tablesDir)) Directory.CreateDirectory(_tablesDir);
                if (!Directory.Exists(_schemaDir)) Directory.CreateDirectory(_schemaDir);
                if (!Directory.Exists(_dosirDir)) Directory.CreateDirectory(_dosirDir);
                if (!Directory.Exists(_backupsDir)) Directory.CreateDirectory(_backupsDir);

                string sqlPath = Path.Combine(_schemaDir, "ksdas_relational_schema.sql");
                if (!File.Exists(sqlPath))
                {
                    string sqlContent =
@"-- ========================================================
-- SKEMA BASIS DATA RELASIONAL KSDAS INSTITUT TEKNOLOGI DEL
-- Target RDBMS: PostgreSQL 14+ / SQLite 3
-- ========================================================

CREATE TABLE IF NOT EXISTS ksdas_mitra (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    partner_type VARCHAR(50) NOT NULL,
    country VARCHAR(50) DEFAULT 'Indonesia',
    city VARCHAR(100),
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ksdas_fakultas_prodi (
    program_id VARCHAR(20) PRIMARY KEY,
    faculty_id VARCHAR(20) NOT NULL,
    faculty_name VARCHAR(150) NOT NULL,
    program_name VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS ksdas_naskah_kerjasama (
    id VARCHAR(50) PRIMARY KEY,
    document_number VARCHAR(120) NOT NULL UNIQUE,
    document_type VARCHAR(30) NOT NULL,
    title TEXT NOT NULL,
    partner_id VARCHAR(50) REFERENCES ksdas_mitra(id),
    faculty_id VARCHAR(20),
    program_id VARCHAR(20) REFERENCES ksdas_fakultas_prodi(program_id),
    tri_dharma VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    signed_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'AKTIF',
    activity_name TEXT,
    pic VARCHAR(150),
    partner_signatory VARCHAR(150),
    partner_signatory_title VARCHAR(150),
    itdel_signatory VARCHAR(150),
    itdel_signatory_title VARCHAR(150),
    location VARCHAR(150) DEFAULT 'Sitoluama, Laguboti',
    budget VARCHAR(100),
    funding_source VARCHAR(100),
    scope TEXT,
    notes TEXT,
    file_name VARCHAR(255),
    parent_id VARCHAR(50) REFERENCES ksdas_naskah_kerjasama(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ksdas_audit_log (
    log_id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actor VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    target_id VARCHAR(50),
    details TEXT
);
";
                    File.WriteAllText(sqlPath, sqlContent, Encoding.UTF8);
                }

                string dictPath = Path.Combine(_schemaDir, "data_dictionary.json");
                if (!File.Exists(dictPath))
                {
                    string dictJson = @"{
  ""database_name"": ""ksdas_itdel_local"",
  ""version"": ""1.2.0-LOKAL"",
  ""architecture"": ""Relational Local File-Based System"",
  ""tables"": [
    { ""name"": ""ksdas_naskah_kerjasama"", ""records_file"": ""tables/naskah_kerjasama.json"", ""description"": ""Dosir Naskah Perjanjian (MoU, PKS, IA)"" },
    { ""name"": ""ksdas_mitra"", ""records_file"": ""tables/mitra_institusi.json"", ""description"": ""Direktori Master Mitra Industri & Universitas"" },
    { ""name"": ""ksdas_fakultas_prodi"", ""records_file"": ""tables/fakultas_prodi.json"", ""description"": ""Taksonomi Fakultas FITE, FTI, FB dan Program Studi"" },
    { ""name"": ""ksdas_audit_log"", ""records_file"": ""tables/audit_trail_log.json"", ""description"": ""Buku Log Mutasi dan Riwayat Validasi Staf"" }
  ]
}";
                    File.WriteAllText(dictPath, dictJson, Encoding.UTF8);
                }

                if (!File.Exists(_mitraPath))
                {
                    string mitraJson = @"[
  { ""id"": ""TOBA"", ""name"": ""Pemerintah Kabupaten Toba"", ""shortName"": ""Pemkab Toba"", ""type"": ""PEMERINTAH_DAERAH"", ""city"": ""Balige"" },
  { ""id"": ""USU"", ""name"": ""Universitas Sumatera Utara"", ""shortName"": ""USU"", ""type"": ""UNIVERSITAS"", ""city"": ""Medan"" },
  { ""id"": ""SMKN1_LAGUBOTI"", ""name"": ""SMK Negeri 1 Laguboti"", ""shortName"": ""SMKN 1 Laguboti"", ""type"": ""SEKOLAH_VOKASI"", ""city"": ""Laguboti"" },
  { ""id"": ""DISPAR_SUMUT"", ""name"": ""Dinas Kebudayaan dan Pariwisata Provinsi Sumatera Utara"", ""shortName"": ""Dispar Sumut"", ""type"": ""PEMERINTAH_DAERAH"", ""city"": ""Medan"" },
  { ""id"": ""HUAWEI"", ""name"": ""PT Huawei Tech Investment"", ""shortName"": ""Huawei"", ""type"": ""INDUSTRI"", ""city"": ""Jakarta"" },
  { ""id"": ""MANDIRI"", ""name"": ""PT Bank Mandiri (Persero) Tbk."", ""shortName"": ""Bank Mandiri"", ""type"": ""BUMN"", ""city"": ""Medan"" }
]";
                    File.WriteAllText(_mitraPath, mitraJson, Encoding.UTF8);
                }

                if (!File.Exists(_fakultasProdiPath))
                {
                    string fakJson = @"[
  { ""facultyId"": ""FITE"", ""facultyName"": ""Fakultas Informatika dan Teknik Elektro"", ""programId"": ""IF"", ""programName"": ""S1 Informatika"" },
  { ""facultyId"": ""FITE"", ""facultyName"": ""Fakultas Informatika dan Teknik Elektro"", ""programId"": ""SI"", ""programName"": ""S1 Sistem Informasi"" },
  { ""facultyId"": ""FTI"", ""facultyName"": ""Fakultas Teknologi Industri"", ""programId"": ""MR"", ""programName"": ""S1 Manajemen Rekayasa"" },
  { ""facultyId"": ""FB"", ""facultyName"": ""Fakultas Bioteknologi"", ""programId"": ""BP"", ""programName"": ""S1 Teknik Bioproses"" }
]";
                    File.WriteAllText(_fakultasProdiPath, fakJson, Encoding.UTF8);
                }

                if (!File.Exists(_auditPath))
                {
                    string initAudit = string.Format(@"[
  {{
    ""logId"": ""INIT-001"",
    ""timestamp"": ""{0}"",
    ""actor"": ""SYSTEM_INSTALLER"",
    ""action"": ""DATABASE_INITIALIZATION"",
    ""targetId"": ""DATABASE_ROOT"",
    ""details"": ""Sistem basis data terstruktur dan terintegrasi lokal KSDAS IT Del berhasil dibangun otomatis di komputer lokal.""
  }}
]", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
                    File.WriteAllText(_auditPath, initAudit, Encoding.UTF8);
                }

                string manifestPath = Path.Combine(_tablesDir, "database_manifest.json");
                if (!File.Exists(manifestPath))
                {
                    string manifest = string.Format(@"{{
  ""system"": ""KSDAS IT Del Local Relational Database"",
  ""version"": ""1.2.0-LOKAL"",
  ""created_at"": ""{0}"",
  ""schema_status"": ""INTEGRATED_HEALTHY"",
  ""author"": ""Samuel Hasudungan Tampubolon"",
  ""institution"": ""Institut Teknologi Del""
}}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
                    File.WriteAllText(manifestPath, manifest, Encoding.UTF8);
                }

                if (!File.Exists(_relationalDocsPath))
                {
                    JavaScriptSerializer js = new JavaScriptSerializer();
                    string seedJson = js.Serialize(GetSeedDocuments());
                    File.WriteAllText(_relationalDocsPath, seedJson, Encoding.UTF8);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Inisialisasi basis data lokal: " + ex.Message, "Info", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
            return createdNow;
        }

        private void InitializeUi()
        {
            Text = "KSDAS IT Del — Sistem Informasi Kerja Sama (Desktop Standalone & Local Relational DB)";
            Size = new Size(1220, 750);
            StartPosition = FormStartPosition.CenterScreen;
            Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            Icon = SystemIcons.Application;

            // Main layout
            Panel headerPanel = new Panel { Dock = DockStyle.Top, Height = 75, BackColor = Color.FromArgb(22, 50, 79) };
            Label titleLabel = new Label
            {
                Text = "INSTITUT TEKNOLOGI DEL — UNIT KERJA SAMA",
                ForeColor = Color.White,
                Font = new Font("Georgia", 13f, FontStyle.Bold),
                Location = new Point(16, 12),
                AutoSize = true
            };
            Label subLabel = new Label
            {
                Text = "KSDAS Standalone Desktop • Sistem Basis Data Terstruktur & Terintegrasi Lokal (ksdas_local_database)",
                ForeColor = Color.FromArgb(213, 221, 230),
                Font = new Font("Segoe UI", 9f, FontStyle.Regular),
                Location = new Point(17, 40),
                AutoSize = true
            };
            headerPanel.Controls.Add(titleLabel);
            headerPanel.Controls.Add(subLabel);

            // Filter & Toolbar Panel (3 Baris: Filter, Operasi Naskah, Tata Kelola Basis Data)
            Panel toolPanel = new Panel { Dock = DockStyle.Top, Height = 135, BackColor = Color.FromArgb(243, 240, 232), Padding = new Padding(12, 10, 12, 8) };

            // Baris 1: Filter
            Label lblSearch = new Label { Text = "Cari Dokumen:", Location = new Point(14, 12), AutoSize = true };
            _searchBox = new TextBox { Location = new Point(115, 9), Width = 220 };
            _searchBox.TextChanged += (s, e) => ApplyFilter();

            Label lblType = new Label { Text = "Jenis:", Location = new Point(350, 12), AutoSize = true };
            _typeCombo = new ComboBox { Location = new Point(395, 9), Width = 140, DropDownStyle = ComboBoxStyle.DropDownList };
            _typeCombo.Items.AddRange(new object[] { "Semua Jenis", "MoU / LOI", "PKS / MoA", "IA", "Proposal", "Laporan" });
            _typeCombo.SelectedIndex = 0;
            _typeCombo.SelectedIndexChanged += (s, e) => ApplyFilter();

            Label lblStatus = new Label { Text = "Status:", Location = new Point(550, 12), AutoSize = true };
            _statusCombo = new ComboBox { Location = new Point(600, 9), Width = 140, DropDownStyle = ComboBoxStyle.DropDownList };
            _statusCombo.Items.AddRange(new object[] { "Semua Status", "Aktif", "Akan Berakhir", "Berakhir", "Draf" });
            _statusCombo.SelectedIndex = 0;
            _statusCombo.SelectedIndexChanged += (s, e) => ApplyFilter();

            Button btnResetFilter = new Button { Text = "Reset Saringan", Location = new Point(755, 8), Width = 110, Height = 28 };
            btnResetFilter.Click += (s, e) => { _searchBox.Text = ""; _typeCombo.SelectedIndex = 0; _statusCombo.SelectedIndex = 0; };

            // Baris 2: Operasi Naskah & OCR
            Button btnOcr = new Button
            {
                Text = "🔍 Ekstraksi Cerdas & OCR",
                Location = new Point(14, 48),
                Width = 195,
                Height = 32,
                BackColor = Color.FromArgb(180, 83, 9),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 9f, FontStyle.Bold)
            };
            btnOcr.Click += (s, e) => OpenSmartExtractionDialog();

            Button btnAdd = new Button { Text = "+ Tambah Naskah", Location = new Point(215, 48), Width = 140, Height = 32, BackColor = Color.FromArgb(22, 50, 79), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnAdd.Click += (s, e) => OpenAddDialog();

            Button btnSave = new Button { Text = "💾 Simpan Database", Location = new Point(361, 48), Width = 145, Height = 32, BackColor = Color.FromArgb(40, 100, 60), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnSave.Click += (s, e) => { SaveData(); MessageBox.Show("Data berhasil disimpan persisten ke basis data terstruktur lokal:\n" + _relationalDocsPath, "Tersimpan", MessageBoxButtons.OK, MessageBoxIcon.Information); };

            Button btnExport = new Button { Text = "📊 Ekspor ke CSV", Location = new Point(512, 48), Width = 130, Height = 32 };
            btnExport.Click += (s, e) => ExportCsv();

            Button btnAnalysis = new Button { Text = "📈 Generate Analisis", Location = new Point(648, 48), Width = 150, Height = 32, BackColor = Color.FromArgb(22, 50, 79), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnAnalysis.Click += (s, e) => ShowAnalysis();

            Button btnOpenWeb = new Button { Text = "🌐 Buka Versi Web", Location = new Point(804, 48), Width = 140, Height = 32 };
            btnOpenWeb.Click += (s, e) => OpenWeb();

            Button btnResetSample = new Button { Text = "↺ Muat Ulang 10 Contoh", Location = new Point(950, 48), Width = 175, Height = 32 };
            btnResetSample.Click += (s, e) => ResetToSeedData();

            // Baris 3: Pengelolaan Basis Data Terstruktur Lokal
            Button btnOpenDbDir = new Button
            {
                Text = "🗄️ Buka Folder Basis Data Lokal",
                Location = new Point(14, 88),
                Width = 230,
                Height = 32,
                BackColor = Color.FromArgb(30, 80, 110),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat
            };
            btnOpenDbDir.Click += (s, e) => OpenDatabaseFolder();

            Button btnSchema = new Button
            {
                Text = "📊 Skema Relasional & Log Audit",
                Location = new Point(250, 88),
                Width = 220,
                Height = 32
            };
            btnSchema.Click += (s, e) => ShowSchemaDialog();

            Button btnBackup = new Button
            {
                Text = "🔄 Cadangkan Basis Data (Snapshot)",
                Location = new Point(476, 88),
                Width = 240,
                Height = 32
            };
            btnBackup.Click += (s, e) => BackupDatabase();

            toolPanel.Controls.Add(lblSearch);
            toolPanel.Controls.Add(_searchBox);
            toolPanel.Controls.Add(lblType);
            toolPanel.Controls.Add(_typeCombo);
            toolPanel.Controls.Add(lblStatus);
            toolPanel.Controls.Add(_statusCombo);
            toolPanel.Controls.Add(btnResetFilter);
            toolPanel.Controls.Add(btnOcr);
            toolPanel.Controls.Add(btnAdd);
            toolPanel.Controls.Add(btnSave);
            toolPanel.Controls.Add(btnExport);
            toolPanel.Controls.Add(btnAnalysis);
            toolPanel.Controls.Add(btnOpenWeb);
            toolPanel.Controls.Add(btnResetSample);
            toolPanel.Controls.Add(btnOpenDbDir);
            toolPanel.Controls.Add(btnSchema);
            toolPanel.Controls.Add(btnBackup);

            // DataGridView
            _grid = new DataGridView
            {
                Dock = DockStyle.Fill,
                BackgroundColor = Color.FromArgb(255, 253, 248),
                RowHeadersVisible = false,
                AllowUserToAddRows = false,
                AllowUserToDeleteRows = false,
                ReadOnly = true,
                SelectionMode = DataGridViewSelectionMode.FullRowSelect,
                MultiSelect = false,
                AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill
            };
            _grid.DoubleClick += (s, e) => OpenEditSelected();

            // Setup columns
            _grid.Columns.Add("no", "No");
            _grid.Columns["no"].FillWeight = 30;
            _grid.Columns.Add("docNumber", "Nomor Dokumen");
            _grid.Columns["docNumber"].FillWeight = 90;
            _grid.Columns.Add("docType", "Jenis");
            _grid.Columns["docType"].FillWeight = 50;
            _grid.Columns.Add("title", "Judul Kerja Sama");
            _grid.Columns["title"].FillWeight = 160;
            _grid.Columns.Add("partner", "Mitra");
            _grid.Columns["partner"].FillWeight = 110;
            _grid.Columns.Add("faculty", "Fakultas / Prodi");
            _grid.Columns["faculty"].FillWeight = 85;
            _grid.Columns.Add("startDate", "Mulai");
            _grid.Columns["startDate"].FillWeight = 55;
            _grid.Columns.Add("endDate", "Berakhir");
            _grid.Columns["endDate"].FillWeight = 55;
            _grid.Columns.Add("status", "Status");
            _grid.Columns["status"].FillWeight = 50;

            // Status strip
            StatusStrip statusStrip = new StatusStrip();
            _statusLabel = new ToolStripStatusLabel { Text = "🟢 Basis Data Terstruktur: Terkoneksi | Lokasi: ksdas_local_database" };
            statusStrip.Items.Add(_statusLabel);

            Controls.Add(_grid);
            Controls.Add(toolPanel);
            Controls.Add(headerPanel);
            Controls.Add(statusStrip);
        }

        private void OpenDatabaseFolder()
        {
            try
            {
                if (Directory.Exists(_dbDir))
                {
                    Process.Start("explorer.exe", _dbDir);
                }
                else
                {
                    MessageBox.Show("Folder basis data lokal belum dibuat: " + _dbDir, "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Gagal membuka folder: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void ShowSchemaDialog()
        {
            StringBuilder sb = new StringBuilder();
            sb.AppendLine("==================================================");
            sb.AppendLine("STRUKTUR BASIS DATA RELASIONAL LOKAL KSDAS IT DEL");
            sb.AppendLine("==================================================");
            sb.AppendLine();
            sb.AppendLine("Direktori: " + _dbDir);
            sb.AppendLine("Status   : Terkoneksi (Lokal Portabel & Terintegrasi)");
            sb.AppendLine();
            sb.AppendLine("I. TABEL RELASIONAL TERSEDIA:");
            sb.AppendLine(string.Format("  1. ksdas_naskah_kerjasama ({0} rekaman)", _documents.Count));
            sb.AppendLine("     File: tables/naskah_kerjasama.json");
            sb.AppendLine("     Kolom: id, document_number, document_type, title, partner_id,");
            sb.AppendLine("            faculty_id, program_id, tri_dharma, start_date, end_date,");
            sb.AppendLine("            status, activity_name, pic, signatories, budget, scope");
            sb.AppendLine();
            sb.AppendLine("  2. ksdas_mitra (6 entitas mitra terstandar)");
            sb.AppendLine("     File: tables/mitra_institusi.json");
            sb.AppendLine("     Mitra: Pemkab Toba, USU, SMKN 1 Laguboti, Dispar Sumut, Huawei, Bank Mandiri");
            sb.AppendLine();
            sb.AppendLine("  3. ksdas_fakultas_prodi (4 program studi resmi)");
            sb.AppendLine("     File: tables/fakultas_prodi.json");
            sb.AppendLine("     Fakultas: FITE (IF, SI), FTI (MR), FB (BP)");
            sb.AppendLine();
            sb.AppendLine("  4. ksdas_audit_log (Buku Log Mutasi Sistem)");
            sb.AppendLine("     File: tables/audit_trail_log.json");
            sb.AppendLine();
            sb.AppendLine("II. BERKAS SKEMA DDL (POSTGRESQL & SQLITE):");
            sb.AppendLine("  • schema/ksdas_relational_schema.sql");
            sb.AppendLine("  • schema/data_dictionary.json");
            sb.AppendLine();
            sb.AppendLine("III. REPOSITORY DOSIR & CADANGAN:");
            sb.AppendLine("  • dosir_lampiran/ (Arsip naskah PDF/Word/Scan)");
            sb.AppendLine("  • backups/ (Cadangan snapshot berkala)");

            using (Form dlg = new Form())
            {
                dlg.Text = "Struktur Basis Data & Skema Relasional Lokal KSDAS";
                dlg.Size = new Size(680, 560);
                dlg.StartPosition = FormStartPosition.CenterParent;
                dlg.Font = new Font("Segoe UI", 9.5f);

                TextBox txt = new TextBox
                {
                    Multiline = true,
                    ReadOnly = true,
                    ScrollBars = ScrollBars.Both,
                    Dock = DockStyle.Fill,
                    Font = new Font("Consolas", 9.5f),
                    Text = sb.ToString()
                };

                Panel bot = new Panel { Dock = DockStyle.Bottom, Height = 50, Padding = new Padding(10) };
                Button btnOpenDir = new Button { Text = "Buka Folder Basis Data di Explorer", Width = 250, Height = 32, Dock = DockStyle.Left };
                btnOpenDir.Click += (s, e) => OpenDatabaseFolder();
                Button btnClose = new Button { Text = "Tutup", Width = 90, Height = 32, Dock = DockStyle.Right, DialogResult = DialogResult.OK };
                bot.Controls.Add(btnOpenDir);
                bot.Controls.Add(btnClose);

                dlg.Controls.Add(txt);
                dlg.Controls.Add(bot);
                dlg.ShowDialog(this);
            }
        }

        private void BackupDatabase()
        {
            try
            {
                if (!Directory.Exists(_backupsDir)) Directory.CreateDirectory(_backupsDir);
                string ts = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                string target = Path.Combine(_backupsDir, string.Format("backup_ksdas_{0}.json", ts));
                JavaScriptSerializer js = new JavaScriptSerializer();
                string json = js.Serialize(_documents);
                File.WriteAllText(target, json, Encoding.UTF8);

                AppendAuditLog("BACKUP_DATABASE", "SNAPSHOT", "Snapshot basis data dibuat: " + Path.GetFileName(target));
                MessageBox.Show(
                    "Cadangan basis data lokal berhasil dibuat!\n\nBerkas Cadangan:\n" + target + "\n\nTotal Naskah: " + _documents.Count,
                    "Cadangan Sukses",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information
                );
            }
            catch (Exception ex)
            {
                MessageBox.Show("Gagal membuat cadangan: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void AppendAuditLog(string action, string targetId, string details)
        {
            try
            {
                if (string.IsNullOrEmpty(_auditPath)) return;
                List<Dictionary<string, string>> logs = new List<Dictionary<string, string>>();
                JavaScriptSerializer js = new JavaScriptSerializer();
                if (File.Exists(_auditPath))
                {
                    try
                    {
                        string existing = File.ReadAllText(_auditPath, Encoding.UTF8);
                        logs = js.Deserialize<List<Dictionary<string, string>>>(existing) ?? new List<Dictionary<string, string>>();
                    }
                    catch {}
                }
                Dictionary<string, string> entry = new Dictionary<string, string>();
                entry["logId"] = "LOG-" + Guid.NewGuid().ToString().Substring(0, 8).ToUpper();
                entry["timestamp"] = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                entry["actor"] = "STAFF_DESKTOP";
                entry["action"] = action;
                entry["targetId"] = targetId;
                entry["details"] = details;
                logs.Add(entry);
                File.WriteAllText(_auditPath, js.Serialize(logs), Encoding.UTF8);
            }
            catch {}
        }

        private void LoadData()
        {
            bool loaded = false;
            if (File.Exists(_relationalDocsPath))
            {
                try
                {
                    string json = File.ReadAllText(_relationalDocsPath, Encoding.UTF8);
                    JavaScriptSerializer js = new JavaScriptSerializer();
                    _documents = js.Deserialize<List<NaskahItem>>(json) ?? new List<NaskahItem>();
                    loaded = true;
                }
                catch {}
            }
            if (!loaded && File.Exists(_dbPath))
            {
                try
                {
                    string json = File.ReadAllText(_dbPath, Encoding.UTF8);
                    JavaScriptSerializer js = new JavaScriptSerializer();
                    _documents = js.Deserialize<List<NaskahItem>>(json) ?? new List<NaskahItem>();
                    loaded = true;
                }
                catch {}
            }
            if (!loaded || _documents.Count == 0)
            {
                _documents = GetSeedDocuments();
                SaveData();
            }
            ApplyFilter();
        }

        private void SaveData()
        {
            try
            {
                JavaScriptSerializer js = new JavaScriptSerializer();
                string json = js.Serialize(_documents);
                File.WriteAllText(_dbPath, json, Encoding.UTF8);
                if (!string.IsNullOrEmpty(_relationalDocsPath))
                {
                    string dir = Path.GetDirectoryName(_relationalDocsPath);
                    if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
                    File.WriteAllText(_relationalDocsPath, json, Encoding.UTF8);
                }
                AppendAuditLog("SAVE_DATABASE", "MUTATION", string.Format("Total {0} rekaman naskah tersimpan ke basis data lokal terstruktur.", _documents.Count));
                UpdateStatus();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Gagal menyimpan basis data: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void ApplyFilter()
        {
            string q = _searchBox.Text.Trim().ToLower();
            string typeFilter = _typeCombo.SelectedIndex > 0 ? _typeCombo.SelectedItem.ToString() : "";
            string statusFilter = _statusCombo.SelectedIndex > 0 ? _statusCombo.SelectedItem.ToString() : "";

            _grid.Rows.Clear();
            int count = 0;
            DateTime today = DateTime.Today;

            foreach (var doc in _documents)
            {
                // Calculate display status
                string calcStatus = GetDisplayStatus(doc, today);

                if (!string.IsNullOrEmpty(q))
                {
                    string blob = string.Format("{0} {1} {2} {3} {4} {5}", doc.documentNumber, doc.title, doc.partnerName, doc.pic, doc.faculty, doc.activityName).ToLower();
                    if (!blob.Contains(q)) continue;
                }

                if (!string.IsNullOrEmpty(typeFilter) && !doc.documentType.Equals(typeFilter, StringComparison.OrdinalIgnoreCase))
                    continue;

                if (!string.IsNullOrEmpty(statusFilter) && !calcStatus.Equals(statusFilter, StringComparison.OrdinalIgnoreCase))
                    continue;

                count++;
                int rowIndex = _grid.Rows.Add(
                    count,
                    doc.documentNumber,
                    doc.documentType,
                    doc.title,
                    doc.partnerName,
                    string.Format("{0} / {1}", doc.faculty, doc.program),
                    doc.startDate,
                    doc.endDate,
                    calcStatus
                );

                if (calcStatus == "Akan Berakhir")
                    _grid.Rows[rowIndex].DefaultCellStyle.BackColor = Color.FromArgb(255, 248, 230);
                else if (calcStatus == "Berakhir")
                    _grid.Rows[rowIndex].DefaultCellStyle.BackColor = Color.FromArgb(255, 235, 235);
            }

            UpdateStatus();
        }

        private string GetDisplayStatus(NaskahItem doc, DateTime today)
        {
            if (string.Equals(doc.status, "ARSIP", StringComparison.OrdinalIgnoreCase)) return "Arsip";
            if (string.Equals(doc.status, "DRAFT", StringComparison.OrdinalIgnoreCase)) return "Draf";

            DateTime end;
            if (DateTime.TryParse(doc.endDate, out end))
            {
                if (end < today) return "Berakhir";
                if ((end - today).TotalDays <= 180) return "Akan Berakhir";
            }
            return "Aktif";
        }

        private void UpdateStatus()
        {
            int total = _documents.Count;
            int visible = _grid.Rows.Count;
            _statusLabel.Text = string.Format("Basis Data: {0} | Ditampilkan: {1} dari {2} Naskah | Tersimpan Persisten", Path.GetFileName(_dbPath), visible, total);
        }

        private void OpenSmartExtractionDialog()
        {
            using (OpenFileDialog ofd = new OpenFileDialog())
            {
                ofd.Title = "Pilih Berkas Dokumen Naskah / Hasil Pindai untuk Ekstraksi Cerdas & OCR";
                ofd.Filter = "Semua Berkas Didukung (*.pdf;*.docx;*.txt;*.csv;*.png;*.jpg;*.jpeg)|*.pdf;*.docx;*.txt;*.csv;*.png;*.jpg;*.jpeg|Dokumen PDF (*.pdf)|*.pdf|Dokumen Word (*.docx)|*.docx|Gambar / Scan (*.png;*.jpg;*.jpeg)|*.png;*.jpg;*.jpeg|Teks / CSV (*.txt;*.csv)|*.txt;*.csv|Semua Berkas (*.*)|*.*";
                if (ofd.ShowDialog(this) == DialogResult.OK)
                {
                    SmartExtractionResult result = SmartDocumentEngine.ProcessFile(ofd.FileName, _documents);
                    using (OcrResultDialog ord = new OcrResultDialog(result, ofd.FileName))
                    {
                        if (ord.ShowDialog(this) == DialogResult.OK)
                        {
                            using (EntryDialog dlg = new EntryDialog(result.Item, false))
                            {
                                if (dlg.ShowDialog(this) == DialogResult.OK)
                                {
                                    _documents.Insert(0, dlg.Document);
                                    SaveData();
                                    ApplyFilter();
                                    MessageBox.Show("Naskah hasil ekstraksi cerdas berhasil divalidasi dan disimpan ke basis data lokal!", "Sukses", MessageBoxButtons.OK, MessageBoxIcon.Information);
                                }
                            }
                        }
                    }
                }
            }
        }

        private void OpenAddDialog()
        {
            NaskahItem newDoc = new NaskahItem
            {
                id = "DOC-" + Guid.NewGuid().ToString().Substring(0, 6).ToUpper(),
                documentType = "MoU / LOI",
                startDate = DateTime.Today.ToString("yyyy-MM-dd"),
                signedDate = DateTime.Today.ToString("yyyy-MM-dd"),
                location = "Laguboti",
                itdelSignatory = "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.",
                itdelSignatoryTitle = "Rektor Institut Teknologi Del",
                unit = "UKS",
                triDharma = "Pendidikan",
                pic = "Staf Unit Kerja Sama",
                status = "DRAFT"
            };

            using (EntryDialog dlg = new EntryDialog(newDoc, false))
            {
                if (dlg.ShowDialog(this) == DialogResult.OK)
                {
                    _documents.Insert(0, dlg.Document);
                    SaveData();
                    ApplyFilter();
                    MessageBox.Show("Naskah berhasil ditambahkan dan disimpan ke basis data lokal!", "Sukses", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
            }
        }

        private void OpenEditSelected()
        {
            if (_grid.CurrentRow == null) return;
            string docNum = _grid.CurrentRow.Cells["docNumber"].Value.ToString();
            NaskahItem doc = _documents.Find(d => d.documentNumber == docNum);
            if (doc == null) return;

            using (EntryDialog dlg = new EntryDialog(doc, true))
            {
                if (dlg.ShowDialog(this) == DialogResult.OK)
                {
                    SaveData();
                    ApplyFilter();
                }
            }
        }

        private void ExportCsv()
        {
            SaveFileDialog sfd = new SaveFileDialog
            {
                Filter = "Berkas CSV (*.csv)|*.csv|Berkas Excel (*.xls)|*.xls",
                FileName = "ksdas-rekap-naskah-" + DateTime.Today.ToString("yyyyMMdd") + ".csv"
            };
            if (sfd.ShowDialog() == DialogResult.OK)
            {
                try
                {
                    StringBuilder sb = new StringBuilder();
                    sb.AppendLine("Nomor Dokumen,Jenis,Judul Naskah,Mitra,Fakultas,Program Studi,Mulai,Berakhir,Status,PIC,Penandatangan IT Del,Penandatangan Mitra,Kegiatan");
                    foreach (var doc in _documents)
                    {
                        sb.AppendLine(string.Format("\"{0}\",\"{1}\",\"{2}\",\"{3}\",\"{4}\",\"{5}\",\"{6}\",\"{7}\",\"{8}\",\"{9}\",\"{10}\",\"{11}\",\"{12}\"",
                            doc.documentNumber, doc.documentType, doc.title, doc.partnerName, doc.faculty, doc.program,
                            doc.startDate, doc.endDate, doc.status, doc.pic, doc.itdelSignatory, doc.partnerSignatory, doc.activityName));
                    }
                    File.WriteAllText(sfd.FileName, sb.ToString(), Encoding.UTF8);
                    MessageBox.Show("Data berhasil diekspor ke: " + sfd.FileName, "Ekspor Berhasil", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Gagal mengekspor: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        private void ShowAnalysis()
        {
            DateTime today = DateTime.Today;
            int total = _documents.Count;
            int aktif = 0, akan = 0, berakhir = 0, draf = 0;
            Dictionary<string, int> byType = new Dictionary<string, int>();

            foreach (var doc in _documents)
            {
                string st = GetDisplayStatus(doc, today);
                if (st == "Aktif") aktif++;
                else if (st == "Akan Berakhir") akan++;
                else if (st == "Berakhir") berakhir++;
                else if (st == "Draf") draf++;

                string t = doc.documentType ?? "Lainnya";
                if (!byType.ContainsKey(t)) byType[t] = 0;
                byType[t]++;
            }

            StringBuilder msg = new StringBuilder();
            msg.AppendLine("=== LAPORAN ANALISIS EVALUASI KERJA SAMA IT DEL ===");
            msg.AppendLine(string.Format("Tanggal: {0} | Total Naskah: {1}", today.ToString("dd MMMM yyyy"), total));
            msg.AppendLine();
            msg.AppendLine("I. SEBARAN STATUS MASA BERLAKU:");
            msg.AppendLine(string.Format("  • Masih Aktif          : {0} naskah ({1:P0})", aktif, total > 0 ? (double)aktif / total : 0));
            msg.AppendLine(string.Format("  • Akan Berakhir (<=180): {0} naskah ({1:P0}) [PERLU PERPANJANGAN]", akan, total > 0 ? (double)akan / total : 0));
            msg.AppendLine(string.Format("  • Telah Berakhir       : {0} naskah ({1:P0}) [PERLU ARSIP/ADENDUM]", berakhir, total > 0 ? (double)berakhir / total : 0));
            msg.AppendLine(string.Format("  • Draf / Perlu Isian   : {0} naskah ({1:P0})", draf, total > 0 ? (double)draf / total : 0));
            msg.AppendLine();
            msg.AppendLine("II. SEBARAN MENURUT JENIS NASKAH:");
            foreach (var kvp in byType)
            {
                msg.AppendLine(string.Format("  • {0,-18}: {1} naskah", kvp.Key, kvp.Value));
            }
            msg.AppendLine();
            msg.AppendLine("III. REKOMENDASI PIMPINAN:");
            msg.AppendLine("  1. Segera instruksikan PIC Fakultas/Prodi untuk meninjau naskah yang akan berakhir.");
            msg.AppendLine("  2. Pastikan MoU yang aktif telah memiliki PKS turunan dan bukti IA kegiatan.");
            msg.AppendLine("  3. Simpan dosir fisik resmi di Unit Kerja Sama Kampus IT Del.");

            MessageBox.Show(msg.ToString(), "Hasil Analisis Kemitraan KSDAS", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void OpenWeb()
        {
            string url = "https://samuelhtampubolon.github.io/ksdas-itdel/";
            string localIndex = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "index.html");
            if (File.Exists(localIndex)) url = localIndex;

            try
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            catch (Exception ex)
            {
                MessageBox.Show("Tidak dapat membuka peramban: " + ex.Message, "Info", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

        private void ResetToSeedData()
        {
            if (MessageBox.Show("Kembalikan 10 data contoh resmi IT Del?\nPerubahan saat ini akan ditimpa dengan naskah awal.", "Konfirmasi Reset", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
            {
                _documents = GetSeedDocuments();
                SaveData();
                ApplyFilter();
            }
        }

        private List<NaskahItem> GetSeedDocuments()
        {
            return new List<NaskahItem>
            {
                new NaskahItem
                {
                    id = "DOC-01",
                    documentType = "MoU / LOI",
                    documentNumber = "MOU-CONTOH-2024-001",
                    title = "Contoh — nota kesepahaman dengan Pemkab Toba",
                    partnerName = "Pemerintah Kabupaten Toba",
                    partnerType = "Pemerintah",
                    signedDate = "2024-03-12",
                    startDate = "2024-03-12",
                    endDate = "2027-03-11",
                    status = "AKTIF",
                    scope = "Pendidikan dan pengabdian di Kabupaten Toba",
                    faculty = "FITE",
                    program = "S1 Informatika",
                    unit = "Unit Kerja Sama",
                    triDharma = "Pendidikan; Pengabdian",
                    activityName = "Kuliah tamu dan desa binaan contoh",
                    pic = "Staf Unit Kerja Sama",
                    itdelSignatory = "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.",
                    itdelSignatoryTitle = "Rektor Institut Teknologi Del",
                    partnerSignatory = "Pejabat Contoh Mitra",
                    partnerSignatoryTitle = "Bupati Toba",
                    location = "Laguboti"
                },
                new NaskahItem
                {
                    id = "DOC-02",
                    documentType = "PKS / MoA",
                    documentNumber = "PKS-CONTOH-2024-014",
                    title = "Contoh — PKS pelaksanaan dengan Pemkab Toba",
                    partnerName = "Pemerintah Kabupaten Toba",
                    partnerType = "Pemerintah",
                    signedDate = "2024-08-01",
                    startDate = "2024-08-01",
                    endDate = "2026-12-20",
                    status = "AKTIF",
                    scope = "Pelatihan aparatur desa",
                    faculty = "FITE",
                    program = "S1 Informatika",
                    unit = "LPPM",
                    triDharma = "Pengabdian",
                    activityName = "Pelatihan contoh",
                    pic = "Staf Unit Kerja Sama",
                    itdelSignatory = "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.",
                    itdelSignatoryTitle = "Rektor Institut Teknologi Del",
                    partnerSignatory = "Pejabat Contoh Mitra",
                    partnerSignatoryTitle = "Kepala Dinas PMD",
                    location = "Balige",
                    parentNumber = "MOU-CONTOH-2024-001"
                },
                new NaskahItem
                {
                    id = "DOC-03",
                    documentType = "IA",
                    documentNumber = "IA-CONTOH-2025-003",
                    title = "Contoh — IA pelatihan desa",
                    partnerName = "Pemerintah Kabupaten Toba",
                    partnerType = "Pemerintah",
                    signedDate = "2025-02-01",
                    startDate = "2025-02-01",
                    endDate = "2026-12-20",
                    status = "AKTIF",
                    scope = "Satu kegiatan pelatihan",
                    faculty = "FITE",
                    program = "S1 Informatika",
                    unit = "LPPM",
                    triDharma = "Pengabdian",
                    activityName = "Pelatihan desa contoh",
                    pic = "Staf Unit Kerja Sama",
                    itdelSignatory = "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.",
                    itdelSignatoryTitle = "Rektor Institut Teknologi Del",
                    partnerSignatory = "Pejabat Contoh Mitra",
                    partnerSignatoryTitle = "Camat",
                    location = "Laguboti",
                    parentNumber = "PKS-CONTOH-2024-014"
                },
                new NaskahItem
                {
                    id = "DOC-04",
                    documentType = "Proposal",
                    documentNumber = "PROP-CONTOH-2025-011",
                    title = "Contoh — proposal pelatihan desa",
                    partnerName = "Pemerintah Kabupaten Toba",
                    partnerType = "Pemerintah",
                    signedDate = "2025-02-10",
                    startDate = "2025-03-01",
                    endDate = "2025-06-30",
                    status = "AKTIF",
                    scope = "Rencana kegiatan",
                    faculty = "FITE",
                    program = "S1 Informatika",
                    unit = "Prodi",
                    triDharma = "Pengabdian",
                    activityName = "Pelatihan desa contoh",
                    pic = "Staf Unit Kerja Sama",
                    itdelSignatory = "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.",
                    itdelSignatoryTitle = "Rektor Institut Teknologi Del",
                    partnerSignatory = "Pejabat Contoh Mitra",
                    partnerSignatoryTitle = "Pimpinan Contoh",
                    location = "Laguboti",
                    parentNumber = "IA-CONTOH-2025-003"
                },
                new NaskahItem
                {
                    id = "DOC-05",
                    documentType = "Laporan",
                    documentNumber = "LAP-CONTOH-2025-020",
                    title = "Contoh — laporan pelatihan desa",
                    partnerName = "Pemerintah Kabupaten Toba",
                    partnerType = "Pemerintah",
                    signedDate = "2025-07-02",
                    startDate = "2025-03-01",
                    endDate = "2025-06-30",
                    status = "AKTIF",
                    scope = "Laporan pelaksanaan",
                    faculty = "FITE",
                    program = "S1 Informatika",
                    unit = "Prodi",
                    triDharma = "Pengabdian",
                    activityName = "Pelatihan desa contoh",
                    pic = "Staf Unit Kerja Sama",
                    itdelSignatory = "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.",
                    itdelSignatoryTitle = "Rektor Institut Teknologi Del",
                    partnerSignatory = "Pejabat Contoh Mitra",
                    partnerSignatoryTitle = "Pimpinan Contoh",
                    location = "Laguboti",
                    parentNumber = "PROP-CONTOH-2025-011"
                },
                new NaskahItem
                {
                    id = "DOC-06",
                    documentType = "MoU / LOI",
                    documentNumber = "MOU-CONTOH-2025-006",
                    title = "Contoh — nota kesepahaman dengan USU",
                    partnerName = "Universitas Sumatera Utara",
                    partnerType = "Perguruan Tinggi",
                    signedDate = "2025-01-15",
                    startDate = "2025-01-15",
                    endDate = "2027-01-14",
                    status = "AKTIF",
                    scope = "Penelitian bersama",
                    faculty = "FITE",
                    program = "S1 Sistem Informasi",
                    unit = "LPPM",
                    triDharma = "Penelitian",
                    activityName = "Riset bersama contoh",
                    pic = "Staf Unit Kerja Sama",
                    itdelSignatory = "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.",
                    itdelSignatoryTitle = "Rektor Institut Teknologi Del",
                    partnerSignatory = "Rektor USU",
                    partnerSignatoryTitle = "Rektor",
                    location = "Medan"
                },
                new NaskahItem
                {
                    id = "DOC-07",
                    documentType = "PKS / MoA",
                    documentNumber = "PKS-CONTOH-2025-021",
                    title = "Contoh — PKS riset dengan USU",
                    partnerName = "Universitas Sumatera Utara",
                    partnerType = "Perguruan Tinggi",
                    signedDate = "2025-04-01",
                    startDate = "2025-04-01",
                    endDate = "2026-11-15",
                    status = "AKTIF",
                    scope = "Satu skema riset",
                    faculty = "FITE",
                    program = "S1 Sistem Informasi",
                    unit = "LPPM",
                    triDharma = "Penelitian",
                    activityName = "Riset bersama contoh",
                    pic = "Staf Unit Kerja Sama",
                    itdelSignatory = "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.",
                    itdelSignatoryTitle = "Rektor Institut Teknologi Del",
                    partnerSignatory = "Dekan Fasilkom-TI USU",
                    partnerSignatoryTitle = "Dekan",
                    location = "Medan",
                    parentNumber = "MOU-CONTOH-2025-006"
                },
                new NaskahItem
                {
                    id = "DOC-08",
                    documentType = "MoU / LOI",
                    documentNumber = "MOU-CONTOH-2025-009",
                    title = "Contoh — nota kesepahaman dengan SMK Laguboti",
                    partnerName = "SMK Negeri 1 Laguboti",
                    partnerType = "Sekolah",
                    signedDate = "2025-06-01",
                    startDate = "2025-06-01",
                    endDate = "2028-05-31",
                    status = "AKTIF",
                    scope = "Pengenalan pemrograman",
                    faculty = "FITE",
                    program = "S1 Informatika",
                    unit = "Unit Kerja Sama",
                    triDharma = "Pendidikan",
                    activityName = "Workshop siswa",
                    pic = "Staf Unit Kerja Sama",
                    itdelSignatory = "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.",
                    itdelSignatoryTitle = "Rektor Institut Teknologi Del",
                    partnerSignatory = "Kepala Sekolah SMK N 1 Laguboti",
                    partnerSignatoryTitle = "Kepala Sekolah",
                    location = "Laguboti"
                },
                new NaskahItem
                {
                    id = "DOC-09",
                    documentType = "MoU / LOI",
                    documentNumber = "MOU-CONTOH-2023-004",
                    title = "Contoh — nota kesepahaman yang sudah lewat masa berlaku",
                    partnerName = "PT Toba Digital Nusantara",
                    partnerType = "Swasta / Industri",
                    signedDate = "2023-07-01",
                    startDate = "2023-07-01",
                    endDate = "2026-06-30",
                    status = "AKTIF",
                    scope = "Magang industri",
                    faculty = "FTI",
                    program = "S1 Manajemen Rekayasa",
                    unit = "Unit Kerja Sama",
                    triDharma = "Pendidikan",
                    activityName = "Magang contoh",
                    pic = "Staf Unit Kerja Sama",
                    itdelSignatory = "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.",
                    itdelSignatoryTitle = "Rektor Institut Teknologi Del",
                    partnerSignatory = "Direktur Utama",
                    partnerSignatoryTitle = "Direktur",
                    location = "Balige"
                },
                new NaskahItem
                {
                    id = "DOC-10",
                    documentType = "PKS / MoA",
                    documentNumber = "PKS-CONTOH-2026-002",
                    title = "Contoh — PKS yang masih perlu dilengkapi",
                    partnerName = "Dinas Pariwisata Provinsi Sumatera Utara",
                    partnerType = "Pemerintah",
                    signedDate = "",
                    startDate = "2026-09-01",
                    endDate = "",
                    status = "DRAFT",
                    scope = "Pendataan flora Danau Toba",
                    faculty = "FB",
                    program = "S1 Teknik Bioproses",
                    unit = "LPPM",
                    triDharma = "Pengabdian",
                    activityName = "Pendataan flora contoh",
                    pic = "Staf Unit Kerja Sama",
                    itdelSignatory = "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.",
                    itdelSignatoryTitle = "Rektor Institut Teknologi Del",
                    partnerSignatory = "",
                    partnerSignatoryTitle = "",
                    location = "Danau Toba",
                    notes = "Baris ini sengaja berstatus draf untuk uji kelengkapan formulir."
                }
            };
        }
    }

    public class EntryDialog : Form
    {
        public NaskahItem Document { get; private set; }
        private ComboBox _cbType, _cbStatus, _cbFaculty;
        private TextBox _txtNum, _txtTitle, _txtPartner, _txtScope, _txtActivity, _txtPic;
        private TextBox _txtPartnerSign, _txtPartnerSignTitle, _txtDelSign, _txtDelSignTitle;
        private TextBox _txtStart, _txtEnd, _txtLocation, _txtBudget, _txtNotes;

        public EntryDialog(NaskahItem doc, bool isEdit)
        {
            Document = doc;
            Text = isEdit ? "Ubah Data Naskah Kerja Sama" : "Tambah Naskah Kerja Sama Baru";
            Size = new Size(740, 680);
            StartPosition = FormStartPosition.CenterParent;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            TableLayoutPanel tlp = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 4,
                RowCount = 10,
                Padding = new Padding(15)
            };
            tlp.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 140));
            tlp.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
            tlp.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 140));
            tlp.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));

            // Controls
            _cbType = new ComboBox { DropDownStyle = ComboBoxStyle.DropDownList, Dock = DockStyle.Fill };
            _cbType.Items.AddRange(new object[] { "MoU / LOI", "PKS / MoA", "IA", "Proposal", "Laporan" });
            _cbType.SelectedItem = doc.documentType ?? "MoU / LOI";

            _txtNum = new TextBox { Text = doc.documentNumber ?? "", Dock = DockStyle.Fill };
            _txtTitle = new TextBox { Text = doc.title ?? "", Dock = DockStyle.Fill };
            _txtPartner = new TextBox { Text = doc.partnerName ?? "", Dock = DockStyle.Fill };

            _txtStart = new TextBox { Text = doc.startDate ?? DateTime.Today.ToString("yyyy-MM-dd"), Dock = DockStyle.Fill };
            _txtEnd = new TextBox { Text = doc.endDate ?? "", Dock = DockStyle.Fill };

            _cbStatus = new ComboBox { DropDownStyle = ComboBoxStyle.DropDownList, Dock = DockStyle.Fill };
            _cbStatus.Items.AddRange(new object[] { "DRAFT", "AKTIF", "ARSIP" });
            _cbStatus.SelectedItem = doc.status ?? "DRAFT";

            _cbFaculty = new ComboBox { DropDownStyle = ComboBoxStyle.DropDownList, Dock = DockStyle.Fill };
            _cbFaculty.Items.AddRange(new object[] { "FITE", "FTI", "FB" });
            _cbFaculty.SelectedItem = doc.faculty ?? "FITE";

            _txtScope = new TextBox { Text = doc.scope ?? "", Dock = DockStyle.Fill };
            _txtActivity = new TextBox { Text = doc.activityName ?? "", Dock = DockStyle.Fill };
            _txtPic = new TextBox { Text = doc.pic ?? "Staf Unit Kerja Sama", Dock = DockStyle.Fill };
            _txtLocation = new TextBox { Text = doc.location ?? "Laguboti", Dock = DockStyle.Fill };

            _txtPartnerSign = new TextBox { Text = doc.partnerSignatory ?? "", Dock = DockStyle.Fill };
            _txtPartnerSignTitle = new TextBox { Text = doc.partnerSignatoryTitle ?? "", Dock = DockStyle.Fill };

            _txtDelSign = new TextBox { Text = doc.itdelSignatory ?? "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.", Dock = DockStyle.Fill };
            _txtDelSignTitle = new TextBox { Text = doc.itdelSignatoryTitle ?? "Rektor Institut Teknologi Del", Dock = DockStyle.Fill };

            _txtBudget = new TextBox { Text = doc.budget ?? "", Dock = DockStyle.Fill };
            _txtNotes = new TextBox { Text = doc.notes ?? "", Dock = DockStyle.Fill };

            // Add rows
            AddRow(tlp, 0, "Jenis Naskah:", _cbType, "Nomor Dokumen:", _txtNum);
            AddRow(tlp, 1, "Judul Naskah:", _txtTitle, "Nama Mitra:", _txtPartner);
            AddRow(tlp, 2, "Tanggal Mulai:", _txtStart, "Tanggal Berakhir:", _txtEnd);
            AddRow(tlp, 3, "Status:", _cbStatus, "Fakultas:", _cbFaculty);
            AddRow(tlp, 4, "PIC Kerja Sama:", _txtPic, "Nama Kegiatan:", _txtActivity);
            AddRow(tlp, 5, "Penandatangan Mitra:", _txtPartnerSign, "Jabatan Mitra:", _txtPartnerSignTitle);
            AddRow(tlp, 6, "Penandatangan Del:", _txtDelSign, "Jabatan Del:", _txtDelSignTitle);
            AddRow(tlp, 7, "Ruang Lingkup:", _txtScope, "Lokasi:", _txtLocation);
            AddRow(tlp, 8, "Anggaran:", _txtBudget, "Catatan:", _txtNotes);

            // Button panel
            Panel bp = new Panel { Dock = DockStyle.Bottom, Height = 55 };

            Button btnOcrInDialog = new Button
            {
                Text = "🔍 Ekstraksi Cerdas / OCR Berkas...",
                Location = new Point(15, 12),
                Width = 240,
                Height = 32,
                BackColor = Color.FromArgb(180, 83, 9),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 9f, FontStyle.Bold)
            };
            btnOcrInDialog.Click += (s, e) => RunOcrInsideDialog();
            bp.Controls.Add(btnOcrInDialog);

            Button btnOk = new Button { Text = "Simpan", DialogResult = DialogResult.OK, Location = new Point(510, 12), Width = 100, Height = 32, BackColor = Color.FromArgb(22, 50, 79), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnOk.Click += (s, e) => SaveFields();

            Button btnCancel = new Button { Text = "Batal", DialogResult = DialogResult.Cancel, Location = new Point(620, 12), Width = 90, Height = 32 };
            bp.Controls.Add(btnOk);
            bp.Controls.Add(btnCancel);

            Controls.Add(tlp);
            Controls.Add(bp);
        }

        private void RunOcrInsideDialog()
        {
            using (OpenFileDialog ofd = new OpenFileDialog())
            {
                ofd.Title = "Pilih Berkas Dokumen untuk Ekstraksi Cerdas & OCR ke Form Ini";
                ofd.Filter = "Semua Berkas Didukung (*.pdf;*.docx;*.txt;*.csv;*.png;*.jpg;*.jpeg)|*.pdf;*.docx;*.txt;*.csv;*.png;*.jpg;*.jpeg|Semua Berkas (*.*)|*.*";
                if (ofd.ShowDialog(this) == DialogResult.OK)
                {
                    SmartExtractionResult res = SmartDocumentEngine.ProcessFile(ofd.FileName, null);
                    LoadDocToControls(res.Item);
                    MessageBox.Show(string.Format("Ekstraksi Cerdas & OCR Berhasil!\n{0} atribut naskah telah dikenali dan diisikan ke formulir.\nSilakan Staf memeriksa dan memvalidasi sebelum menyimpan.", res.Findings.Count), "Ekstraksi Selesai", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
            }
        }

        private void LoadDocToControls(NaskahItem doc)
        {
            if (!string.IsNullOrEmpty(doc.documentType)) _cbType.SelectedItem = doc.documentType;
            if (!string.IsNullOrEmpty(doc.documentNumber)) _txtNum.Text = doc.documentNumber;
            if (!string.IsNullOrEmpty(doc.title)) _txtTitle.Text = doc.title;
            if (!string.IsNullOrEmpty(doc.partnerName)) _txtPartner.Text = doc.partnerName;
            if (!string.IsNullOrEmpty(doc.startDate)) _txtStart.Text = doc.startDate;
            if (!string.IsNullOrEmpty(doc.endDate)) _txtEnd.Text = doc.endDate;
            if (!string.IsNullOrEmpty(doc.faculty)) _cbFaculty.SelectedItem = doc.faculty;
            if (!string.IsNullOrEmpty(doc.pic)) _txtPic.Text = doc.pic;
            if (!string.IsNullOrEmpty(doc.activityName)) _txtActivity.Text = doc.activityName;
            if (!string.IsNullOrEmpty(doc.partnerSignatory)) _txtPartnerSign.Text = doc.partnerSignatory;
            if (!string.IsNullOrEmpty(doc.partnerSignatoryTitle)) _txtPartnerSignTitle.Text = doc.partnerSignatoryTitle;
            if (!string.IsNullOrEmpty(doc.itdelSignatory)) _txtDelSign.Text = doc.itdelSignatory;
            if (!string.IsNullOrEmpty(doc.itdelSignatoryTitle)) _txtDelSignTitle.Text = doc.itdelSignatoryTitle;
            if (!string.IsNullOrEmpty(doc.scope)) _txtScope.Text = doc.scope;
            if (!string.IsNullOrEmpty(doc.location)) _txtLocation.Text = doc.location;
            if (!string.IsNullOrEmpty(doc.budget)) _txtBudget.Text = doc.budget;
            if (!string.IsNullOrEmpty(doc.notes)) _txtNotes.Text = doc.notes;
        }

        private void AddRow(TableLayoutPanel tlp, int row, string l1, Control c1, string l2, Control c2)
        {
            tlp.Controls.Add(new Label { Text = l1, AutoSize = true, Anchor = AnchorStyles.Left }, 0, row);
            tlp.Controls.Add(c1, 1, row);
            tlp.Controls.Add(new Label { Text = l2, AutoSize = true, Anchor = AnchorStyles.Left }, 2, row);
            tlp.Controls.Add(c2, 3, row);
        }

        private void SaveFields()
        {
            Document.documentType = _cbType.SelectedItem.ToString();
            Document.documentNumber = _txtNum.Text.Trim();
            Document.title = _txtTitle.Text.Trim();
            Document.partnerName = _txtPartner.Text.Trim();
            Document.startDate = _txtStart.Text.Trim();
            Document.endDate = _txtEnd.Text.Trim();
            Document.status = _cbStatus.SelectedItem.ToString();
            Document.faculty = _cbFaculty.SelectedItem.ToString();
            Document.pic = _txtPic.Text.Trim();
            Document.activityName = _txtActivity.Text.Trim();
            Document.partnerSignatory = _txtPartnerSign.Text.Trim();
            Document.partnerSignatoryTitle = _txtPartnerSignTitle.Text.Trim();
            Document.itdelSignatory = _txtDelSign.Text.Trim();
            Document.itdelSignatoryTitle = _txtDelSignTitle.Text.Trim();
            Document.scope = _txtScope.Text.Trim();
            Document.location = _txtLocation.Text.Trim();
            Document.budget = _txtBudget.Text.Trim();
            Document.notes = _txtNotes.Text.Trim();
        }
    }
}
