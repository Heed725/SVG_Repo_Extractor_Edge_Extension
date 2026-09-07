let foundItems = [];
let collectionSlug = "svgrepo-collection";

const scanBtn = document.getElementById("scanBtn");
const downloadBtn = document.getElementById("downloadBtn");
const saveAs = document.getElementById("saveAs");
const statusEl = document.getElementById("status");
const detailsEl = document.getElementById("details");

function setStatus(message) {
  statusEl.textContent = message;
}

function slugify(value) {
  return (value || "svgrepo-collection")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "svgrepo-collection";
}

function filenameFromUrl(url, fallbackIndex) {
  try {
    const u = new URL(url);
    let name = decodeURIComponent(u.pathname.split("/").filter(Boolean).pop() || "");
    name = name.replace(/[<>:"/\\|?*]+/g, "_");
    if (!name) name = `icon-${fallbackIndex}.svg`;
    if (!/\.svg$/i.test(name)) name += ".svg";
    return name;
  } catch {
    return `icon-${fallbackIndex}.svg`;
  }
}

// Runs inside the open SVGRepo tab, where the user's verified browser session
// and same-origin access can be used to read all collection pages.
async function scanRenderedCollection() {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  if (!location.hostname.endsWith("svgrepo.com")) {
    throw new Error("Open an SVGRepo collection page first.");
  }

  const currentUrl = new URL(location.href);
  const pathParts = currentUrl.pathname.split("/").filter(Boolean);
  const collectionIndex = pathParts.indexOf("collection");
  if (collectionIndex < 0 || !pathParts[collectionIndex + 1]) {
    throw new Error("This is not an SVGRepo collection page.");
  }

  const rawSlug = pathParts[collectionIndex + 1];
  const collectionPath = `/collection/${rawSlug}`;

  const pageNumberFromUrl = (url) => {
    try {
      const parts = new URL(url, location.href).pathname.split("/").filter(Boolean);
      const i = parts.indexOf("collection");
      const value = i >= 0 ? Number(parts[i + 2]) : NaN;
      return Number.isInteger(value) && value > 0 ? value : 1;
    } catch (_) {
      return 1;
    }
  };

  const readPageCounter = (doc) => {
    const text = doc.body?.innerText || doc.body?.textContent || "";
    const matches = [...text.matchAll(/Page\s+(\d+)\s*\/\s*(\d+)/gi)];
    if (!matches.length) return { current: 1, total: 1 };
    return {
      current: Number(matches[0][1]) || 1,
      total: Math.max(1, ...matches.map(match => Number(match[2]) || 1))
    };
  };

  const pageUrl = (pageNumber) => {
    const url = new URL(currentUrl.origin);
    url.pathname = pageNumber === 1
      ? `${collectionPath}/`
      : `${collectionPath}/${pageNumber}`;
    return url.href;
  };

  const extractItems = (doc, sourceUrl, pageNumber) => {
    const candidates = [];
    const seen = new Set();

    const add = (value, label = "") => {
      if (!value) return;
      try {
        const absolute = new URL(value, sourceUrl).href;
        if (!/^https?:/i.test(absolute) || !/\.svg(?:$|[?#])/i.test(absolute)) return;
        if (seen.has(absolute)) return;
        seen.add(absolute);
        candidates.push({ url: absolute, label, page: pageNumber });
      } catch (_) {}
    };

    doc.querySelectorAll('[itemprop="contentUrl"]').forEach((el) => {
      const label = el.getAttribute("alt") || el.getAttribute("title") || "";
      ["src", "data-src", "data-lazy-src", "content", "href"]
        .forEach(attr => add(el.getAttribute(attr), label));
      if (el.currentSrc) add(el.currentSrc, label);
    });

    // Fallback for future SVGRepo markup changes.
    doc.querySelectorAll("img, source, a, meta").forEach((el) => {
      const label = el.getAttribute("alt") || el.getAttribute("title") || el.textContent?.trim() || "";
      ["src", "href", "data-src", "data-lazy-src", "content"]
        .forEach(attr => add(el.getAttribute(attr), label));

      const srcset = el.getAttribute("srcset");
      if (srcset) {
        srcset.split(",").forEach(part => add(part.trim().split(/\s+/)[0], label));
      }
    });

    // Actual SVGRepo assets use /show/<id>/<name>.svg. Prefer these so the
    // site's own logo and navigation graphics are not included.
    const directAssets = candidates.filter(item => /\/show\/\d+\/[^/?#]+\.svg(?:$|[?#])/i.test(item.url));
    return directAssets.length ? directAssets : candidates;
  };

  // Scroll the current page first so its lazy-loaded markup is complete.
  let lastHeight = 0;
  for (let i = 0; i < 20; i++) {
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(250);
    const height = document.body.scrollHeight;
    if (height === lastHeight) break;
    lastHeight = height;
  }
  window.scrollTo(0, 0);
  await sleep(200);

  const counter = readPageCounter(document);
  const currentPage = pageNumberFromUrl(currentUrl.href) || counter.current;
  const totalPages = counter.total;
  const allItems = [];
  const pageResults = [];

  for (let page = 1; page <= totalPages; page++) {
    try {
      let pageDocument;
      const url = pageUrl(page);

      if (page === currentPage) {
        pageDocument = document;
      } else {
        const response = await fetch(url, {
          credentials: "include",
          cache: "no-store",
          headers: { "Accept": "text/html" }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const html = await response.text();
        pageDocument = new DOMParser().parseFromString(html, "text/html");
      }

      const items = extractItems(pageDocument, url, page);
      allItems.push(...items);
      pageResults.push({ page, count: items.length, ok: true });
    } catch (error) {
      pageResults.push({ page, count: 0, ok: false, error: error.message });
    }

    // A small pause reduces the chance of triggering server rate limits.
    if (page < totalPages) await sleep(300);
  }

  const uniqueItems = Array.from(new Map(allItems.map(item => [item.url, item])).values());
  const heading = document.querySelector("h1")?.textContent || rawSlug;

  return {
    title: document.title,
    slug: rawSlug || heading,
    totalPages,
    pageResults,
    items: uniqueItems
  };
}

scanBtn.addEventListener("click", async () => {
  foundItems = [];
  downloadBtn.disabled = true;
  detailsEl.textContent = "";
  setStatus("Detecting and scanning every collection page…");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("Could not access the current tab.");

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scanRenderedCollection
    });

    const data = results?.[0]?.result;
    if (!data) throw new Error("No scan result was returned.");

    collectionSlug = slugify(data.slug);
    foundItems = Array.from(
      new Map((data.items || []).map(item => [item.url, item])).values()
    );

    const failedPages = (data.pageResults || []).filter(result => !result.ok);
    const pageSummary = (data.pageResults || [])
      .map(result => result.ok
        ? `Page ${result.page}/${data.totalPages}: ${result.count} SVG(s)`
        : `Page ${result.page}/${data.totalPages}: FAILED (${result.error})`)
      .join("\n");

    if (!foundItems.length) {
      setStatus(`Scanned ${data.totalPages} page(s), but found no direct SVG asset URLs.`);
      detailsEl.textContent = pageSummary || "SVGRepo may have changed how it embeds its files.";
      return;
    }

    const warning = failedPages.length ? ` ${failedPages.length} page(s) failed.` : "";
    setStatus(`Found ${foundItems.length} SVG file(s) across ${data.totalPages} page(s).${warning}`);
    detailsEl.textContent = `${pageSummary}\n\n` +
      foundItems.map((item, i) => `${i + 1}. [page ${item.page}] ${item.url}`).join("\n");
    downloadBtn.disabled = false;
  } catch (error) {
    setStatus(`Scan failed: ${error.message}`);
  }
});

downloadBtn.addEventListener("click", async () => {
  if (!foundItems.length) return;

  downloadBtn.disabled = true;
  let started = 0;
  let failed = 0;

  setStatus(`Starting ${foundItems.length} download(s)…`);

  for (let i = 0; i < foundItems.length; i++) {
    const item = foundItems[i];
    const filename = `SVGRepo/${collectionSlug}/${filenameFromUrl(item.url, i + 1)}`;

    try {
      await chrome.downloads.download({
        url: item.url,
        filename,
        conflictAction: "uniquify",
        saveAs: saveAs.checked
      });
      started++;
    } catch (error) {
      failed++;
      console.error("Download failed", item.url, error);
    }
  }

  setStatus(`Started ${started} download(s). Failed to start: ${failed}. Check Edge Downloads for completion.`);
  downloadBtn.disabled = false;
});
