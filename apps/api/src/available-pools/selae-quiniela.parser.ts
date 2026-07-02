import { XMLParser } from 'fast-xml-parser';
import { AvailablePoolMatch } from './entities/available-pool.entity';

export interface SelaeRssItem {
  title: string;
  description: string;
  link: string | null;
  publishedAt: Date | null;
}

export interface SelaeJackpot {
  value: string;
  formatted: string;
  jornada: number | null;
  drawDate: Date | null;
}

const MONTHS: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

const textValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value && typeof value === 'object' && '#text' in value) {
    return textValue((value as { '#text'?: unknown })['#text']);
  }
  return '';
};

const normalizeAccents = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const htmlToText = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style[\s\S]*?<\/style>/gi, '\n')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&aacute;/gi, 'a')
    .replace(/&eacute;/gi, 'e')
    .replace(/&iacute;/gi, 'i')
    .replace(/&oacute;/gi, 'o')
    .replace(/&uacute;/gi, 'u')
    .replace(/&ntilde;/gi, 'n')
    .replace(/\r/g, '')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

export const parseSelaeRss = (xml: string): SelaeRssItem[] => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    trimValues: true,
  });
  const parsed = parser.parse(xml) as {
    rss?: { channel?: { item?: unknown | unknown[] } };
  };
  const sourceItems = parsed.rss?.channel?.item;
  const items = Array.isArray(sourceItems)
    ? sourceItems
    : sourceItems
      ? [sourceItems]
      : [];

  return items.map((item) => {
    const entry = item as Record<string, unknown>;
    const publishedValue = textValue(entry.pubDate ?? entry.date);
    const publishedAt = publishedValue ? new Date(publishedValue) : null;
    return {
      title: textValue(entry.title),
      description: htmlToText(
        textValue(entry.description ?? entry.encoded ?? entry.content),
      ),
      link: textValue(entry.link) || null,
      publishedAt:
        publishedAt && !Number.isNaN(publishedAt.getTime())
          ? publishedAt
          : null,
    };
  });
};

export const extractSelaeJornada = (value: string): number | null => {
  const match = normalizeAccents(value).match(
    /\bjornada\s*(?:n[.o]?\s*)?(\d{1,3})\b/,
  );
  return match ? Number(match[1]) : null;
};

export const extractSelaeDate = (value: string): Date | null => {
  const iso = value.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (iso) {
    return new Date(
      Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 12),
    );
  }

  const spanish = normalizeAccents(value).match(
    /\b(\d{1,2})\s+de\s+([a-z]+)\s+de\s+(20\d{2})\b/,
  );
  if (!spanish || MONTHS[spanish[2]] === undefined) {
    return null;
  }
  return new Date(
    Date.UTC(Number(spanish[3]), MONTHS[spanish[2]], Number(spanish[1]), 12),
  );
};

export const extractSelaeJackpot = (
  item: SelaeRssItem,
): SelaeJackpot | null => {
  const source = `${item.title}\n${item.description}`;
  const match = source.match(
    /(?:bote[^\d]{0,80})?(\d{1,3}(?:[.\s]\d{3})+(?:,\d{2})?\s*(?:EUR|euros?|\u20ac))/i,
  );
  if (!match) {
    return null;
  }

  return {
    value: match[1].replace(/[^\d]/g, ''),
    formatted: match[1].replace(/\s*(?:EUR|euros?)\b/i, ' EUR').trim(),
    jornada: extractSelaeJornada(source),
    drawDate: extractSelaeDate(source) ?? item.publishedAt,
  };
};

export const extractCompositionMatches = (
  documentText: string,
): AvailablePoolMatch[] => {
  const matchesByOrder = new Map<number, AvailablePoolMatch>();
  const normalized = htmlToText(documentText);
  const pattern =
    /(?:^|\n)\s*(?:partido\s*)?(1[0-5]|[1-9])\s*[.)-]?\s*([^\n]{2,}?)\s+(?:-|vs\.?|\u2013)\s+([^\n]{2,})/gim;
  let match = pattern.exec(normalized);

  while (match) {
    const order = Number(match[1]);
    if (!matchesByOrder.has(order)) {
      matchesByOrder.set(order, {
        order,
        homeTeam: match[2].trim(),
        awayTeam: match[3].trim(),
        full15: order === 15,
      });
    }
    match = pattern.exec(normalized);
  }

  return Array.from(matchesByOrder.values())
    .sort((left, right) => left.order - right.order)
    .slice(0, 15);
};

export const extractOfficialResults = (documentText: string): string[][] => {
  const normalized = htmlToText(documentText);
  const full15Index = normalizeAccents(normalized).search(
    /pleno\s+(?:al\s+)?quince/,
  );
  const beforeFull15 =
    full15Index >= 0 ? normalized.slice(0, full15Index) : normalized;
  const signs = Array.from(beforeFull15.matchAll(/\b([1X2])\b/gi))
    .map((match) => match[1].toUpperCase())
    .slice(-14)
    .map((sign) => [sign]);

  if (signs.length !== 14) {
    return [];
  }

  const full15Source = full15Index >= 0 ? normalized.slice(full15Index) : '';
  const full15 = full15Source.match(/\b([012M])\s*[-:]\s*([012M])\b/i);
  if (full15) {
    signs.push([full15[1].toUpperCase(), full15[2].toUpperCase()]);
  }

  return signs;
};
