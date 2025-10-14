// src/pages/api/brand-manager/capture.ts
import type { NextApiRequest, NextApiResponse } from "next";
import brandManager from "../../../lib/brandManager";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL required" });

  try {
    const snapshot = await brandManager.captureBrand(url);
    res.status(200).json(snapshot);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}