# 🧩 SVGRepo Extractor — Microsoft Edge Extension

A lightweight Microsoft Edge extension that detects every page in an SVGRepo collection and downloads the SVG assets through your normal browser session.

> [!IMPORTANT]
> This extension does **not** bypass SVGRepo/Vercel browser verification, rate limits, or security checkpoints. Open SVGRepo normally in Microsoft Edge and complete any browser verification yourself first.

## ✨ Features

- 🔢 Automatically detects collection pagination such as **Page 1 / 6**
- 🔎 Scans every page from **1/6 through 6/6**
- 🧩 Detects direct SVG asset URLs from every collection page
- 🧹 Removes duplicate SVG links before downloading
- 📊 Shows the detected SVG count for each page
- ⚠️ Identifies any page that could not be fetched
- 📥 Downloads all detected SVGs through Microsoft Edge
- 📁 Organizes downloads under `Downloads/SVGRepo/<collection-name>/`
- ♻️ Avoids filename conflicts by creating unique names
- 💾 Optional **Ask where to save each file** mode
- 🛡️ Uses your active browser session rather than a separate scraper
- 🧱 Manifest V3 extension

## 🚀 Install in Microsoft Edge

### From the packaged ZIP

1. Download `SVGRepo_Edge_Extension.zip` from this repository.
2. Extract the ZIP.
3. Open Microsoft Edge.
4. Enter `edge://extensions` in the address bar.
5. Turn on **Developer mode**.
6. Click **Load unpacked**.
7. Select the extracted `SVGRepo_Edge_Extension` folder.

### From the repository

Clone or download this repository, then select the repository folder using **Load unpacked**.

## 📖 Usage

1. Open an SVGRepo collection normally in Edge.
2. Complete any browser verification shown by SVGRepo.
3. Wait until the collection and icons are visible.
4. Open **SVGRepo Collection Downloader** from the Edge Extensions menu.
5. Click **1. Scan all collection pages**.
6. Confirm the page-by-page results, such as:

   ```text
   Page 1/6: 50 SVG(s)
   Page 2/6: 50 SVG(s)
   Page 3/6: 50 SVG(s)
   Page 4/6: 50 SVG(s)
   Page 5/6: 50 SVG(s)
   Page 6/6: 1 SVG(s)
   ```

7. Click **2. Download SVGs**.

Files are saved under:

```text
Downloads/
└── SVGRepo/
    └── <collection-name>/
        ├── icon-1.svg
        ├── icon-2.svg
        └── ...
```

> [!NOTE]
> Enabling **Ask where to save each file** produces one Edge prompt per SVG and can result in hundreds of prompts.

## 🛠️ Troubleshooting

### Failed to verify your browser — Code 21

This is an SVGRepo/Vercel browser-security response. Resolve normal browser access first, then run the extension after the collection is visible.

### One or more pages fail

The scan result identifies the failed page. Wait briefly and scan again instead of repeatedly clicking, which may trigger rate limits.

### Scan finds 0 files

SVGRepo may have changed its HTML structure. Open an issue with the collection URL and a screenshot of the visible collection page.

### Downloads return HTTP 429

Stop repeated retries. SVGRepo is rate-limiting requests. Resume only when normal browser access works again.

## 📂 Files

- `manifest.json` — Edge/Chromium extension manifest
- `popup.html` — extension popup interface
- `popup.css` — popup styling
- `popup.js` — multi-page collection scanner and download logic
- `SVGRepo_Edge_Extension.zip` — ready-to-install packaged extension

## ⚠️ Responsible use

Use the extension only for content you are permitted to download and in accordance with SVGRepo's terms and the license attached to each SVG asset.

---

Made for Microsoft Edge / Chromium browsers. 🌐🧩
