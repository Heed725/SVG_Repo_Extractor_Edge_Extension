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

async function scanRenderedPage() {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  if (!location.hostname.endsWith("svgrepo.com")) {
    throw new Error("Open an SVGRepo collection page first.");
  }

  // Scroll through the rendered page so lazy-loaded collection icons appear.
  let lastHeight = 0;
  for (let i = 0; i < 20; i++) {
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(300);
    const h = document.body.scrollHeight;
    if (h === lastHeight) break;
    lastHeight = h;
  }
  window.scrollTo(0, 0);
  await sleep(300);

  const candidates = [];
  const seen = new Set();

  const add = (value, label = "") => {
    if (!value) return;
    try {
      const absolute = new URL(value, location.href).href;
      if (!/^https?:/i.test(absolute)) return;
      if (seen.has(absolute)) return;
      seen.add(absolute);
      candidates.push({ url: absolute, label });
    } catch (_) {}
  };

  // SVGRepo historically exposes the downloadable SVG using itemprop=contentUrl.
  document.querySelectorAll('[itemprop="contentUrl"]').forEach((el) => {
    const label = el.getAttribute("alt") || el.getAttribute("title") || "";
    ["src", "data-src", "data-lazy-src", "content", "href"].forEach(attr => add(el.getAttribute(attr), label));
    if (el.currentSrc) add(el.currentSrc, label);
  });

  // Also capture explicit SVG URLs found anywhere on the rendered page.
  document.querySelectorAll("img, source, a").forEach((el) => {
    const label = el.getAttribute("alt") || el.getAttribute("title") || el.textContent?.trim() || "";
    const values = [el.getAttribute("src"), el.getAttribute("href"), el.getAttribute("data-src"), el.currentSrc];
    values.filter(Boolean).forEach(value => {
      if (/\.svg(?:$|[?#])/i.test(value)) add(value, label);
    });

    const srcset = el.getAttribute("srcset");
    if (srcset) {
      srcset.split(",").forEach(part => {
        const value = part.trim().split(/\s+/)[0];
        if (/\.svg(?:$|[?#])/i.test(value)) add(value, label);
      });
    }
  });

  // Prefer URLs that look like actual SVG assets.
  const likelySvg = candidates.filter(item =>
    /\.svg(?:$|[?#])/i.test(item.url) ||
    /itemprop/i.test(item.label || "") ||
    /svg/i.test(item.label || "")
  );

  const pathParts = location.pathname.split("/").filter(Boolean);
  let slug = "svgrepo-collection";
  const collectionIndex = pathParts.indexOf("collection");
  if (collectionIndex >= 0 && pathParts[collectionIndex + 1]) {
    slug = pathParts[collectionIndex + 1];
  } else if (document.querySelector("h1")) {
    slug = document.querySelector("h1").textContent;
  }

  return {
    title: document.title,
    slug,
    items: likelySvg.length ? likelySvg : candidates
  };
}

scanBtn.addEventListener("click", async () => {
  foundItems = [];
  downloadBtn.disabled = true;
  detailsEl.textContent = "";
  setStatus("Scanning the rendered collection page…");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("Could not access the current tab.");

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scanRenderedPage
    });

    const data = results?.[0]?.result;
    if (!data) throw new Error("No scan result was returned.");

    collectionSlug = slugify(data.slug);
    foundItems = Array.from(
      new Map((data.items || []).map(item => [item.url, item])).values()
    );

    if (!foundItems.length) {
      setStatus("No direct SVG asset URLs were found on the rendered page.");
      detailsEl.textContent = "If the collection itself is visible, SVGRepo may have changed how it embeds its files.";
      return;
    }

    setStatus(`Found ${foundItems.length} candidate SVG file(s).`);
    detailsEl.textContent = foundItems.map((item, i) => `${i + 1}. ${item.url}`).join("\n");
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
