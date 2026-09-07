// Local preview helper for `npm start`.
// - Static export (default): serves the generated `out/` folder, exactly like
//   Render Static Site does.
// - NEXT_STATIC_EXPORT=false (sandbox previews only): falls back to `next start`.
require("dotenv").config();
const { spawnSync } = require("child_process");

const port = process.env.PORT || "3000";
const isStatic = process.env.NEXT_STATIC_EXPORT !== "false";
const cmd = isStatic
  ? ["npx", ["serve", "out", "-l", `tcp://0.0.0.0:${port}`]]
  : ["npx", ["next", "start", "-p", port]];

const res = spawnSync(cmd[0], cmd[1], { stdio: "inherit", shell: process.platform === "win32" });
process.exit(res.status ?? 1);
