# Types Directory

## Why Types Are Separate from Services

**Issue:** Vite/ESBuild has problems with TypeScript type exports when they're defined in the same file as runtime code (classes, functions). The error looks like:

```
Uncaught SyntaxError: The requested module '/src/services/xxx.service.ts' does not provide an export named 'TypeName'
```

**Root Cause:** When Vite transforms TypeScript files, type-only exports can get stripped or mishandled when mixed with runtime exports. This is especially problematic with:
- `interface` declarations
- `type` declarations
- Class-based services

**Solution:** Keep types in separate `.types.ts` files in this directory, then:

1. Import types in service files: `import type { MyType } from '../types/my.types';`
2. Re-export from service for convenience: `export type { MyType } from '../types/my.types';`
3. Components should import directly from types: `import type { MyType } from '../../types/my.types';`

## File Naming Convention

- `{feature}.types.ts` - Types for a specific feature
- Example: `recipe-comments.types.ts`, `activity-feed.types.ts`

## Example Pattern

```typescript
// types/example.types.ts
export type MyData = {
  id: string;
  name: string;
};

// services/example.service.ts
import { api } from './api';
import type { MyData } from '../types/example.types';
export type { MyData } from '../types/example.types';

export const exampleService = {
  async getData(): Promise<MyData> {
    const response = await api.get<MyData>('/data');
    return response.data;
  },
};

// components/MyComponent.tsx
import type { MyData } from '../../types/example.types';
```
