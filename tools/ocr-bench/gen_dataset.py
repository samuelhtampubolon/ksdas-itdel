#!/usr/bin/env python3
"""Pembuat dataset uji OCR sintetis (teks dari UDHR + kalimat naskah kerja sama buatan sendiri).

Tujuan: mengukur CER/WER mesin OCR pada berbagai bahasa dan kondisi gambar (bersih, resolusi rendah, miring,
bising, bayangan, JPEG, fotokopi). Semua teks UDHR berlisensi MIT (paket npm "udhr"); teks lain karangan sendiri.

Pemakaian: python3 gen_dataset.py <folder_udhr/declaration> <folder_keluaran> [seed]
"""
import sys, os, re, json, html, random
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

UDHR = sys.argv[1]; OUT = sys.argv[2]; SEED = int(sys.argv[3]) if len(sys.argv) > 3 else 7
random.seed(SEED); np.random.seed(SEED)
os.makedirs(OUT, exist_ok=True)
F = "/usr/share/fonts/truetype/"
FONTS = {
    "serif": F + "liberation/LiberationSerif-Regular.ttf",
    "sans": F + "liberation/LiberationSans-Regular.ttf",
    "dejavu": F + "dejavu/DejaVuSerif.ttf",
    "freeserif": F + "freefont/FreeSerif.ttf",
}
CJK = F + "wqy/wqy-zenhei.ttc"; THAI = "/usr/share/fonts/opentype/loma/Loma.otf"

# Teks karangan: domain naskah kerja sama (nama, gelar, nomor, tanggal, Rp)
DOMAIN = {
    "id": [
        "NOTA KESEPAHAMAN antara INSTITUT TEKNOLOGI DEL dengan PEMERINTAH KABUPATEN SAMOSIR tentang Pengembangan Sistem Informasi Desa.",
        "Nomor: 031/ITDel/MoU/2026. Pada hari ini Selasa tanggal 20 Januari 2026, bertempat di Laguboti, yang bertanda tangan di bawah ini:",
        "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech., Rektor Institut Teknologi Del, selanjutnya disebut PIHAK PERTAMA.",
        "Ir. Mangihut Pasaribu, M.Si., Bupati Samosir, bertindak untuk dan atas nama Pemerintah Kabupaten Samosir, selanjutnya disebut PIHAK KEDUA.",
        "Perjanjian ini berlaku sejak 18 Agustus 2025 sampai dengan 17 Agustus 2027 dengan biaya sebesar Rp 75.000.000 (tujuh puluh lima juta rupiah).",
        "Penanggung jawab kegiatan: Rina Situmorang, S.T., M.T. Lokasi: Balige, Kabupaten Toba, Provinsi Sumatera Utara.",
    ],
    "en": [
        "MEMORANDUM OF UNDERSTANDING between INSTITUT TEKNOLOGI DEL and UNIVERSITI TEKNOLOGI MALAYSIA concerning joint research.",
        "Number: 021/ITDel/MoU/2026. This Memorandum is made on 5 March 2026 in Laguboti, North Sumatra, Indonesia.",
        "Prof. Dr. Ahmad Bin Ali, Vice Chancellor of Universiti Teknologi Malaysia, represents the SECOND PARTY.",
        "The cooperation is valid for 5 (five) years from the date of signing, with a budget of USD 12,500.00 funded by the partner.",
    ],
    "ms": [
        "MEMORANDUM PERSEFAHAMAN antara INSTITUT TEKNOLOGI DEL dengan UNIVERSITI TEKNOLOGI MALAYSIA mengenai kerjasama penyelidikan.",
        "Nombor: 021/ITDel/MoU/2026. Memorandum ini dibuat pada 5 Mac 2026 di Laguboti, Sumatera Utara, Indonesia.",
        "Kerjasama ini sah selama lima tahun mulai tarikh ditandatangani dan dibiayai oleh pihak kedua sebanyak RM 50,000.",
        "Pegawai penyelaras: Dr. Nurul Huda binti Abdullah, Fakulti Sains Komputer dan Teknologi Maklumat.",
    ],
}

def clean(t):
    t = html.unescape(re.sub(r"<[^>]+>", " ", t))
    return re.sub(r"\s+", " ", t).strip()

def udhr_text(code, n_chars=520):
    p = os.path.join(UDHR, code + ".html")
    s = open(p, encoding="utf-8").read()
    paras = [clean(x) for x in re.findall(r"<p[^>]*>(.*?)</p>", s, flags=re.S)]
    paras = [x for x in paras if len(x) > 25]
    out = []
    tot = 0
    for x in paras[2:]:
        out.append(x); tot += len(x)
        if tot >= n_chars: break
    return out

