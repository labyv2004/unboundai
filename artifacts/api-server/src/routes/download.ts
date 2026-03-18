import { Router, type IRouter } from "express";
import archiver from "archiver";
import path from "path";
import { fileURLToPath } from "url";

const router: IRouter = Router();

const WORKSPACE_ROOT = process.cwd();

// Complex secret password — change or delete after use
const DOWNLOAD_SECRET = "Zr7#KqX$mN2@vB9!wL4^pE8&dT5*cF6";

router.post("/verify", (req, res) => {
  const { password } = req.body;
  if (password === DOWNLOAD_SECRET) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false, error: "Incorrect password" });
  }
});

router.post("/archive", async (req, res) => {
  const { password } = req.body;

  if (password !== DOWNLOAD_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="unbound-ai-source-${Date.now()}.zip"`,
  );

  const archive = archiver("zip", { zlib: { level: 6 } });

  archive.on("error", (err) => {
    console.error("[DOWNLOAD] Archive error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Archive failed" });
    }
  });

  archive.pipe(res);

  // Add workspace excluding heavy dirs
  const excludeDirs = [
    "node_modules",
    ".git",
    ".cache",
    "dist",
    ".local/skills",
    "attached_assets",
  ];

  archive.glob("**/*", {
    cwd: WORKSPACE_ROOT,
    ignore: excludeDirs.flatMap((d) => [`${d}/**`, `**/${d}/**`, `${d}`]),
    dot: true,
  });

  await archive.finalize();
});

export default router;
