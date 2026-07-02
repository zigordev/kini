import {
  extractEduardoLosillaPoolFromJornada,
  extractEduardoLosillaPools,
} from './eduardo-losilla-quiniela.parser';

describe('Eduardo Losilla Quiniela parser', () => {
  it('extracts fixtures, official signs and an actual jackpot from page state', () => {
    const matches = Array.from({ length: 15 }, (_, index) => ({
      orden: index + 1,
      local: `Home ${index + 1}`,
      visitante: `Away ${index + 1}`,
      resultado: index === 14 ? '3-1' : index % 2 === 0 ? '2-0' : '1-1',
      fecha: 1782500400 + index * 3600,
    }));
    const state = {
      datosGeneralesQuiniela: {
        jornada: 71,
        temporada: 2026,
        fechaJornada: 1782424800,
        fechaFinApuestas: 1782410400,
      },
      jornada_71_2026: {
        jornada: 71,
        temporada: 2026,
        fechaFinApuestas: 1782410400,
        boteData: { bote: 125000 },
        partidos: matches,
      },
    };
    const html = `<script id="eduardo-losilla-state" type="application/json">${JSON.stringify(
      state,
    ).replaceAll('"', '&q;')}</script>`;

    const [pool] = extractEduardoLosillaPools(html);

    expect(pool).toMatchObject({
      jornada: 71,
      season: 2026,
      jackpot: '125000',
      jackpotFormatted: '125.000 EUR',
      completed: true,
    });
    expect(pool.matches).toHaveLength(15);
    expect(pool.matches[0].officialResults).toEqual(['1']);
    expect(pool.matches[1].officialResults).toEqual(['X']);
    expect(pool.matches[14].officialResults).toEqual(['M', '1']);
  });

  it('uses Losilla textoBote when the official bote value is not published', () => {
    const matches = Array.from({ length: 15 }, (_, index) => ({
      orden: index + 1,
      local: `Home ${index + 1}`,
      visitante: `Away ${index + 1}`,
      resultado: 'null-null',
      fecha: 1782500400 + index * 3600,
    }));
    const state = {
      datosGeneralesQuiniela: {
        jornada: 71,
        temporada: 2026,
        fechaJornada: 1782424800,
        fechaFinApuestas: 1782410400,
      },
      jornada_71_2026: {
        jornada: 71,
        temporada: 2026,
        fechaFinApuestas: 1782410400,
        textoBote: '282000',
        boteData: { bote: 0.001, unico_acertante: 282000 },
        partidos: matches,
      },
    };
    const html = `<script id="eduardo-losilla-state" type="application/json">${JSON.stringify(
      state,
    ).replaceAll('"', '&q;')}</script>`;

    const [pool] = extractEduardoLosillaPools(html);

    expect(pool).toMatchObject({
      jackpot: '282000',
      jackpotFormatted: '282.000 EUR',
      completed: false,
    });
  });

  it('extracts partial official results from direct jornada API payloads', () => {
    const matches = Array.from({ length: 15 }, (_, index) => ({
      orden: index + 1,
      local: `Home ${index + 1}`,
      visitante: `Away ${index + 1}`,
      resultado: index < 9 || index === 14 ? '1-0' : 'null-null',
      fecha: 1782500400 + index * 3600,
    }));

    const pool = extractEduardoLosillaPoolFromJornada({
      jornada: 70,
      temporada: 2026,
      fechaFinApuestas: 1782410400,
      textoBote: '282000',
      partidos: matches,
    });

    expect(pool).toMatchObject({
      jornada: 70,
      season: 2026,
      jackpotFormatted: '282.000 EUR',
      completed: false,
    });
    expect(pool?.matches).toHaveLength(15);
    expect(
      pool?.matches.filter((match) => match.officialResults?.length),
    ).toHaveLength(10);
    expect(pool?.matches[9].officialResults).toEqual([]);
    expect(pool?.matches[14].officialResults).toEqual(['1', '0']);
  });
});