def wrap(par, width):
    # CJK/Thai tidak memakai spasi; pecah per jumlah karakter
    if " " not in par[:40]:
        return [par[i:i + width // 2] for i in range(0, len(par), width // 2)]
    lines, cur = [], ""
    for w in par.split(" "):
        if len(cur) + len(w) + 1 > width and cur:
            lines.append(cur); cur = w
        else:
            cur = (cur + " " + w).strip()
    if cur: lines.append(cur)
    return lines

def render(lines, font_path, size, index=0, rtl=False, lang=None):
    font = ImageFont.truetype(font_path, size, index=index, layout_engine=ImageFont.Layout.RAQM) if font_path.endswith(".ttc") else ImageFont.truetype(font_path, size, layout_engine=ImageFont.Layout.RAQM)
    lh = int(size * 1.45)
    W = 1500; H = 70 + lh * len(lines)
    img = Image.new("L", (W, H), 255)
    d = ImageDraw.Draw(img)
    y = 35
    for ln in lines:
        if rtl:
            d.text((W - 50, y), ln, font=font, fill=18, anchor="ra", direction="rtl", language=lang)
        else:
            d.text((50, y), ln, font=font, fill=18, language=lang)
        y += lh
    return np.array(img)

def cond_apply(a, cond):
    h, w = a.shape
    if cond == "clean":
        return a
    if cond == "lowres":
        s = cv2.resize(a, None, fx=0.52, fy=0.52, interpolation=cv2.INTER_AREA)
        return s
    if cond == "skew":
        ang = random.choice([-2.6, 2.3])
        M = cv2.getRotationMatrix2D((w / 2, h / 2), ang, 1.0)
        return cv2.warpAffine(a, M, (w, h), borderValue=255, flags=cv2.INTER_LINEAR)
    if cond == "noisy":
        n = np.random.normal(0, 24, a.shape)
        b = cv2.GaussianBlur(a.astype(np.float32), (0, 0), 1.0) + n
        return np.clip(b, 0, 255).astype(np.uint8)
    if cond == "shadow":
        xs = np.linspace(0.45, 1.0, w)[None, :]
        ys = np.linspace(0.85, 1.0, h)[:, None]
        g = xs * ys
        b = a.astype(np.float32) * g + 8 * np.random.randn(*a.shape)
        return np.clip(b, 0, 255).astype(np.uint8)
    if cond == "jpeg":
        ok, enc = cv2.imencode(".jpg", cv2.GaussianBlur(a, (0, 0), 0.7), [cv2.IMWRITE_JPEG_QUALITY, 22])
        return cv2.imdecode(enc, cv2.IMREAD_GRAYSCALE)
    if cond == "photocopy":
        b = (a < 150).astype(np.uint8) * 255
        b = cv2.erode(b, np.ones((2, 2), np.uint8))
        sp = (np.random.rand(*a.shape) < 0.012).astype(np.uint8) * 255
        b = cv2.bitwise_or(b, sp)
        return 255 - b
    raise ValueError(cond)

CONDS = ["clean", "lowres", "skew", "noisy", "shadow", "jpeg", "photocopy"]
LATIN = {"id": "ind", "en": "eng", "jv": "jav", "su": "sun", "de": "deu_1996", "fr": "fra", "es": "spa", "pt": "por_BR", "nl": "nld", "it": "ita", "tr": "tur", "vi": "vie"}
NONLATIN = {"ja": ("jpn", CJK, 30), "ko": ("kor", CJK, 30), "zh": ("cmn_hans", CJK, 30), "th": ("tha", THAI, 28), "ru": ("rus", FONTS["dejavu"], 26),
            "ar": ("arb", F + "dejavu/DejaVuSans.ttf", 28), "hi": ("hin", F + "freefont/FreeSerif.ttf", 28)}

items = []
def add(lang, kind, text_lines, cond, font_name, font_path, size, idx=0, rtl=False):
    base = render(text_lines, font_path, size, idx, rtl, lang)
    img = cond_apply(base, cond)
    name = f"{lang}_{kind}_{font_name}_{cond}.png"
    cv2.imwrite(os.path.join(OUT, name), img)
    truth = " ".join(text_lines)
    items.append({"file": name, "lang": lang, "kind": kind, "font": font_name, "cond": cond, "truth": truth})

fonts_cycle = list(FONTS.items())
k = 0
# 1) naskah domain (id/en/ms), semua kondisi, 2 font
for lang, paras in DOMAIN.items():
    lines = []
    for p_ in paras: lines += wrap(p_, 78)
    for ci, cond in enumerate(CONDS):
        fn, fp = fonts_cycle[(k + ci) % len(fonts_cycle)]
        add(lang, "domain", lines, cond, fn, fp, 25)
    k += 1
# 2) UDHR bahasa Latin: kondisi clean + noisy + skew + lowres
for lang, code in LATIN.items():
    paras = udhr_text(code, 480)
    lines = []
    for p_ in paras: lines += wrap(p_, 78)
    lines = lines[:8]
    for ci, cond in enumerate(["clean", "lowres", "skew", "noisy"]):
        fn, fp = fonts_cycle[(k + ci) % len(fonts_cycle)]
        add(lang, "udhr", lines, cond, fn, fp, 25)
    k += 1
# 3) UDHR bukan Latin: clean + noisy
for lang, (code, fp, size) in NONLATIN.items():
    paras = udhr_text(code, 300)
    lines = []
    for p_ in paras: lines += wrap(p_, 60)
    lines = lines[:6]
    for cond in ["clean", "noisy"]:
        add(lang, "udhr", lines, cond, os.path.basename(fp).split(".")[0], fp, size, rtl=(lang == "ar"))

json.dump(items, open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(items), "gambar ->", OUT)
