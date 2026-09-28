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

export const MOCK_NULL_ADDEVENTLISTENER: AnalysisResult = {
  title: "Cannot read properties of null (reading 'addEventListener')",
  category: 'DOM / Runtime Error',
  severity: 'high',
  symptom: "TypeError: Cannot read properties of null (reading 'addEventListener')",
  rootCause: "`document.getElementById('submit-btn')` returns `null` because the script executes before the DOM element exists. Property access on `null` throws immediately.",
  confidence: 'high',
  evidence: [
    "`document.getElementById('submit-btn')` returns `null` when the element is not yet in the DOM.',",
    '`button.addEventListener(...)` is called directly on the return value without a null guard.',
    '`initializeForm()` is called at script load time — before the DOM is fully parsed.',
    'Classic symptom of a script running in `<head>` without `defer`, or called before `DOMContentLoaded`.',
  ],
  executionFlow: [
    {
      label: 'Page begins loading',
      description: 'The browser starts parsing HTML and encounters the script tag. If the script is in <head> without defer/async, it executes immediately — before the body is rendered.',
      status: 'normal',
    },
    {
      label: 'initializeForm() called',
      description: 'The script calls initializeForm() synchronously at load time. The DOM has not finished parsing — the #submit-btn element does not exist yet.',
      status: 'warning',
    },
    {
      label: "getElementById('submit-btn') → null",
      description: 'The browser searches the current DOM for an element with id="submit-btn". Since the element hasn\'t been rendered yet, it returns null.',
      status: 'warning',
    },
    {
      label: 'button.addEventListener called on null',
      description: '`null.addEventListener(...)` — null has no properties. JavaScript cannot look up addEventListener on a null reference and throws immediately.',
      status: 'failure',
    },
    {
      label: '💥 TypeError thrown',
      description: "TypeError: Cannot read properties of null (reading 'addEventListener'). The event listener is never attached. The submit button will not respond to clicks.",
      status: 'failure',
    },
  ],
  fix: {
    before: `const button = document.getElementById('submit-btn');
button.addEventListener('click', handleSubmit);

initializeForm();`,
    after: `// Option A: guard against null
const button = document.getElementById('submit-btn');
if (button) {
  button.addEventListener('click', handleSubmit);
}

// Option B: defer until DOM is ready (recommended)
document.addEventListener('DOMContentLoaded', () => {
  initializeForm();
});`,
    explanation: 'Wrap DOM queries in a DOMContentLoaded listener so the script only runs after the full HTML is parsed. As a secondary safety net, always null-check the return value of getElementById before accessing its properties.',
  },
  regressionRisk: {
    level: 'medium',
    reason: 'Any script that queries DOM elements at the top level (outside DOMContentLoaded or a framework lifecycle hook) is vulnerable to this same class of error. If the element ID changes or the script load order changes, the bug reappears.',
    tests: [
      "getElementById returns a valid element when DOM is ready",
      "initializeForm() is safe to call before DOMContentLoaded — should no-op or defer",
      "submit-btn click handler fires correctly after full page load",
      "Page works correctly with script tag in <head> and in <body>",
    ],
  },
  prevention: [
    'Always wrap DOM manipulation code in DOMContentLoaded or place scripts at the bottom of <body>.',
    'Never call getElementById and immediately chain a method call without a null check.',
    'Use TypeScript with strict DOM types — HTMLElement | null forces null handling at compile time.',
    'Add integration tests that assert event listeners are attached after page load.',
  ],
}

