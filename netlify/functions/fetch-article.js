// netlify/functions/fetch-article.js
// Improved fetcher: realistic headers + redirects
export async function handler(event) {
  try {
    const { url } = JSON.parse(event.body || "{}");
    if (!url || !/^https?:\/\//i.test(url)) return { statusCode: 400, body: "Missing or invalid url" };

    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache"
      }
    });

    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<svg[\s\S]*?<\/svg>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return { statusCode: 200, headers: { "content-type": "application/json", "access-control-allow-origin": "*" }, body: JSON.stringify({ text }) };
  } catch (e) {
    return { statusCode: 500, body: e.message || "Error" };
  }
}
