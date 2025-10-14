// src/pages/api/brand-manager/preview.ts
import type { NextApiRequest, NextApiResponse } from "next";
import brandManager from "../../../lib/brandManager";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { domain, version } = req.query;
  if (!domain) return res.status(400).json({ error: "domain required" });

  const snapshot = brandManager.getSnapshot(domain as string, version as string);
  if (!snapshot) return res.status(404).json({ error: "Snapshot not found" });

  res.status(200).json(snapshot);
}