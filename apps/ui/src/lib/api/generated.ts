// Auto-generated from OpenAPI. Do not edit by hand.
// Source: artifacts/openapi.test.json

export type ApiOperation = {
  method: 'GET';
  path: '/auth/google';
  operationId: 'AuthController_googleLogin';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/auth/google/callback';
  operationId: 'AuthController_googleCallback';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/auth/google/config';
  operationId: 'AuthController_googleConfig';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/auth/me';
  operationId: 'AuthController_me';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/available-pools';
  operationId: 'AvailablePoolsController_list';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/available-pools/jackpot';
  operationId: 'AvailablePoolsController_jackpot';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/fut-pool';
  operationId: 'FutPoolController_getFutPools';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/fut-pool/stats';
  operationId: 'FutPoolController_getStats';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/health';
  operationId: 'HealthController_check';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/metrics';
  operationId: 'MetricsController_getMetrics';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/teams';
  operationId: 'TeamsController_listTeams';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/users';
  operationId: 'UsersController_listUsers';
  responseCodes: ['200'];
} | {
  method: 'PATCH';
  path: '/available-pools/{availablePoolId}/matches/{order}/result';
  operationId: 'AvailablePoolsController_updateMatchResult';
  responseCodes: ['200'];
} | {
  method: 'PATCH';
  path: '/fut-pool-match/{matchId}';
  operationId: 'FutPoolMatchController_update';
  responseCodes: ['200'];
} | {
  method: 'PATCH';
  path: '/fut-pool/{poolId}';
  operationId: 'FutPoolController_updatePool';
  responseCodes: ['200'];
} | {
  method: 'PATCH';
  path: '/users';
  operationId: 'UsersController_updateUser';
  responseCodes: ['200'];
} | {
  method: 'POST';
  path: '/auth/logout';
  operationId: 'AuthController_logout';
  responseCodes: ['201'];
} | {
  method: 'POST';
  path: '/available-pools/{availablePoolId}/add-to-team';
  operationId: 'AvailablePoolsController_addToTeam';
  responseCodes: ['201'];
} | {
  method: 'POST';
  path: '/available-pools/sync';
  operationId: 'AvailablePoolsController_sync';
  responseCodes: ['200'];
} | {
  method: 'POST';
  path: '/available-pools/team-pools/{poolId}/check-results';
  operationId: 'AvailablePoolsController_checkResults';
  responseCodes: ['200'];
} | {
  method: 'POST';
  path: '/fut-pool';
  operationId: 'FutPoolController_createPool';
  responseCodes: ['201'];
} | {
  method: 'POST';
  path: '/logs';
  operationId: 'LogsController_ingest';
  responseCodes: ['201'];
} | {
  method: 'POST';
  path: '/rum/event';
  operationId: 'RumController_ingest';
  responseCodes: ['201'];
} | {
  method: 'POST';
  path: '/teams';
  operationId: 'TeamsController_createTeam';
  responseCodes: ['201'];
} | {
  method: 'POST';
  path: '/teams/{teamId}/accept-invitation';
  operationId: 'TeamsController_acceptInvitation';
  responseCodes: ['201'];
} | {
  method: 'POST';
  path: '/teams/{teamId}/invite';
  operationId: 'TeamsController_inviteUser';
  responseCodes: ['201'];
};

export const API_OPERATION_COUNT = 26 as const;

export const API_OPERATIONS = [
  {
    "method": "GET",
    "path": "/auth/google",
    "operationId": "AuthController_googleLogin",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/auth/google/callback",
    "operationId": "AuthController_googleCallback",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/auth/google/config",
    "operationId": "AuthController_googleConfig",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/auth/me",
    "operationId": "AuthController_me",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/available-pools",
    "operationId": "AvailablePoolsController_list",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/available-pools/jackpot",
    "operationId": "AvailablePoolsController_jackpot",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/fut-pool",
    "operationId": "FutPoolController_getFutPools",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/fut-pool/stats",
    "operationId": "FutPoolController_getStats",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/health",
    "operationId": "HealthController_check",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/metrics",
    "operationId": "MetricsController_getMetrics",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/teams",
    "operationId": "TeamsController_listTeams",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/users",
    "operationId": "UsersController_listUsers",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "PATCH",
    "path": "/available-pools/{availablePoolId}/matches/{order}/result",
    "operationId": "AvailablePoolsController_updateMatchResult",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "PATCH",
    "path": "/fut-pool-match/{matchId}",
    "operationId": "FutPoolMatchController_update",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "PATCH",
    "path": "/fut-pool/{poolId}",
    "operationId": "FutPoolController_updatePool",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "PATCH",
    "path": "/users",
    "operationId": "UsersController_updateUser",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "POST",
    "path": "/auth/logout",
    "operationId": "AuthController_logout",
    "responseCodes": [
      "201"
    ]
  },
  {
    "method": "POST",
    "path": "/available-pools/{availablePoolId}/add-to-team",
    "operationId": "AvailablePoolsController_addToTeam",
    "responseCodes": [
      "201"
    ]
  },
  {
    "method": "POST",
    "path": "/available-pools/sync",
    "operationId": "AvailablePoolsController_sync",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "POST",
    "path": "/available-pools/team-pools/{poolId}/check-results",
    "operationId": "AvailablePoolsController_checkResults",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "POST",
    "path": "/fut-pool",
    "operationId": "FutPoolController_createPool",
    "responseCodes": [
      "201"
    ]
  },
  {
    "method": "POST",
    "path": "/logs",
    "operationId": "LogsController_ingest",
    "responseCodes": [
      "201"
    ]
  },
  {
    "method": "POST",
    "path": "/rum/event",
    "operationId": "RumController_ingest",
    "responseCodes": [
      "201"
    ]
  },
  {
    "method": "POST",
    "path": "/teams",
    "operationId": "TeamsController_createTeam",
    "responseCodes": [
      "201"
    ]
  },
  {
    "method": "POST",
    "path": "/teams/{teamId}/accept-invitation",
    "operationId": "TeamsController_acceptInvitation",
    "responseCodes": [
      "201"
    ]
  },
  {
    "method": "POST",
    "path": "/teams/{teamId}/invite",
    "operationId": "TeamsController_inviteUser",
    "responseCodes": [
      "201"
    ]
  }
] as const;
