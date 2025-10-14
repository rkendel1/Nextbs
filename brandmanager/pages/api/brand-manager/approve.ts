// src/pages/api/brand-manager/approve.ts
import type { NextApiRequest, NextApiResponse } from "next";
import brandManager from "../../../lib/brandManager";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { domain, version } = req.body;
  if (!domain || !version) return res.status(400).json({ error: "domain and version required" });

  const approved = brandManager.approveSnapshot(domain, version);
  if (!approved) return res.status(404).json({ error: "Snapshot not found" });

  res.status(200).json(approved);
}