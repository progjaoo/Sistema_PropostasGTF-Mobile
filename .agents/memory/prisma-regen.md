---
name: Prisma client regeneration
description: When the API server crashes with missing Prisma exports, regenerate the client
---

# Prisma Client Regeneration

## Rule
If the API server fails to start with `SyntaxError: The requested module '@prisma/client' does not provide an export named '...'`, the Prisma generated client is stale and must be regenerated.

**Why:** The schema defines enums/models that have not been generated into the client yet (e.g. after a schema change without running `prisma generate`).

## How to apply
```bash
cd lib/db && pnpm prisma generate
```
Then restart the API server workflow. This is fast (~500ms) and safe to run at any time.