export const MOCK_PYTHON_KEYERROR: AnalysisResult = {
  title: "KeyError: 'user_id'",
  category: 'Python / Runtime Error',
  severity: 'high',
  symptom: "KeyError: 'user_id' in verify_token() at app/routes/auth.py line 34",
  rootCause: "The JWT payload contains the key `sub` (standard JWT subject claim) instead of the custom key `user_id`. The code assumes a non-standard key name that was never present in the token.",
  confidence: 'high',
  evidence: [
    "The token payload shown is: `{\"sub\": \"abc123\", \"email\": \"user@example.com\", \"exp\": 1735689600}`.",
    "The key `user_id` is not present anywhere in the decoded payload.",
    "The code directly accesses `payload['user_id']` with no `.get()` fallback or KeyError handler.",
    "JWT standard uses `sub` (subject) for user identity — not `user_id`.",
  ],
  executionFlow: [
    {
      label: 'Client sends request with JWT',
      description: 'An authenticated HTTP request arrives with a Bearer token in the Authorization header.',
      status: 'normal',
    },
    {
      label: 'jwt.decode() succeeds',
      description: 'The token is valid, signature checks pass, expiry is valid. decode_token() returns the payload dict successfully.',
      status: 'normal',
    },
    {
      label: "payload['user_id'] accessed",
      description: "The code expects a custom key 'user_id' in the payload. The actual payload uses the standard JWT claim 'sub' for user identity. Python dict lookup raises KeyError for missing keys.",
      status: 'failure',
    },
    {
      label: '💥 KeyError raised',
      description: "KeyError: 'user_id' — Python raises immediately. The user_id variable is never assigned. The authentication check fails and the request is rejected with a 500 error.",
      status: 'failure',
    },
  ],
  fix: {
    before: `user_id = payload['user_id']`,
    after: `# Option A: read the standard JWT 'sub' claim
user_id = payload['sub']

# Option B: support both for backwards compatibility
user_id = payload.get('user_id') or payload.get('sub')
if not user_id:
    raise ValueError('Token missing user identity claim')`,
    explanation: "The JWT spec uses 'sub' (subject) as the standard user identity claim. Either update the key to 'sub', or use dict.get() with a fallback so missing keys return None instead of raising. Always validate that the resulting value is not None.",
  },
  regressionRisk: {
    level: 'high',
    reason: 'If the token issuer changes payload structure (e.g. during an auth provider migration), any hardcoded key access will break silently or raise. There are likely other places in the codebase reading payload keys directly.',
    tests: [
      "Token with 'sub' claim — verify_token() returns correct user_id",
      "Token with legacy 'user_id' claim — backwards compatibility check",
      "Token missing all identity claims — should raise AuthenticationError, not KeyError",
      "Expired token — should raise ExpiredSignatureError before key access",
    ],
  },
  prevention: [
    "Use payload.get('key') instead of payload['key'] for all JWT claim access — KeyError should never reach a 500 response.",
    'Define a typed dataclass or Pydantic model for your JWT payload so missing fields are caught at parse time.',
    'Write a JWT payload schema validator that runs immediately after decode() and raises AuthenticationError on missing required claims.',
    'Add a contract test that asserts the shape of every token your auth provider issues.',
  ],
}

export const MOCK_REACT_INFINITE_LOOP: AnalysisResult = {
  title: 'Maximum update depth exceeded — infinite re-render loop',
  category: 'React / Runtime Warning',
  severity: 'critical',
  symptom: 'Warning: Maximum update depth exceeded. Component calls setState inside useEffect with a dependency that changes on every render.',
  rootCause: '`filteredItems` is listed as a dependency of the useEffect that calls `setFilteredItems`. Every time the effect runs it updates `filteredItems`, which triggers the effect again — creating an infinite loop.',
  confidence: 'high',
  evidence: [
    '`filteredItems` appears in both the dependency array and is set inside the effect via `setFilteredItems`.',
    '`setLastUpdated(new Date())` creates a new Date object on every render — but `filteredItems` is the primary loop driver.',
    'React detects the cycle after hitting the maximum update depth (typically ~50 renders) and throws.',
    '`items` alone as a dependency would be safe — `filteredItems` is the self-referential dependency causing the loop.',
  ],
  executionFlow: [
    {
      label: 'Component renders',
      description: 'The component renders for the first time. `filteredItems` is initialized (empty array or initial value).',
      status: 'normal',
    },
    {
      label: 'useEffect fires',
      description: 'After render, React runs the effect because its dependencies ([items, filteredItems]) changed. processItems(items) runs and produces a new array.',
      status: 'normal',
    },
    {
      label: 'setFilteredItems(data) called',
      description: 'State is updated with the new processed array. React schedules a re-render. filteredItems now has a new reference.',
      status: 'warning',
    },
    {
      label: 'Component re-renders',
      description: 'Re-render triggered by the state update. filteredItems is now a different reference — which is listed as a dependency.',
      status: 'warning',
    },
    {
      label: '💥 Infinite loop — max depth exceeded',
      description: 'React detects the dependency changed again, fires the effect again, which updates state again. This cycle repeats until React hits the max update depth and throws.',
      status: 'failure',
    },
  ],
  fix: {
    before: `useEffect(() => {
  const data = processItems(items);
  setFilteredItems(data);
  setLastUpdated(new Date());
}, [items, filteredItems]);`,
    after: `useEffect(() => {
  const data = processItems(items);
  setFilteredItems(data);
  setLastUpdated(new Date());
}, [items]); // remove filteredItems — it is set by this effect, not a trigger`,
    explanation: "Remove `filteredItems` from the dependency array. The effect's job is to *produce* filteredItems from items — it should only re-run when `items` changes. Including its own output as a dependency creates a self-triggering loop.",
  },
  regressionRisk: {
    level: 'medium',
    reason: 'Any useEffect that both reads and writes the same state variable, or includes derived state in its dependency array, will produce this loop. This is one of the most common React mistakes and is easy to reintroduce during refactoring.',
    tests: [
      'Render component with initial items — assert no re-render loop (check render count)',
      'Update items prop — assert filteredItems updates exactly once',
      'Rapid items updates — assert component stabilizes without infinite renders',
      'setLastUpdated should not trigger re-processing of items',
    ],
  },
  prevention: [
    'Never include a state variable in a useEffect dependency array if that same effect calls its setter.',
    'Use the React ESLint plugin (eslint-plugin-react-hooks) — the exhaustive-deps rule flags unsafe dependency arrays.',
    'If you need to derive state from other state, prefer useMemo over useEffect + setState.',
    'Use React DevTools Profiler to detect components that render more than expected.',
  ],
}

