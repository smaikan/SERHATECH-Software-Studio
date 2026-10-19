import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-config-next'in varsayılan ignore'larını eziyoruz.
  globalIgnores([
    // eslint-config-next'in varsayılan ignore'ları:
    ".next/**",
    ".next-e2e/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    ".playwright-mcp/**",
  ]),
]);

export default eslintConfig;
