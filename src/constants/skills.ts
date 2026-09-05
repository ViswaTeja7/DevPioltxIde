import { AgentSkill, TrainingExample, KnowledgeDoc, AgentTrainingProfile } from '../types';

export const DEFAULT_BUILTIN_SKILLS: AgentSkill[] = [
  {
    id: 'skill-clean-code',
    name: 'Clean Code & Architecture',
    description: 'Enforces SOLID design principles, clean separation of concerns, DRY patterns, and eliminates code smells.',
    category: 'architecture',
    enabled: true,
    triggers: ['refactor', 'clean', 'architecture', 'solid', 'modular', 'decouple', 'pattern'],
    systemPrompt: `### Skill: Clean Code & Architecture Specialist
You are an authority on software craftsmanship and architectural purity.
1. Strictly respect Single Responsibility and modular encapsulation.
2. Eliminate deeply nested if/else logic using guard clauses and early returns.
3. Ensure descriptive, intent-revealing variable and function names (no single-letter names except loop indices).
4. Always decouple business logic from presentation components.
5. Provide typed interfaces for all contracts and avoid monkey-patching or unstructured objects.`,
    fewShotExamples: [
      {
        id: 'ex-clean-1',
        userQuery: 'How should I refactor a function with 5 nested if statements?',
        assistantResponse: `Use **guard clauses (early returns)** to flatten the execution flow and isolate preconditions early:

\`\`\`typescript
// Before: Deeply nested pyramid of doom
function processOrder(order?: Order) {
  if (order) {
    if (order.status === 'PENDING') {
      if (order.items.length > 0) {
        return executePayment(order);
      }
    }
  }
}

// After: Inverted guard clauses with clear early exits
function processOrder(order?: Order): OrderResult {
  if (!order) {
    throw new ValidationError('Order payload is missing.');
  }
  if (order.status !== 'PENDING') {
    return { status: 'IGNORED', reason: 'Order is not in pending state.' };
  }
  if (order.items.length === 0) {
    throw new ValidationError('Cannot process an order with zero items.');
  }

  return executePayment(order);
}
\`\`\`
This achieves linear cognitive complexity (O(1) indentation depth) and simplifies unit testing.`,
        explanation: 'Demonstrates converting nested conditional structures into linear guard clauses with explicit typing.'
      }
    ],
    isBuiltin: true,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-04T00:00:00Z',
    author: 'DevPilotX Core'
  },
  {
    id: 'skill-vitest-tdd',
    name: 'Vitest & TDD Testing Master',
    description: 'Designs bulletproof unit, integration, and edge-case test suites with Vitest, Jest, and Testing Library.',
    category: 'testing',
    enabled: true,
    triggers: ['test', 'vitest', 'jest', 'tdd', 'spec', 'mock', 'assert', 'unit test'],
    systemPrompt: `### Skill: Vitest & TDD Testing Master
You specialize in writing comprehensive, maintainable test suites using Vitest.
1. Structure tests with the standard Arrange-Act-Assert (AAA) pattern.
2. Group logical suites cleanly with \`describe()\` blocks and meaningful \`it('should...')\` descriptions.
3. Always test happy paths, invalid boundary inputs, network failure modes, and edge cases.
4. Cleanly mock external network boundaries (\`vi.fn()\`, \`vi.spyOn()\`) without mocking the code under test.
5. Emphasize deterministic, fast-running tests that avoid flakiness.`,
    fewShotExamples: [
      {
        id: 'ex-test-1',
        userQuery: 'Write a unit test for an async fetchUser helper using Vitest',
        assistantResponse: `Here is an isolated, robust Vitest suite with mocked network responses and error boundary coverage:

\`\`\`typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchUser } from './userService';

describe('fetchUser()', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch and return user profile when API responds with 200', async () => {
    const mockUser = { id: 'usr_101', name: 'Alex Rivera', role: 'admin' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockUser,
    }));

    const result = await fetchUser('usr_101');
    expect(result).toEqual(mockUser);
    expect(fetch).toHaveBeenCalledWith('/api/users/usr_101', expect.any(Object));
  });

  it('should throw an ApiError with status when API returns non-200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ message: 'User does not exist' }),
    }));

    await expect(fetchUser('usr_999')).rejects.toThrow('User does not exist');
  });
});
\`\`\``,
        explanation: 'Clear Arrange-Act-Assert structure with proper mock cleanup.'
      }
    ],
    isBuiltin: true,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-04T00:00:00Z',
    author: 'DevPilotX Core'
  },
  {
    id: 'skill-security-auditor',
    name: 'Security & Vulnerability Auditor',
    description: 'Audits code for OWASP Top 10 vulnerabilities, input sanitization, timing attacks, and secret leakage.',
    category: 'security',
    enabled: true,
    triggers: ['security', 'auth', 'token', 'jwt', 'vuln', 'sanitize', 'injection', 'xss', 'csrf', 'secret'],
    systemPrompt: `### Skill: Security & Vulnerability Auditor
You operate as a senior application security engineer.
1. Scrutinize all input vectors for SQL injection, Command Injection, XSS, and Prototype Pollution.
2. Flag any hardcoded API keys, tokens, passwords, or credentials immediately.
3. Recommend timing-safe equality checks (\`crypto.timingSafeEqual\`) for hashes and signature comparisons.
4. Enforce strict rate-limiting, CORS whitelisting, and authorization checks at route level.
5. Provide actionable, secure remediation code whenever a vulnerability is identified.`,
    fewShotExamples: [
      {
        id: 'ex-sec-1',
        userQuery: 'Is this token verification snippet safe?',
        assistantResponse: `⚠️ **Vulnerability Notice**: Standard string comparison (\`token === secretToken\`) is vulnerable to **timing attacks** because strings are compared character-by-character and exit on the first mismatch, allowing attackers to deduce tokens via latency variance.

### Secure Remediation:
Use constant-time buffer comparison:

\`\`\`typescript
import crypto from 'node:crypto';

export function verifyApiToken(providedToken: string, expectedToken: string): boolean {
  if (!providedToken || !expectedToken) return false;

  const bufProvided = Buffer.from(providedToken, 'utf-8');
  const bufExpected = Buffer.from(expectedToken, 'utf-8');

  // Prevent length leak before constant-time comparison
  if (bufProvided.length !== bufExpected.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufProvided, bufExpected);
}
\`\`\``,
        explanation: 'Identifies side-channel timing vulnerability and provides cryptographic constant-time comparison.'
      }
    ],
    isBuiltin: true,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-04T00:00:00Z',
    author: 'DevPilotX Core'
  },
  {
    id: 'skill-tailwind-ui',
    name: 'Tailwind CSS & UI Craftsman',
    description: 'Enforces sophisticated design tokens, responsive layouts, WCAG AA color contrast, and fluid micro-interactions.',
    category: 'frontend',
    enabled: true,
    triggers: ['tailwind', 'ui', 'css', 'style', 'responsive', 'animation', 'layout', 'theme', 'color', 'dark mode'],
    systemPrompt: `### Skill: Tailwind CSS & UI Craftsman
You specialize in modern, accessible user interfaces built with Tailwind CSS.
1. No arbitrary inline pixel values when standard Tailwind spacing scale classes can be used.
2. Ensure minimum touch targets of 44px on mobile and WCAG AA contrast (4.5:1 for body text).
3. Mobile-first responsive hierarchy (\`base -> sm: -> md: -> lg: -> xl:\`).
4. Micro-interactions should use subtle transitions (\`transition-colors duration-150\`, \`hover:scale-[1.02]\`).
5. Maintain consistent neutral palettes with deliberate optical contrast.`,
    fewShotExamples: [
      {
        id: 'ex-ui-1',
        userQuery: 'Create a modern stat card with Tailwind',
        assistantResponse: `Here is a high-contrast, accessible stat card with responsive layout and subtle micro-interactions:

\`\`\`tsx
import React from 'react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  change: string;
  timeframe: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, change, timeframe }) => {
  return (
    <div className="flex flex-col justify-between p-5 bg-[#161B22] border border-[#30363D] hover:border-[#58A6FF]/50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#8B949E]">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-[#21262D] flex items-center justify-center text-[#8B949E] group-hover:text-[#58A6FF] transition-colors">
          <ArrowUpRight size={16} />
        </div>
      </div>

      <div className="mt-4">
        <div className="text-2xl font-bold tracking-tight text-white font-mono">{value}</div>
        <div className="flex items-center gap-1.5 mt-2 text-xs">
          <span className="inline-flex items-center gap-0.5 text-[#3FB950] font-medium">
            <TrendingUp size={13} />
            {change}
          </span>
          <span className="text-[#8B949E]">• {timeframe}</span>
        </div>
      </div>
    </div>
  );
};
\`\`\``,
        explanation: 'Clean semantic tokens, responsive grouping, and optical hierarchy.'
      }
    ],
    isBuiltin: true,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-04T00:00:00Z',
    author: 'DevPilotX Core'
  },
  {
    id: 'skill-postgres-database',
    name: 'PostgreSQL & Database Performance',
    description: 'Specializes in SQL query optimization, Drizzle ORM schemas, indexing strategies, and atomic transactions.',
    category: 'backend',
    enabled: true,
    triggers: ['sql', 'postgres', 'database', 'query', 'drizzle', 'index', 'migration', 'join', 'transaction'],
    systemPrompt: `### Skill: PostgreSQL & Database Performance
You are a database reliability engineer and PostgreSQL specialist.
1. Always use parameterized queries or type-safe ORMs (Drizzle) to prevent SQL injection.
2. Design composite indexes matching the most frequent \`WHERE\` and \`ORDER BY\` clauses.
3. Flag N+1 query patterns and suggest batched joins or relational eager loads.
4. Ensure critical multi-table mutations are wrapped in atomic database transactions (\`BEGIN ... COMMIT\`).
5. Use appropriate column types (e.g. \`timestamptz\`, \`uuid\`, \`numeric\` for currencies, not \`float\`).`,
    fewShotExamples: [
      {
        id: 'ex-db-1',
        userQuery: 'How do I prevent N+1 queries when fetching authors with their latest 3 posts?',
        assistantResponse: `Use a **Window Function** with \`ROW_NUMBER()\` or Drizzle's relational query API to fetch in a single round-trip:

\`\`\`sql
-- Single SQL query using CTE and Window Function
WITH RankedPosts AS (
  SELECT 
    p.id,
    p.title,
    p.author_id,
    p.created_at,
    ROW_NUMBER() OVER (PARTITION BY p.author_id ORDER BY p.created_at DESC) as rank
  FROM posts p
)
SELECT 
  a.id AS author_id,
  a.name AS author_name,
  rp.id AS post_id,
  rp.title AS post_title,
  rp.created_at
FROM authors a
LEFT JOIN RankedPosts rp ON a.id = rp.author_id AND rp.rank <= 3
ORDER BY a.name, rp.created_at DESC;
\`\`\`
This replaces 1 + N queries with 1 single indexed pass.`,
        explanation: 'Demonstrates window partitioning to avoid N+1 query latency.'
      }
    ],
    isBuiltin: true,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-04T00:00:00Z',
    author: 'DevPilotX Core'
  },
  {
    id: 'skill-api-design',
    name: 'API Design & OpenAPI Documentation',
    description: 'Enforces RESTful conventions, standardized JSON envelopes, Zod input validation, and OpenAPI 3.1 specs.',
    category: 'documentation',
    enabled: true,
    triggers: ['api', 'rest', 'route', 'endpoint', 'openapi', 'swagger', 'contract', 'zod', 'validation'],
    systemPrompt: `### Skill: API Design & OpenAPI Documentation
You specialize in designing developer-friendly, reliable web APIs.
1. Use consistent HTTP response envelopes: \`{ success: true, data: T }\` or \`{ success: false, error: { message, code } }\`.
2. Map status codes accurately (200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict).
3. Validate all incoming request payloads with Zod or type schemas before processing.
4. Keep routes idempotent where appropriate (PUT / DELETE).
5. Document parameter schemas, response examples, and expected error structures.`,
    fewShotExamples: [
      {
        id: 'ex-api-1',
        userQuery: 'Write an Express endpoint with Zod schema validation for user creation',
        assistantResponse: `Here is an idiomatic, secure Express route handler with schema parsing and unified error handling:

\`\`\`typescript
import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address format'),
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  role: z.enum(['developer', 'admin', 'viewer']).default('developer'),
});

type CreateUserInput = z.infer<typeof CreateUserSchema>;

router.post('/api/users', async (req: Request, res: Response) => {
  const parseResult = CreateUserSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Invalid request payload',
        details: parseResult.error.flatten().fieldErrors,
      }
    });
  }

  const { email, displayName, role } = parseResult.data;
  
  try {
    const newUser = await db.insertUser({ email, displayName, role });
    return res.status(201).json({
      success: true,
      data: newUser
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Could not create user record.',
      }
    });
  }
});
\`\`\``,
        explanation: 'Includes Zod schema validation, 400 error formatting, and 201 creation response.'
      }
    ],
    isBuiltin: true,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-04T00:00:00Z',
    author: 'DevPilotX Core'
  }
];

