export interface Example {
  id: string
  label: string
  input: string
}

export const EXAMPLES: Example[] = [
  {
    id: 'typescript',
    label: 'TypeScript Runtime Error',
    input: `Cannot set properties of undefined (setting 'tenantGuid')

getAllMyTaskRecord(filter: any): Observable<any> {
  let options = undefined;

  if (filter.tenantGuid) {
    options.tenantGuid = filter.tenantGuid;
  }

  return this._httpSvc.postApi<any>(
    'api/home/allmytask/record',
    filter,
    options
  );
}`,
  },
  {
    id: 'sql',
    label: 'SQL Error',
    input: `ERROR:  relation "users" does not exist at character 15
STATEMENT:  SELECT * FROM users WHERE id = $1

Query context:
  SELECT id, email, role FROM users WHERE id = $1

PostgreSQL error code: 42P01 (undefined_table)
Search path: "$user", public
Current database: app_staging`,
  },
  {
    id: 'api',
    label: 'API Breaking Change',
    input: `API Breaking Change detected in GET /api/v1/session response

--- v1.4.2 (previous)
+++ v1.5.0 (current)

 {
-  "user_id": "abc-123",
+  "userId": "abc-123",
   "email": "user@example.com",
   "role": "admin",
   "expires_at": "2024-12-01T00:00:00Z"
 }

Consumer code (authentication middleware):
const userId = response.user_id;          // now undefined
if (!userId) return res.status(401).json({ error: 'Unauthorized' });`,
  },
]
