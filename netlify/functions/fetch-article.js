// netlify/functions/fetch-article.js
export async function handler(event) {
  try {
    const { url } = JSON.parse(event.body || "{}");
    if (!url || !/^https?:\/\//i.test(url)) return { statusCode: 400, body: "Missing or invalid url" };
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return { statusCode: 200, headers: { "content-type": "application/json", "access-control-allow-origin": "*" }, body: JSON.stringify({ text }) };
  } catch (e) {
    return { statusCode: 500, body: e.message || "Error" };
  }
}
