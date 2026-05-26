// @ts-nocheck
/* global chrome */

export async function fetchGoogleReviews(tabId: number) {
    try {
        console.log("Injecting Google review scraper and preparing auto-scroll with reviewer metadata extraction...");

        const injectionResults = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: async () => {
                // Find the scrollable review container
                const firstReview = document.querySelector('.jftiEf');
                if (!firstReview) return [];
                
                let scrollContainer = firstReview.parentElement;
                // Walk up the DOM until we find the actual scrollable parent
                while (scrollContainer && scrollContainer.scrollHeight === scrollContainer.clientHeight) {
                    scrollContainer = scrollContainer.parentElement;
                }

                // Simulate scrolling to load more reviews
                if (scrollContainer) {
                    const scrollTimes = 15; // Scroll 15 times, usually enough for around 100–150 reviews
                    console.log(`Starting auto-scroll for ${scrollTimes} rounds...`);
                    
                    for (let i = 0; i < scrollTimes; i++) {
                        scrollContainer.scrollTo(0, scrollContainer.scrollHeight);
                        // Wait after each scroll so Google has time to load more data
                        await new Promise(resolve => setTimeout(resolve, 1500)); 
                    }
                }

                //Collect review content and reviewer details
                const placeTitle =
                    document.querySelector('h1.DUwDvf')?.textContent?.trim() ||
                    document.querySelector('h1')?.textContent?.trim() ||
                    document.title ||
                    "Unknown Place";

                const contextTarget = {
                    title: placeTitle,
                    url: location.href,
                    category: "place"
                };

                const reviews = [];
                const reviewBlocks = document.querySelectorAll('.jftiEf'); 

                reviewBlocks.forEach(block => {
                    const textEl = block.querySelector('.wiI7pd');      
                    const nameEl = block.querySelector('.d4r55');       
                    const ratingEl = block.querySelector('.kvMYJc');    
                    const timeEl = block.querySelector('.rsqaWe');      
                    
                    // Reviewer profile link, usually stored in an anchor tag
                    const profileLinkEl = block.querySelector('a'); 
                    
                    // Reviewer info shown below the name, such as Local Guide or review count
                    const statsEl = block.querySelector('.RfnDt'); 

                    if (textEl && textEl.textContent) {
                        reviews.push({
                            platform: "Google Reviews",
                            author_name: nameEl ? nameEl.textContent : "Anonymous User",
                            
                            // Reviewer-related fields
                            author_url: profileLinkEl ? profileLinkEl.href : "N/A",
                            author_stats: statsEl ? statsEl.textContent : "Regular User", 
                            
                            text: textEl.textContent.trim(),
                            rating: ratingEl ? ratingEl.getAttribute('aria-label') : "N/A",
                            timestamp: timeEl ? timeEl.textContent : "N/A",
                            context_target: contextTarget,
                        });
                    }
                });
                return reviews;
            }
        });

        const data = injectionResults[0].result;
        console.log(`Google scraping completed. ${data.length} reviews captured after scrolling.`);
        return data;

    } catch (error) {
        console.error("Google Reviews scraping failed:", error);
        return [];
    }
}