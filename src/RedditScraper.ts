// @ts-nocheck
export async function fetchRedditComments(redditPostUrl: string) {
  try {
    const response = await fetch(`${redditPostUrl}.json`);
    const rawData = await response.json();
    const postData = rawData?.[0]?.data?.children?.[0]?.data || {};

    const contextTarget = {
      title: postData.title || "Untitled Reddit Post",
      url: postData.permalink
        ? `https://www.reddit.com${postData.permalink}`
        : redditPostUrl,
      category: "thread"
    };
    const allComments: any[] = [];
    const rootComments = rawData[1].data.children;

    function traverse(children: any[]) {
      children.forEach((item: any) => {
        const d = item.data;
        if (item.kind === 't1' && d.body) {
          allComments.push({
            platform: "Reddit",
            text: d.body,
            upvotes: d.ups,
            score: d.score,
            timestamp: new Date(d.created_utc * 1000).toISOString(),
            author_name: d.author,
            is_op: d.is_submitter,
            author_detail: null,
            context_target: contextTarget
          });
          if (d.replies?.data?.children) traverse(d.replies.data.children);
        }
      });
    }
    traverse(rootComments);

    const uniqueAuthors = [...new Set(allComments.map(c => c.author_name))].filter(n => n !== '[deleted]');
    
    
    for (let i = 0; i < uniqueAuthors.length; i += 3) {
      const batch = uniqueAuthors.slice(i, i + 3);
      await Promise.all(batch.map(async (name) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const userRes = await fetch(`https://www.reddit.com/user/${name}/about.json`, { signal: controller.signal });
          const userData = await userRes.json();
          clearTimeout(timeoutId);

          const u = userData.data;
          allComments.forEach(c => {
            if (c.author_name === name) {
              c.author_detail = {
                total_karma: u.total_karma,
                created_date: new Date(u.created_utc * 1000).toLocaleDateString()
              };
            }
          });
        } catch (e) {
          console.log(`Skip the author: ${name}`);
        }
      }));
      // 稍微等一下
      await new Promise(r => setTimeout(r, 200));
    }

    return allComments;
  } catch (error) {
    console.error(error);
    return [];
  }
}