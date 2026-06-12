export type ImportRow = Record<string, string>;

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && quoted && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === ',' && !quoted) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(text: string): ImportRow[] {
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    throw new Error('Import file has no header row.');
  }

  const headers = parseCsvLine(lines[0] ?? '').map(normalizeHeader);
  if (headers.every((header) => header.length === 0)) {
    throw new Error('Import file has no header row.');
  }

  return lines
    .slice(1)
    .map((line) => {
      const cells = parseCsvLine(line);
      return Object.fromEntries(
        headers
          .map((header, index) => [header, cells[index]?.trim() ?? ''] as const)
          .filter(([header]) => header.length > 0),
      );
    })
    .filter((row) => Object.values(row).some((value) => value.trim().length > 0));
}

function readFileText(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Import file could not be read.'));
    reader.readAsText(file);
  });
}

async function parseWorkbook(file: File): Promise<ImportRow[]> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Import file has no sheets.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) {
    throw new Error('Import file has no sheets.');
  }
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  });

  return rows
    .map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [normalizeHeader(key), String(value).trim()]),
      ),
    )
    .filter((row) => Object.values(row).some((value) => value.trim().length > 0));
}

export async function parseImportFile(file: File): Promise<ImportRow[]> {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
    return parseWorkbook(file);
  }

  return parseCsv(await readFileText(file));
}
