// push.js
import { execSync } from "child_process";

const message = process.argv[2] || "update";
execSync(`git add . && git commit -m "${message}" && git push`, {
  stdio: "inherit",
});
