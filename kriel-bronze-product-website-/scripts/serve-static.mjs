import { spawn } from "node:child_process";

const child = spawn("npx", ["next", "start", "-p", process.env.PORT || "3000"], {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code);
});
