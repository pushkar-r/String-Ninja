# String Ninja 🥷 — Client-Side Text & Crypto Tools

**String Ninja** is a neatly organized toolbox for encoding/decoding, string manipulation, comparison, hashing, encryption, JSON & CSV utilities, QR tools, markdown conversion, regex testing, timestamps, UUID/randoms, and more — **100% client-side**.

## Categories
- **Encoding / Decoding**: Base64, Base32, URL, HTML entities, ROT13/Caesar, Hex/Binary/Text converters
- **String Manipulation**: trim, case transforms, slugify, counters, code points
- **Comparison**: diff (words/chars/lines)
- **Security & Hashing**: MD5/SHA family, AES-GCM (PBKDF2), JWT decoder
- **Data Tools**: JSON formatter/minifier, CSV↔JSON, Markdown→HTML, QR generate/scan
- **Misc Utilities**: timestamps, random string, UUID, regex tester, steganography (demo)

## Tech
- React + Vite + TypeScript + Tailwind (dark mode)
- Web Crypto API (PBKDF2 + AES-GCM)
- crypto-js (hashes), diff (text diff), hi-base32, qrcode, jsqr, papaparse, marked

## Develop
```bash
npm i
npm run dev

# build & preview
npm run build
npm run preview
```

## Deploy
- Any static host (GitHub Pages, Netlify, Vercel).
- Build outputs to `dist/`.

## Security notes
- Entirely **client-side**; no servers or analytics included.
- The stego tool is for **education/demos** and is not resistant to forensic analysis.
- Review before production use if your threat model is strict.

## License
MIT


## New Features Added
- Code beautify/minify (HTML/CSS/JS)
- XML <-> JSON converter
- Unicode normalizer (NFC/NFD/NFKC/NFKD)
- bcrypt (bcryptjs) and Argon2 (argon2-browser) hashing
- JWT verification (HS256 and RS256 PEM public key)
- CSV parsing with custom delimiter
- Regex save/load using localStorage
- Copy buttons & search bar placeholders
