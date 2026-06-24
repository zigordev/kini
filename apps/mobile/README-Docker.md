# Kini Mobile Docker Development

The mobile app is run through the root compose stack.

```bash
npm run local:up
```

This starts:

- API: `http://localhost:3012`
- Expo web entry: `http://localhost:19006`
- Metro ports: `19000`, `19001`, `19002`

The first run creates `docker/.env.app.local` from `docker/.env.app.local.example` and exits. Fill in the OAuth/session/Tolgee values, then rerun `npm run local:up`.

Stop the stack with:

```bash
npm run local:down
```

Reset containers and volumes with:

```bash
npm run local:reset
```
