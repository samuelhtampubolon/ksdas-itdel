// KSDAS IT Del - Aplikasi Desktop (EXE) v1.0
//
// KSDAS_ITDel.exe membangun sistem penyimpanan lokal di komputer ini dan menjalankan server
// lokal yang HANYA mendengarkan 127.0.0.1. Antarmuka web KSDAS (sama dengan GitHub Pages)
// dibuka di peramban bawaan dan otomatis memakai penyimpanan di disk:
//
//   ksdas_local_database\
//     tables\    naskah_kerjasama.json, mitra_institusi.json, lampiran_berkas.json, audit_trail_log.jsonl, ...
//     schema\    ksdas_relational_schema.sql, data_dictionary.json
//     dosir_lampiran\   berkas asli yang diunggah (nama dibuat server, bukan nama asli)
//     backups\   cadangan bertanda waktu beserta manifest SHA-256
//
// Kompatibel dengan kompilator csc.exe bawaan Windows (C# 5, .NET Framework 4.x).
// Argumen: --headless (tanpa jendela), --no-browser, --port N, --data-dir PATH

using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;

namespace KsdasDesktop
{
    public static class Program
    {
        public const string Version = "1.0.0";
        public const int PreferredPort = 17877;

        [STAThread]
        public static int Main(string[] args)
        {
            bool headless = false, noBrowser = false;
            int port = PreferredPort;
            string dataDir = null;
            for (int i = 0; i < args.Length; i++)
            {
                if (args[i] == "--headless") headless = true;
                else if (args[i] == "--no-browser") noBrowser = true;
                else if (args[i] == "--port" && i + 1 < args.Length) int.TryParse(args[++i], out port);
                else if (args[i] == "--data-dir" && i + 1 < args.Length) dataDir = args[++i];
            }

            // Satu instans: bila sudah berjalan, cukup buka peramban ke instans tersebut.
            for (int p = PreferredPort; p < PreferredPort + 10; p++)
            {
                if (LocalServer.IsKsdasRunning(p))
                {
                    if (!noBrowser && !headless) LocalServer.OpenBrowser("http://127.0.0.1:" + p + "/");
                    return 0;
                }
            }

            LocalDatabase db;
            try { db = new LocalDatabase(dataDir); }
            catch (Exception ex)
            {
                Fail(headless, "Tidak dapat menyiapkan folder basis data: " + ex.Message);
                return 2;
            }

            LocalServer server = new LocalServer(db);
            try { server.Start(port); }
            catch (Exception ex)
            {
                Fail(headless, "Tidak dapat memulai server lokal: " + ex.Message);
                return 3;
            }

            if (headless)
            {
                Console.WriteLine("KSDAS " + Version + " berjalan di " + server.Url);
                Console.WriteLine("Basis data: " + db.Root);
                if (!noBrowser) LocalServer.OpenBrowser(server.Url);
                server.WaitUntilStopped();
                return 0;
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            if (!noBrowser) LocalServer.OpenBrowser(server.Url);
            Application.Run(new MainForm(server, db));
            server.Stop();
            return 0;
        }

        static void Fail(bool headless, string msg)
        {
            if (headless) Console.Error.WriteLine(msg);
            else MessageBox.Show(msg, "KSDAS IT Del", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    // ------------------------------------------------------------------ basis data lokal
    public class LocalDatabase
    {
        public readonly string Root, Tables, Schema, Dosir, Backups, Sim;
        public readonly List<string> InitLog = new List<string>();
        readonly object gate = new object();
        readonly JavaScriptSerializer ser = NewSerializer();
        public static readonly string[] AllowedExt = { ".pdf", ".docx", ".doc", ".xlsx", ".xls", ".csv", ".txt", ".png", ".jpg", ".jpeg", ".bmp", ".webp" };
        public const long MaxFileBytes = 25L * 1024 * 1024;

        public static JavaScriptSerializer NewSerializer()
        {
            JavaScriptSerializer s = new JavaScriptSerializer();
            s.MaxJsonLength = int.MaxValue;
            s.RecursionLimit = 200;
            return s;
        }

        public LocalDatabase(string overrideDir)
        {
            string baseDir = overrideDir;
            if (string.IsNullOrEmpty(baseDir))
            {
                string exeDir = AppDomain.CurrentDomain.BaseDirectory;
                baseDir = Path.Combine(exeDir, "ksdas_local_database");
                if (!CanWrite(exeDir))
                    baseDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "KSDAS_ITDel", "ksdas_local_database");
            }
            Root = Path.GetFullPath(baseDir);
            Tables = Path.Combine(Root, "tables");
            Schema = Path.Combine(Root, "schema");
            Dosir = Path.Combine(Root, "dosir_lampiran");
            Backups = Path.Combine(Root, "backups");
            Sim = Path.Combine(Root, "simulasi");
            Build();
        }

        static bool CanWrite(string dir)
        {
            try
            {
                string probe = Path.Combine(dir, ".ksdas_write_test");
                File.WriteAllText(probe, "x");
                File.Delete(probe);
                return true;
            }
            catch { return false; }
        }

        void Log(string s) { InitLog.Add(s); }

        /// Membangun hierarki folder, skema SQL, dan tabel kosong bila belum ada.
        void Build()
        {
            foreach (string d in new string[] { Root, Tables, Schema, Dosir, Backups })
            {
                if (!Directory.Exists(d)) { Directory.CreateDirectory(d); Log("Folder dibuat: " + d.Substring(Root.Length).TrimStart('\\', '/') + (d == Root ? Root : "")); }
            }
            WriteResourceIfMissing("schema.sql", Path.Combine(Schema, "ksdas_relational_schema.sql"));
            WriteResourceIfMissing("data_dictionary.json", Path.Combine(Schema, "data_dictionary.json"));
            foreach (string t in new string[] { "naskah_kerjasama.json", "mitra_institusi.json", "lampiran_berkas.json", "memori_ekstraksi.json" })
            {
                string p = Path.Combine(Tables, t);
                if (!File.Exists(p)) { File.WriteAllText(p, t.StartsWith("memori") ? "{}" : "[]", new UTF8Encoding(false)); Log("Tabel dibuat: tables/" + t); }
            }
            string audit = Path.Combine(Tables, "audit_trail_log.jsonl");
            if (!File.Exists(audit)) { File.WriteAllText(audit, "", new UTF8Encoding(false)); Log("Tabel dibuat: tables/audit_trail_log.jsonl"); }
            string meta = Path.Combine(Tables, "database_manifest.json");
            if (!File.Exists(meta))
            {
                WriteAtomic(meta, "{\"database\":\"ksdas_itdel_local\",\"createdAt\":\"" + DateTime.UtcNow.ToString("o") + "\",\"initialized\":false,\"savedAt\":\"\",\"roleId\":\"STAFF\",\"app\":\"" + Program.Version + "\"}");
                Log("Manifest dibuat: tables/database_manifest.json");
            }
            if (InitLog.Count == 0) Log("Basis data sudah ada dan siap dipakai: " + Root);
        }

        void WriteResourceIfMissing(string res, string target)
        {
            if (File.Exists(target)) return;
            byte[] data = Resources.Read(res);
            if (data == null) return;
            File.WriteAllBytes(target, data);
            Log("Berkas dibuat: schema/" + Path.GetFileName(target));
        }

        public static void WriteAtomic(string path, string text)
        {
            string tmp = path + ".tmp";
            File.WriteAllText(tmp, text, new UTF8Encoding(false));
            if (File.Exists(path)) File.Replace(tmp, path, null); else File.Move(tmp, path);
        }

        string P(string table) { return Path.Combine(Tables, table); }

        // ---- state (naskah + mitra)
        public string ReadStateJson()
        {
            lock (gate)
            {
                Dictionary<string, object> meta = ReadMeta();
                bool init = meta.ContainsKey("initialized") && meta["initialized"] is bool && (bool)meta["initialized"];
                if (!init) return "{\"documents\":null}";
                string docs = File.ReadAllText(P("naskah_kerjasama.json"), Encoding.UTF8);
                string partners = File.ReadAllText(P("mitra_institusi.json"), Encoding.UTF8);
                string memory = File.Exists(P("memori_ekstraksi.json")) ? File.ReadAllText(P("memori_ekstraksi.json"), Encoding.UTF8) : "{}";
                return "{\"roleId\":" + ser.Serialize(Str(meta, "roleId", "STAFF")) + ",\"savedAt\":" + ser.Serialize(Str(meta, "savedAt", "")) +
                       ",\"documents\":" + docs + ",\"partners\":" + partners + ",\"memory\":" + memory + "}";
            }
        }

        public void WriteStateJson(string body)
        {
            object parsed = ser.DeserializeObject(body);
            Dictionary<string, object> d = parsed as Dictionary<string, object>;
            if (d == null || !d.ContainsKey("documents") || !d.ContainsKey("partners") || !(d["documents"] is IEnumerable) || !(d["partners"] is IEnumerable))
                throw new ApiError(400, "Struktur state tidak valid.");
            lock (gate)
            {
                WriteAtomic(P("naskah_kerjasama.json"), ser.Serialize(d["documents"]));
                WriteAtomic(P("mitra_institusi.json"), ser.Serialize(d["partners"]));
                if (d.ContainsKey("memory") && d["memory"] is Dictionary<string, object>) WriteAtomic(P("memori_ekstraksi.json"), ser.Serialize(d["memory"]));
                Dictionary<string, object> meta = ReadMeta();
                meta["initialized"] = true;
                meta["savedAt"] = Str(d, "savedAt", DateTime.UtcNow.ToString("o"));
                meta["roleId"] = Str(d, "roleId", "STAFF");
                WriteAtomic(P("database_manifest.json"), ser.Serialize(meta));
            }
        }

        Dictionary<string, object> ReadMeta()
        {
            try
            {
                Dictionary<string, object> m = ser.DeserializeObject(File.ReadAllText(P("database_manifest.json"), Encoding.UTF8)) as Dictionary<string, object>;
                if (m != null) return m;
            }
            catch { }
            return new Dictionary<string, object>();
        }

        static string Str(Dictionary<string, object> d, string k, string def)
        {
            object v;
            if (d.TryGetValue(k, out v) && v != null) return Convert.ToString(v);
            return def;
        }

        // ---- audit
        public void AppendAudit(string body)
        {
            Dictionary<string, object> d = ser.DeserializeObject(body) as Dictionary<string, object>;
            if (d == null) throw new ApiError(400, "Format audit tidak valid.");
            Dictionary<string, object> ev = new Dictionary<string, object>();
            foreach (string k in new string[] { "at", "actor", "action", "target", "detail" })
                ev[k] = Trunc(Str(d, k, ""), 500);
            lock (gate)
            {
                string path = P("audit_trail_log.jsonl");
                FileInfo fi = new FileInfo(path);
                if (fi.Exists && fi.Length > 10 * 1024 * 1024) File.Move(path, path + "." + DateTime.UtcNow.ToString("yyyyMMddHHmmss"));
                File.AppendAllText(path, ser.Serialize(ev) + "\n", new UTF8Encoding(false));
            }
        }

        public string ReadAuditJson(int limit)
        {
            lock (gate)
            {
                string path = P("audit_trail_log.jsonl");
                List<string> lines = new List<string>();
                if (File.Exists(path)) foreach (string l in File.ReadAllLines(path, Encoding.UTF8)) if (l.Length > 2) lines.Add(l);
                int start = Math.Max(0, lines.Count - Math.Max(1, Math.Min(limit, 500)));
                StringBuilder sb = new StringBuilder("{\"items\":[");
                for (int i = lines.Count - 1; i >= start; i--) { sb.Append(lines[i]); if (i > start) sb.Append(','); }
                return sb.Append("]}").ToString();
            }
        }

        public int AuditCount()
        {
            string path = P("audit_trail_log.jsonl");
            if (!File.Exists(path)) return 0;
            int n = 0;
            foreach (string l in File.ReadLines(path)) if (l.Length > 2) n++;
            return n;
        }

        static string Trunc(string s, int n) { return s.Length > n ? s.Substring(0, n) : s; }

        // ---- berkas lampiran
        static bool IdOk(string id) { return id != null && System.Text.RegularExpressions.Regex.IsMatch(id, "^[A-Za-z0-9_-]{3,48}$"); }

        public static bool MagicOk(string ext, byte[] b)
        {
            Func<int, byte[], bool> starts = delegate(int off, byte[] sig)
            {
                if (b.Length < off + sig.Length) return false;
                for (int i = 0; i < sig.Length; i++) if (b[off + i] != sig[i]) return false;
                return true;
            };
            switch (ext)
            {
                case ".pdf": return starts(0, new byte[] { 0x25, 0x50, 0x44, 0x46 });
                case ".docx": case ".xlsx": return starts(0, new byte[] { 0x50, 0x4B, 3, 4 });
                case ".doc": case ".xls": return starts(0, new byte[] { 0xD0, 0xCF, 0x11, 0xE0 });
                case ".png": return starts(0, new byte[] { 0x89, 0x50, 0x4E, 0x47 });
                case ".jpg": case ".jpeg": return starts(0, new byte[] { 0xFF, 0xD8, 0xFF });
                case ".bmp": return starts(0, new byte[] { 0x42, 0x4D });
                case ".webp": return starts(0, new byte[] { 0x52, 0x49, 0x46, 0x46 }) && starts(8, new byte[] { 0x57, 0x45 });
                case ".txt": case ".csv":
                    for (int i = 0; i < Math.Min(b.Length, 4000); i++) if (b[i] == 0) return false;
                    return true;
            }
            return false;
        }

        public string PutFile(string id, string originalName, byte[] data)
        {
            if (!IdOk(id)) throw new ApiError(400, "ID berkas tidak valid.");
            if (data.LongLength > MaxFileBytes) throw new ApiError(413, "Ukuran berkas melebihi 25 MB.");
            string ext = (Path.GetExtension(originalName ?? "") ?? "").ToLowerInvariant();
            if (Array.IndexOf(AllowedExt, ext) < 0) throw new ApiError(415, "Jenis berkas tidak didukung.");
            if (!MagicOk(ext, data)) throw new ApiError(415, "Isi berkas tidak sesuai ekstensi.");
            string hash = Sha256Hex(data);
            string safe = id + ext;
            lock (gate)
            {
                foreach (string old in Directory.GetFiles(Dosir, id + ".*")) File.Delete(old);
                File.WriteAllBytes(Path.Combine(Dosir, safe), data);
                List<object> idx = ReadIndex();
                idx.RemoveAll(delegate(object o) { Dictionary<string, object> m = o as Dictionary<string, object>; return m != null && Str(m, "docId", "") == id; });
                Dictionary<string, object> rec = new Dictionary<string, object>();
                rec["docId"] = id; rec["name"] = Trunc(Path.GetFileName(originalName ?? "berkas"), 200); rec["file"] = safe;
                rec["size"] = data.LongLength; rec["sha256"] = hash; rec["at"] = DateTime.UtcNow.ToString("o");
                idx.Add(rec);
                WriteAtomic(P("lampiran_berkas.json"), ser.Serialize(idx));
            }
            return "{\"ref\":\"dosir_lampiran/" + safe + "\",\"sha256\":\"" + hash + "\"}";
        }

        List<object> ReadIndex()
        {
            try
            {
                IEnumerable e = ser.DeserializeObject(File.ReadAllText(P("lampiran_berkas.json"), Encoding.UTF8)) as IEnumerable;
                List<object> l = new List<object>();
                if (e != null) foreach (object o in e) l.Add(o);
                return l;
            }
            catch { return new List<object>(); }
        }

        public bool GetFile(string id, out byte[] data, out string name, out string ext)
        {
            data = null; name = null; ext = null;
            if (!IdOk(id)) return false;
            lock (gate)
            {
                foreach (object o in ReadIndex())
                {
                    Dictionary<string, object> m = o as Dictionary<string, object>;
                    if (m == null || Str(m, "docId", "") != id) continue;
                    string f = Path.Combine(Dosir, Path.GetFileName(Str(m, "file", "")));
                    if (!File.Exists(f)) return false;
                    data = File.ReadAllBytes(f); name = Str(m, "name", id); ext = Path.GetExtension(f).ToLowerInvariant();
                    return true;
                }
            }
            return false;
        }

        public void DeleteFile(string id)
        {
            if (!IdOk(id)) throw new ApiError(400, "ID berkas tidak valid.");
            lock (gate)
            {
                foreach (string old in Directory.GetFiles(Dosir, id + ".*")) File.Delete(old);
                List<object> idx = ReadIndex();
                idx.RemoveAll(delegate(object o) { Dictionary<string, object> m = o as Dictionary<string, object>; return m != null && Str(m, "docId", "") == id; });
                WriteAtomic(P("lampiran_berkas.json"), ser.Serialize(idx));
            }
        }

        // ---- cadangan
        public string CreateBackup()
        {
            lock (gate)
            {
                string name = "backup_" + DateTime.Now.ToString("yyyyMMddHHmmss");
                string dir = Path.Combine(Backups, name);
                int n = 1;
                while (Directory.Exists(dir)) { name = "backup_" + DateTime.Now.ToString("yyyyMMddHHmmss") + "_" + (n++); dir = Path.Combine(Backups, name); }
                Directory.CreateDirectory(dir);
                long total = 0;
                StringBuilder combined = new StringBuilder();
                Dictionary<string, object> files = new Dictionary<string, object>();
                foreach (string src in Directory.GetFiles(Tables))
                {
                    string fn = Path.GetFileName(src);
                    if (fn.EndsWith(".tmp") || fn.Contains(".jsonl.")) continue;
                    File.Copy(src, Path.Combine(dir, fn), true);
                    byte[] bytes = File.ReadAllBytes(src);
                    total += bytes.LongLength;
                    string h = Sha256Hex(bytes);
                    files[fn] = h; combined.Append(fn).Append(':').Append(h).Append(';');
                }
                string sum = Sha256Hex(Encoding.UTF8.GetBytes(combined.ToString()));
                int docs = CountItems(Path.Combine(dir, "naskah_kerjasama.json"));
                Dictionary<string, object> man = new Dictionary<string, object>();
                man["name"] = name; man["at"] = DateTime.UtcNow.ToString("o"); man["bytes"] = total; man["sha256"] = sum; man["documents"] = docs; man["files"] = files;
                File.WriteAllText(Path.Combine(dir, "manifest.json"), ser.Serialize(man), new UTF8Encoding(false));
                return ser.Serialize(new Dictionary<string, object> { { "name", name }, { "bytes", total }, { "sha256", sum }, { "documents", docs } });
            }
        }

        int CountItems(string file)
        {
            try { IEnumerable e = ser.DeserializeObject(File.ReadAllText(file, Encoding.UTF8)) as IEnumerable; int n = 0; if (e != null) foreach (object o in e) n++; return n; }
            catch { return 0; }
        }

        public string ListBackups()
        {
            lock (gate)
            {
                List<object> items = new List<object>();
                foreach (string d in Directory.GetDirectories(Backups))
                {
                    string mf = Path.Combine(d, "manifest.json");
                    if (!File.Exists(mf)) continue;
                    try
                    {
                        Dictionary<string, object> m = ser.DeserializeObject(File.ReadAllText(mf, Encoding.UTF8)) as Dictionary<string, object>;
                        if (m != null) { m.Remove("files"); items.Add(m); }
                    }
                    catch { }
                }
                items.Sort(delegate(object a, object b) { return string.CompareOrdinal(Str((Dictionary<string, object>)b, "name", ""), Str((Dictionary<string, object>)a, "name", "")); });
                return ser.Serialize(new Dictionary<string, object> { { "items", items } });
            }
        }

        public string Restore(string name, bool dryRun)
        {
            if (name == null || !System.Text.RegularExpressions.Regex.IsMatch(name, "^backup_[0-9_]+$")) throw new ApiError(400, "Nama cadangan tidak valid.");
            lock (gate)
            {
                string dir = Path.Combine(Backups, name);
                string mf = Path.Combine(dir, "manifest.json");
                if (!File.Exists(mf)) throw new ApiError(404, "Cadangan tidak ditemukan.");
                Dictionary<string, object> man = ser.DeserializeObject(File.ReadAllText(mf, Encoding.UTF8)) as Dictionary<string, object>;
                Dictionary<string, object> files = man != null && man.ContainsKey("files") ? man["files"] as Dictionary<string, object> : null;
                if (files == null) throw new ApiError(500, "Manifest cadangan rusak.");
                StringBuilder combined = new StringBuilder();
                foreach (KeyValuePair<string, object> kv in files)
                {
                    string f = Path.Combine(dir, Path.GetFileName(kv.Key));
                    if (!File.Exists(f)) throw new ApiError(409, "Berkas cadangan hilang: " + kv.Key);
                    string h = Sha256Hex(File.ReadAllBytes(f));
                    if (h != Convert.ToString(kv.Value)) throw new ApiError(409, "Pemeriksaan integritas gagal: " + kv.Key + " berubah sejak dicadangkan.");
                    combined.Append(kv.Key).Append(':').Append(h).Append(';');
                }
                if (!dryRun)
                {
                    foreach (KeyValuePair<string, object> kv in files)
                    {
                        string fn = Path.GetFileName(kv.Key);
                        File.Copy(Path.Combine(dir, fn), Path.Combine(Tables, fn), true);
                    }
                }
                string docs = File.ReadAllText(Path.Combine(dir, "naskah_kerjasama.json"), Encoding.UTF8);
                string partners = File.ReadAllText(Path.Combine(dir, "mitra_institusi.json"), Encoding.UTF8);
                return "{\"documents\":" + docs + ",\"partners\":" + partners + "}";
            }
        }

        // ---- statistik
        public string StatsJson(DateTime started)
        {
            lock (gate)
            {
                Dictionary<string, object> s = new Dictionary<string, object>();
                s["dbDir"] = Root;
                List<object> tables = new List<object>();
                foreach (string t in new string[] { "naskah_kerjasama.json", "mitra_institusi.json", "lampiran_berkas.json", "memori_ekstraksi.json", "audit_trail_log.jsonl", "database_manifest.json" })
                {
                    FileInfo fi = new FileInfo(P(t));
                    Dictionary<string, object> r = new Dictionary<string, object>();
                    r["name"] = Path.GetFileNameWithoutExtension(t); r["path"] = "tables/" + t; r["bytes"] = fi.Exists ? fi.Length : 0L;
                    tables.Add(r);
                }
                s["tables"] = tables;
                List<object> tree = new List<object>();
                long dbBytes = 0, fileBytes = 0; int fileCount = 0, backupCount = 0;
                foreach (string e in Directory.GetFileSystemEntries(Root, "*", SearchOption.AllDirectories))
                {
                    if (tree.Count >= 400) break;
                    bool isDir = Directory.Exists(e);
                    long len = isDir ? 0 : new FileInfo(e).Length;
                    if (!isDir) dbBytes += len;
                    Dictionary<string, object> r = new Dictionary<string, object>();
                    r["path"] = e.Substring(Root.Length).TrimStart('\\', '/').Replace('\\', '/'); r["dir"] = isDir; r["bytes"] = len;
                    tree.Add(r);
                }
                foreach (string f in Directory.GetFiles(Dosir)) { fileCount++; fileBytes += new FileInfo(f).Length; }
                backupCount = Directory.GetDirectories(Backups).Length;
                s["tree"] = tree; s["dbBytes"] = dbBytes; s["fileCount"] = fileCount; s["fileBytes"] = fileBytes;
                s["backupCount"] = backupCount; s["auditCount"] = AuditCount();
                try { s["workingSetBytes"] = Process.GetCurrentProcess().WorkingSet64; } catch { }
                s["gcBytes"] = GC.GetTotalMemory(false);
                s["uptimeSec"] = (long)(DateTime.Now - started).TotalSeconds;
                try
                {
                    DriveInfo di = new DriveInfo(Path.GetPathRoot(Root));
                    s["diskFreeBytes"] = di.AvailableFreeSpace; s["diskTotalBytes"] = di.TotalSize;
                }
                catch { s["diskFreeBytes"] = 0L; s["diskTotalBytes"] = 0L; }
                s["files"] = ReadIndexSummary();
                return ser.Serialize(s);
            }
        }

        List<object> ReadIndexSummary()
        {
            List<object> res = new List<object>();
            foreach (object o in ReadIndex())
            {
                Dictionary<string, object> m = o as Dictionary<string, object>;
                if (m == null) continue;
                Dictionary<string, object> r = new Dictionary<string, object>();
                r["docId"] = Str(m, "docId", ""); r["name"] = Str(m, "name", ""); r["size"] = m.ContainsKey("size") ? m["size"] : 0; r["sha256"] = Str(m, "sha256", ""); r["at"] = Str(m, "at", "");
                res.Add(r);
            }
            return res;
        }

        // ---- simulasi tulis/baca (data uji terpisah)
        public string Simulate(string body)
        {
            Dictionary<string, object> d = ser.DeserializeObject(body) as Dictionary<string, object>;
            IEnumerable rows = d != null && d.ContainsKey("rows") ? d["rows"] as IEnumerable : null;
            if (rows == null) throw new ApiError(400, "Format simulasi tidak valid.");
            Directory.CreateDirectory(Sim);
            string path = Path.Combine(Sim, "sim.jsonl");
            Stopwatch w = Stopwatch.StartNew();
            long bytes = 0;
            using (FileStream fs = new FileStream(path, FileMode.Create, FileAccess.Write, FileShare.None, 1 << 16, FileOptions.WriteThrough))
            using (StreamWriter sw = new StreamWriter(fs, new UTF8Encoding(false)))
            {
                foreach (object r in rows) { string line = ser.Serialize(r); bytes += line.Length; sw.WriteLine(line); }
                sw.Flush(); fs.Flush(true);
            }
            long writeMs = w.ElapsedMilliseconds;
            w.Restart();
            int count = 0; long read = 0;
            foreach (string l in File.ReadLines(path)) { count++; read += l.Length; }
            long readMs = w.ElapsedMilliseconds;
            return ser.Serialize(new Dictionary<string, object> { { "writeMs", writeMs }, { "readMs", readMs }, { "bytes", bytes }, { "rows", count } });
        }

        public void ClearSim() { try { if (Directory.Exists(Sim)) Directory.Delete(Sim, true); } catch { } }

        public static string Sha256Hex(byte[] data)
        {
            using (SHA256 sha = SHA256.Create())
            {
                byte[] h = sha.ComputeHash(data);
                StringBuilder sb = new StringBuilder(h.Length * 2);
                foreach (byte b in h) sb.Append(b.ToString("x2"));
                return sb.ToString();
            }
        }
    }

    public class ApiError : Exception
    {
        public readonly int Status;
        public ApiError(int status, string msg) : base(msg) { Status = status; }
    }

    // ------------------------------------------------------------------ sumber daya tertanam
    public static class Resources
    {
        static readonly object gate = new object();
        static ZipArchive zip;
        static Dictionary<string, ZipArchiveEntry> entries;
        static string webDir;

        public static byte[] Read(string name)
        {
            Assembly a = Assembly.GetExecutingAssembly();
            using (Stream s = a.GetManifestResourceStream(name))
            {
                if (s == null) return null;
                using (MemoryStream ms = new MemoryStream()) { s.CopyTo(ms); return ms.ToArray(); }
            }
        }

        static void EnsureWeb()
        {
            if (zip != null || webDir != null) return;
            string dev = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "web");
            if (Directory.Exists(dev) && File.Exists(Path.Combine(dev, "index.html"))) { webDir = dev; return; }
            byte[] z = Read("web.zip");
            if (z == null) throw new InvalidOperationException("Aset web tidak ditemukan (web.zip). Bangun ulang EXE dengan build_exe.bat.");
            zip = new ZipArchive(new MemoryStream(z), ZipArchiveMode.Read);
            entries = new Dictionary<string, ZipArchiveEntry>(StringComparer.Ordinal);
            foreach (ZipArchiveEntry e in zip.Entries) entries[e.FullName.Replace('\\', '/')] = e;
        }

        public static byte[] Web(string rel)
        {
            lock (gate)
            {
                EnsureWeb();
                rel = rel.Replace('\\', '/').TrimStart('/');
                if (rel.Length == 0) rel = "index.html";
                if (rel.Contains("..")) return null;
                if (webDir != null)
                {
                    string p = Path.GetFullPath(Path.Combine(webDir, rel));
                    if (!p.StartsWith(Path.GetFullPath(webDir)) || !File.Exists(p)) return null;
                    return File.ReadAllBytes(p);
                }
                ZipArchiveEntry e;
                if (!entries.TryGetValue(rel, out e)) return null;
                using (Stream s = e.Open())
                using (MemoryStream ms = new MemoryStream()) { s.CopyTo(ms); return ms.ToArray(); }
            }
        }
    }

    // ------------------------------------------------------------------ server lokal
    public class LocalServer
    {
        readonly LocalDatabase db;
        HttpListener listener;
        readonly string token = NewToken();
        readonly DateTime started = DateTime.Now;
        readonly ManualResetEvent stopped = new ManualResetEvent(false);
        readonly List<string> log = new List<string>();
        int port;
        volatile bool running;
        public int Requests;

        public LocalServer(LocalDatabase d) { db = d; }
        public string Url { get { return "http://127.0.0.1:" + port + "/"; } }
        public DateTime Started { get { return started; } }
        public LocalDatabase Db { get { return db; } }

        static string NewToken()
        {
            byte[] b = new byte[24];
            using (RandomNumberGenerator r = RandomNumberGenerator.Create()) r.GetBytes(b);
            return Convert.ToBase64String(b).Replace('+', '-').Replace('/', '_').TrimEnd('=');
        }

        public void Start(int preferred)
        {
            Exception last = null;
            for (int p = preferred; p < preferred + 10; p++)
            {
                HttpListener l = new HttpListener();
                l.Prefixes.Add("http://127.0.0.1:" + p + "/");
                l.Prefixes.Add("http://localhost:" + p + "/");
                try { l.Start(); listener = l; port = p; running = true; break; }
                catch (Exception ex) { last = ex; try { l.Close(); } catch { } }
            }
            if (listener == null) throw last ?? new InvalidOperationException("Tidak ada port yang tersedia.");
            Thread t = new Thread(Loop);
            t.IsBackground = true;
            t.Start();
            Log("Server lokal aktif di " + Url);
        }

        public void Stop()
        {
            running = false;
            try { if (listener != null) listener.Close(); } catch { }
            stopped.Set();
        }

        public void WaitUntilStopped() { stopped.WaitOne(); }

        public List<string> RecentLog() { lock (log) { return new List<string>(log); } }
        public void Log(string s)
        {
            lock (log) { log.Add(DateTime.Now.ToString("HH:mm:ss") + "  " + s); if (log.Count > 300) log.RemoveAt(0); }
        }

        void Loop()
        {
            while (running)
            {
                HttpListenerContext ctx = null;
                try { ctx = listener.GetContext(); }
                catch { if (!running) break; continue; }
                ThreadPool.QueueUserWorkItem(delegate(object o) { Handle((HttpListenerContext)o); }, ctx);
            }
        }

        public static bool IsKsdasRunning(int port)
        {
            try
            {
                HttpWebRequest r = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:" + port + "/api/ping");
                r.Timeout = 600; r.ReadWriteTimeout = 600; r.Proxy = null;
                using (HttpWebResponse resp = (HttpWebResponse)r.GetResponse())
                using (StreamReader sr = new StreamReader(resp.GetResponseStream()))
                    return sr.ReadToEnd().Contains("\"app\":\"KSDAS\"");
            }
            catch { return false; }
        }

        public static void OpenBrowser(string url)
        {
            try { Process.Start(new ProcessStartInfo(url) { UseShellExecute = true }); }
            catch
            {
                try { if (Environment.OSVersion.Platform == PlatformID.Unix) Process.Start("xdg-open", url); } catch { }
            }
        }

        static readonly Dictionary<string, string> Mime = new Dictionary<string, string>
        {
            { ".html", "text/html; charset=utf-8" }, { ".js", "text/javascript; charset=utf-8" }, { ".css", "text/css; charset=utf-8" },
            { ".json", "application/json; charset=utf-8" }, { ".gz", "application/octet-stream" }, { ".wasm", "application/wasm" },
            { ".png", "image/png" }, { ".jpg", "image/jpeg" }, { ".jpeg", "image/jpeg" }, { ".bmp", "image/bmp" }, { ".webp", "image/webp" },
            { ".pdf", "application/pdf" }, { ".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
            { ".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }, { ".doc", "application/msword" },
            { ".xls", "application/vnd.ms-excel" }, { ".csv", "text/csv; charset=utf-8" }, { ".txt", "text/plain; charset=utf-8" },
            { ".svg", "image/svg+xml" }, { ".ico", "image/x-icon" }, { ".md", "text/plain; charset=utf-8" }
        };

        const string Csp = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' blob:; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' data: blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

        void Handle(HttpListenerContext ctx)
        {
            HttpListenerResponse res = ctx.Response;
            try
            {
                Interlocked.Increment(ref Requests);
                HttpListenerRequest req = ctx.Request;
                res.Headers["X-Content-Type-Options"] = "nosniff";
                res.Headers["X-Frame-Options"] = "DENY";
                res.Headers["Referrer-Policy"] = "no-referrer";
                res.Headers["Content-Security-Policy"] = Csp;
                res.Headers["Cache-Control"] = "no-store";

                // Pertahanan DNS rebinding: Host harus loopback pada port ini.
                string host = req.Headers["Host"] ?? "";
                if (host != "127.0.0.1:" + port && host != "localhost:" + port) { Send(res, 403, "text/plain", "Host tidak diizinkan."); return; }

                string path = req.Url.AbsolutePath;
                if (path.StartsWith("/api/", StringComparison.Ordinal)) { Api(req, res, path); return; }
                if (req.HttpMethod != "GET" && req.HttpMethod != "HEAD") { Send(res, 405, "text/plain", "Metode tidak diizinkan."); return; }
                byte[] data = Resources.Web(Uri.UnescapeDataString(path).TrimStart('/'));
                if (data == null) { Send(res, 404, "text/plain", "Tidak ditemukan."); return; }
                string ext = Path.GetExtension(path).ToLowerInvariant();
                if (path == "/" || path.Length == 0) ext = ".html";
                string mime;
                if (!Mime.TryGetValue(ext, out mime)) mime = "application/octet-stream";
                if (ext == ".html")
                {
                    string html = Encoding.UTF8.GetString(data).Replace("{{KSDAS_TOKEN}}", token);
                    data = Encoding.UTF8.GetBytes(html);
                }
                else res.Headers["Cache-Control"] = "no-cache";
                Send(res, 200, mime, data);
            }
            catch (ApiError ae) { SafeSend(res, ae.Status, "application/json; charset=utf-8", JsonErr(ae.Message)); }
            catch (Exception ex)
            {
                Log("Galat: " + ex.Message);
                SafeSend(res, 500, "application/json; charset=utf-8", JsonErr("Kesalahan internal server."));
            }
        }

        static string JsonErr(string m) { return "{\"error\":" + LocalDatabase.NewSerializer().Serialize(m) + "}"; }

        void SafeSend(HttpListenerResponse res, int code, string mime, string body)
        {
            try { Send(res, code, mime, body); } catch { }
        }

        void Api(HttpListenerRequest req, HttpListenerResponse res, string path)
        {
            string method = req.HttpMethod;
            // Ping publik hanya menyatakan identitas aplikasi (untuk deteksi satu instans).
            if (path == "/api/ping" && method == "GET")
            {
                bool authed = req.Headers["X-KSDAS-Token"] == token;
                string extra = authed ? ",\"dbDir\":" + LocalDatabase.NewSerializer().Serialize(db.Root) + ",\"port\":" + port : "";
                Send(res, 200, "application/json; charset=utf-8", "{\"app\":\"KSDAS\",\"version\":\"" + Program.Version + "\",\"mode\":\"local-server\"" + extra + "}");
                return;
            }
            if (req.Headers["X-KSDAS-Token"] != token) throw new ApiError(401, "Token sesi tidak valid. Muat ulang halaman dari aplikasi KSDAS.");
            string origin = req.Headers["Origin"];
            if (!string.IsNullOrEmpty(origin) && origin != "http://127.0.0.1:" + port && origin != "http://localhost:" + port) throw new ApiError(403, "Origin tidak diizinkan.");

            if (path == "/api/state")
            {
                if (method == "GET") { Send(res, 200, "application/json; charset=utf-8", db.ReadStateJson()); return; }
                if (method == "POST") { db.WriteStateJson(ReadBody(req, 80L * 1024 * 1024)); Send(res, 200, "application/json; charset=utf-8", "{\"ok\":true}"); return; }
            }
            else if (path == "/api/audit")
            {
                if (method == "POST") { db.AppendAudit(ReadBody(req, 64 * 1024)); Send(res, 200, "application/json; charset=utf-8", "{\"ok\":true}"); return; }
                if (method == "GET")
                {
                    int limit = 50; int.TryParse(req.QueryString["limit"], out limit); if (limit <= 0) limit = 50;
                    Send(res, 200, "application/json; charset=utf-8", db.ReadAuditJson(limit)); return;
                }
            }
            else if (path == "/api/stats" && method == "GET") { Send(res, 200, "application/json; charset=utf-8", db.StatsJson(started)); return; }
            else if (path == "/api/backup" && method == "POST") { string r = db.CreateBackup(); Log("Cadangan dibuat"); Send(res, 200, "application/json; charset=utf-8", r); return; }
            else if (path == "/api/backups" && method == "GET") { Send(res, 200, "application/json; charset=utf-8", db.ListBackups()); return; }
            else if (path == "/api/restore" && method == "POST")
            {
                Dictionary<string, object> d = LocalDatabase.NewSerializer().DeserializeObject(ReadBody(req, 64 * 1024)) as Dictionary<string, object>;
                string name = d != null && d.ContainsKey("name") ? Convert.ToString(d["name"]) : null;
                bool dry = d != null && d.ContainsKey("dryRun") && d["dryRun"] is bool && (bool)d["dryRun"];
                string r = db.Restore(name, dry);
                if (!dry) Log("Data dipulihkan dari " + name);
                Send(res, 200, "application/json; charset=utf-8", r); return;
            }
            else if (path == "/api/sim")
            {
                if (method == "POST") { Send(res, 200, "application/json; charset=utf-8", db.Simulate(ReadBody(req, 80L * 1024 * 1024))); return; }
                if (method == "DELETE") { db.ClearSim(); Send(res, 200, "application/json; charset=utf-8", "{\"ok\":true}"); return; }
            }
            else if (path == "/api/open-folder" && method == "POST")
            {
                if (Environment.OSVersion.Platform == PlatformID.Win32NT) Process.Start("explorer.exe", "\"" + db.Root + "\"");
                Send(res, 200, "application/json; charset=utf-8", "{\"ok\":true}"); return;
            }
            else if (path.StartsWith("/api/files/", StringComparison.Ordinal))
            {
                string id = Uri.UnescapeDataString(path.Substring("/api/files/".Length));
                if (method == "PUT")
                {
                    byte[] data = ReadBytes(req, LocalDatabase.MaxFileBytes);
                    Send(res, 200, "application/json; charset=utf-8", db.PutFile(id, req.QueryString["name"], data)); return;
                }
                if (method == "GET")
                {
                    byte[] data; string name, ext;
                    if (!db.GetFile(id, out data, out name, out ext)) throw new ApiError(404, "Berkas tidak ditemukan.");
                    string mime; if (!Mime.TryGetValue(ext, out mime)) mime = "application/octet-stream";
                    res.Headers["Content-Disposition"] = "attachment; filename*=UTF-8''" + Uri.EscapeDataString(name);
                    Send(res, 200, mime, data); return;
                }
                if (method == "DELETE") { db.DeleteFile(id); Send(res, 200, "application/json; charset=utf-8", "{\"ok\":true}"); return; }
            }
            throw new ApiError(404, "Endpoint tidak ditemukan.");
        }

        static byte[] ReadBytes(HttpListenerRequest req, long max)
        {
            if (req.ContentLength64 > max) throw new ApiError(413, "Badan permintaan terlalu besar.");
            using (MemoryStream ms = new MemoryStream())
            {
                byte[] buf = new byte[81920]; int n;
                while ((n = req.InputStream.Read(buf, 0, buf.Length)) > 0)
                {
                    ms.Write(buf, 0, n);
                    if (ms.Length > max) throw new ApiError(413, "Badan permintaan terlalu besar.");
                }
                return ms.ToArray();
            }
        }

        static string ReadBody(HttpListenerRequest req, long max) { return Encoding.UTF8.GetString(ReadBytes(req, max)); }

        static void Send(HttpListenerResponse res, int code, string mime, string body) { Send(res, code, mime, Encoding.UTF8.GetBytes(body)); }
        static void Send(HttpListenerResponse res, int code, string mime, byte[] body)
        {
            res.StatusCode = code;
            res.ContentType = mime;
            res.ContentLength64 = body.LongLength;
            res.OutputStream.Write(body, 0, body.Length);
            res.OutputStream.Close();
        }
    }

    // ------------------------------------------------------------------ jendela status
    public class MainForm : Form
    {
        readonly LocalServer server;
        readonly LocalDatabase db;
        readonly Label lblUrl = new Label(), lblStats = new Label();
        readonly TextBox txtLog = new TextBox();
        readonly System.Windows.Forms.Timer timer = new System.Windows.Forms.Timer();
        readonly NotifyIcon tray = new NotifyIcon();
        bool quitting;

        public MainForm(LocalServer s, LocalDatabase d)
        {
            server = s; db = d;
            Text = "KSDAS IT Del - Server Penyimpanan Lokal";
            Width = 780; Height = 560; StartPosition = FormStartPosition.CenterScreen;
            Font = new Font("Segoe UI", 9.5f);
            MinimumSize = new Size(640, 460);

            Label title = new Label { Text = "KSDAS IT Del", Font = new Font("Georgia", 18f, FontStyle.Bold), AutoSize = true, Left = 16, Top = 12, ForeColor = Color.FromArgb(22, 50, 79) };
            Label sub = new Label { Text = "Sistem Informasi Kerja Sama. Penyimpanan dibangun di komputer ini, data tidak dikirim ke internet.", AutoSize = true, Left = 18, Top = 48 };
            lblUrl.Left = 18; lblUrl.Top = 76; lblUrl.AutoSize = true; lblUrl.Font = new Font("Segoe UI", 10f, FontStyle.Bold);
            lblUrl.Text = "Alamat aplikasi: " + server.Url;

            Button bOpen = Btn("Buka Aplikasi KSDAS", 18, 104, 170, delegate { LocalServer.OpenBrowser(server.Url); });
            Button bFolder = Btn("Buka Folder Basis Data", 196, 104, 170, delegate { try { Process.Start("explorer.exe", "\"" + db.Root + "\""); } catch { } });
            Button bBackup = Btn("Cadangkan Sekarang", 374, 104, 160, delegate { try { db.CreateBackup(); server.Log("Cadangan dibuat dari jendela ini"); } catch (Exception ex) { MessageBox.Show(ex.Message); } });
            Button bQuit = Btn("Keluar", 542, 104, 90, delegate { quitting = true; Close(); });

            lblStats.Left = 18; lblStats.Top = 144; lblStats.Width = 720; lblStats.Height = 120;
            lblStats.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            Label lh = new Label { Text = "Catatan aktivitas", Left = 18, Top = 270, AutoSize = true, Font = new Font("Segoe UI", 9.5f, FontStyle.Bold) };
            txtLog.Left = 18; txtLog.Top = 292; txtLog.Width = 725; txtLog.Height = 215; txtLog.Multiline = true; txtLog.ReadOnly = true; txtLog.ScrollBars = ScrollBars.Vertical;
            txtLog.Font = new Font("Consolas", 9f);
            txtLog.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;

            Controls.AddRange(new Control[] { title, sub, lblUrl, bOpen, bFolder, bBackup, bQuit, lblStats, lh, txtLog });
            foreach (string l in db.InitLog) server.Log(l);

            tray.Icon = SystemIcons.Application; tray.Text = "KSDAS IT Del"; tray.Visible = true;
            ContextMenuStrip menu = new ContextMenuStrip();
            menu.Items.Add("Buka Aplikasi KSDAS", null, delegate { LocalServer.OpenBrowser(server.Url); });
            menu.Items.Add("Tampilkan jendela", null, delegate { Show(); WindowState = FormWindowState.Normal; Activate(); });
            menu.Items.Add("Keluar", null, delegate { quitting = true; Close(); });
            tray.ContextMenuStrip = menu;
            tray.DoubleClick += delegate { Show(); WindowState = FormWindowState.Normal; Activate(); };

            timer.Interval = 1500; timer.Tick += delegate { RefreshStats(); }; timer.Start();
            RefreshStats();
        }

        Button Btn(string text, int x, int y, int w, EventHandler h)
        {
            Button b = new Button { Text = text, Left = x, Top = y, Width = w, Height = 30 };
            b.Click += h;
            return b;
        }

        static string Fmt(long n)
        {
            if (n < 1024) return n + " B";
            if (n < 1048576) return (n / 1024.0).ToString("0.0") + " KB";
            if (n < 1073741824) return (n / 1048576.0).ToString("0.0") + " MB";
            return (n / 1073741824.0).ToString("0.00") + " GB";
        }

        void RefreshStats()
        {
            try
            {
                int files = Directory.GetFiles(db.Dosir).Length;
                long fb = 0; foreach (string f in Directory.GetFiles(db.Dosir)) fb += new FileInfo(f).Length;
                int backups = Directory.GetDirectories(db.Backups).Length;
                long ws = Process.GetCurrentProcess().WorkingSet64;
                string disk = "";
                try { DriveInfo di = new DriveInfo(Path.GetPathRoot(db.Root)); disk = Fmt(di.AvailableFreeSpace) + " kosong dari " + Fmt(di.TotalSize); } catch { }
                lblStats.Text = "Folder basis data : " + db.Root + "\r\n" +
                                "Berkas lampiran   : " + files + " berkas (" + Fmt(fb) + ")\r\n" +
                                "Cadangan          : " + backups + "\r\n" +
                                "Catatan audit     : " + db.AuditCount() + "\r\n" +
                                "Memori proses     : " + Fmt(ws) + " (working set), " + Fmt(GC.GetTotalMemory(false)) + " heap terkelola\r\n" +
                                "Disk              : " + disk + "\r\n" +
                                "Permintaan dilayani: " + server.Requests;
                lblStats.Font = new Font("Consolas", 9f);
                string logText = string.Join("\r\n", server.RecentLog().ToArray());
                if (txtLog.Text != logText) { txtLog.Text = logText; txtLog.SelectionStart = txtLog.Text.Length; txtLog.ScrollToCaret(); }
            }
            catch { }
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            if (!quitting && e.CloseReason == CloseReason.UserClosing)
            {
                DialogResult r = MessageBox.Show("Keluar dari server KSDAS? Aplikasi di peramban tidak akan dapat menyimpan data sampai dijalankan lagi.\r\n\r\nPilih Tidak untuk menyembunyikan jendela ke baki sistem.", "KSDAS IT Del", MessageBoxButtons.YesNoCancel, MessageBoxIcon.Question);
                if (r == DialogResult.Cancel) { e.Cancel = true; return; }
                if (r == DialogResult.No) { e.Cancel = true; Hide(); return; }
            }
            tray.Visible = false;
            timer.Stop();
            base.OnFormClosing(e);
        }
    }
}
