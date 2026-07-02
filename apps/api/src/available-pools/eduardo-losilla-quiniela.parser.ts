import { AvailablePoolMatch } from './entities/available-pool.entity';

interface LosillaMatch {
  orden?: number;
  local?: string;
  visitante?: string;
  resultado?: string;
  fecha?: number;
}

interface LosillaJornada {
  jornada?: number;
  temporada?: number;
  fechaFinApuestas?: number;
  textoBote?: string;
  bote?: number;
  boteData?: { bote?: number; unico_acertante?: number };
  partidos?: LosillaMatch[];
}

interface LosillaState {
  datosGeneralesQuiniela?: {
    jornada?: number;
    temporada?: number;
    fechaJornada?: number;
    fechaFinApuestas?: number;
  };
  [key: string]: unknown;
}

export interface EduardoLosillaPool {
  jornada: number;
  season: number | null;
  drawDate: Date;
  closingDate: Date | null;
  matches: AvailablePoolMatch[];
  completed: boolean;
  jackpot: string | null;
  jackpotFormatted: string | null;
}

const fromUnixSeconds = (value: unknown): Date | null => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return new Date(value * 1000);
};

const toQuinielaSign = (score: string): string[] => {
  const match = score.match(/^(\d+)-(\d+)$/);
  if (!match) {
    return [];
  }
  const home = Number(match[1]);
  const away = Number(match[2]);
  return [home === away ? 'X' : home > away ? '1' : '2'];
};

const toFull15Result = (score: string): string[] => {
  const match = score.match(/^(\d+)-(\d+)$/);
  if (!match) {
    return [];
  }
  const toMark = (value: string): string => {
    const goals = Number(value);
    return goals > 2 ? 'M' : String(goals);
  };
  return [toMark(match[1]), toMark(match[2])];
};

const decodeState = (html: string): LosillaState | null => {
  const state = html.match(
    /<script id="eduardo-losilla-state" type="application\/json">([\s\S]*?)<\/script>/i,
  );
  if (!state) {
    return null;
  }

  try {
    return JSON.parse(
      state[1]
        .replaceAll('&q;', '"')
        .replaceAll('&l;', '<')
        .replaceAll('&g;', '>')
        .replaceAll('&a;', '&'),
    ) as LosillaState;
  } catch {
    return null;
  }
};

const formatEuro = (value: number): string =>
  `${new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value)} EUR`;

const parseAmount = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 1 ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value
    .trim()
    .replace(/[^\d.,-]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount >= 1 ? amount : null;
};

const extractJackpotValue = (jornada: LosillaJornada): number | null =>
  parseAmount(jornada.boteData?.bote) ??
  parseAmount(jornada.bote) ??
  parseAmount(jornada.textoBote) ??
  parseAmount(jornada.boteData?.unico_acertante);

export const extractEduardoLosillaPoolFromJornada = (
  source: unknown,
  current?: LosillaState['datosGeneralesQuiniela'],
): EduardoLosillaPool | null => {
  if (!source || typeof source !== 'object') {
    return null;
  }
  const jornada = source as LosillaJornada;
  if (!jornada.jornada || !Array.isArray(jornada.partidos)) {
    return null;
  }

  const matches = jornada.partidos
    .map((match, index) => {
      const order = Number(match.orden ?? index + 1);
      const full15 = order === 15;
      const score = String(match.resultado ?? '');
      const officialResults = full15
        ? toFull15Result(score)
        : toQuinielaSign(score);
      return {
        order,
        homeTeam: String(match.local ?? '').trim(),
        awayTeam: String(match.visitante ?? '').trim(),
        full15,
        officialResults,
      };
    })
    .filter((match) => match.order >= 1 && match.order <= 15)
    .sort((left, right) => left.order - right.order);
  if (
    matches.length !== 15 ||
    matches.some((match) => !match.homeTeam || !match.awayTeam)
  ) {
    return null;
  }

  const matchDates = jornada.partidos
    .map((match) => fromUnixSeconds(match.fecha))
    .filter((date): date is Date => date !== null)
    .sort((left, right) => left.getTime() - right.getTime());
  const drawDate =
    (current?.jornada === jornada.jornada
      ? fromUnixSeconds(current.fechaJornada)
      : null) ?? matchDates[0];
  if (!drawDate) {
    return null;
  }
  const closingDate =
    fromUnixSeconds(jornada.fechaFinApuestas) ??
    (current?.jornada === jornada.jornada
      ? fromUnixSeconds(current.fechaFinApuestas)
      : null);
  const completed = matches.every((match) =>
    Boolean(match.officialResults?.length),
  );
  const jackpotValue = extractJackpotValue(jornada);

  return {
    jornada: jornada.jornada,
    season: jornada.temporada ?? current?.temporada ?? null,
    drawDate,
    closingDate,
    matches,
    completed,
    jackpot: jackpotValue !== null ? String(jackpotValue) : null,
    jackpotFormatted: jackpotValue !== null ? formatEuro(jackpotValue) : null,
  };
};

export const extractEduardoLosillaPools = (
  html: string,
): EduardoLosillaPool[] => {
  const state = decodeState(html);
  if (!state) {
    return [];
  }

  const current = state.datosGeneralesQuiniela;
  const pools = new Map<number, EduardoLosillaPool>();
  for (const [key, value] of Object.entries(state)) {
    if (!/^jornada_\d+_\d+$/.test(key) || !value || typeof value !== 'object') {
      continue;
    }
    const pool = extractEduardoLosillaPoolFromJornada(value, current);
    if (!pool) {
      continue;
    }

    pools.set(pool.jornada, pool);
  }

  return Array.from(pools.values()).sort(
    (left, right) => left.drawDate.getTime() - right.drawDate.getTime(),
  );
};
