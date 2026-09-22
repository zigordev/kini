import { withRouteMetrics } from '@/observability/http-metrics';
import { createRumIngestRoute } from '@/observability/next';
import { RUM_INTERACTIONS } from '@/observability/rum-events';
import { RUM_PAGES } from '@/observability/rum-pages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withRouteMetrics(
  '/rum/events',
  createRumIngestRoute({ customInteractions: RUM_INTERACTIONS, pages: RUM_PAGES })
);
