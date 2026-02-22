import axios from "axios";

export async function proxyImage(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).send("URL parameter is required");
    }

    try {
        console.log("📦 Proxying image:", url.substring(0, 50) + "...");
        const response = await axios.get(url, {
            responseType: "stream",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
            timeout: 10000,
        });

        const contentType = response.headers["content-type"];
        if (contentType) {
            res.setHeader("Content-Type", contentType);
        }
        res.setHeader("Cache-Control", "public, max-age=86400");
        response.data.pipe(res);
    } catch (error) {
        console.error("Proxy error:", error.message);
        res.status(500).send("Error fetching image");
    }
}
