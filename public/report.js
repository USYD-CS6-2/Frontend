/* global chrome */
chrome.storage.local.get("latestAnalysis", async (res) => {
  const payload = res.latestAnalysis;

  const summaryEl = document.getElementById("summary");
  const rawEl = document.getElementById("rawResponse");

  if (!payload) {
    summaryEl.textContent = "No analysis result found in storage.";
    rawEl.textContent = "No data.";
    return;
  }

  const backendResult = payload.backendResult || {};
  const meta = backendResult.meta || {};
  const cleaningMeta = meta.cleaning_meta || {};

  const requestId = backendResult.request_id || meta.request_id || "-";
  const strategy = meta.strategy || backendResult.strategy || "-";
  const fallbackReason = meta.fallback_reason || backendResult.fallback_reason || "-";

  document.getElementById("platform").textContent = payload.platform || "-";
  document.getElementById("commentsCount").textContent = String(payload.commentsCount ?? "-");
  document.getElementById("generatedAt").textContent = formatDate(payload.scrapedAt);
  document.getElementById("source").textContent = meta.source || payload.platform || "-";
  document.getElementById("language").textContent = meta.language || "-";
  document.getElementById("requestId").textContent = requestId;
  document.getElementById("strategy").textContent = strategy;

  document.getElementById("heroPlatform").textContent = payload.platform || "-";
  document.getElementById("heroCount").textContent = String(payload.commentsCount ?? "-");
  document.getElementById("heroLanguage").textContent = meta.language || "-";

  document.getElementById("fallbackChip").textContent = `Fallback: ${fallbackReason}`;
  document.getElementById("inputChip").textContent = `Input Count: ${cleaningMeta.input_count ?? "-"}`;
  document.getElementById("outputChip").textContent = `Output Count: ${cleaningMeta.output_count ?? "-"}`;

  const postUrlEl = document.getElementById("postUrl");
  const postUrl = payload.postUrl || "#";
  postUrlEl.textContent = postUrl;
  postUrlEl.href = postUrl;

  const summaryText = backendResult.summary || "No summary returned.";
  summaryEl.textContent = summaryText;
  summaryEl.classList.remove("summary-empty");

  const rawText = JSON.stringify(backendResult, null, 2);
  rawEl.textContent = rawText;

  document.getElementById("copyBtn").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(rawText);
      const btn = document.getElementById("copyBtn");
      const old = btn.textContent;
      btn.textContent = "Copied";
      setTimeout(() => {
        btn.textContent = old;
      }, 1200);
    } catch (_) {}
  });

  document.getElementById("toggleBtn").addEventListener("click", () => {
    const btn = document.getElementById("toggleBtn");
    if (rawEl.style.display === "none") {
      rawEl.style.display = "block";
      btn.textContent = "Collapse";
    } else {
      rawEl.style.display = "none";
      btn.textContent = "Expand";
    }
  });
});

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}
