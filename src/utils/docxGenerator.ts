/**
 * Pure browser-native OpenXML (.docx) document generator.
 * Builds a compliant ECMA-376 Word document inside a standard PKZIP container
 * with zero external dependencies so Download as DOCX works reliably everywhere.
 */

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Precompute IEEE 802.3 CRC-32 lookup table
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntryInput {
  path: string;
  content: string;
}

function buildStoreZip(entries: ZipEntryInput[]): Uint8Array {
  const encoder = new TextEncoder();
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.path);
    const dataBytes = encoder.encode(entry.content);
    const checksum = crc32(dataBytes);
    const size = dataBytes.length;

    // Local File Header (30 bytes + filename + data)
    const localHeader = new Uint8Array(30 + nameBytes.length + size);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // Local file header signature
    lv.setUint16(4, 20, true); // Version needed to extract (2.0)
    lv.setUint16(6, 0x0800, true); // UTF-8 filename flag
    lv.setUint16(8, 0, true); // Compression method: 0 (Store)
    lv.setUint16(10, 0x4800, true); // Mod time
    lv.setUint16(12, 0x5d58, true); // Mod date
    lv.setUint32(14, checksum, true); // CRC-32
    lv.setUint32(18, size, true); // Compressed size
    lv.setUint32(22, size, true); // Uncompressed size
    lv.setUint16(26, nameBytes.length, true); // File name length
    lv.setUint16(28, 0, true); // Extra field length
    localHeader.set(nameBytes, 30);
    localHeader.set(dataBytes, 30 + nameBytes.length);
    localChunks.push(localHeader);

    // Central Directory File Header (46 bytes + filename)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // Central directory signature
    cv.setUint16(4, 20, true); // Version made by
    cv.setUint16(6, 20, true); // Version needed
    cv.setUint16(8, 0x0800, true); // UTF-8 flag
    cv.setUint16(10, 0, true); // Compression: Store
    cv.setUint16(12, 0x4800, true); // Mod time
    cv.setUint16(14, 0x5d58, true); // Mod date
    cv.setUint32(16, checksum, true); // CRC-32
    cv.setUint32(20, size, true); // Compressed size
    cv.setUint32(24, size, true); // Uncompressed size
    cv.setUint16(28, nameBytes.length, true); // File name length
    cv.setUint16(30, 0, true); // Extra length
    cv.setUint16(32, 0, true); // Comment length
    cv.setUint16(34, 0, true); // Disk number
    cv.setUint16(36, 0, true); // Internal attrs
    cv.setUint32(38, 0, true); // External attrs
    cv.setUint32(42, localOffset, true); // Offset of local header
    centralHeader.set(nameBytes, 46);
    centralChunks.push(centralHeader);

    localOffset += localHeader.length;
  }

  const centralSize = centralChunks.reduce((sum, c) => sum + c.length, 0);

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // EOCD signature
  ev.setUint16(4, 0, true); // Disk number
  ev.setUint16(6, 0, true); // Start disk
  ev.setUint16(8, entries.length, true); // Entries on disk
  ev.setUint16(10, entries.length, true); // Total entries
  ev.setUint32(12, centralSize, true); // Central directory size
  ev.setUint32(16, localOffset, true); // Central directory offset
  ev.setUint16(20, 0, true); // Comment length

  const totalLength = localOffset + centralSize + eocd.length;
  const output = new Uint8Array(totalLength);
  let pos = 0;

  for (const chunk of localChunks) {
    output.set(chunk, pos);
    pos += chunk.length;
  }
  for (const chunk of centralChunks) {
    output.set(chunk, pos);
    pos += chunk.length;
  }
  output.set(eocd, pos);

  return output;
}

export function downloadTextAsDocx(options: {
  title: string;
  referenceNumber: string;
  bodyText: string;
  filename: string;
}): void {
  const { title, referenceNumber, bodyText, filename } = options;

  const lines = bodyText.replace(/\r\n/g, '\n').split('\n');

  const paragraphsXml = lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return `<w:p><w:pPr><w:spacing w:after="100"/></w:pPr></w:p>`;
      }

      const isEmphasized =
        trimmed.startsWith('Subject:') ||
        trimmed.startsWith('Sub:') ||
        trimmed.startsWith('Ref:') ||
        trimmed.startsWith('Reference:') ||
        trimmed.startsWith('To,') ||
        trimmed.startsWith('From:');

      return `<w:p>
        <w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
            <w:sz w:val="22"/>
            ${isEmphasized ? '<w:b/>' : ''}
          </w:rPr>
          <w:t xml:space="preserve">${escapeXml(line)}</w:t>
        </w:r>
      </w:p>`;
    })
    .join('\n');

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
      <w:sz w:val="22"/>
      <w:color w:val="0F172A"/>
    </w:rPr>
  </w:style>
</w:styles>`;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:spacing w:after="60"/></w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
          <w:b/>
          <w:sz w:val="28"/>
          <w:color w:val="0F172A"/>
        </w:rPr>
        <w:t>${escapeXml(title)}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:pBdr>
          <w:bottom w:val="single" w:sz="6" w:space="6" w:color="CBD5E1"/>
        </w:pBdr>
        <w:spacing w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
          <w:sz w:val="18"/>
          <w:color w:val="64748B"/>
        </w:rPr>
        <w:t xml:space="preserve">Notice Reference: ${escapeXml(referenceNumber)}  |  Drafted via RupiVanta (Guidance only, verify before filing)</w:t>
      </w:r>
    </w:p>
    ${paragraphsXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const zipBytes = buildStoreZip([
    { path: '[Content_Types].xml', content: contentTypesXml },
    { path: '_rels/.rels', content: rootRelsXml },
    { path: 'word/_rels/document.xml.rels', content: docRelsXml },
    { path: 'word/styles.xml', content: stylesXml },
    { path: 'word/document.xml', content: documentXml },
  ]);

  const blob = new Blob([zipBytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
