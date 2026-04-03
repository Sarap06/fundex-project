---
paths:
  - "src/components/**/*.tsx"
  - "app/dashboard/**/*.tsx"
---
# Component Conventions

- Dashboard pages are large monoliths — when modifying, extract sub-sections into `_components/` directories
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes
- shadcn/ui primitives live in `src/components/ui/` — do not modify these directly, use composition
- New shadcn components: `npx shadcn@latest add <component>`
- Always use `'use client'` directive only when the component needs interactivity or browser APIs
- Import UI components with destructuring: `import { Button } from '@/components/ui/button'`
- Keep components focused — if a component exceeds 300 lines, consider splitting
