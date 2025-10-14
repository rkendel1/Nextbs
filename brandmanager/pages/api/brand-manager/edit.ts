// src/pages/api/brand-manager/edit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import brandManager from "../../../lib/brandManager";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { domain, command } = req.body;
  if (!domain || !command) return res.status(400).json({ error: "domain and command required" });

  try {
    const edited = await brandManager.editSnapshot(domain, command);
    res.status(200).json(edited);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}