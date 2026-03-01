# String Ninja 🥷

A fast, 100% client‑side toolbox for developers and power users. Encode/decode, manipulate text, compare strings, hash/encrypt, inspect JWT/X.509/SAML, convert data formats, generate/scan QR, beautify/minify code, and more. No data leaves your device.


## Highlights
- Client‑side only. No servers. No analytics.
- Organized by category with a left‑side feature menu
- Global search bar (desktop) with deep links (e.g. `/security?tool=rsa`)
- Dark/light theme persisted in localStorage
- SEO landing pages for all tools under `/tools/*` with route-level metadata
- Build-time prerender for key routes and auto-generated sitemap with `lastmod`


## Feature Map

Encoding
- Base64, Base32, URL encode/decode
- HTML entities encode/decode
- Hex ↔ Binary ↔ Text
- ROT13 / Caesar

Strings
- Trim, remove redundant spaces, case transforms (UPPER/lower/Title/Sentence), reverse, slugify
- Word/character counts
- Case converters: camelCase, PascalCase, snake_case, kebab-case
- Unicode code point viewer
- Line operations: sort, unique, remove blank lines
- Find/Replace with regex (gi flags), shows match indices
- Wrap/Reflow text to width
- Frequency analysis (words/chars)
- Remove diacritics (accents)

Compare
- Diff: words / chars / lines
- Views: inline and side‑by‑side

Security
- Hashing: MD5, SHA‑1, SHA‑256, SHA‑512
- AES‑GCM encrypt/decrypt (PBKDF2‑SHA‑256, 100k)
- JWT tools: decoder, signature verify (HS256/RS256), signer (HS256/RS256)
- Password hashing: bcrypt (hash/verify), Argon2 (hash via hash‑wasm)
- RSA keygen: generate RSA key pair (PEM, PKCS#8 + SPKI)
- ECC keygen: P‑256 (ECDSA), export PEM (PKCS#8 + SPKI)
- X.509 certificate decoder: basic fields (issuer/subject/validity/SPKI OID)
- SAML decoder: POST (Base64) and Redirect (URL‑decode + raw DEFLATE)
- HMAC generator: SHA‑256 / SHA‑512
- File hashing: SHA‑256 / SHA‑512
- TOTP/HOTP generator (Base32/Hex/Text secrets, digits 6/8, configurable period)
- PKCE code_verifier generator and S256 code_challenge derivation

Data Tools
- JSON format/minify (with precise error location on failures)
- CSV ↔ JSON (header mode)
- Markdown → HTML
- QR tools: generate (toDataURL), scan from image (canvas + jsQR)
- Beautify: JS/CSS/HTML (js‑beautify)
- Minify: JS (terser), CSS (csso), HTML (simple browser‑safe minify)
- XML ↔ JSON (xml‑js)
- Unicode normalizer (NFC/NFD/NFKC/NFKD)

Misc
- Timestamp converter (Unix ↔ ISO8601)
- Random string and UUID v4
- Regex tester (+ save/load patterns)
- Image steganography demo (LSB in PNG)
- CSV import with custom delimiter


## Tech Stack
- React 18 + Vite + TypeScript + TailwindCSS
- Web Crypto API (PBKDF2, AES‑GCM, HMAC, RSA)
- Libraries: crypto‑js, diff, hi‑base32, qrcode, jsqr, papaparse, marked, csso, terser, xml‑js, hash‑wasm, pako


## Requirements
- Node.js 18+ (recommended: 20 LTS)
- npm (or a compatible package manager)


## Local Development
1) Install dependencies
```bash
npm install
```

2) Start the dev server
```bash
npm run dev
```
Vite prints a local URL (e.g., http://localhost:5173). Open it in your browser.

3) Build and preview
```bash
npm run build
npm run preview
```
Preview serves the production build locally.


## Using the App
- Navigation: Top bar categories (Encoding, Strings, Compare, Security, Data, Misc)
- Per‑category menu: Left sidebar lists features; click to open a panel
- Global search (desktop): In the header, type a feature (e.g., "JWT Signer") and press Enter
- Deep links: You can navigate directly with `?tool=` (e.g., `/security?tool=rsa`, `/data?tool=xml`)
- Dark mode: Toggle from the header; preference is saved


## Deploy (GitHub Pages)
This repository includes a GitHub Actions workflow that builds and deploys automatically to GitHub Pages.

1) Enable GitHub Pages
- Repo Settings → Pages → Source: GitHub Actions

2) Trigger a deploy
- Push to your default branch (e.g., `main`), or run the workflow manually under the Actions tab

