// @ts-nocheck
/* global chrome */

export async function fetchYouTubeComments(tabId: number) {
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: async () => {
                function sleep(ms: number) {
                    return new Promise((resolve) => setTimeout(resolve, ms));
                }

                function cleanText(text: string) {
                    return (text || "").replace(/\s+\n/g, "\n").replace(/\n\s+/g, "\n").trim();
                }

                function getVideoTitle() {
                    const titleEl =
                        document.querySelector('ytd-watch-metadata h1 yt-formatted-string') ||
                        document.querySelector('h1.title yt-formatted-string') ||
                        document.querySelector('meta[name="title"]');
                    return (titleEl?.textContent || titleEl?.getAttribute?.("content") || document.title || "Untitled YouTube Video").trim();
                }

                function getVideoUrl() {
                    return (
                        document.querySelector('link[rel="canonical"]')?.getAttribute("href") ||
                        location.href
                    );
                }

                async function ensureCommentsSectionVisible() {
                    const comments = document.querySelector("ytd-comments");
                    if (!comments) {
                        window.scrollBy(0, window.innerHeight);
                        await sleep(1500);
                    }

                    const commentsSection = document.querySelector("ytd-comments");
                    if (commentsSection) {
                        commentsSection.scrollIntoView({ behavior: "instant", block: "start" });
                        await sleep(1200);
                    }
                }

                async function expandButtons() {
                    const selectors = [
                        "tp-yt-paper-button#more",
                        "ytd-button-renderer#more",
                        "ytd-continuation-item-renderer tp-yt-paper-button",
                        "ytd-comment-replies-renderer #more-replies",
                        "ytd-comment-replies-renderer #more",
                        "button[aria-label*='more replies']",
                        "button[aria-label*='展开']"
                    ];

                    for (const selector of selectors) {
                        const buttons = Array.from(document.querySelectorAll(selector));
                        for (const btn of buttons) {
                            const el = btn as HTMLElement;
                            if (el && el.offsetParent !== null) {
                                try {
                                    el.click();
                                    await sleep(300);
                                } catch (_) {}
                            }
                        }
                    }
                }

                function readComments(contextTarget: any) {
                    const commentNodes = Array.from(
                        document.querySelectorAll("ytd-comment-thread-renderer #comment")
                    );

                    const items = [];
                    const seen = new Set();

                    for (const node of commentNodes) {
                        try {
                            const authorAnchor =
                                node.querySelector("#author-text") ||
                                node.querySelector("a[href*='/@']") ||
                                node.querySelector("a[href*='/channel/']");

                            const author_name = cleanText(authorAnchor?.textContent || "");
                            const rawAuthorUrl = authorAnchor?.getAttribute("href") || "";
                            const author_url = rawAuthorUrl
                                ? new URL(rawAuthorUrl, location.origin).href
                                : "";

                            const textEl =
                                node.querySelector("#content-text") ||
                                node.querySelector("yt-attributed-string");
                            const text = cleanText(textEl?.textContent || "");

                            const likesEl =
                                node.querySelector("#vote-count-middle") ||
                                node.querySelector("#vote-count-left");
                            const likes = cleanText(likesEl?.textContent || "");

                            const timeEl =
                                node.querySelector("a[href*='lc=']") ||
                                node.querySelector("yt-formatted-string.published-time-text a") ||
                                node.querySelector(".published-time-text a");
                            const timestamp = cleanText(timeEl?.textContent || "");

                            if (!text) continue;

                            const key = `${author_name}|||${text}`;
                            if (seen.has(key)) continue;
                            seen.add(key);

                            items.push({
                                author_name: author_name || "Unknown",
                                author_url,
                                likes,
                                platform: "YouTube",
                                text,
                                timestamp,
                                context_target: contextTarget
                            });
                        } catch (_) {}
                    }

                    return items;
                }

                await ensureCommentsSectionVisible();

                const canonicalUrl = getVideoUrl();
                const videoTitle = getVideoTitle();

                const contextTarget = {
                    title: videoTitle,
                    url: canonicalUrl,
                    category: "video"
                };

                let lastCount = 0;
                let stableRounds = 0;
                const maxRounds = 18;

                for (let round = 0; round < maxRounds; round++) {
                    await expandButtons();

                    const commentsSection = document.querySelector("ytd-comments") || document.body;
                    (commentsSection as HTMLElement).scrollIntoView({ behavior: "instant", block: "end" });
                    window.scrollBy(0, 1200);

                    await sleep(1500);

                    const currentCount = document.querySelectorAll("ytd-comment-thread-renderer #comment").length;
                    if (currentCount <= lastCount) {
                        stableRounds += 1;
                    } else {
                        stableRounds = 0;
                        lastCount = currentCount;
                    }

                    if (stableRounds >= 3) break;
                }

                await expandButtons();
                await sleep(800);

                return readComments(contextTarget);
            }
        });

        return results?.[0]?.result || [];
    } catch (error) {
        console.error("❌ Failed to scrape YouTube comments:", error);
        return [];
    }
}
