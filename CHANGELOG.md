# Changelog

## [0.2.0](https://github.com/zigordev/kini/compare/kini-v0.1.0...kini-v0.2.0) (2026-09-04)


### Features

* add native mobile controls ([b1eac36](https://github.com/zigordev/kini/commit/b1eac36b10a9a4b6139c6c2753c415ae2f4ac0a5))
* adopt design-system form primitives in create-pool ([c07c49d](https://github.com/zigordev/kini/commit/c07c49d726e6072284e02e5f0322e25623b6174f))
* adopt shared design-system navigation ([1b5c0f8](https://github.com/zigordev/kini/commit/1b5c0f85de558083f641a41be3d3a53fd3c8109b))
* design system nav ([7970cd5](https://github.com/zigordev/kini/commit/7970cd5ba9ff6d2bb3036ea4a936c3fb3e95e05a))
* dev-only design-system preview, fix balance tile signalling ([afc7e23](https://github.com/zigordev/kini/commit/afc7e23609f1afa232de976d9e4856a35d2eedc5))
* first commit ([7c21f6e](https://github.com/zigordev/kini/commit/7c21f6e061e6a440da4d1a7dfac2b898459c7957))
* **health:** add a health endpoint that probes the database ([1a02b8b](https://github.com/zigordev/kini/commit/1a02b8b8b25cf8f035364d7be3260b834311173c))
* migrate Kini to a web-only application ([3d74491](https://github.com/zigordev/kini/commit/3d74491d6d836a4ff73ceca0be320d8310cbeed5))
* move login screen onto design-system AuthShell/AuthCard ([becf1bb](https://github.com/zigordev/kini/commit/becf1bb64a7ea379004fe2ceae878234816023bb))
* **observability:** converge on the shared health/metrics/tracing kit ([0cb4e82](https://github.com/zigordev/kini/commit/0cb4e82b5b42eddc2b3d0aa1a9e3e03edd5ca70c))
* real flags + log-out icon, show toggle on login screen ([b7f2b53](https://github.com/zigordev/kini/commit/b7f2b53001517c670163b46aa81142e3c52c8ac2))
* replace unicode/emoji nav and topbar icons with design-system Icon ([3a21990](https://github.com/zigordev/kini/commit/3a219905692cc8457b7b8f10d8487e50d99ca127))
* **security:** set security headers and enable Dependabot ([2323fbc](https://github.com/zigordev/kini/commit/2323fbca190acf4ab3be2ce6cda57e2e656ab1b5))
* **ui:** render the quiniela match lists as real tables ([6a07761](https://github.com/zigordev/kini/commit/6a07761639f968905b711340d9e6f694f1148110))
* unify topbar (theme/language/user, no avatar), Settings page ([59df62c](https://github.com/zigordev/kini/commit/59df62c9eb23c5931025c456f356784579fe7a56))


### Bug Fixes

* **a11y:** raise fg-subtle/fg-faint contrast to WCAG AA ([fcc7587](https://github.com/zigordev/kini/commit/fcc7587d03297b31ad5f835cc47ac3ade5ff74f2))
* **api:** migrate listUsers' select to typeorm 1.x's FindOptionsSelect shape ([18bd28b](https://github.com/zigordev/kini/commit/18bd28b5fe944554c2194bb105ef1e1043e0c7f4))
* **api:** migrate SELAE PDF parsing to pdf-parse 2.x's class API ([e8c9493](https://github.com/zigordev/kini/commit/e8c949310c5ad763ea35a27c7ddf345fb8aca853))
* **ci:** correct the codeql-action SHA pin, it didn't resolve to a commit ([8a0fb4d](https://github.com/zigordev/kini/commit/8a0fb4d79304bacb647a1318a7fffbbe709ffc48))
* **ci:** drop Jest-only flags from the post-Vitest-migration test:cov:api script ([3542bb5](https://github.com/zigordev/kini/commit/3542bb5b6ee1fa2e4512d31cd580330b704e06dc))
* **ci:** raise commitlint header-max-length to fit Dependabot titles ([d9ca351](https://github.com/zigordev/kini/commit/d9ca3510215573c88f9457a3784b05062c56115e))
* **ci:** retry npm audit on transient registry failures ([42c03e8](https://github.com/zigordev/kini/commit/42c03e84bee34e13f3e5b0d2618a1f678c62ffd9))
* **ci:** skip CodeQL gracefully on this private repo, like every other one ([47f6bab](https://github.com/zigordev/kini/commit/47f6babad6320af262967a9fa62be9ab171e2582))
* **ci:** stop format:check from failing on generated CHANGELOG.md ([753843e](https://github.com/zigordev/kini/commit/753843e57d51796798936e09970bffec9cb3fe21))
* create-pool returns where you came from, and guards unsaved work ([4a094af](https://github.com/zigordev/kini/commit/4a094af08a6a9d1fd90a1f5e0224429df792c594))
* handle Google OAuth callback failures ([af116bc](https://github.com/zigordev/kini/commit/af116bcae24bbfd0af4956bb2152733c690008ab))
* **lint:** migrate api and ui to ESLint flat config ([ec7b66d](https://github.com/zigordev/kini/commit/ec7b66ddda425316a9f307c2227654b935ac7232))
* **security:** strip the bundled npm CLI and patch Alpine at build time ([f164db7](https://github.com/zigordev/kini/commit/f164db7c87605ad65a9f9d96e0e5a335d55a04cf))
* **security:** strip the bundled npm/yarn CLI from the web image too ([06f8f5e](https://github.com/zigordev/kini/commit/06f8f5e050d2c0f50407332c141ea1336f5a7585))
* stop double-padding the content area ([b404281](https://github.com/zigordev/kini/commit/b4042818d96dd6b090fc612d0c8e8bda9138c553))
* sync Topbar to design-system v0.1.14 (tabs merged into main row) ([ba26760](https://github.com/zigordev/kini/commit/ba26760fc84ea8eb97f7884a4432f585e4a1419e))
* sync Topbar to design-system v0.1.8 (divider alignment fix) ([a26b739](https://github.com/zigordev/kini/commit/a26b73999d8367141fa234c2921fe330188fe451))
* sync Topbar to v0.1.5 (mobile wrap fix refinement) ([c01b194](https://github.com/zigordev/kini/commit/c01b194f7deb205c29def3b03176d9b322503d75))
* unify favicon with the circular Logo mark ([ab9debe](https://github.com/zigordev/kini/commit/ab9debe838b16d77cdb2a65b78235461fcd56783))
* update vendored design-system to v0.1.3, drop local workaround ([c154c38](https://github.com/zigordev/kini/commit/c154c3897bfda7e1bc11a6ec55fa508f2244a847))
* update vendored design-system to v0.1.4, use next/link for nav ([a698bea](https://github.com/zigordev/kini/commit/a698beab244f07167b2b8d66f227e844e855c41b))
* use IPv4 for web health check ([59882a5](https://github.com/zigordev/kini/commit/59882a55703b2f1afa0af74ee5e9a7b797c4a013))

## Changelog

All notable changes to this project will be managed by Release Please.
