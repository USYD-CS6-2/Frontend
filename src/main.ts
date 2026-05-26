// @ts-nocheck
/* global chrome */
import { fetchRedditComments } from './RedditScraper';
import { fetchGoogleReviews } from './GoogleReviewScraper';
import { fetchYouTubeComments } from './YouTubeScraper';

const API_URL = "http://54.252.102.147/api/v1/analyze";

document.getElementById('scrapeBtn')?.addEventListener('click', async () => {
    const status = document.getElementById('status')!;
    status.innerText = "🔍 iDENTIFYING THE PLATFORM";
    status.style.color = "black";

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tab.url || "";
        let data = [];
        let platformName = "unknown";

        if (url.includes("reddit.com")) {
            status.innerText = "🕵️ SCRAPING THE REDDIT...";
            data = await fetchRedditComments(url);
            platformName = "reddit";

        } else if (url.includes("google") && (url.includes("maps") || url.includes("search") || url.includes("local"))) {
            status.innerText = "🕵️ Running Google scroll scraping (please do not interact with the page)...";
            data = await fetchGoogleReviews(tab.id);
            platformName = "google_reviews";

        } else if (url.includes("youtube.com/watch") || url.includes("youtu.be/")) {
            status.innerText = "🕵️ SCRAPING YOUTUBE COMMENTS...";
            data = await fetchYouTubeComments(tab.id);
            platformName = "youtube";

        } else if (url.includes("x.com") || url.includes("twitter.com")) {
            status.style.color = "blue";
            status.innerText = "🕵️ X capture started. Please scroll replies and click the green button on the page. The report page will open automatically after sending.";

            await chrome.runtime.sendMessage({
                action: "startXCaptureFlow",
                tabId: tab.id,
                pageUrl: url
            });
            return;

        } else {
            status.style.color = "red";
            status.innerText = `❌ Blocked: Please use this on a Reddit, Google Maps, YouTube, or X (Twitter) comments page.`;
            return;
        }

        if (data && data.length > 0) {
            const limitedData = data.slice(0, 200);
            status.innerText = `📦 Task completed! Processing...`;

            setTimeout(() => {
                status.innerText = "📤 Sending data to backend...";
                sendToBackend(limitedData, platformName)
                    .then(async (result) => {
                        console.log("Backend result:", result);
                        status.style.color = "green";

                        const analysisPayload = {
                            platform: platformName,
                            postUrl: url,
                            commentsCount: limitedData.length,
                            backendResult: result,
                            scrapedAt: new Date().toISOString()
                        };

                        await chrome.storage.local.set({ latestAnalysis: analysisPayload });
                        chrome.tabs.create({ url: chrome.runtime.getURL("report.html") });
                        status.innerText = `✅ Success! Sent ${limitedData.length} records to backend. Report page opened.`;
                    })
                    .catch((err) => {
                        console.error("Backend send error:", err);
                        status.style.color = "red";
                        status.innerText = `❌ ${err.message}`;
                    });
            }, 500);

        } else {
            status.style.color = "orange";
            status.innerText = "⚠️ No data was captured. Please make sure the comment sidebar is open.";
        }

    } catch (e) {
        status.style.color = "red";
        status.innerText = "❌ Runtime error. Please right-click and check the console for errors.";
        console.error("Runtime error:", e);
    }
});

async function sendToBackend(data: any[], platform: string) {
    const payload = {
        platform,
        comments: data
    };

    let response;
    try {
        response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
    } catch (err: any) {
        throw new Error(
            `Backend network error: cannot reach ${API_URL}. Possible reasons: endpoint unavailable, server/proxy not running, connection timeout/refused, or CORS/network policy.`
        );
    }

    if (!response.ok) {
        let errorText = "";
        try {
            errorText = await response.text();
        } catch (_) {
            errorText = "";
        }

        const suffix = errorText ? ` Response: ${errorText}` : "";
        throw new Error(`Backend HTTP error ${response.status}.${suffix}`);
    }

    return await response.json();
}
