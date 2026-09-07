# 🧩 SVGRepo Extractor — Microsoft Edge Extension

A lightweight Microsoft Edge extension for extracting and downloading SVG assets from an **SVGRepo collection page that is already open and rendered in your normal browser session**.

> [!IMPORTANT]
> This extension does **not** bypass SVGRepo/Vercel browser verification, rate limits, or security checkpoints. Open SVGRepo normally in Microsoft Edge and complete any browser verification yourself first. Once the collection page is visible, the extension scans the rendered page and asks Edge to download the SVG assets it can find.

## ✨ Features

- 🔎 Scan the currently open SVGRepo collection page
- 🧩 Detect SVG asset URLs from rendered page elements
- 📥 Download all detected SVGs through Microsoft Edge
- 📁 Organize downloads under `Downloads/SVGRepo/<collection-name>/`
- ♻️ Automatically avoid filename conflicts by creating unique names
- 💾 Optional **Ask where to save each file** mode
- 🛡️ Uses your normal browser session rather than a separate Python scraper
- 🧱 Manifest V3 extension

## 🚀 Install in Microsoft Edge

1. Download or clone this repository.
2. Open Microsoft Edge.
3. Enter `edge://extensions` in the address bar.
4. Turn on **Developer mode**.
5. Click **Load unpacked**.
6. Select this repository folder.

## 📖 Usage

1. Open an SVGRepo collection normally in Edge.
2. If SVGRepo displays browser verification, complete it normally.
3. Wait until the actual collection and icons are visible.
4. Click the **Extensions** button in Edge.
5. Open **SVGRepo Collection Downloader**.
6. Click **1. Scan current collection**.
7. Check how many SVG files were detected.
8. Click **2. Download SVGs**.

By default files are saved under:

```text
Downloads/
└── SVGRepo/
    └── <collection-name>/
        ├── icon-1.svg
        ├── icon-2.svg
        └── ...
```

## 🛠️ Troubleshooting

### Failed to verify your browser — Code 21

This is an SVGRepo/Vercel browser-security response. The extension does not attempt to bypass it. Resolve normal browser access first, then run the extension after the collection page is visible.

### Scan finds 0 files

SVGRepo may have changed its rendered HTML structure. Open an issue with the collection URL and, if possible, a screenshot of the visible collection page.

### Downloads return HTTP 429

Stop repeated retries. SVGRepo is rate-limiting requests. Resume only when normal browser access works again.

## 📂 Files

- `manifest.json` — Edge/Chromium extension manifest
- `popup.html` — extension popup interface
- `popup.css` — popup styling
- `popup.js` — collection scanner and download logic

## ⚠️ Responsible use

Use the extension only for content you are permitted to download and in accordance with SVGRepo's terms and the license attached to each SVG asset.

---

Made for Microsoft Edge / Chromium browsers. 🌐🧩
