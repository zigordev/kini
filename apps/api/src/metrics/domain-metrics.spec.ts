import { describe, expect, it } from 'vitest';
import { registry } from '../observability';
import {
  countNotification,
  countSyncProblem,
  countSyncRun,
  countWebsocketAccepted,
  countWebsocketRejected,
  NOTIFICATION_OUTCOMES,
  NOTIFICATION_TEMPLATES,
  startDomainMetricsAtZero,
  SYNC_OUTCOMES,
  SYNC_PROBLEMS,
  SYNC_SOURCES,
  WEBSOCKET_REJECTIONS,
  websocketConnected,
  websocketDisconnected,
} from './domain-metrics';

describe('kini domain metrics', () => {
  it('exist at zero for every outcome, source and template before the first one happens', async () => {
    startDomainMetricsAtZero();
    const text = await registry.metrics();

    for (const outcome of SYNC_OUTCOMES) {
      expect(text).toContain(`kini_pools_sync_runs_total{outcome="${outcome}"} 0`);
    }
    for (const source of SYNC_SOURCES) {
      for (const problem of SYNC_PROBLEMS) {
        expect(text).toContain(
          `kini_pools_sync_problems_total{source="${source}",problem="${problem}"} 0`
        );
      }
    }
    for (const template of NOTIFICATION_TEMPLATES) {
      for (const outcome of NOTIFICATION_OUTCOMES) {
        expect(text).toContain(
          `kini_notifications_total{template="${template}",outcome="${outcome}"} 0`
        );
      }
    }
    expect(text).toContain('kini_websocket_connections_total{outcome="accepted",reason="none"} 0');
    for (const reason of WEBSOCKET_REJECTIONS) {
      expect(text).toContain(
        `kini_websocket_connections_total{outcome="rejected",reason="${reason}"} 0`
      );
    }
    expect(text).toContain('kini_websocket_clients 0');
  });

  it('counts on top of the zero and follows connected clients', async () => {
    startDomainMetricsAtZero();
    countSyncRun('completed');
    countSyncProblem('selae_results', 'empty');
    countNotification('kini.team-invitation', 'queued');
    websocketConnected();
    websocketConnected();
    websocketDisconnected();
    countWebsocketAccepted();
    countWebsocketRejected('no_session');
    const text = await registry.metrics();

    expect(text).toContain('kini_pools_sync_runs_total{outcome="completed"} 1');
    expect(text).toContain(
      'kini_pools_sync_problems_total{source="selae_results",problem="empty"} 1'
    );
    expect(text).toContain(
      'kini_notifications_total{template="kini.team-invitation",outcome="queued"} 1'
    );
    expect(text).toContain('kini_websocket_clients 1');
    expect(text).toContain('kini_websocket_connections_total{outcome="accepted",reason="none"} 1');
    expect(text).toContain(
      'kini_websocket_connections_total{outcome="rejected",reason="no_session"} 1'
    );
  });
});