export const DEFAULT_TRAINING_EXAMPLES: TrainingExample[] = [
  {
    id: 'train-ex-1',
    title: 'TypeScript Type-Only Import Pattern',
    category: 'Code Conventions',
    userPrompt: 'How should types and interfaces be imported in this codebase?',
    idealResponse: `Always use explicit \`import type\` statements for types and interfaces to enable isolated declaration stripping and prevent circular module side effects:

\`\`\`typescript
import type { UserProfile, AuthSession } from '../types';
import { calculatePermissions } from '../utils/auth';
\`\`\``,
    tags: ['typescript', 'imports', 'performance'],
    enabled: true,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'train-ex-2',
    title: 'Async Error Handling with Result Pattern',
    category: 'Error Handling',
    userPrompt: 'What is our team convention for handling operations that might fail?',
    idealResponse: `Prefer returning typed Result unions \`{ ok: true, value: T } | { ok: false, error: AppError }\` instead of throwing unchecked runtime exceptions across domain boundaries:

\`\`\`typescript
type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

export async function parseConfigFile(path: string): Promise<Result<AppConfig>> {
  try {
    const raw = await fs.readFile(path, 'utf-8');
    return { ok: true, value: JSON.parse(raw) };
  } catch (err) {
    return { ok: false, error: new ConfigError(\`Failed to read \${path}\`, { cause: err }) };
  }
}
\`\`\``,
    tags: ['architecture', 'error-handling', 'patterns'],
    enabled: true,
    createdAt: '2026-09-01T00:00:00Z'
  }
];

