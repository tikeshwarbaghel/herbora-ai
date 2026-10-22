import { Router, raw, type IRouter } from "express";

const router: IRouter = Router();
const ML_URL = process.env.ML_SERVICE_URL ?? "http://localhost:8000";

router.post(
  "/identify",
  raw({ type: "image/*", limit: "10mb" }),
  async (req, res) => {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      res.status(400).json({ error: "Please send an image" });
      return;
    }

    try {
      const mlRes = await fetch(`${ML_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": req.headers["content-type"] ?? "image/jpeg" },
        body: new Uint8Array(req.body),
      });
      const data = await mlRes.json();
      res.status(mlRes.status).json(data);
    } catch {
      res.status(502).json({ error: "ML service is not reachable" });
    }
  },
);

export default router;