# Light of Landour

A content-driven website for Light of Landour, a Himalayan sanctuary in Landour, Mussoorie. The site includes pages for accommodation, dining, wellness, retreats, and contact information.

## Tech stack

- React 19
- Vinext and Vite
- TypeScript
- Tailwind CSS
- Cloudflare Vite plugin and Wrangler
- JSON-based page content

## Requirements

- Node.js `22.13.0` or newer
- npm

Check your installed versions with:

```bash
node --version
npm --version
```

## Getting started

The application is inside the `website` directory.

```bash
cd website
npm install
npm run dev
```

Open the local URL shown in the terminal, usually [http://localhost:5173](http://localhost:5173).

The development server supports hot reload while you edit the React components, styles, and JSON content.

## Available commands

Run these commands from `website/`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the built app with Wrangler locally |
| `npm run lint` | Check the project with Oxlint |
| `npm run format` | Format the project with Oxfmt |

To test the production build locally:

```bash
cd website
npm run build
npm run start
```

## Site routes

| Route | Purpose |
| --- | --- |
| `/` | Home page and Himalayan sanctuary overview |
| `/about` | About the sanctuary |
| `/mudra` | Mudra rooms and duplex suites |
| `/chakra` | Chakra rooms and suites |
| `/element` | Element rooms and courtyard cottages |
| `/dining` | Dining and cafe experiences |
| `/spa` | Spa and wellness experiences |
| `/retreats` | Curated retreat packages and bespoke stays |
| `/contact` | Contact and location information |

## Project structure

```text
website/
├── app/              # Routes, layouts, and global styles
├── components/       # Shared website and UI components
├── content/          # Page content stored as JSON
├── public/assets/    # Images and other static assets
├── scripts/          # Asset and content utilities
├── package.json      # Scripts and dependencies
└── vite.config.ts    # Vinext, Vite, and Cloudflare configuration
```

## Updating content

Most page copy and page-specific content lives in `website/content/`. The home page is in `home.json`; the other routes use matching files such as `about.json`, `mudra.json`, and `spa.json`.

Static images and other public files belong in `website/public/assets/`. Reference public assets using paths beginning with `/assets/`.

Shared layout and interactions are handled in `website/components/website.tsx`. Route wiring is in `website/app/`.

## Contributing workflow

1. Create a branch for your change.
2. Install dependencies in `website/` with `npm install`.
3. Run `npm run dev` while developing.
4. Run `npm run lint` and `npm run build` before opening a pull request.
5. Describe content, design, and route changes in the pull request.

## Notes

- Do not commit `.env*` files or generated build directories.
- The project currently does not require environment variables for the standard local development flow.
- Keep page content in the JSON files and reusable behavior in the shared React components where possible.
