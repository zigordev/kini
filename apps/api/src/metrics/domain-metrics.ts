import { Counter, Gauge } from 'prom-client';
import { registry, startAtZero } from '../observability';

export const SYNC_SOURCES = [
  'all',
  'eduardo_losilla',
  'eduardo_losilla_api',
  'selae_composition',
  'selae_notices',
  'selae_jackpots',
  'selae_results',
] as const;
export type SyncSource = (typeof SYNC_SOURCES)[number];

export const SYNC_PROBLEMS = ['failed', 'empty', 'unmapped'] as const;
export type SyncProblem = (typeof SYNC_PROBLEMS)[number];

export const SYNC_OUTCOMES = ['completed', 'failed'] as const;
export type SyncOutcome = (typeof SYNC_OUTCOMES)[number];

export const NOTIFICATION_TEMPLATES = ['kini.team-invitation'] as const;
export const NOTIFICATION_OUTCOMES = ['queued', 'failed'] as const;
export type NotificationOutcome = (typeof NOTIFICATION_OUTCOMES)[number];

export const WEBSOCKET_REJECTIONS = ['no_session', 'bad_origin'] as const;
export type WebsocketRejection = (typeof WEBSOCKET_REJECTIONS)[number];

const syncRuns = new Counter({
  name: 'kini_pools_sync_runs_total',
  help: 'Scheduled syncs of the available pools, by outcome',
  labelNames: ['outcome'] as const,
  registers: [registry],
});

const syncProblems = new Counter({
  name: 'kini_pools_sync_problems_total',
  help: 'Problems syncing the available pools, by source and kind',
  labelNames: ['source', 'problem'] as const,
  registers: [registry],
});

const notifications = new Counter({
  name: 'kini_notifications_total',
  help: 'Emails kini asked notifications to send, by template and outcome',
  labelNames: ['template', 'outcome'] as const,
  registers: [registry],
});

const websocketConnections = new Counter({
  name: 'kini_websocket_connections_total',
  help: 'WebSocket connection attempts, by outcome and the reason a refused one was refused',
  labelNames: ['outcome', 'reason'] as const,
  registers: [registry],
});

const websocketClients = new Gauge({
  name: 'kini_websocket_clients',
  help: 'WebSocket clients connected now',
  registers: [registry],
});

export function startDomainMetricsAtZero(): void {
  startAtZero(
    syncRuns,
    SYNC_OUTCOMES.map((outcome) => ({ outcome }))
  );
  startAtZero(
    syncProblems,
    SYNC_SOURCES.flatMap((source) => SYNC_PROBLEMS.map((problem) => ({ source, problem })))
  );
  startAtZero(
    notifications,
    NOTIFICATION_TEMPLATES.flatMap((template) =>
      NOTIFICATION_OUTCOMES.map((outcome) => ({ template, outcome }))
    )
  );
  startAtZero(websocketConnections, [
    { outcome: 'accepted', reason: 'none' },
    ...WEBSOCKET_REJECTIONS.map((reason) => ({ outcome: 'rejected', reason })),
  ]);
  websocketClients.set(0);
}

export function countSyncRun(outcome: SyncOutcome): void {
  syncRuns.inc({ outcome });
}

export function countSyncProblem(source: SyncSource, problem: SyncProblem): void {
  syncProblems.inc({ source, problem });
}

export function countNotification(template: string, outcome: NotificationOutcome): void {
  notifications.inc({ template, outcome });
}

export function countWebsocketAccepted(): void {
  websocketConnections.inc({ outcome: 'accepted', reason: 'none' });
}

export function countWebsocketRejected(reason: WebsocketRejection): void {
  websocketConnections.inc({ outcome: 'rejected', reason });
}

export function websocketConnected(): void {
  websocketClients.inc();
}

export function websocketDisconnected(): void {
  websocketClients.dec();
}