export const MOCK_NODE_UNHANDLED_REJECTION: AnalysisResult = {
  title: 'UnhandledPromiseRejection — ECONNREFUSED to PostgreSQL',
  category: 'Node.js / Database Error',
  severity: 'critical',
  symptom: 'UnhandledPromiseRejectionWarning: Error: ECONNREFUSED connect ECONNREFUSED 127.0.0.1:5432',
  rootCause: 'The async route handler has no try/catch and no Express error middleware. When the database connection is refused (PostgreSQL not running or wrong port), the rejected promise propagates unhandled and crashes the process.',
  confidence: 'high',
  evidence: [
    'The route handler is `async` but contains no try/catch block.',
    '`await db.query(...)` throws when the database connection is refused.',
    'Express does not automatically catch async errors — unhandled rejections in async route handlers must be explicitly caught.',
    'ECONNREFUSED on 127.0.0.1:5432 means PostgreSQL is either not running, not on port 5432, or the connection pool was never initialized.',
    'No error middleware (`app.use((err, req, res, next) => {...})`) is shown in the code.',
  ],
  executionFlow: [
    {
      label: 'GET /users/:id request received',
      description: 'Express receives the request and calls the async route handler.',
      status: 'normal',
    },
    {
      label: 'getUser(id) called',
      description: 'The async helper is invoked. It attempts to run a query against the database connection pool.',
      status: 'normal',
    },
    {
      label: 'db.query() rejects — ECONNREFUSED',
      description: 'The database client attempts a TCP connection to 127.0.0.1:5432. The connection is refused — PostgreSQL is not accepting connections at that address.',
      status: 'failure',
    },
    {
      label: 'Promise rejection propagates unhandled',
      description: 'The rejected promise bubbles up through getUser() and into the route handler. With no try/catch and no Express error handler, Node.js receives an unhandled rejection.',
      status: 'failure',
    },
    {
      label: '💥 Process crash / UnhandledPromiseRejectionWarning',
      description: 'In Node 15+, unhandled promise rejections terminate the process. In older versions, a warning is emitted and the request hangs — the client receives no response.',
      status: 'failure',
    },
  ],
  fix: {
    before: `router.get('/users/:id', async (req, res) => {
  const user = await getUser(req.params.id);
  res.json(user);
});`,
    after: `// Option A: try/catch in the route handler
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await getUser(req.params.id);
    res.json(user);
  } catch (err) {
    next(err); // forward to Express error middleware
  }
});

// Option B: centralised error middleware (add once, covers all routes)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Option C: wrap all async handlers (library: express-async-errors)
// import 'express-async-errors'; // patches Express to catch async throws automatically`,
    explanation: 'Async route handlers in Express do not automatically forward thrown errors. Wrap every async handler in try/catch and call next(err), or use a library like express-async-errors that patches Express globally. Also ensure the database connection pool is established before the server starts accepting requests.',
  },
  regressionRisk: {
    level: 'high',
    reason: 'Every async route handler without try/catch is a potential process crash. This pattern is widespread in Express codebases and a single missed catch will take down the server in Node 15+.',
    tests: [
      'Route returns 500 (not crash) when database is unavailable',
      'Route returns user data when database is available and user exists',
      'Route returns 404 when user is not found — not 500',
      'Server continues accepting requests after a database error on one route',
    ],
  },
  prevention: [
    'Install express-async-errors or write a asyncHandler wrapper — never rely on manual try/catch in every route.',
    'Add a global Express error middleware (4-argument function) as the last app.use() call.',
    'Add a database readiness check on startup — fail fast before accepting traffic if the DB is unreachable.',
    'Add process.on("unhandledRejection") as a last-resort logger so crashes are always recorded.',
  ],
}

