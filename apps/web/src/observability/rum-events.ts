import { trackEvent } from './rum-client';

export const RUM_INTERACTIONS = [
  'sign-in-started',
  'team-created',
  'team-switched',
  'invitation-sent',
  'invitation-accepted',
  'invitation-accept-failed',
  'pool-created',
  'pool-create-failed',
  'available-pools-synced',
  'available-pool-added',
  'results-checked',
  'match-result-set',
  'match-assigned',
  'language-switched',
] as const;

export type RumInteraction = (typeof RUM_INTERACTIONS)[number];

export function trackInteraction(name: RumInteraction): void {
  trackEvent(name);
}
