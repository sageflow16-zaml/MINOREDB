export async function extractTextFromFile(file: File): Promise<string> {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();

  if (ext === '.txt') {
    return file.text();
  }

  if (ext === '.pdf') {
    return extractPDFText(file);
  }

  if (ext === '.docx') {
    return extractDOCXText(file);
  }

  return '';
}

async function extractPDFText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item: any) => item.str).join(' '));
  }
  return pages.join('\n\n');
}

async function extractDOCXText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = new Uint8Array(arrayBuffer);
  let offset = 0;

  function readString(length: number): string {
    const slice = zip.slice(offset, offset + length);
    offset += length;
    return new TextDecoder('utf-8').decode(slice);
  }

  try {
    const header = readString(2);
    if (header !== 'PK') return '';

    while (offset < zip.length) {
      const sig = readString(4);
      if (sig === 'PK\x03\x04') {
        const version = readString(2);
        const flags = readString(2);
        const method = readString(2);
        const lastMod = readString(4);
        const crc32 = readString(4);
        const compSize = new DataView(zip.buffer, zip.byteOffset + offset, 4).getUint32(0, true);
        offset += 4;
        const uncompSize = new DataView(zip.buffer, zip.byteOffset + offset, 4).getUint32(0, true);
        offset += 4;
        const nameLen = new DataView(zip.buffer, zip.byteOffset + offset, 2).getUint16(0, true);
        offset += 2;
        const extraLen = new DataView(zip.buffer, zip.byteOffset + offset, 2).getUint16(0, true);
        offset += 2;
        const fileName = readString(nameLen);
        offset += extraLen;

        if (fileName === 'word/document.xml') {
          if (method === '\x00\x00') {
            const content = readString(uncompSize);
            const textMatch = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            return textMatch;
          }
          return '';
        }
        offset += compSize;
      } else {
        break;
      }
    }
  } catch {
    /* DOCX parsing failed */
  }
  return '';
}
