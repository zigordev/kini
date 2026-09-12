import {
  extractCompositionMatches,
  extractOfficialResults,
  extractSelaeDate,
  extractSelaeJackpot,
  extractSelaeJornada,
  htmlToText,
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
    expect(extractSelaeDate(items[0].description)?.toISOString()).toBe('2026-07-04T12:00:00.000Z');
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

describe('htmlToText', () => {
  it('strips a script whose end tag carries whitespace', () => {
    const text = htmlToText(
      '<p>Real Madrid - Barcelona</p><script >leaked()</script ><p>Sevilla - Betis</p>'
    );

    expect(text).not.toContain('leaked()');
    expect(text).toContain('Real Madrid - Barcelona');
  });

  it('ignores a greater-than sign inside an attribute', () => {
    const text = htmlToText('<p title="a > b">Valencia - Osasuna</p>');

    expect(text).toBe('Valencia - Osasuna');
  });

  it('drops comments rather than emitting their contents', () => {
    const text = htmlToText('<div><!-- Girona - Elche --><p>Cadiz - Getafe</p></div>');

    expect(text).not.toContain('Girona');
    expect(text).toContain('Cadiz - Getafe');
  });

  it('unescapes an entity exactly once', () => {
    expect(htmlToText('<p>&amp;quot;</p>')).toBe('&quot;');
    expect(htmlToText('<p>&amp;amp;</p>')).toBe('&amp;');
    expect(htmlToText('<p>Elche &amp; Levante</p>')).toBe('Elche & Levante');
  });

  it('turns a non-breaking space into a plain space', () => {
    expect(htmlToText('<p>Rayo&nbsp;Vallecano</p>')).toBe('Rayo Vallecano');
  });

  it('decodes accented entities to their characters', () => {
    expect(htmlToText('<p>Alav&eacute;s - Legan&eacute;s</p>')).toBe('Alavés - Leganés');
  });

  it('breaks lines at element boundaries so fixtures stay separated', () => {
    const matches = extractCompositionMatches(
      '<ul><li>1 Real Madrid - Barcelona</li><li>2 Sevilla - Betis</li></ul>'
    );

    expect(matches).toEqual([
      {
        order: 1,
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        full15: false,
      },
      { order: 2, homeTeam: 'Sevilla', awayTeam: 'Betis', full15: false },
    ]);
  });
});
