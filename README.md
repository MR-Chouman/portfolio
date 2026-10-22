# Portfolio

Personal portfolio of Mohamad Rida Chouman, frontend lead. Static site built with React Router (prerendered), Vite, TypeScript and Tailwind CSS, hosted on Cloudflare Pages.

## Run it locally

Requirements: Node 24 (pinned in `.nvmrc`; run `nvm use`) and npm.

```sh
npm ci            # install dependencies and the Git hooks
npm run dev       # dev server at http://localhost:5173
npm run build     # prerendered static output in build/client
npm run preview   # serve build/client at http://localhost:4173
```

## Test and check

```sh
npm run lint        # ESLint
npm run typecheck   # React Router typegen + tsc
npm run test        # unit tests (Vitest)
npm run test:e2e    # Playwright smoke and axe tests (builds and serves the site itself)
```

The first `test:e2e` run needs a browser: `npx playwright install chromium`.

Git hooks run ESLint and Prettier on staged files, and commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/). CI runs lint, typecheck and build on PRs into `dev`, plus unit tests, Playwright and Lighthouse on PRs into `main`.

## Deployments

| Environment | Branch | URL                                 |
| ----------- | ------ | ----------------------------------- |
| Production  | `main` | https://portfolio-4q6.pages.dev     |
| Staging     | `dev`  | https://dev.portfolio-4q6.pages.dev |

Cloudflare Pages builds `main` to production and `dev` to a preview alias (D-006). Other branches are not built.

## Project docs

- [Requirements](docs/REQUIREMENTS.md)
- [Tasks](docs/TASKS.md)
- [Decisions](docs/DECISIONS.md)
- [Feedback](docs/FEEDBACK.md)

## License

The source code is released under the [MIT License](LICENSE).

The written content (the `content/` folder: biography, case studies and other copy), images, and the CV PDF are © Mohamad Rida Chouman, all rights reserved. They are not covered by the MIT License and may not be reused without permission.
