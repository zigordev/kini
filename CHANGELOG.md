# Changelog

## [0.7.0](https://github.com/zigordev/kini/compare/kini-v0.6.5...kini-v0.7.0) (2026-09-09)


### Features

* **api:** send RFC 9457 problem details and name resources plurally ([#84](https://github.com/zigordev/kini/issues/84)) ([fcd045e](https://github.com/zigordev/kini/commit/fcd045ef0ddf88fe071bb3b9509bb5ad087522cf))

## [0.6.5](https://github.com/zigordev/kini/compare/kini-v0.6.4...kini-v0.6.5) (2026-09-09)


### Bug Fixes

* **available-pools:** parse the SELAE document instead of stripping tags ([#82](https://github.com/zigordev/kini/issues/82)) ([3ccd887](https://github.com/zigordev/kini/commit/3ccd88785c33f86111b3e03c40aae2c8c6137518))

## [0.6.4](https://github.com/zigordev/kini/compare/kini-v0.6.3...kini-v0.6.4) (2026-09-09)


### Bug Fixes

* **api:** send a content security policy instead of disabling it ([#80](https://github.com/zigordev/kini/issues/80)) ([87dd4a4](https://github.com/zigordev/kini/commit/87dd4a4ea23d7e4a37194db7ff157f5438125c2f))

## [0.6.3](https://github.com/zigordev/kini/compare/kini-v0.6.2...kini-v0.6.3) (2026-09-09)


### Bug Fixes

* **api:** declare the TypeORM line @nestjs/typeorm resolves ([#75](https://github.com/zigordev/kini/issues/75)) ([7cc25b4](https://github.com/zigordev/kini/commit/7cc25b4146a561adba883038aa0e95025ae8809b))

## [0.6.2](https://github.com/zigordev/kini/compare/kini-v0.6.1...kini-v0.6.2) (2026-09-09)


### Bug Fixes

* **deps:** take the patched multer ([#77](https://github.com/zigordev/kini/issues/77)) ([43864bd](https://github.com/zigordev/kini/commit/43864bd3686217caac72d8ccd7206ae3eed9f43d))

## [0.6.1](https://github.com/zigordev/kini/compare/kini-v0.6.0...kini-v0.6.1) (2026-09-08)


### Bug Fixes

* **auth:** keep sessions in Postgres so a restart stops signing everyone out ([#66](https://github.com/zigordev/kini/issues/66)) ([26d19b0](https://github.com/zigordev/kini/commit/26d19b0122ca6051ca2041468efaed61b860383c))

## [0.6.0](https://github.com/zigordev/kini/compare/kini-v0.5.2...kini-v0.6.0) (2026-09-08)


### Features

* **db:** create the schema from a versioned migration ([#64](https://github.com/zigordev/kini/issues/64)) ([0a9dfe6](https://github.com/zigordev/kini/commit/0a9dfe6a692c55311f154c3fef27b44f1c83dbe7))

## [0.5.2](https://github.com/zigordev/kini/compare/kini-v0.5.1...kini-v0.5.2) (2026-09-08)


### Bug Fixes

* **auth:** trust the ingress proxy so the session cookie is set ([#62](https://github.com/zigordev/kini/issues/62)) ([079fc66](https://github.com/zigordev/kini/commit/079fc66beb88640fa687cc056306cb929fff697c))

## [0.5.1](https://github.com/zigordev/kini/compare/kini-v0.5.0...kini-v0.5.1) (2026-09-08)


### Bug Fixes

* **docker:** name kini's production build stage prod ([#60](https://github.com/zigordev/kini/issues/60)) ([8c26179](https://github.com/zigordev/kini/commit/8c261791a3eb31dc4275d64b6aca063aad450155))

## [0.5.0](https://github.com/zigordev/kini/compare/kini-v0.4.0...kini-v0.5.0) (2026-09-08)


### Features

* **auth:** set kini's Google OAuth client id ([#58](https://github.com/zigordev/kini/issues/58)) ([02d8908](https://github.com/zigordev/kini/commit/02d8908d760d7b1e2b549ab4a292395d4bfdc8e7))

## [0.4.0](https://github.com/zigordev/kini/compare/kini-v0.3.0...kini-v0.4.0) (2026-09-08)


### Features

* **deploy:** set the production domains kini deploys behind ([#56](https://github.com/zigordev/kini/issues/56)) ([7961a47](https://github.com/zigordev/kini/commit/7961a474e26497654ebed4050e33b36f36ab9f7d))

## [0.3.0](https://github.com/zigordev/kini/compare/kini-v0.2.0...kini-v0.3.0) (2026-09-07)


### Features

* **docker:** run the api and web under compose watch for local development ([#46](https://github.com/zigordev/kini/issues/46)) ([0cfdf07](https://github.com/zigordev/kini/commit/0cfdf07b20df03eccf5c7ba1d398ee2ea1265e74))

## [0.2.0](https://github.com/zigordev/kini/compare/kini-v0.1.0...kini-v0.2.0) (2026-09-06)


### Features

* add native mobile controls ([7364bc6](https://github.com/zigordev/kini/commit/7364bc6927ea70926f83842ef3572d5c0ef324dd))
* adopt design-system form primitives in create-pool ([dc2039c](https://github.com/zigordev/kini/commit/dc2039c52b712d96679654627c7ed67c7d910469))
* adopt shared design-system navigation ([6eb2de9](https://github.com/zigordev/kini/commit/6eb2de9306e3cfff2cd648944f3999e612013203))
* **deploy:** add production deploy pipeline (EC2 via SSM) ([#22](https://github.com/zigordev/kini/issues/22)) ([804757d](https://github.com/zigordev/kini/commit/804757d4151068613be65caf943f67c1c44ced59))
* design system nav ([b4ea2f5](https://github.com/zigordev/kini/commit/b4ea2f58c8cb82f62962b43c10185b2dbd0b6e35))
* dev-only design-system preview, fix balance tile signalling ([1c97625](https://github.com/zigordev/kini/commit/1c97625a96ac68a16a7c4f37490d969e1b1c6b5a))
* first commit ([5ca3933](https://github.com/zigordev/kini/commit/5ca3933ad00b0b0609a0417a89d150369811f50b))
* **health:** add a health endpoint that probes the database ([e8063c4](https://github.com/zigordev/kini/commit/e8063c4eb06bfe88592e475688e07178287a0324))
* migrate Kini to a web-only application ([012fe1f](https://github.com/zigordev/kini/commit/012fe1f8561623f65ca30ca6c06d4b17e53ed444))
* move login screen onto design-system AuthShell/AuthCard ([470134a](https://github.com/zigordev/kini/commit/470134aba8db8533d583e5e1d5d6bb48ad7efed8))
* **observability:** converge on the shared health/metrics/tracing kit ([c73e826](https://github.com/zigordev/kini/commit/c73e826ad1c88d524a383065faaf888b3fd0826b))
* real flags + log-out icon, show toggle on login screen ([7b5f661](https://github.com/zigordev/kini/commit/7b5f661c4ffd597d02f702f68936f5b86f5e2145))
* replace unicode/emoji nav and topbar icons with design-system Icon ([36e9e06](https://github.com/zigordev/kini/commit/36e9e06cf6122ecd0f79b07f628738825c2d6767))
* **security:** set security headers and enable Dependabot ([94a74dd](https://github.com/zigordev/kini/commit/94a74dd045fde068e36f18aa55e74943ed443437))
* **ui:** consume design-system as a package instead of vendoring it ([#26](https://github.com/zigordev/kini/issues/26)) ([443c24c](https://github.com/zigordev/kini/commit/443c24c92f6da55e0768c39c96498ea9c2956e7d))
* **ui:** render the quiniela match lists as real tables ([fa47890](https://github.com/zigordev/kini/commit/fa478904c67249e0f0c282763528d3f1d34ef109))
* unify topbar (theme/language/user, no avatar), Settings page ([76339b6](https://github.com/zigordev/kini/commit/76339b658b098049ca1fb41dc32b8ba0a1e8f5c9))


### Bug Fixes

* **a11y:** raise fg-subtle/fg-faint contrast to WCAG AA ([d73cdf9](https://github.com/zigordev/kini/commit/d73cdf94bb56e242bf03bd7db4cb12b7568031dd))
* **api:** migrate listUsers' select to typeorm 1.x's FindOptionsSelect shape ([8b55dbd](https://github.com/zigordev/kini/commit/8b55dbd1b695940ebbb72d8882fe80636c2ad1d9))
* **api:** migrate SELAE PDF parsing to pdf-parse 2.x's class API ([1482c51](https://github.com/zigordev/kini/commit/1482c51de63ccf99bc0c949fbc400546fd3e8bd0))
* **ci:** correct the codeql-action SHA pin, it didn't resolve to a commit ([36270f1](https://github.com/zigordev/kini/commit/36270f17db9184a799848c510a1187bc7c5e6943))
* **ci:** drop Jest-only flags from the post-Vitest-migration test:cov:api script ([89d5239](https://github.com/zigordev/kini/commit/89d52391be70d82efe88500141070184c12e2367))
* **ci:** merge with a PAT so push-triggered workflows still run ([#27](https://github.com/zigordev/kini/issues/27)) ([b58b675](https://github.com/zigordev/kini/commit/b58b6752699461757aa32b046d69bf163fce50db))
* **ci:** raise commitlint header-max-length to fit Dependabot titles ([fdf114d](https://github.com/zigordev/kini/commit/fdf114d3111650bc3dfa4e261c914155de11fce5))
* **ci:** retry npm audit on transient registry failures ([4a4dd16](https://github.com/zigordev/kini/commit/4a4dd1622c56cb1bb8a0dd12e3e7c370be25f243))
* **ci:** skip CodeQL gracefully on this private repo, like every other one ([524a315](https://github.com/zigordev/kini/commit/524a31586388287f4d4bd273ab3f0d7dcfae1567))
* **ci:** stop format:check from failing on generated CHANGELOG.md ([354eee6](https://github.com/zigordev/kini/commit/354eee6304e451e4c6c2564a1c812db61213da32))
* create-pool returns where you came from, and guards unsaved work ([9eab3d1](https://github.com/zigordev/kini/commit/9eab3d15b4738def1fde1bffd22c418ff5bf0a36))
* handle Google OAuth callback failures ([fd82870](https://github.com/zigordev/kini/commit/fd828700210ae724594b14dba9c50eb45364043b))
* **lint:** migrate api and ui to ESLint flat config ([8609575](https://github.com/zigordev/kini/commit/8609575c342de3f7f772f18d63a5041eda2f378a))
* **security:** strip the bundled npm CLI and patch Alpine at build time ([70f6934](https://github.com/zigordev/kini/commit/70f6934bd26676e8a3ec10f7c6500c5f31c8d38f))
* **security:** strip the bundled npm/yarn CLI from the web image too ([9252f38](https://github.com/zigordev/kini/commit/9252f38c2c0776e78b45b65a6f68266417fcda72))
* stop double-padding the content area ([cd4b65b](https://github.com/zigordev/kini/commit/cd4b65be63528bc94219779d0ebdd2459ddc8ea1))
* sync Topbar to design-system v0.1.14 (tabs merged into main row) ([557278d](https://github.com/zigordev/kini/commit/557278d43ffc38ec060111a7ee2b477b7883f724))
* sync Topbar to design-system v0.1.8 (divider alignment fix) ([1bb949c](https://github.com/zigordev/kini/commit/1bb949ce8fc894fe693e7a7b4b37e114cb574dbc))
* sync Topbar to v0.1.5 (mobile wrap fix refinement) ([14777f1](https://github.com/zigordev/kini/commit/14777f11d5006c5cba7bff6562f4e810ebc3070d))
* unify favicon with the circular Logo mark ([19da395](https://github.com/zigordev/kini/commit/19da395d94dea91db32d591b1d97c5a88f1317f6))
* update vendored design-system to v0.1.3, drop local workaround ([b36f0d4](https://github.com/zigordev/kini/commit/b36f0d4803edc7f4b8b711080b44ec3efe77efe3))
* update vendored design-system to v0.1.4, use next/link for nav ([762408c](https://github.com/zigordev/kini/commit/762408c33ca394e80ab0c1a99e9cd47fc6fbc2d4))
* use IPv4 for web health check ([bd7cc23](https://github.com/zigordev/kini/commit/bd7cc23888ae1830597bc6cfe82a5d10882810c9))

## Changelog

All notable changes to this project will be managed by Release Please.