3) SPA routing
- The workflow copies `dist/index.html` to `dist/404.html` to support client‑side routes on GitHub Pages

4) Access URL (default project pages)
- GitHub shows the site URL in Settings → Pages, typically:
  - `https://<username>.github.io/<repo-name>/`
- For this case, Vite’s base is auto‑set to `/<repo-name>/` in production so assets resolve correctly.

### Custom Domain (stringninja.in or your own)
There are two supported approaches. If you’ve already added the GitHub repository variable (recommended), use Option A.

Option A — Configure via GitHub repository variable (recommended)
- In GitHub → your repo → Settings → Secrets and variables → Actions → Variables, set:
  - Name: `CUSTOM_DOMAIN`
  - Value: `stringninja.in` (or your domain)
- What the workflow does when `CUSTOM_DOMAIN` is set:
  - Builds with `VITE_BASE=/` so the site works at domain root
  - Writes `dist/CNAME` with the value of `CUSTOM_DOMAIN`
- You do not need to commit a CNAME file if using this option.

Option B — Commit a CNAME file
- Create `public/CNAME` containing only your domain (e.g., `stringninja.in`)
- Vite copies it to `dist/` on build
- Ensure production builds use `base: '/'` (the workflow only forces this when `CUSTOM_DOMAIN` is set). If you use Option B exclusively, either:
  - Set `CUSTOM_DOMAIN` anyway (the workflow will set `VITE_BASE=/`), or
  - Build locally with `VITE_BASE=/` when deploying (not needed if you only deploy via the workflow)

DNS configuration
- Apex (root): `stringninja.in`
  - Add A records to GitHub Pages IPs:
    - 185.199.108.153
    - 185.199.109.153
    - 185.199.110.153
    - 185.199.111.153
  - Optional AAAA (IPv6):
    - 2606:50c0:8000::153
    - 2606:50c0:8001::153
    - 2606:50c0:8002::153
    - 2606:50c0:8003::153
- Alternate host (www): `www.stringninja.in`
  - CNAME → `<username>.github.io`
- If you use only a subdomain (e.g., `tools.example.com`), use a CNAME to `<username>.github.io` for that subdomain and skip apex A/AAAA records.

GitHub Pages settings
- Repo → Settings → Pages → Custom domain: `stringninja.in`
- Click “Save”, then enable “Enforce HTTPS” once the certificate is issued
- If you change DNS, click “Check again” after propagation (can take minutes; sometimes up to a few hours)

Verification
- Check DNS:
  - `dig +short A stringninja.in`
  - `dig +short AAAA stringninja.in`
  - `dig +short CNAME www.stringninja.in`
- All should resolve to the GitHub Pages IPs (A/AAAA) and the `www` CNAME to `<username>.github.io`

Notes for Cloudflare users
- For apex: use the A/AAAA records above. For `www`: CNAME to `<username>.github.io`
- If validation fails, temporarily disable the proxy (grey cloud) until HTTPS is issued; re‑enable after.


## Troubleshooting
Localhost 404
- Vite is configured to use `/` in dev and `/<repo>/` only in production; if you changed the base, revert or mirror the change in the router basename

GitHub Pages 404
- Confirm the Pages URL path matches `/<repo-name>/` exactly (case‑sensitive)
- Ensure the workflow completed, and `404.html` exists in `dist/`
- Settings → Pages must be set to Source: GitHub Actions

TypeScript: missing types for some modules
- Minimal type shims are included at `src/types/shims.d.ts`
- If you add a library without types, add a small declaration there

Vite: import.meta.env typing error
- `vite/client` types are included in `tsconfig.json`; if you created a new tsconfig, add it to `compilerOptions.types`

Node version mismatches
- Use Node 18+ (20 LTS recommended)
- If installs fail, try cleaning: `rm -rf node_modules package-lock.json && npm install`


## Security & Privacy Notes
- All operations run in your browser. No data is transmitted
- Cryptography tools are for convenience/testing and not a substitute for audited, server‑side code in production
- JWT "Decoder" simply parses header/payload; signature verification is a separate tool
- X.509 decoder is a simplified ASN.1 reader intended for inspection; not a validator
- SAML decoder decodes to XML (POST and Redirect binding); it does not validate signatures or schemas
- Steganography tool is for education/demos and is not for secure secrecy


## Contributing
- Fork the repo and create a feature branch
- Run the app locally: `npm install && npm run dev`
- Keep features self‑contained and 100% client‑side
- For new libraries without TS types, add a small entry in `src/types/shims.d.ts`
- Open a pull request with a concise description and screenshots if UI changes


## License
MIT
