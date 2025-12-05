# System Patterns

> The "How" document - defines architectural decisions and conventions.

## Technology Stack

| Layer | Technology | Version | Notes |
|-------|------------|---------|-------|
| Frontend | [e.g., Next.js] | [14.x] | [App Router] |
| Backend | [e.g., FastAPI] | [0.100+] | |
| Database | [e.g., PostgreSQL] | [15+] | |
| ORM | [e.g., Prisma] | [5.x] | |
| Auth | [e.g., NextAuth] | | |
| Hosting | [e.g., Vercel] | | |

## Project Structure

```
/
├── src/
│   ├── app/              # [Description]
│   ├── components/       # [Description]
│   ├── lib/             # [Description]
│   └── ...
├── tests/
└── ...
```

## Architectural Decisions

### [Decision 1: e.g., "State Management"]

**Decision:** [What was decided]  
**Rationale:** [Why this choice]  
**Alternatives Considered:** [What else was evaluated]

### [Decision 2]

**Decision:** [What was decided]  
**Rationale:** [Why this choice]

## Code Conventions

### Naming

- Components: `PascalCase` (e.g., `UserProfile.tsx`)
- Utilities: `camelCase` (e.g., `formatDate.ts`)
- Constants: `SCREAMING_SNAKE` (e.g., `MAX_RETRIES`)
- CSS/Styles: [Convention used]

### File Organization

- [Pattern 1: e.g., "Feature-based folders for components"]
- [Pattern 2: e.g., "Co-locate tests with source files"]

### API Design

- [Pattern: e.g., "RESTful endpoints under /api/v1"]
- [Error format specification]

## Design Patterns in Use

| Pattern | Where Used | Example |
|---------|------------|---------|
| [Repository] | [Data access] | `UserRepository` |
| [Factory] | [Object creation] | `createUser()` |
| [Observer] | [Event handling] | `eventBus.on()` |

## Integration Points

### External APIs

| Service | Purpose | Auth Method |
|---------|---------|-------------|
| [Service 1] | [Purpose] | [API Key / OAuth] |

### Internal Services

- [Service communication patterns]

## Testing Strategy

- **Unit Tests:** [Framework, coverage target]
- **Integration Tests:** [Approach]
- **E2E Tests:** [Framework, what's covered]

## Performance Budgets

| Metric | Budget |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Bundle Size | < 200KB |

---

*Last Updated: [Date]*
