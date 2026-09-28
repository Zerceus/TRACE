import type { AnalysisResult } from '../types/analysis'

export const MOCK_TYPESCRIPT_ERROR: AnalysisResult = {
  title: 'Cannot set properties of undefined',
  category: 'Runtime Error',
  severity: 'high',
  symptom: "TypeError: Cannot set properties of undefined (setting 'tenantGuid')",
  rootCause: '`options` is declared as `undefined` and is never initialized to an object before a property is assigned to it.',
  confidence: 'high',
  evidence: [
    '`options` is explicitly initialized as `undefined` on line 2.',
    '`filter.tenantGuid` is truthy — so the conditional block is entered.',
    '`options.tenantGuid = filter.tenantGuid` attempts property assignment on `undefined`.',
    'JavaScript does not coerce `undefined` to an object for assignment — it throws immediately.',
  ],
  executionFlow: [
    {
      label: 'HTTP request received',
      description: 'An API call or UI action triggers getAllMyTaskRecord() with a filter object that includes a tenantGuid field.',
      status: 'normal',
    },
    {
      label: 'getAllMyTaskRecord(filter) called',
      description: 'The function begins executing. The filter parameter is a valid object with tenantGuid present.',
      status: 'normal',
    },
    {
      label: 'options = undefined',
      description: '`options` is declared with the literal value `undefined`. No object is created. This is the seed of the failure.',
      status: 'warning',
    },
    {
      label: 'filter.tenantGuid check passes',
      description: 'The guard condition is truthy, so execution enters the if-block. This is intentional — but it means the unsafe assignment will now execute.',
      status: 'warning',
    },
    {
      label: 'options.tenantGuid = filter.tenantGuid',
      description: '`options` has no object reference at this point. JavaScript cannot assign a property to `undefined`. The runtime throws immediately.',
      status: 'failure',
    },
    {
      label: '💥 TypeError thrown',
      description: 'Uncaught TypeError: Cannot set properties of undefined (setting \'tenantGuid\'). The Observable is never returned. The HTTP request is never made.',
      status: 'failure',
    },
  ],
  fix: {
    before: `let options = undefined;

if (filter.tenantGuid) {
  options.tenantGuid = filter.tenantGuid;
}`,
    after: `let options: Record<string, unknown> = {};

if (filter.tenantGuid) {
  options.tenantGuid = filter.tenantGuid;
}`,
    explanation: 'Changing the initializer from `undefined` to `{}` creates an actual object reference. Property assignment on an empty object is valid. The rest of the logic is unchanged — the smallest safe fix.',
  },
  regressionRisk: {
    level: 'medium',
    reason: 'The pattern of declaring an options variable as `undefined` and conditionally populating it is likely repeated elsewhere in the codebase. Any future caller that passes a filter with tenantGuid will hit this if the initialization is not fixed consistently.',
    tests: [
      'filter.tenantGuid is present — options object should be passed to postApi',
      'filter.tenantGuid is absent — options should remain empty or undefined',
      'filter is an empty object — no error should be thrown',
      'filter is null or undefined — guard should prevent crash',
    ],
  },
  prevention: [
    'Always initialize optional object accumulators to `{}` rather than `undefined` before conditional property assignment.',
    'Add TypeScript strict null checks (`"strictNullChecks": true`) — the compiler would have caught this assignment.',
    'Define a typed interface for request options instead of `any` to make missing fields explicit at compile time.',
    'Add unit tests for every conditional path that modifies an options object before passing it to an HTTP layer.',
  ],
}

