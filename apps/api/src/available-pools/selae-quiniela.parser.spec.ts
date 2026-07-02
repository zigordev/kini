import {
  extractCompositionMatches,
  extractOfficialResults,
  extractSelaeDate,
  extractSelaeJackpot,
  extractSelaeJornada,
  parseSelaeRss,
} from './selae-quiniela.parser';

describe('SELAE Quiniela parser', () => {
  it('parses the official RSS item and its jackpot metadata', () => {
    const items = parseSelaeRss(`
      <rss><channel><item>
        <title>Bote Jornada 71 de La Quiniela</title>
        <description><![CDATA[El 4 de julio de 2026 se pone en juego un bote de 1.250.000 euros.]]></description>
        <link>https://www.loteriasyapuestas.es/es/la-quiniela/botes/test</link>
        <pubDate>Thu, 26 Jun 2026 08:00:00 GMT</pubDate>
      </item></channel></rss>
    `);

    expect(items).toHaveLength(1);
    expect(extractSelaeJornada(items[0].title)).toBe(71);
    expect(extractSelaeDate(items[0].description)?.toISOString()).toBe(
      '2026-07-04T12:00:00.000Z',
    );
    expect(extractSelaeJackpot(items[0])).toMatchObject({
      value: '1250000',
      formatted: '1.250.000 EUR',
      jornada: 71,
    });
  });

  it('extracts ordered fixtures from an official composition document', () => {
    const matches = extractCompositionMatches(`
      COMPOSICION DE BOLETOS JORNADA 71
      1. Athletic Club - Real Sociedad
      2. R. Oviedo - Osasuna
      14. Granada - Mirandes
      15. Barcelona - Real Madrid
    `);

    expect(matches).toEqual([
      {
        order: 1,
        homeTeam: 'Athletic Club',
        awayTeam: 'Real Sociedad',
        full15: false,
      },
      {
        order: 2,
        homeTeam: 'R. Oviedo',
        awayTeam: 'Osasuna',
        full15: false,
      },
      {
        order: 14,
        homeTeam: 'Granada',
        awayTeam: 'Mirandes',
        full15: false,
      },
      {
        order: 15,
        homeTeam: 'Barcelona',
        awayTeam: 'Real Madrid',
        full15: true,
      },
    ]);
  });

  it('extracts the fourteen signs and pleno al quince result', () => {
    const results = extractOfficialResults(`
      Resultados de La Quiniela
      1 2 3 4 5 6 7 8 9 10 11 12 13 14
      Athletic Club Real Sociedad
      1 X X 2 1 1 X 1 2 1 1 1 1 1
      Pleno al quince
      Barcelona Real Madrid 1 - 1
    `);

    expect(results).toHaveLength(15);
    expect(results.slice(0, 3)).toEqual([['1'], ['X'], ['X']]);
    expect(results[14]).toEqual(['1', '1']);
  });
});