export const MOCK_GIT_NULL_CHECK_DELETED: AnalysisResult = {
  title: "Accidental null guard deletion — TypeError on null user",
  category: 'Git Diff / Regression',
  severity: 'critical',
  symptom: "TypeError: Cannot read properties of null (reading 'firstName') — in production after recent deploy",
  rootCause: "A refactor commit removed the null guard for the `user` parameter in `formatUserDisplay()`. The function now unconditionally accesses `user.firstName` and `user.profileImage.url` — both throw when `user` is `null`.",
  confidence: 'high',
  evidence: [
    "The diff shows 3 lines deleted: the `if (!user)` guard and its early return.",
    "The function signature `user: User | null` was unchanged — null is still a valid input.",
    "Callers that pass null (e.g. unauthenticated users, guest sessions) now receive a TypeError instead of the safe anonymous fallback.",
    "`user.profileImage.url` is a chained property access — even if user is non-null, a missing profileImage would also throw.",
  ],
  executionFlow: [
    {
      label: 'formatUserDisplay(null) called',
      description: 'A caller passes null — representing a guest user or unauthenticated session. This was a valid, handled case before the refactor.',
      status: 'normal',
    },
    {
      label: 'Null guard no longer present',
      description: 'The if (!user) early return was deleted in the refactor. Execution falls through directly to the return statement.',
      status: 'warning',
    },
    {
      label: 'user.firstName accessed on null',
      description: '`null.firstName` — JavaScript cannot read properties of null. The runtime throws immediately. The function never returns.',
      status: 'failure',
    },
    {
      label: '💥 TypeError in production',
      description: "TypeError: Cannot read properties of null (reading 'firstName'). Any page or component that calls formatUserDisplay with a null user now crashes. Guest users see an unhandled error.",
      status: 'failure',
    },
  ],
  fix: {
    before: `export function formatUserDisplay(user: User | null) {
  return {
    name: \`\${user.firstName} \${user.lastName}\`,
    avatar: user.profileImage.url,
  };
}`,
    after: `export function formatUserDisplay(user: User | null) {
  if (!user) {
    return { name: 'Anonymous', avatar: null };
  }
  return {
    name: \`\${user.firstName} \${user.lastName}\`,
    avatar: user.profileImage?.url ?? null,
  };
}`,
    explanation: "Restore the null guard that was deleted. Also add optional chaining on `profileImage?.url` to handle cases where a non-null user has no profile image. This is the exact state before the regression was introduced.",
  },
  regressionRisk: {
    level: 'high',
    reason: 'The function signature explicitly accepts `User | null`, meaning the null case is part of the public contract. Any refactor that removes the guard without changing the type signature is a silent regression. TypeScript strict mode would not have caught this — the guard is a runtime check, not a type error.',
    tests: [
      'formatUserDisplay(null) returns { name: "Anonymous", avatar: null }',
      'formatUserDisplay(validUser) returns correct name and avatar',
      'formatUserDisplay(userWithNoProfileImage) does not throw — avatar is null',
      'All callers that may pass null are covered by unit tests',
    ],
  },
  prevention: [
    'Add a unit test for the null input case immediately — it would have caught this regression in CI before deploy.',
    'Use TypeScript strict mode with noUncheckedIndexedAccess — chain access like profileImage.url requires a non-null assertion or optional chaining.',
    'In code review, any deletion of a null/undefined guard on a nullable type should be flagged and require explicit justification.',
    'Consider using a linter rule or snapshot test on utility functions with nullable parameters to detect guard removal.',
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