export const MOCK_SQL_ERROR: AnalysisResult = {
  title: 'relation "users" does not exist',
  category: 'SQL / Database Error',
  severity: 'high',
  symptom: 'ERROR: relation "users" does not exist at character 15',
  rootCause: 'The query targets a table named "users" (lowercase, no schema prefix), but the table either lives in a non-default schema, was never created, or was created with a quoted mixed-case name.',
  confidence: 'high',
  evidence: [
    'PostgreSQL error code 42P01 (undefined_table) confirms the relation cannot be found.',
    'The query uses an unqualified table name "users" with no schema prefix.',
    'Default search_path is typically `public` — if the table is in another schema, it will not be found.',
    'Common cause: migration ran against the wrong database or the migration itself was never executed.',
  ],
  executionFlow: [
    {
      label: 'Application query issued',
      description: 'The application sends SELECT * FROM users WHERE id = $1 to the PostgreSQL connection pool.',
      status: 'normal',
    },
    {
      label: 'PostgreSQL parses query',
      description: 'The SQL parser tokenizes the statement and identifies "users" as an unqualified relation reference.',
      status: 'normal',
    },
    {
      label: 'Schema search_path resolution',
      description: 'PostgreSQL searches schemas in search_path order (typically: "$user", public). The table "users" is not found in any of them.',
      status: 'warning',
    },
    {
      label: 'Catalog lookup fails',
      description: 'pg_catalog.pg_class has no entry matching relname="users" in any accessible schema. PostgreSQL cannot proceed with query planning.',
      status: 'failure',
    },
    {
      label: '💥 ERROR 42P01 thrown',
      description: 'relation "users" does not exist — query is aborted, transaction is rolled back, and the error is returned to the application.',
      status: 'failure',
    },
  ],
  fix: {
    before: `SELECT * FROM users WHERE id = $1;`,
    after: `-- Option 1: qualify the schema explicitly
SELECT * FROM public.users WHERE id = $1;

-- Option 2: ensure migration has run
-- psql -d your_db -f migrations/001_create_users.sql

-- Option 3: verify correct database
-- \\c your_database
-- \\dt users`,
    explanation: 'Either qualify the table with its schema name, or verify the migration creating the users table has been applied to the target database. Check `\\dt users` in psql to confirm the table exists and is visible to the current role.',
  },
  regressionRisk: {
    level: 'high',
    reason: 'Missing migrations in staging/production environments are a recurring class of failure. Without a migration health-check on startup, this can silently affect any table, not just users.',
    tests: [
      'Run migration in a fresh database — verify all tables are created',
      'Query pg_tables to assert "users" exists before running integration tests',
      'Test connection with a role that has restricted search_path',
      'Add a startup check that validates required tables exist',
    ],
  },
  prevention: [
    'Run a schema validation step (e.g. `SELECT tablename FROM pg_tables`) as part of your CI pipeline before integration tests.',
    'Adopt a migration tool (Flyway, Liquibase, or Prisma Migrate) with explicit version tracking so missing migrations are caught automatically.',
    'Use fully qualified table names (schema.table) in production queries to eliminate search_path ambiguity.',
    'Add a database readiness probe to your application startup that fails fast if required tables are missing.',
  ],
}

