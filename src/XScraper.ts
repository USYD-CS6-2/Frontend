// @ts-nocheck
/* global chrome */

export async function fetchXComments(tabId: number) {
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            world: "MAIN",
            func: async () => {
                const existingBtn = document.getElementById('x-hacker-btn');
                if (existingBtn) existingBtn.remove();

                return await new Promise((resolve) => {
                    console.log("X interceptor started");

                    const btn = document.createElement('button');
                    btn.id = 'x-hacker-btn';
                    btn.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); z-index:2147483647; padding:15px 30px; background-color:#E0245E; color:white; border:none; border-radius:30px; font-weight:bold; font-size:18px; cursor:pointer; box-shadow: 0 8px 15px rgba(0,0,0,0.6); transition: background-color 0.3s;';
                    btn.innerText = '📡 Capturing X data... Please scroll through the replies';
                    document.documentElement.appendChild(btn);

                    const interceptedTweets = new Map();

                    const canonicalUrl =
                        document.querySelector('link[rel="canonical"]')?.href || location.href;

                    const rootTweetText =
                        Array.from(document.querySelectorAll('article [data-testid="tweetText"]'))
                            .map(el => el.textContent?.trim())
                            .find(Boolean) ||
                        document.title ||
                        "Untitled X Post";

                    const contextTarget = {
                        title: rootTweetText,
                        url: canonicalUrl,
                        category: "post"
                    };

                    const originalFetch = window.fetch;
                    const originalOpen = window.XMLHttpRequest.prototype.open;
                    const originalSend = window.XMLHttpRequest.prototype.send;

                    function cleanup() {
                        window.fetch = originalFetch;
                        window.XMLHttpRequest.prototype.open = originalOpen;
                        window.XMLHttpRequest.prototype.send = originalSend;
                        if (btn && btn.parentNode) btn.remove();
                    }

                    function extractTweets(obj) {
                        if (!obj || typeof obj !== 'object') return;

                        if (obj.legacy && obj.legacy.full_text && obj.core && obj.core.user_results) {
                            try {
                                const user = obj.core.user_results.result.legacy || {};
                                const isBlue = obj.core.user_results.result.is_blue_verified || false;
                                const text = obj.legacy.full_text;

                                if (!interceptedTweets.has(text)) {
                                    interceptedTweets.set(text, {
                                        platform: "X/Twitter",
                                        author_name: user.name || "Unknown",
                                        author_handle: "@" + (user.screen_name || "unknown"),
                                        is_verified: user.verified || isBlue,
                                        text: text,
                                        likes: obj.legacy.favorite_count || 0,
                                        retweets: obj.legacy.retweet_count || 0,
                                        timestamp: obj.legacy.created_at || "N/A",
                                        context_target: contextTarget
                                    });
                                    btn.innerText = `📦 X data ready. Click to finish and send (${interceptedTweets.size} captured)`;
                                    btn.style.backgroundColor = '#17BF63';
                                }
                            } catch (e) {}
                        }

                        for (let key in obj) {
                            if (typeof obj[key] === 'object') extractTweets(obj[key]);
                        }
                    }

                    window.fetch = async function(...args) {
                        const response = await originalFetch.apply(this, args);
                        const url = args[0] && typeof args[0] === 'string'
                            ? args[0]
                            : (args[0] && args[0].url ? args[0].url : '');

                        if (url.includes('/graphql/') || url.includes('/i/api/')) {
                            response.clone().json().then(data => extractTweets(data)).catch(() => {});
                        }
                        return response;
                    };

                    window.XMLHttpRequest.prototype.open = function() {
                        this._url = arguments[1];
                        return originalOpen.apply(this, arguments);
                    };

                    window.XMLHttpRequest.prototype.send = function() {
                        this.addEventListener('load', function() {
                            if (this._url && (this._url.includes('/graphql/') || this._url.includes('/i/api/'))) {
                                try {
                                    const data = JSON.parse(this.responseText);
                                    extractTweets(data);
                                } catch (e) {}
                            }
                        });
                        return originalSend.apply(this, arguments);
                    };

                    btn.onclick = () => {
                        if (interceptedTweets.size === 0) {
                            alert('No data captured yet. Please scroll further in the reply section.');
                            return;
                        }

                        const data = Array.from(interceptedTweets.values());
                        btn.disabled = true;
                        btn.innerText = `✅ X data collected (${data.length} captured). Returning to extension...`;
                        btn.style.backgroundColor = '#17BF63';

                        setTimeout(() => {
                            cleanup();
                            resolve(data);
                        }, 600);
                    };
                });
            }
        });

        return results?.[0]?.result || [];
    } catch (error) {
        console.error("❌ Failed to start X interceptor:", error);
        return [];
    }
}
