import { Hono } from 'hono';
const contact = new Hono();


contact.post("/", async (c) => {
    let body;
    try { body = await c.req.json(); }
    catch { return c.json({ error: "Invalid JSON" }, 400); }
    const { name, email, subject, message } = body;
    // Input validation
    if (!name?.trim())
        return c.json({ error: "Name is required" }, 400);
    if (!email?.includes("@")) return c.json({ error: "Valid email required" }, 400);
    if (!message?.trim()) return c.json({ error: "Message is required" }, 400);


    // Forward to Web3Forms with server-held key
    const formData = new FormData(); formData.append("access_key", c.env.WEB3FORMS_ACCESS_KEY);
    formData.append("name", name.trim());
    formData.append("email", email.trim());
    formData.append("subject", (subject ?? "Contact Form").trim());
    formData.append("message", message.trim());
    const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
    });
    const result = await res.json();
    if (result.success) {
        return c.json({ success: true });
    } else {
        console.error("[Contact] Web3Forms error:", result);
        return c.json({ success: false, error: "Failed to send message" }, 502);
    }
});
export default contact;