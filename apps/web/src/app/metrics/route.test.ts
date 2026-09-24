import { describe, expect, it } from 'vitest';

import { GET } from './route';

describe('GET /metrics', () => {
  it('answers in OpenMetrics, the format that carries exemplars', async () => {
    const response = await GET();
    const body = await response.text();

    expect(response.headers.get('content-type')).toContain('application/openmetrics-text');
    expect(body).toContain('service_build_info');
    expect(body).toContain('kini_i18n_messages_total{source="local"} 0');
    expect(body.trimEnd().endsWith('# EOF')).toBe(true);
  });
});
