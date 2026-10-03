using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Text;
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
        private string _dbPath;
        private DataGridView _grid;
        private TextBox _searchBox;
        private ComboBox _typeCombo;
        private ComboBox _statusCombo;
        private ToolStripStatusLabel _statusLabel;

        public MainForm()
        {
            _dbPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "ksdas_desktop_database.json");
            InitializeUi();
            LoadData();
        }

        private void InitializeUi()
        {
            Text = "KSDAS IT Del — Sistem Informasi Kerja Sama (Desktop Standalone)";
            Size = new Size(1180, 720);
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
                Text = "KSDAS Standalone Desktop • Penyimpanan Data Persisten Lokal (ksdas_desktop_database.json)",
                ForeColor = Color.FromArgb(213, 221, 230),
                Font = new Font("Segoe UI", 9f, FontStyle.Regular),
                Location = new Point(17, 40),
                AutoSize = true
            };
            headerPanel.Controls.Add(titleLabel);
            headerPanel.Controls.Add(subLabel);

            // Filter & Toolbar Panel
            Panel toolPanel = new Panel { Dock = DockStyle.Top, Height = 95, BackColor = Color.FromArgb(243, 240, 232), Padding = new Padding(12, 10, 12, 8) };

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

            // Row 2 Buttons
            Button btnAdd = new Button { Text = "+ Tambah Naskah", Location = new Point(14, 50), Width = 150, Height = 32, BackColor = Color.FromArgb(22, 50, 79), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnAdd.Click += (s, e) => OpenAddDialog();

            Button btnSave = new Button { Text = "💾 Simpan Database", Location = new Point(174, 50), Width = 150, Height = 32, BackColor = Color.FromArgb(40, 100, 60), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnSave.Click += (s, e) => { SaveData(); MessageBox.Show("Data berhasil disimpan persisten ke file:\n" + _dbPath, "Tersimpan", MessageBoxButtons.OK, MessageBoxIcon.Information); };

            Button btnExport = new Button { Text = "📊 Ekspor ke CSV", Location = new Point(334, 50), Width = 135, Height = 32 };
            btnExport.Click += (s, e) => ExportCsv();

            Button btnAnalysis = new Button { Text = "📈 Generate Analisis", Location = new Point(479, 50), Width = 155, Height = 32, BackColor = Color.FromArgb(22, 50, 79), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnAnalysis.Click += (s, e) => ShowAnalysis();

            Button btnOpenWeb = new Button { Text = "🌐 Buka Versi Web", Location = new Point(644, 50), Width = 145, Height = 32 };
            btnOpenWeb.Click += (s, e) => OpenWeb();

            Button btnResetSample = new Button { Text = "↺ Muat Ulang 10 Contoh", Location = new Point(799, 50), Width = 175, Height = 32 };
            btnResetSample.Click += (s, e) => ResetToSeedData();

            toolPanel.Controls.Add(lblSearch);
            toolPanel.Controls.Add(_searchBox);
            toolPanel.Controls.Add(lblType);
            toolPanel.Controls.Add(_typeCombo);
            toolPanel.Controls.Add(lblStatus);
            toolPanel.Controls.Add(_statusCombo);
            toolPanel.Controls.Add(btnResetFilter);
            toolPanel.Controls.Add(btnAdd);
            toolPanel.Controls.Add(btnSave);
            toolPanel.Controls.Add(btnExport);
            toolPanel.Controls.Add(btnAnalysis);
            toolPanel.Controls.Add(btnOpenWeb);
            toolPanel.Controls.Add(btnResetSample);

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
            _statusLabel = new ToolStripStatusLabel { Text = "Siap." };
            statusStrip.Items.Add(_statusLabel);

            Controls.Add(_grid);
            Controls.Add(toolPanel);
            Controls.Add(headerPanel);
            Controls.Add(statusStrip);
        }

        private void LoadData()
        {
            if (File.Exists(_dbPath))
            {
                try
                {
                    string json = File.ReadAllText(_dbPath, Encoding.UTF8);
                    JavaScriptSerializer js = new JavaScriptSerializer();
                    _documents = js.Deserialize<List<NaskahItem>>(json) ?? new List<NaskahItem>();
                }
                catch
                {
                    _documents = GetSeedDocuments();
                }
            }
            else
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
            Button btnOk = new Button { Text = "Simpan", DialogResult = DialogResult.OK, Location = new Point(510, 12), Width = 100, Height = 32, BackColor = Color.FromArgb(22, 50, 79), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnOk.Click += (s, e) => SaveFields();

            Button btnCancel = new Button { Text = "Batal", DialogResult = DialogResult.Cancel, Location = new Point(620, 12), Width = 90, Height = 32 };
            bp.Controls.Add(btnOk);
            bp.Controls.Add(btnCancel);

            Controls.Add(tlp);
            Controls.Add(bp);
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
