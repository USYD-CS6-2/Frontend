# LLM-based Online Comments Summarizer (Frontend)

Group A frontend browser-extension baseline for v1 plugin workflows.

## Quick Start

### 1. Clone the Repository

First, download the project source code to your local machine:

```bash
git clone https://github.com/USYD-CS6-2/Frontend.git
```

Then enter the project root directory:

```bash
cd Frontend
```

### 2. Install Dependencies

Install all required frontend dependencies:

```bash
npm install
```

### 3. Configure Backend Endpoint

Before building the extension, make sure the backend API URL is correct.

Check the following files:

- `src/main.ts`
- `public/background.js`

Look for a line similar to:

```ts
const API_URL = "http://54.252.102.147/api/v1/analyze";
```

If the backend server address changes, update the URL in the frontend code before rebuilding.

### 4. Build the Extension

Build the frontend project with:

```bash
npm run build
```

If the build is successful, a `dist/` folder will be generated.

### 5. Load the Extension in Browser

Open your browser extension page:

- Edge: `edge://extensions`
- Chrome: `chrome://extensions`

Then:

1. Turn on **Developer mode**
2. Click **Load unpacked**
3. Select the generated `dist/` folder

The extension is now ready to use in the browser.

## Supported Platforms

The current frontend supports:

- Reddit
- Google Reviews / Google Maps
- X (Twitter)
- YouTube

## How to Use

### Reddit
1. Open a Reddit post/comments page
2. Click the extension icon
3. Click the scrape button
4. The extension captures comments and sends them to the backend
5. A report page opens automatically after analysis is returned

### Google Reviews / Google Maps
1. Open a Google Maps place/reviews page
2. Click the extension icon
3. Click the scrape button
4. The extension scrolls and captures review data
5. The report page opens automatically after backend analysis

### X (Twitter)
1. Open an X/Twitter post page
2. Click the extension icon
3. Start the X capture workflow
4. Scroll the replies manually on the page
5. Click the green capture/send button shown on the page
6. The background script forwards the data to the backend
7. The report page opens automatically

Note: X currently uses a semi-manual workflow for better stability.

### YouTube
1. Open a YouTube video page
2. Click the extension icon
3. Click the scrape button
4. The extension captures comments and sends them to the backend
5. The report page opens automatically after analysis is returned

## Report Page

After successful backend processing, the frontend opens a report page showing:

- platform name
- source URL
- comments count
- backend metadata
- summary result
- raw backend response

## Main Files

- `src/main.ts` – popup entry logic and platform routing
- `src/RedditScraper.ts` – Reddit scraping module
- `src/GoogleReviewScraper.ts` – Google Reviews scraping module
- `src/XScraper.ts` – X/Twitter scraping module
- `src/YoutubeScraper.ts` – YouTube scraping module
- `public/manifest.json` – browser extension manifest
- `public/background.js` – background workflow handling
- `public/report.html` – analysis report page
- `public/report.js` – report-page rendering logic

## Notes

- Rebuild the project with `npm run build` after any source-code update
- Reload the unpacked extension after rebuilding
- Very large inputs may be rejected by backend limits
- Some backend responses may fall back to local summary if the upstream agent service fails
