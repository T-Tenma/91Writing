#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { glob } from "glob";  // ✅ 使用命名导出
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
const declaredDeps = new Set([
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
]);

// 扫描 src 目录下的所有 js/ts/vue 文件
const files = glob.sync("src/**/*.{js,ts,vue,jsx,tsx}", { absolute: true });

const importRegex = /from\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\)/g;

const usedDeps = new Set();

for (const file of files) {
  const content = fs.readFileSync(file, "utf-8");
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const dep = match[1] || match[2];
    if (!dep) continue;
    // 忽略相对路径和绝对路径
    if (dep.startsWith(".") || dep.startsWith("/")) continue;
    // 只取包名（去掉子路径）
    const pkgName = dep.startsWith("@")
      ? dep.split("/").slice(0, 2).join("/")
      : dep.split("/")[0];
    usedDeps.add(pkgName);
  }
}

const missing = [...usedDeps].filter((dep) => !declaredDeps.has(dep));

if (missing.length) {
  console.log("⚠️  以下依赖被代码引用，但没有在 package.json 中声明：");
  for (const dep of missing) {
    console.log("   - " + dep);
  }
  console.log("\n👉 你可以运行以下命令安装它们：");
  console.log(`   pnpm add ${missing.join(" ")}`);
} else {
  console.log("✅ 没有缺失的依赖，一切正常！");
}