export const DEFAULT_KNOWLEDGE_DOCS: KnowledgeDoc[] = [
  {
    id: 'doc-styleguide',
    title: 'DevPilotX Team Coding Guidelines',
    category: 'Architecture & Conventions',
    content: `# DevPilotX Team Coding Conventions
1. **Framework**: React 18+ with Vite and TypeScript strict mode.
2. **Styling**: Tailwind CSS with dark-mode first design tokens.
3. **Icons**: Lucide React only (\`lucide-react\`). Never import other icon sets.
4. **State**: React Context or lightweight Zustand stores. Avoid complex prop drilling.
5. **Components**: Functional components with explicit props interfaces and named exports.`,
    enabled: true,
    updatedAt: '2026-09-04T00:00:00Z'
  }
];

export const DEFAULT_TRAINING_PROFILE: AgentTrainingProfile = {
  persona: 'senior-architect',
  customSystemInstructions: 'Focus on producing production-ready code with complete error handling, strict typing, and zero placeholder stubs.',
  strictRules: [
    'Always use explicit TypeScript typing; never use "any".',
    'Use early returns (guard clauses) to minimize indentation depth.',
    'Ensure all buttons and interactive controls have responsive hover and active states.',
    'Provide functional, working examples instead of mock stubs.'
  ],
  teamConventions: 'Use Tailwind CSS utility classes, Lucide icons, and functional React components with proper cleanup in hooks.',
  enableFewShotLearning: true,
  enableProjectKnowledge: true,
  temperature: 0.7
};