export const MOCK_API_BREAKING_CHANGE: AnalysisResult = {
  title: "Breaking field rename: 'user_id' → 'userId'",
  category: 'API Breaking Change',
  severity: 'critical',
  symptom: "API consumers receive undefined for user_id — authentication and authorization checks silently fail.",
  rootCause: "The API response schema changed the field name from snake_case `user_id` to camelCase `userId` without a deprecation period or versioning. All consumers that reference `response.user_id` now receive `undefined`.",
  confidence: 'high',
  evidence: [
    'Git diff shows `user_id` renamed to `userId` in the serializer/response transformer.',
    'No API version bump — the change ships under the same endpoint and version.',
    'Consumer code references `response.user_id` — this now evaluates to `undefined` silently.',
    'Authorization middleware that reads `user_id` will now pass `undefined` to downstream services.',
  ],
  executionFlow: [
    {
      label: 'Client calls GET /api/v1/session',
      description: 'Consumer sends authenticated request expecting the existing response contract.',
      status: 'normal',
    },
    {
      label: 'Server processes request',
      description: 'Request is valid, authentication succeeds, session data is fetched from the database.',
      status: 'normal',
    },
    {
      label: 'Response serializer runs',
      description: 'The serializer now outputs `userId` instead of `user_id`. The field is present, but under a new name the consumer does not know about.',
      status: 'warning',
    },
    {
      label: "Consumer reads response.user_id",
      description: '`response.user_id` is `undefined` — the field exists as `response.userId` but the consumer was never notified of the rename.',
      status: 'failure',
    },
    {
      label: '💥 Silent authorization failure',
      description: 'Downstream auth checks receive `undefined` as the user identity. Depending on the guard logic, this either throws, grants access to nobody, or — worst case — bypasses the check entirely.',
      status: 'failure',
    },
  ],
  fix: {
    before: `// Server serializer (breaking change)
{
  "userId": "abc-123",   // renamed from user_id
  "email": "user@example.com"
}

// Consumer (now broken)
const userId = response.user_id; // undefined`,
    after: `// Option A: revert server — keep both fields during transition
{
  "user_id": "abc-123",     // keep original
  "userId": "abc-123",      // add new
  "email": "user@example.com"
}

// Option B: version the endpoint
// GET /api/v2/session → userId
// GET /api/v1/session → user_id (deprecated)

// Option C: update consumer immediately
const userId = response.userId ?? response.user_id;`,
    explanation: 'For an immediate fix, emit both field names simultaneously (dual-write) and deprecate the old one. This buys time to migrate all consumers without downtime. Never rename fields in a non-versioned API without a deprecation window.',
  },
  regressionRisk: {
    level: 'high',
    reason: 'API field renames are a class of breaking change that TypeScript types alone cannot catch if the types are auto-generated from an outdated schema or are typed as `any`. Every consumer of this endpoint is affected.',
    tests: [
      'Contract test: assert response schema contains user_id field',
      'Consumer integration test: verify auth token derived from user_id is valid',
      'Regression test: simulate old consumer calling new API — assert no silent undefined',
      'Add schema snapshot test that fails on any field removal or rename',
    ],
  },
  prevention: [
    'Never rename or remove response fields without a versioned endpoint and a deprecation period.',
    'Add consumer-driven contract tests (e.g. Pact) so breaking changes are caught before deployment.',
    'Generate TypeScript types from your API schema (OpenAPI/zod) so field renames produce compile-time errors in consumers.',
    'Treat any API field rename as a major version bump — bump the endpoint version and keep the old one alive.',
  ],
}

export const MOCK_UNKNOWN: AnalysisResult = {
  title: 'Insufficient Evidence for Analysis',
  category: 'Analysis Unavailable',
  severity: 'low',
  symptom: 'Live AI analysis is not configured.',
  rootCause: 'TRACE is running in mock mode without an OpenAI API key. Deterministic analysis is only available for the three built-in demo examples.',
  confidence: 'low',
  evidence: [
    'No VITE_OPENAI_API_KEY environment variable is set.',
    'The input does not match any of the three demo examples.',
    'Live AI analysis would require a valid API key to proceed.',
  ],
  executionFlow: [
    {
      label: 'Input received',
      description: 'TRACE received the pasted evidence.',
      status: 'normal',
    },
    {
      label: 'Mock pattern matching',
      description: 'The input was compared against known demo patterns. No match was found.',
      status: 'warning',
    },
    {
      label: '⚠️ Live AI unavailable',
      description: 'Without an API key, TRACE cannot perform live analysis on arbitrary input. Add VITE_OPENAI_API_KEY to your .env to enable full analysis.',
      status: 'failure',
    },
  ],
  fix: {
    before: '# .env\n# (no API key configured)',
    after: '# .env\nVITE_OPENAI_API_KEY=sk-your-key-here',
    explanation: 'Create a .env file in the project root with your OpenAI API key. Restart the dev server. TRACE will switch to live AI analysis automatically.',
  },
  regressionRisk: {
    level: 'low',
    reason: 'This is a configuration issue, not a code defect.',
    tests: [
      'Verify VITE_OPENAI_API_KEY is present in the environment',
      'Restart the dev server after adding the key',
      'Test with one of the three demo examples to confirm live mode',
    ],
  },
  prevention: [
    'Add VITE_OPENAI_API_KEY to your .env file to enable live AI analysis.',
    'Use the three built-in demo examples (TypeScript Error, SQL Error, API Breaking Change) to explore TRACE without an API key.',
    'Consult the README for full setup instructions.',
  ],
}
