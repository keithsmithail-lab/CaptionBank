// netlify/functions/verify-gumroad.js
// Verifies a Gumroad license key for a specific product_id.
// POST body: { license: "LICENSE_KEY", product_id: "YOUR_PRODUCT_ID" }
export async function handler(event) {
  try {
    const { license, product_id } = JSON.parse(event.body || "{}");
    if (!license || !product_id) {
      return { statusCode: 400, body: JSON.stringify({ valid:false, error:"Missing license or product_id" }) };
    }

    const form = new URLSearchParams();
    form.set("product_id", product_id);
    form.set("product_permalink", product_id); // accepts either id or permalink
    form.set("license_key", license);
    form.set("increment_uses_count", "false");


    const resp = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString()
    });

    const data = await resp.json();
    const valid = !!(data && data.success && data.purchase && data.purchase.chargebacked === false && data.purchase.disputed === false);
    return {
      statusCode: 200,
      headers: { "content-type": "application/json", "access-control-allow-origin":"*" },
      body: JSON.stringify({ valid, raw: data })
    };
  } catch (e) {
    return { statusCode: 500, headers: { "access-control-allow-origin":"*" }, body: JSON.stringify({ valid:false, error:String(e) }) };
  }
}
