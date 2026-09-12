// lint-staged.config.js
export default {
  '*.{ts,js,mjs,cjs}': ['eslint --fix', 'prettier --write'],
  '*.{json,yml,yaml,css}': ['prettier --write'],
  '*.tf': () => 'terraform fmt -recursive infra/terraform',
  // Typecheck global: no se puede hacer "por archivo" en TS.
  '**/*.ts': () => 'pnpm run typecheck',
};
