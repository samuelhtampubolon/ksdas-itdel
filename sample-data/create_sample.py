import zipfile
import os

docx_path = os.path.join("sample-data", "MoU_ITDel_PemkabToba_2026.docx")

doc_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>MEMORANDUM OF UNDERSTANDING (NOTA KESEPAHAMAN)</w:t></w:r></w:p>
    <w:p><w:r><w:t>ANTARA</w:t></w:r></w:p>
    <w:p><w:r><w:t>INSTITUT TEKNOLOGI DEL</w:t></w:r></w:p>
    <w:p><w:r><w:t>DENGAN</w:t></w:r></w:p>
    <w:p><w:r><w:t>PEMERINTAH KABUPATEN TOBA</w:t></w:r></w:p>
    <w:p><w:r><w:t>TENTANG</w:t></w:r></w:p>
    <w:p><w:r><w:t>KERJA SAMA PENGEMBANGAN SISTEM INFORMASI DESA DAN PELATIHAN SUMBER DAYA MANUSIA DI KABUPATEN TOBA</w:t></w:r></w:p>
    <w:p><w:r><w:t>NOMOR: 014/ITDel/MoU/2026</w:t></w:r></w:p>
    <w:p><w:r><w:t>NOMOR: 100.3/042/Tapem/2026</w:t></w:r></w:p>
    <w:p><w:r><w:t>Pada hari ini, Jumat tanggal 15 bulan Januari tahun 2026 (15-01-2026) bertempat di Laguboti:</w:t></w:r></w:p>
    <w:p><w:r><w:t>1. Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech., Rektor Institut Teknologi Del bertindak untuk dan atas nama Institut Teknologi Del (PIHAK PERTAMA).</w:t></w:r></w:p>
    <w:p><w:r><w:t>2. Ir. Poltak Sitorus, M.Sc., Bupati Toba, bertindak untuk dan atas nama Pemerintah Kabupaten Toba (PIHAK KEDUA).</w:t></w:r></w:p>
    <w:p><w:r><w:t>PASAL 1: RUANG LINGKUP</w:t></w:r></w:p>
    <w:p><w:r><w:t>Ruang lingkup Nota Kesepahaman ini mencakup bidang Pendidikan, Penelitian, dan Pengabdian Kepada Masyarakat dalam bidang teknologi informasi, rekayasa perangkat lunak, sistem informasi, dan tata kelola digital desa di Fakultas Informatika dan Teknik Elektro (FITE) Program Studi S1 Sistem Informasi.</w:t></w:r></w:p>
    <w:p><w:r><w:t>PASAL 2: JANGKA WAKTU</w:t></w:r></w:p>
    <w:p><w:r><w:t>Nota Kesepahaman ini berlaku untuk jangka waktu 3 (tiga) tahun terhitung sejak tanggal ditandatangani.</w:t></w:r></w:p>
  </w:body>
</w:document>"""

content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>"""

rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

with zipfile.ZipFile(docx_path, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('[Content_Types].xml', content_types)
    z.writestr('_rels/.rels', rels)
    z.writestr('word/document.xml', doc_xml)

print(f"Created DOCX sample: {docx_path} ({os.path.getsize(docx_path)} bytes)")
