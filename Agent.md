# AGENT SKILL REFERENCE — Full Stack School Management System
> React Native (Expo) + Node.js (Express) + Supabase DB + Supabase Auth
> Provide this file to the agent alongside the audit prompt as grounding knowledge.

---

# PART 1: REACT NATIVE (EXPO)

## 1.1 Project Structure

```
/app or /src
  /screens          — one file per screen per role
  /components       — reusable UI components
  /navigation       — stack/tab navigators, auth guard
  /services         — all API call functions (axios or fetch wrappers)
  /hooks            — custom hooks (useAuth, useFee, useStudents etc.)
  /context          — React Context or Zustand/Redux store
  /utils            — helpers, formatters, validators
  /constants        — API_BASE_URL, role constants, color theme
  /assets           — images, fonts
app.json            — Expo config
babel.config.js
```

## 1.2 Expo-Specific Knowledge

- Expo SDK manages native modules. Never use bare RN packages requiring react-native link unless ejected.
- `expo-secure-store` is the correct way to store tokens securely on device.
- `@react-native-async-storage/async-storage` is acceptable for non-sensitive persisted state.
- `expo-constants` gives access to `Constants.expoConfig.extra` — use for injecting API_BASE_URL from app.json.
- `expo-router` (file-based routing) vs `react-navigation` (manual stack/tab) — identify which one the project uses before auditing navigation guards.

### Correct portability pattern via app.json:
```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "https://your-server.com",
      "supabaseUrl": "https://xyz.supabase.co",
      "supabaseAnonKey": "eyJ..."
    }
  }
}
```
Accessed as:
```js
import Constants from 'expo-constants';
const API_BASE = Constants.expoConfig.extra.apiBaseUrl;
```
FLAG: any hardcoded URL not using this pattern.

## 1.3 Supabase Client Setup in React Native (Correct Pattern)

```js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig.extra.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig.extra.supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,        // REQUIRED — session persistence in RN
    autoRefreshToken: true,       // REQUIRED — silently refreshes tokens
    persistSession: true,         // REQUIRED — saves session to AsyncStorage
    detectSessionInUrl: false,    // REQUIRED for RN — no URL-based auth
  },
});
```

FLAG any of these four auth options missing or set to false.

## 1.4 Auth Guard / Navigation Pattern (No Silent Logout)

```js
export default function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <SplashScreen />;
  return user ? <AppNavigator /> : <AuthNavigator />;
}
```

On app startup sequence:
1. Check AsyncStorage for existing session
2. Call `supabase.auth.setSession({ access_token, refresh_token })`
3. Supabase auto-refreshes silently if access token expired but refresh token valid
4. Only redirect to login if refresh token is also expired/invalid

FLAG any pattern that skips step 2 and goes directly to login on token expiry.

## 1.5 Auth State Listener (Required for Session Sync)

```js
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null);
    setLoading(false);
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setUser(session?.user ?? null);
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

FLAG if `onAuthStateChange` is not set up — token refresh events won't update app state.
FLAG if the listener calls `signOut()` on `TOKEN_REFRESHED` event — that is a silent logout bug.

## 1.6 API Service Layer Pattern

```js
import axios from 'axios';
import { supabase } from '../lib/supabase';
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig.extra.apiBaseUrl;

const getAuthHeader = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${session.access_token}` };
};

export const collectFee = async (payload) => {
  const headers = await getAuthHeader();
  const response = await axios.post(`${BASE_URL}/api/fees/collect`, payload, { headers });
  return response.data;
};
```

FLAG: API calls without Authorization header.
FLAG: BASE_URL hardcoded as a string literal.
FLAG: Token stored in a variable once and reused without refresh (stale token bug).

## 1.7 Role-Based Navigation (All 5 Roles)

```js
const roleNavigators = {
  student:  StudentNavigator,
  staff:    StaffNavigator,
  admin:    AdminNavigator,
  accounts: AccountsNavigator,
  driver:   DriverNavigator,
};

export default function AppNavigator() {
  const { role } = useAuth();
  const Navigator = roleNavigators[role];
  return Navigator ? <Navigator /> : <UnknownRoleScreen />;
}
```

FLAG: role routing via if/else chains instead of a map — easy to miss a role.
FLAG: role trusted only from local storage without server-side verification.

## 1.8 Double-Submit Prevention (Critical for Fee Screens)

```js
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async () => {
  if (submitting) return;
  setSubmitting(true);
  try {
    await collectFee(payload);
  } finally {
    setSubmitting(false);
  }
};

<Button onPress={handleSubmit} disabled={submitting} />
```

FLAG any fee/payment form without this pattern — double-tap creates duplicate payment records.

## 1.9 Common React Native Bugs to Flag

- setState called after component unmount — memory leak, missing cleanup in useEffect
- Missing keyExtractor in FlatList — rendering bugs on re-renders
- Using index as keyExtractor key — wrong item rendering when list reorders
- Not handling null/empty API responses before rendering — crashes
- Mutating state directly instead of setState
- Missing await on async supabase calls — silent failures
- console.log with tokens or user IDs in production builds

---

# PART 2: NODE.JS (EXPRESS)

## 2.1 Project Structure

```
/src
  /routes           — route definitions (thin, just registers controller methods)
  /controllers      — business logic per resource
  /middleware       — auth, role check, validation, error handler
  /services         — Supabase client, external API wrappers
  /utils            — helpers, response formatters
  /validators       — input validation (Joi, Zod, or express-validator)
  /config           — env loader, constants
server.js / app.js  — Express app setup
.env                — credentials (never committed)
.env.example        — template (committed)
```

## 2.2 Environment Configuration

```js
// config/env.js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || 'development',
};
```

FLAG any of these values hardcoded anywhere in the codebase.
FLAG if SUPABASE_SERVICE_ROLE_KEY is ever sent to or accessible from the frontend.

## 2.3 Supabase Admin Client (Server Singleton)

```js
// services/supabaseAdmin.js
const { createClient } = require('@supabase/supabase-js');
const { supabaseUrl, supabaseServiceKey } = require('../config/env');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = supabaseAdmin;
```

FLAG: anon key used server-side instead of service role key — anon key respects RLS which may block server operations.
FLAG: client created inline inside controller functions — should be a singleton.

## 2.4 JWT Auth Middleware

```js
// middleware/auth.js
const { createClient } = require('@supabase/supabase-js');
const { supabaseUrl, supabaseAnonKey } = require('../config/env');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = user;
  next();
};

module.exports = { authenticate };
```

FLAG: middleware manually decodes JWT instead of calling `supabase.auth.getUser()` — skips Supabase's revocation checks.
FLAG: role read from `req.body.role` or `req.query.role` instead of verified JWT user — client can spoof role.

## 2.5 Role-Check Middleware

```js
// middleware/roles.js
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.user_metadata?.role
                  || req.user?.app_metadata?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
};

module.exports = { requireRole };
```

Usage:
```js
router.post('/fees/collect',
  authenticate,
  requireRole('accounts', 'admin'),
  feesController.collect
);
```

FLAG: role read from req.body instead of req.user — spoofable.
FLAG: routes with authenticate but no requireRole — authentication without authorization.
FLAG: requireRole called without authenticate before it — req.user is undefined.

## 2.6 Route File Pattern

```js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const feesController = require('../controllers/feesController');

router.get('/my-dues',   authenticate, requireRole('student','admin','accounts'), feesController.getMyDues);
router.post('/collect',  authenticate, requireRole('accounts','admin'),           feesController.collect);
router.get('/report',    authenticate, requireRole('accounts','admin'),           feesController.getReport);
router.put('/:id',       authenticate, requireRole('accounts','admin'),           feesController.update);
router.delete('/:id',    authenticate, requireRole('admin'),                      feesController.softDelete);

module.exports = router;
```

FLAG: any route missing authenticate.
FLAG: POST/PUT/DELETE routes missing requireRole.
FLAG: `/report` registered AFTER `/:id` — /report will match /:id with id="report".

## 2.7 Controller Pattern

```js
const collect = async (req, res) => {
  try {
    const { student_id, amount, fee_type, payment_method } = req.body;

    if (!student_id || !amount || !fee_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than zero' });
    }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert({
        student_id,
        amount,
        fee_type,
        payment_method,
        collected_by: req.user.id,   // From verified JWT — not from req.body
      })
      .select('id, receipt_number, amount, created_at')
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('feesController.collect:', err.message);
    return res.status(500).json({ error: 'Internal server error' }); // Never leak err.message
  }
};
```

FLAG: `.insert(req.body)` directly — allows client to insert arbitrary columns.
FLAG: returning raw Supabase error objects to client — leaks DB structure.
FLAG: no field validation before DB call.
FLAG: no try/catch — unhandled rejections crash the server.
FLAG: `req.body.collected_by` instead of `req.user.id` — client can impersonate another user.

## 2.8 Multi-Table Transactions (Financial Operations)

Supabase JS client does not natively support multi-statement transactions. For atomic multi-table fee operations use Postgres RPC:

```js
// In controller
const { data, error } = await supabaseAdmin.rpc('collect_fee_with_ledger', {
  p_student_id: student_id,
  p_amount: amount,
  p_fee_type: fee_type,
  p_collected_by: req.user.id,
});
```

```sql
-- In schema.sql
CREATE OR REPLACE FUNCTION collect_fee_with_ledger(
  p_student_id UUID,
  p_amount NUMERIC,
  p_fee_type TEXT,
  p_collected_by UUID
) RETURNS void AS $$
BEGIN
  INSERT INTO payments (student_id, amount, fee_type, collected_by)
  VALUES (p_student_id, p_amount, p_fee_type, p_collected_by);

  INSERT INTO ledger_entries (student_id, entry_type, amount, description)
  VALUES (p_student_id, 'credit', p_amount, 'Fee payment - ' || p_fee_type);

  UPDATE fee_dues
  SET paid_amount = paid_amount + p_amount
  WHERE student_id = p_student_id AND status != 'paid';
END;
$$ LANGUAGE plpgsql;
```

FLAG: any controller inserting into multiple financial tables sequentially WITHOUT an RPC function — second insert failure leaves data in corrupt state.

## 2.9 Common Express Bugs to Flag

- `app.use(express.json())` missing — req.body is undefined for all POST/PUT requests
- CORS not configured — RN app blocked in some environments
- No rate limiting on auth routes — brute force vulnerability
- Async controllers without try/catch — unhandled rejection crashes the server
- `res.send()` called after `res.json()` in same request — headers already sent error
- Missing `return` before `res.status().json()` — execution continues after response sent
- Routes registered in wrong order — specific paths after parameterized paths get shadowed

---

# PART 3: SUPABASE DATABASE (POSTGRESQL)

## 3.1 Single-Tenant Schema Rules

Each Supabase project IS one school. No tenant_id or school_id needed in queries.

Standard column conventions for all tables:
- Primary key: `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`
- Timestamps: `created_at TIMESTAMPTZ DEFAULT NOW()` and `updated_at TIMESTAMPTZ DEFAULT NOW()`
- Soft delete: `deleted_at TIMESTAMPTZ DEFAULT NULL`
- All FK constraints must declare ON DELETE behavior explicitly

## 3.2 Core Tables Expected in schema.sql

FLAG if any of these are missing from schema.sql:

```
profiles / users     — linked to auth.users, stores role + profile info
students             — student records (linked to parent/guardian user)
staff                — staff records (linked to auth user)
classes              — class/grade definitions
sections             — sections within a class
subjects             — subject definitions
class_assignments    — which staff teaches which class/section/subject
attendance           — daily attendance per student
timetable            — schedule per class/section/day
fee_structure        — fee definitions per class per term
fee_dues             — individual student fee obligations
payments             — actual payment records (append-only)
ledger_entries       — full financial audit trail
receipts             — receipt records per payment
discounts            — student-specific fee concessions/scholarships
transport_routes     — bus routes
vehicles             — vehicle records
transport_assignments — student to route assignment
driver_assignments   — driver to vehicle/route assignment
announcements        — school-wide notices
exam_schedules       — exam timetable
results / grades     — student exam results
app_settings         — school-wide configuration (academic year, etc.)
```

## 3.3 Correct Financial Column Types

```sql
-- CORRECT
amount          NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
paid_amount     NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
late_fee_rate   NUMERIC(5, 2) DEFAULT 0.00,

-- WRONG — FLAG IMMEDIATELY
amount          FLOAT,       -- rounding errors in money
amount          REAL,        -- same problem
amount          INTEGER,     -- cannot represent paise/cents
```

## 3.4 Triggers — Full Reference

### updated_at trigger (must exist on every table with updated_at column):

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

FLAG any table with updated_at column missing this trigger — the column never updates.

### Balance update trigger (fires after payment insert):

```sql
CREATE OR REPLACE FUNCTION update_fee_balance_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE fee_dues
  SET
    paid_amount = paid_amount + NEW.amount,
    updated_at = NOW(),
    status = CASE
      WHEN (paid_amount + NEW.amount) >= total_amount THEN 'paid'
      WHEN (paid_amount + NEW.amount) > 0             THEN 'partial'
      ELSE 'pending'
    END
  WHERE id = NEW.fee_due_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_payment_insert
AFTER INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION update_fee_balance_on_payment();
```

FLAG: this logic in the controller instead of a trigger — not atomic, can be bypassed.

### Receipt number generator (auto, collision-free):

```sql
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.receipt_number = 'RCP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-'
    || LPAD(nextval('receipt_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_payment_insert_receipt
BEFORE INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION generate_receipt_number();
```

FLAG: receipt numbers generated in application code — not atomic, collision risk under concurrent inserts.
FLAG: sequence not defined in schema.sql — will not exist after fresh schema.sql run.

### Ledger entry trigger (every payment auto-creates ledger entry):

```sql
CREATE OR REPLACE FUNCTION create_ledger_entry_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ledger_entries (student_id, payment_id, entry_type, amount, description, created_at)
  VALUES (NEW.student_id, NEW.id, 'credit', NEW.amount, 'Fee payment - ' || NEW.fee_type, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_payment_create_ledger
AFTER INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION create_ledger_entry_on_payment();
```

FLAG: ledger entries created in application code — skipped if server crashes mid-request.

## 3.5 Row Level Security (RLS)

If RLS is enabled:
- Every table needs explicit policies for SELECT, INSERT, UPDATE, DELETE
- Service role key always bypasses RLS (verify server uses service role key, not anon key)
- Student SELECT policy must scope to own records only

```sql
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_read_own" ON students
FOR SELECT USING (auth.uid() = user_id);
```

FLAG: RLS enabled but server uses anon key — server DB operations will be blocked by policies.

## 3.6 Foreign Key Rules

Every FK must declare ON DELETE behavior:

```sql
-- CORRECT
user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
student_id UUID REFERENCES students(id) ON DELETE RESTRICT,
class_id   UUID REFERENCES classes(id) ON DELETE SET NULL,

-- WRONG — FLAG
student_id UUID REFERENCES students(id),  -- ON DELETE behavior undeclared
```

## 3.7 Required Indexes

FLAG missing indexes on:

```sql
-- Every FK column
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_fee_due_id ON payments(fee_due_id);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);

-- Frequently filtered columns
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_fee_dues_status ON fee_dues(status);
CREATE INDEX idx_students_class_id ON students(class_id);

-- Unique constraints (also serve as indexes)
CREATE UNIQUE INDEX idx_payments_receipt_number ON payments(receipt_number);
```

## 3.8 schema.sql Must-Have Checklist for Full Portability

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUM types
CREATE TYPE user_role AS ENUM ('student', 'staff', 'admin', 'accounts', 'driver');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid', 'overdue');

-- Sequences
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 1000;

-- Tables (in FK dependency order)
-- Constraints, indexes, trigger functions, triggers, RLS policies
-- Seed data (e.g. app_settings with academic_year)
```

FLAG: schema.sql that depends on extensions requiring manual dashboard enable (pg_vector, pg_cron).

## 3.9 Common PostgreSQL/Supabase Bugs to Flag

- SERIAL or BIGSERIAL PKs instead of UUID — causes issues if data ever needs merging
- TEXT status/role fields without CHECK constraint — invalid values insertable
- Missing NOT NULL on required columns — nulls break application logic
- TIMESTAMP used instead of TIMESTAMPTZ — timezone bugs in multi-timezone deployments
- Missing UNIQUE constraint on email, roll_number, receipt_number — duplicates accumulate
- Computed columns (balance) calculated in application code instead of GENERATED ALWAYS AS
- Cascade deletes not defined — orphan records accumulate silently

---

# PART 4: SUPABASE AUTH

## 4.1 Auth Architecture

```
React Native
  └── supabase.auth.signInWithPassword({ email, password })
        └── Supabase Auth returns { access_token, refresh_token, user }
              └── access_token sent to Express as Authorization: Bearer <token>
                    └── Express calls supabase.auth.getUser(token)
                          └── Returns verified user with metadata
                                └── role extracted from app_metadata or profiles table
```

## 4.2 Role Storage — Two Valid Patterns

Pattern A — app_metadata (preferred, tamper-proof):
```js
// Server-side only, using service role client
await supabaseAdmin.auth.admin.updateUserById(userId, {
  app_metadata: { role: 'accounts' }
});
```
Role read in Express as: `req.user.app_metadata.role`

Pattern B — profiles table:
```sql
CREATE TABLE profiles (
  id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role    TEXT NOT NULL CHECK (role IN ('student','staff','admin','accounts','driver')),
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

FLAG: role stored in `user_metadata` instead of `app_metadata` — users can update their own user_metadata (security risk).
FLAG: Pattern A and Pattern B mixed inconsistently — pick one.

## 4.3 Token Lifecycle

- access_token (JWT): expires in 1 hour by default
- refresh_token: valid 30 days from last use
- With autoRefreshToken: true and persistSession: true, Supabase handles silent refresh automatically
- App will NEVER log user out as long as refresh token is valid
- Refresh tokens expire only after 30 days of inactivity or explicit sign-out

FLAG: any code that checks access_token expiry and calls signOut() — Supabase refreshes automatically. Correct pattern is to call `supabase.auth.getSession()` which returns a valid session (refreshing if needed) or null (if truly expired).

## 4.4 Auth Events Reference

onAuthStateChange fires on:
- SIGNED_IN — fresh login or session restored
- SIGNED_OUT — explicit sign out
- TOKEN_REFRESHED — access token silently refreshed (DO NOT logout on this event)
- USER_UPDATED — user profile changed
- PASSWORD_RECOVERY — password reset flow

```js
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    clearAppState();
    navigateToLogin();
  }
  // TOKEN_REFRESHED: do nothing special — session is still valid
  if (session) {
    setUser(session.user);
  }
});
```

FLAG: listener navigating to login on TOKEN_REFRESHED — that is a silent logout bug.

## 4.5 Logout — Only On Explicit User Action

```js
const handleLogout = async () => {
  await supabase.auth.signOut();
  await AsyncStorage.clear();
  navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
};
```

FLAG: any call to supabase.auth.signOut() outside of explicit logout button handler.
FLAG: token expiry check in useEffect that calls signOut — causes silent logouts.

## 4.6 Server-Side Auth Admin Operations (Never From RN)

These must ONLY be called from Node.js server using service role key:

```js
// Create user with role
await supabaseAdmin.auth.admin.createUser({
  email, password,
  app_metadata: { role: 'staff' },
  email_confirm: true,
});

// Update user role
await supabaseAdmin.auth.admin.updateUserById(userId, {
  app_metadata: { role: 'admin' }
});

// Delete user
await supabaseAdmin.auth.admin.deleteUser(userId);
```

FLAG: any auth admin operation called from React Native — requires exposing service role key on client (critical security vulnerability).

## 4.7 Common Supabase Auth Bugs to Flag

- detectSessionInUrl: false missing in RN Supabase client — causes crashes
- Anon key used for admin user management — returns 401
- Service role key in React Native app — critical security issue
- Not handling null session in onAuthStateChange — crashes listener on sign-out
- Not awaiting supabase.auth.signOut() before navigation — async, may leave stale state
- Not awaiting supabase.auth.getSession() before rendering protected screens — brief login screen flash

---

# PART 5: SINGLE-TENANT PORTABILITY RULES

## 5.1 The Golden Rule

New school deployment = exactly these 5 steps and NOTHING else:
1. Create new Supabase project
2. Run schema.sql in Supabase SQL editor (Project > SQL Editor > Run)
3. Set env vars on Node.js server: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET
4. Set apiBaseUrl in React Native app.json extra
5. Deploy server and build/publish app

Any additional step required = portability bug.

## 5.2 Hardcoding — What Must Never Be a String Literal

In Node.js backend (must come from .env):
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_JWT_SECRET
- PORT
- Any third-party API keys (SMS, email, payment gateway)

In React Native (must come from app.json extra or equivalent):
- API_BASE_URL (Node.js server URL)
- SUPABASE_URL
- SUPABASE_ANON_KEY

FLAG any of these appearing as string literals in code.

## 5.3 schema.sql Portability Checklist

Must contain in order:
1. CREATE EXTENSION IF NOT EXISTS statements
2. Custom ENUM types
3. CREATE SEQUENCE statements (receipt numbers etc.)
4. CREATE TABLE in FK dependency order (parent tables before child tables)
5. All constraints (PK, FK, UNIQUE, CHECK, NOT NULL)
6. All indexes
7. All trigger functions (CREATE OR REPLACE FUNCTION)
8. All triggers (CREATE TRIGGER)
9. RLS ENABLE and CREATE POLICY statements
10. Seed data required for app to function on first boot

---

# PART 6: FEE SYSTEM DOMAIN KNOWLEDGE

## 6.1 Fee Data Model

```
FeeStructure  — Defines what fees exist per class per term
     |
     | (generates)
     v
FeeDues       — Individual student fee obligation (one row per student per fee item)
     |
     | (fulfilled by)
     v
Payments      — Actual money received (append-only, never hard-delete)
     |
     | (generates via trigger)
     +---> Receipts       — Official receipt per payment
     |
     +---> LedgerEntries  — Full financial audit trail
```

## 6.2 Correct Fee Collection Flow (All Steps Must Be Present)

1. Frontend: GET /api/fees/dues/:studentId → returns all outstanding fee_dues
2. Staff selects dues and enters amount
3. Frontend: POST /api/fees/collect with { student_id, fee_due_id, amount, payment_method }
4. Server: validates student exists, fee_due exists, amount > 0, amount <= remaining balance
5. Server: INSERT into payments table (via RPC for atomicity)
6. DB trigger: updates fee_dues.paid_amount and status
7. DB trigger: creates ledger_entry record
8. DB trigger: generates receipt_number on the payment record
9. Server: returns { receipt_number, amount, student_name, timestamp }
10. Frontend: displays receipt and refreshes dues list

FLAG any step missing from this flow.

## 6.3 Financial Business Rules

- Payments are IMMUTABLE after insert. No UPDATE or DELETE on payments except admin soft-delete with mandatory reason.
- Balance must never go negative unless refund is explicitly modeled as a separate entry type.
- Every payment must have: receipt_number (unique, auto-generated), collected_by (auth user ID), payment_method.
- Late fee = separate fee_due record, never mixed into original fee amount.
- Discounts applied BEFORE fee_dues generation — fee_dues.total_amount already reflects concession.
- Academic year must be recorded on fee_dues AND payments for historical reporting to be possible.
- All monetary arithmetic must happen in the database (SQL/triggers), not in JavaScript.

---

*SKILLS.md — Attach this file to the agent alongside SCHOOL_SYSTEM_AUDIT_PROMPT.md*
*Stack: React Native (Expo) + Node.js/Express + Supabase DB + Supabase Auth*
*System: Single-Tenant School Management SaaS*


# Agent Instruction Manual — Elite Backend Engineering Standards

> **Scope:** This document governs all backend engineering decisions made by this agent. Every code generation, architecture recommendation, schema design, and integration pattern must conform to the standards defined here. No exceptions unless explicitly overridden by the operator.

---

## 0. Core Behavioral Directives

- **Production-ready by default.** Every output is assumed to run in a high-traffic, zero-downtime production environment.
- **Security is non-negotiable.** Never defer security hardening to "later." Embed it in the first pass.
- **Performance is a feature.** Query plans, index usage, memory allocation, and I/O patterns are always considered.
- **Modularity over convenience.** Short-term shortcut code is rejected. Every module must be independently testable and replaceable.
- **Explicit over implicit.** Magic configuration, hidden defaults, and implicit behavior must be surfaced, documented, or removed.
- **Multi-tenancy is never assumed.** Apply tenant isolation patterns only when the task explicitly requires it.
- **Idempotency is the default contract.** Every mutation endpoint, background job, and event handler must be safe to replay.
- **Error handling is first-class logic.** Errors are not afterthoughts. They are typed, handled at the correct layer, logged with context, and never swallowed.

---

## 1. Node.js — Advanced Runtime Mastery

### 1.1 Event Loop & Async Patterns

- Understand and respect the event loop phases: timers → pending callbacks → idle/prepare → poll → check → close callbacks.
- Never block the event loop. CPU-intensive tasks must be offloaded to worker threads (`worker_threads`) or child processes.
- Use `setImmediate` vs `process.nextTick` with precision: `nextTick` fires before I/O callbacks; `setImmediate` fires after I/O in the check phase.
- Avoid unbounded promise chains that accumulate microtasks without yielding.
- Backpressure in streams must always be handled. Never pipe without checking `drain` events or using `pipeline()`.

```js
// Correct: use stream.pipeline for automatic backpressure and cleanup
const { pipeline } = require('stream/promises');
await pipeline(readStream, transformStream, writeStream);
```

### 1.2 Memory Management

- Profile heap usage with `--inspect` + Chrome DevTools or `clinic.js` before declaring memory issues.
- Avoid closure-induced memory leaks in long-lived objects (event emitters, caches, timers).
- Use `WeakMap` and `WeakRef` for associative metadata on objects that may be garbage collected.
- Set explicit `maxListeners` on EventEmitters used in high-concurrency paths.

### 1.3 Concurrency Control

- Use `p-limit` or equivalent for bounded concurrency on promise arrays.
- Never `Promise.all` an unbounded array of I/O operations.
- For distributed task concurrency, use queue-based coordination (BullMQ/Redis), never in-process semaphores.

### 1.4 Process Management

- Use cluster mode or a process manager (PM2 with `cluster` mode) for CPU core saturation only when horizontal scaling is not available.
- Graceful shutdown: handle `SIGTERM` and `SIGINT`, drain active connections, close DB pools, flush log buffers.

```js
process.on('SIGTERM', async () => {
  await server.close();
  await pool.end();
  process.exit(0);
});
```

### 1.5 Module System

- Use ESM (`import`/`export`) in greenfield projects. Configure `"type": "module"` in `package.json`.
- In CommonJS codebases, never mix `require` and dynamic `import()` without understanding the async boundary.
- Barrel files (`index.js`) are acceptable for public API surface only — never for internal module graph.

---

## 2. Express.js — Production-Grade Architecture

### 2.1 Application Structure

```
src/
├── app.js                  # Express app factory (no listen() here)
├── server.js               # HTTP server bootstrap, graceful shutdown
├── config/                 # Validated env config (zod/joi)
├── routes/                 # Route declarations only — no business logic
├── controllers/            # Request/response orchestration
├── services/               # Business logic — framework-agnostic
├── repositories/           # Data access layer — DB-agnostic interface
├── middlewares/             # Express-specific middleware
├── validators/             # Input schema validation
├── errors/                 # Custom error classes + error handler
├── jobs/                   # Background workers / scheduled tasks
└── utils/                  # Pure utility functions
```

### 2.2 Middleware Layering (Ordered)

Apply middleware in this exact sequence:

1. `helmet()` — secure headers
2. `cors()` — with explicit origin whitelist
3. `compression()` — gzip/brotli
4. `express.json({ limit: '100kb' })` — body parsing with size cap
5. Request ID injection (`x-request-id`)
6. Structured logger (attach `req.log`)
7. Rate limiter (Redis-backed)
8. Authentication middleware (JWT verification)
9. Authorization middleware (RBAC/ABAC guard)
10. Route handlers
11. 404 handler
12. Global error handler

### 2.3 Error Handling

- Define a typed error hierarchy:

```js
class AppError extends Error {
  constructor(message, statusCode, code, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
  }
}

class ValidationError extends AppError { ... }
class AuthorizationError extends AppError { ... }
class NotFoundError extends AppError { ... }
class ConflictError extends AppError { ... }
```

- Global error handler differentiates operational vs programmer errors:

```js
app.use((err, req, res, next) => {
  if (!err.isOperational) {
    logger.fatal({ err, requestId: req.id }, 'Unhandled programmer error');
    process.exit(1); // Let the process manager restart
  }
  res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
});
```

### 2.4 Request Lifecycle

- Controllers are thin: validate input → call service → shape response.
- Services contain all business logic and are injected (not imported directly) to enable testing.
- Repositories abstract all database interactions. Services never hold SQL.
- Never pass `req`/`res` objects into services or repositories.

### 2.5 Input Validation

- Use `zod` as the primary schema validation library. Define schemas co-located with routes.
- Validate at the boundary: before any business logic executes.
- Reject unknown fields (`z.object({...}).strict()`).
- Sanitize string inputs: trim whitespace, normalize unicode.

---

## 3. Supabase — Production Integration

### 3.1 Supabase Auth

#### JWT Verification
- Verify JWTs server-side using Supabase's JWKS endpoint or the shared `JWT_SECRET` for HS256.
- Never trust `sub`, `role`, or custom claims without cryptographic verification.
- Use the service role key only in privileged server processes — never expose it to clients.

```js
import { createClient } from '@supabase/supabase-js';

// Authenticated client per request (anon key + user JWT)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${userJwt}` } }
});

// Admin client for privileged ops (service role — never expose)
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
```

#### Token Lifecycle
- Implement access token refresh proactively (before expiry, not after 401).
- Refresh tokens are single-use. Store them securely (httpOnly cookies or encrypted storage).
- On token rotation failure, force re-authentication. Never silently reuse stale tokens.

#### Auth Flows
- Magic link and OAuth flows must validate `redirect_to` against an explicit allowlist.
- Email verification must be enforced before granting access to protected resources.
- Password reset tokens must be single-use and expire within 15 minutes.

### 3.2 Row-Level Security (RLS)

> **Apply RLS only when explicitly requested.** Do not default to multi-tenant isolation patterns.

When RLS is required:

- Enable RLS on every table that holds user-scoped data: `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`
- Default-deny: create no implicit permissive policies. All access must be explicitly granted.
- Reference `auth.uid()` and `auth.jwt()` in policies, not application-layer user IDs.
- Test policies against both authenticated and anon roles in the Supabase SQL editor.

```sql
-- Example: users can only access their own rows
CREATE POLICY "user_isolation" ON orders
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### 3.3 Supabase PostgreSQL

- Use the `supabase-js` client for simple CRUD from client-facing services.
- Use raw `pg` connections (via `postgres.js` or `pg`) for complex queries, transactions, and batch operations from server-side services.
- Never run ad-hoc SQL from controllers. Centralize in repository layer.
- Use prepared statements for all parameterized queries.

### 3.4 Migrations & Schema Evolution

- All schema changes are code. Use Supabase CLI migrations (`supabase migration new`).
- Migrations must be additive and backward-compatible. Never drop columns in the same deploy that removes application references.
- Multi-step migration strategy for breaking changes:
  1. Add new column (nullable or with default)
  2. Deploy application code reading both old and new
  3. Backfill data
  4. Add NOT NULL constraint
  5. Remove old column in a subsequent release
- Never run manual DDL against production outside of a tracked migration file.
- Keep `schema.sql` generated from `supabase db dump` in source control.

### 3.5 Supabase Storage

- Use signed URLs for private file access. Never expose bucket contents via public URLs unless the content is truly public.
- Set explicit bucket policies (not wildcard `*`).
- Validate file MIME type server-side before accepting uploads. Do not trust `Content-Type` headers alone — inspect magic bytes.
- Implement virus scanning for user-uploaded files via a post-upload webhook if content risk is present.
- Use storage path conventions: `{bucket}/{userId}/{resourceId}/{filename}` to enable RLS-aligned access patterns.

```js
const { data, error } = await supabase.storage
  .from('documents')
  .createSignedUrl(`${userId}/${fileId}`, 3600); // 1-hour expiry
```

---

## 4. PostgreSQL — Deep Expertise

### 4.1 Index Strategy

| Index Type | Use Case |
|---|---|
| **B-tree** | Default. Equality, range, ORDER BY, LIKE 'prefix%' |
| **GIN** | JSONB containment, full-text search, array overlap |
| **BRIN** | Very large append-only tables with correlated physical order (timestamps, serial IDs) |
| **GiST** | Geometric types, range types, nearest-neighbor search |
| **Hash** | Equality-only lookups (rarely preferred over B-tree in modern Postgres) |
| **Partial** | Index a subset of rows; reduces index size, improves write throughput |
| **Composite** | Multi-column; column order matters — leading column must be in the predicate |
| **Expression** | Index on `lower(email)`, `date_trunc('day', created_at)` |

```sql
-- Partial index: only active records
CREATE INDEX idx_users_active_email ON users (email) WHERE deleted_at IS NULL;

-- Expression index for case-insensitive lookup
CREATE INDEX idx_users_lower_email ON users (lower(email));

-- GIN for JSONB
CREATE INDEX idx_orders_metadata ON orders USING GIN (metadata jsonb_path_ops);
```

### 4.2 Query Optimization

- Always `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` before shipping a query used in a hot path.
- Eliminate sequential scans on large tables that are not intentional full-table reads.
- Avoid `SELECT *` in application queries. Name every column.
- Push filters as deep as possible: filter in subqueries/CTEs before joins.
- Use `EXISTS` instead of `IN` with subqueries for correlated lookups.
- Avoid `OFFSET` pagination on large tables — use keyset pagination (cursor-based).

```sql
-- Keyset pagination (performant)
SELECT * FROM orders
WHERE (created_at, id) < ($last_created_at, $last_id)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

### 4.3 EXPLAIN Plan Analysis

Read plans bottom-up (innermost node first). Look for:
- **Seq Scan** on large tables → missing index
- **Hash Join** on huge relations → check work_mem
- **Nested Loop** on large sets → potential N+1 materialized as SQL
- **Sort** without index → add index supporting ORDER BY
- **Rows= estimate vs actual** large divergence → stale statistics → `ANALYZE`
- **Buffers: hit vs read** ratio → cache hit rate health

### 4.4 Transactions & Isolation Levels

| Level | Dirty Read | Non-Repeatable Read | Phantom Read | Use Case |
|---|---|---|---|---|
| READ COMMITTED | ✗ | ✓ | ✓ | Default. Most OLTP operations |
| REPEATABLE READ | ✗ | ✗ | ✓ | Consistent snapshot reads across multiple queries |
| SERIALIZABLE | ✗ | ✗ | ✗ | Financial ledgers, inventory deductions, concurrent mutations |

- Use `SERIALIZABLE` for any operation where concurrent execution could produce incorrect results (e.g., balance deductions, seat reservations).
- Use advisory locks (`pg_advisory_xact_lock`) for application-level serialization within a transaction.
- Keep transactions short. Never hold a transaction open across network calls or user input.

### 4.5 Locking & Concurrency

- `SELECT FOR UPDATE` to lock rows before mutation in concurrent paths.
- `SELECT FOR UPDATE SKIP LOCKED` for job queue patterns — avoids blocking workers.
- Avoid DDL in long-running transactions (takes AccessExclusiveLock, blocks all reads).
- Monitor `pg_locks` and `pg_stat_activity` for lock contention in production.
- Use `lock_timeout` and `statement_timeout` at the connection level to prevent runaway queries.

```sql
SET lock_timeout = '2s';
SET statement_timeout = '30s';
```

### 4.6 Connection Management

- Always use a connection pool. `pg` with `pgBouncer` in transaction mode for high-concurrency APIs.
- Pool size formula: `(cores * 2) + effective_spindle_count` — never set arbitrarily.
- Validate connections on acquisition in long-running services (`allowExitOnIdle`, keepalive).

---

## 5. Firebase Cloud Messaging (FCM)

### 5.1 Architecture Overview

- Use the **Firebase Admin SDK** (server-side) for all message dispatch. Never call FCM APIs directly from client code via server secrets.
- Maintain a `device_tokens` table in PostgreSQL to track FCM registration tokens with their platform, user association, and validity state.

```sql
CREATE TABLE device_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  platform    TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  is_valid    BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);
CREATE INDEX idx_device_tokens_user ON device_tokens (user_id) WHERE is_valid = true;
```

### 5.2 Token Lifecycle Management

- Tokens expire and rotate. Re-register on every app launch and capture new tokens via `onTokenRefresh` callbacks.
- On FCM send failure with `messaging/registration-token-not-registered` or `messaging/invalid-registration-token`, immediately mark the token as invalid in the DB. Do not retry with a dead token.
- Proactively clean stale tokens (not used in 60+ days) via scheduled job.

### 5.3 Message Types

| Type | Delivery | Use Case |
|---|---|---|
| **Notification** | System tray, auto-displayed by OS | Simple user-facing alerts |
| **Data** | Delivered to app always, app handles display | Rich payloads, background sync, custom UI |
| **Combined** | Notification + data | Foreground interception with fallback system display |

- Prefer **data-only messages** for any payload requiring custom UI, deep linking, or background processing.
- Notification messages are not delivered to iOS apps in background unless APNs is correctly configured.

### 5.4 Android & iOS Platform Configuration

**Android:**
```js
android: {
  priority: 'high',           // Required for delivery while device is in Doze mode
  ttl: 86400 * 1000,          // 24h TTL in milliseconds
  notification: {
    channelId: 'default',     // Must match registered channel in app
    sound: 'default',
  }
}
```

**iOS (APNs via FCM):**
```js
apns: {
  headers: {
    'apns-priority': '10',    // 10 = immediate, 5 = conserve power
    'apns-push-type': 'alert',
  },
  payload: {
    aps: {
      sound: 'default',
      badge: 1,
      contentAvailable: true, // Enable background delivery
    }
  }
}
```

- APNs authentication: prefer **APNs Auth Key** (`.p8`) over APNs certificates — keys don't expire.
- Configure APNs key in Firebase Console → Project Settings → Cloud Messaging.

### 5.5 Topic Messaging & Device Groups

- Use **topics** for broadcast subscriptions (news, system alerts) where exact delivery acknowledgement is not required.
- Use **device groups** for per-user multi-device fan-out (deprecated in newer SDK — prefer multicast with token list).
- Use `sendEachForMulticast` for sending to a user's multiple devices — it provides per-token delivery results.

```js
const response = await admin.messaging().sendEachForMulticast({
  tokens: userTokens,
  notification: { title, body },
  data: payload,
});

// Process results
response.responses.forEach((result, idx) => {
  if (!result.success) {
    const errCode = result.error?.code;
    if (['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(errCode)) {
      invalidateToken(userTokens[idx]);
    }
  }
});
```

### 5.6 Retry & Failure Strategy

- FCM errors fall into two categories:
  - **Retryable:** `messaging/internal-error`, `messaging/server-unavailable` → exponential backoff with jitter
  - **Non-retryable:** `messaging/invalid-registration-token`, `messaging/mismatched-credential` → fail fast, invalidate token
- Implement all FCM dispatch through a background job queue (BullMQ). Never fire-and-forget from the request path.
- Respect `Retry-After` headers from FCM when rate-limited.

### 5.7 Foreground vs Background Handling

- **Foreground (app open):** FCM delivers to the app's message handler. App is responsible for displaying and acting on the notification.
- **Background (app closed/background):** OS displays notification messages automatically. Data-only messages require `content-available: 1` (iOS) and `priority: high` (Android) to wake the app.
- Test background delivery on real devices. Simulators and emulators are unreliable for push.

---

## 6. Security — OWASP-Aligned Standards

### 6.1 Input Validation & Sanitization

- Validate schema (type, shape, length, format) at the API boundary with `zod`.
- Sanitize HTML content with a strict allowlist (`DOMPurify` server-side via `jsdom` or `sanitize-html`).
- Parameterized queries everywhere. String interpolation into SQL is an unconditional rejection trigger.
- Validate file uploads: MIME type (magic bytes), file size, filename sanitization.

### 6.2 Authentication & JWT

- Use short-lived access tokens (15 min) + long-lived refresh tokens (7–30 days).
- Verify JWT signature, `exp`, `iss`, `aud` on every request.
- Never trust the algorithm from the JWT header (`alg`). Fix the expected algorithm in verification config.
- Store refresh tokens in httpOnly, SameSite=Strict, Secure cookies. Never in localStorage.

### 6.3 Secure Headers (via `helmet`)

```js
app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
```

### 6.4 Rate Limiting

- Use Redis-backed rate limiting (`rate-limiter-flexible`) for distributed rate enforcement.
- Apply tiered limits: global IP limit → authenticated user limit → per-endpoint limit.
- Rate limit auth endpoints aggressively: login (5/min), OTP (3/min), password reset (3/hour).

```js
const loginLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl_login',
  points: 5,
  duration: 60,
  blockDuration: 300,
});
```

### 6.5 RBAC & ABAC

- RBAC: assign roles to users; roles have static permission sets. Suitable for coarse-grained control.
- ABAC: evaluate access policies based on subject attributes + resource attributes + environment. Use for fine-grained, contextual authorization.
- Enforce authorization in the service layer, not in routes or controllers.
- Never derive permissions from user-supplied data without verification.

### 6.6 Additional Hardening

- Disable `X-Powered-By` header.
- Use `crypto.timingSafeEqual` for any secret/token comparison.
- Log all authentication failures with IP, user agent, and timestamp. Alert on anomalous patterns.
- Enforce HTTPS at the load balancer. Reject HTTP internally with 301 redirects.
- Rotate secrets on a schedule. Support dual-token windows during rotation.

---

## 7. Architecture Principles

### 7.1 Clean Architecture — Layer Responsibilities

```
┌──────────────────────────────────┐
│         Interface Layer          │  HTTP, WebSocket, CLI — I/O only
├──────────────────────────────────┤
│       Application Layer          │  Use cases, orchestration, DTOs
├──────────────────────────────────┤
│         Domain Layer             │  Entities, value objects, domain events
├──────────────────────────────────┤
│      Infrastructure Layer        │  DB, cache, external APIs, queues
└──────────────────────────────────┘
```

- Dependency rule: inner layers know nothing about outer layers.
- Domain layer has zero external dependencies.
- Services (application layer) depend on repository interfaces, not implementations.

### 7.2 Repository Pattern

```js
// Interface (domain layer)
class UserRepository {
  findById(id: string): Promise<User | null> {}
  findByEmail(email: string): Promise<User | null> {}
  save(user: User): Promise<User> {}
  delete(id: string): Promise<void> {}
}

// Implementation (infrastructure layer)
class PostgresUserRepository extends UserRepository {
  async findById(id) {
    const row = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return row ? UserMapper.toDomain(row) : null;
  }
}
```

### 7.3 Service Layer

- One service class per domain aggregate root.
- Services are stateless. All state lives in the database or cache.
- Services orchestrate repositories, domain logic, and external integrations.
- Services never know about HTTP request/response objects.

### 7.4 Event-Driven Design

- Use domain events to decouple side effects from core business logic.
- Publish events to a message broker (Redis Streams, BullMQ, or a dedicated broker) for async processing.
- Events must be idempotent consumers — use event IDs for deduplication.
- Outbox pattern for guaranteed event delivery: write event to `outbox` table in the same transaction as the domain mutation.

```sql
CREATE TABLE outbox (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT NOT NULL,
  payload     JSONB NOT NULL,
  processed   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 7.5 Background Jobs & Queues (BullMQ)

- Every background job must:
  - Be idempotent (safe to run multiple times)
  - Have a defined retry strategy with exponential backoff
  - Have a `jobId` to prevent duplicate enqueue
  - Emit structured logs on start, success, and failure
  - Have a timeout to prevent zombie jobs

```js
await queue.add('send-notification', payload, {
  jobId: `notif-${userId}-${eventId}`,  // Dedup key
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: { age: 86400 },
  removeOnFail: { age: 604800 },
  timeout: 30000,
});
```

### 7.6 Redis Caching

- Cache at the service layer, not the repository layer.
- Use cache-aside pattern (read: check cache → DB on miss → populate cache).
- Define explicit TTLs. No indefinite caching.
- Use versioned cache keys for schemas that evolve: `user:v2:{id}`.
- On mutation, invalidate affected keys explicitly. Do not rely on TTL expiry for consistency.
- For distributed rate limiting, session storage, and pub/sub: Redis is the standard tool.

### 7.7 WebSockets

- Use WebSockets (via `ws` or `socket.io`) only when real-time bidirectional communication is genuinely required.
- For server-to-client push only (dashboards, live feeds), prefer SSE (Server-Sent Events) — simpler, HTTP-native, proxy-friendly.
- Authenticate WebSocket connections on handshake (before upgrade). Reject unauthenticated connections immediately.
- Implement heartbeat/ping-pong to detect and clean up dead connections.
- Horizontal scaling of WebSocket servers requires sticky sessions or a Redis pub/sub adapter.

---

## 8. Observability

### 8.1 Structured Logging

- Use `pino` for all logging. JSON output. Zero string interpolation.
- Every log entry must include: `requestId`, `userId` (if available), `service`, `level`, `timestamp`, and relevant context.
- Log levels: `fatal` (process exit), `error` (operational failure), `warn` (degraded state), `info` (business events), `debug` (development only).
- Never log PII, tokens, passwords, or raw request bodies containing sensitive fields.
- Redact sensitive fields at the logger level:

```js
const logger = pino({
  redact: ['req.headers.authorization', 'body.password', 'body.token'],
});
```

### 8.2 Metrics

- Expose `/metrics` endpoint in Prometheus format via `prom-client`.
- Track: request rate, error rate, latency percentiles (p50, p95, p99), DB query duration, queue depth, cache hit rate.
- Use histograms for latency, counters for events, gauges for current state (active connections, queue depth).

### 8.3 Error Tracing

- Integrate OpenTelemetry for distributed tracing in microservice environments.
- Attach `traceId` and `spanId` to every log entry.
- Capture unhandled rejections and uncaught exceptions:

```js
process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled promise rejection');
  process.exit(1);
});
```

### 8.4 Health Checks

- Implement `/health/live` (process alive) and `/health/ready` (dependencies connected) endpoints.
- Ready check must verify: DB connection, Redis connection, any critical external service.
- Do not expose internal diagnostics in health check responses in production.

---

## 9. CI/CD & Dockerization

### 9.1 Dockerfile Best Practices

```dockerfile
# Multi-stage build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:22-alpine AS runtime
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=appuser:appgroup . .
USER appuser
EXPOSE 3000
CMD ["node", "src/server.js"]
```

- Use `node:alpine` for minimal attack surface.
- Run as non-root user.
- Multi-stage builds to exclude dev dependencies from final image.
- `.dockerignore`: exclude `node_modules`, `.env`, `*.log`, test files.
- Pin base image versions. Never use `latest`.

### 9.2 Environment Configuration

- Use `zod` to parse and validate all environment variables at startup. Fail fast if required vars are missing.
- Never commit `.env` files. Use `.env.example` with all required keys (values omitted).
- Secrets in production: use secret manager (AWS Secrets Manager, GCP Secret Manager, Vault). Never environment variables for secrets in container orchestration.

### 9.3 CI Pipeline

Enforce in order:
1. Lint (`eslint --max-warnings 0`)
2. Type check (`tsc --noEmit` if TypeScript)
3. Unit tests
4. Integration tests
5. Security audit (`npm audit --audit-level=high`)
6. Container image build
7. Container image scan (Trivy or Grype)
8. Deploy to staging
9. Smoke/E2E tests against staging
10. Deploy to production (gated — manual approval or automated with rollback)

### 9.4 Database Migrations in CI/CD

- Run `supabase db push` (or migration runner) as a pre-deploy step before new application code is deployed.
- Migrations must pass in staging before production.
- Always have a rollback plan for every migration. Test rollback in staging.

---

## 10. Testing Strategy

### 10.1 Test Pyramid

```
         /\
        /  \  E2E (few, critical paths)
       /----\
      / Intg  \ Integration (DB, external services)
     /----------\
    /    Unit    \ Unit (pure functions, services, domain logic)
   /______________\
```

### 10.2 Unit Tests

- Test services and domain logic in isolation. Mock all repositories and external dependencies.
- Use `vitest` or `jest` with explicit `vi.mock` / `jest.mock`.
- Test happy path + all error branches.
- No test should touch a database, network, or filesystem.
- Target: >80% coverage on services and domain layer.

### 10.3 Integration Tests

- Test repositories against a real PostgreSQL instance (use `testcontainers` or a local Docker Compose DB).
- Test API endpoints end-to-end through Express middleware stack with a real DB.
- Reset database state between tests: use transactions that are rolled back, or truncate tables in `beforeEach`.
- Test FCM integration with Admin SDK mocked at the HTTP level (not just the function call).

### 10.4 E2E Tests

- Use `Playwright` or `supertest` against a running application instance.
- Cover only critical user journeys: auth flow, core CRUD, payment flow, push notification trigger.
- Run in CI against staging environment post-deploy.

### 10.5 Test Data

- Use factory functions (not fixtures) to create test data programmatically.
- Never share state between tests. Each test creates its own data.
- Use `faker.js` for realistic, non-colliding test values.

---

## 11. Anti-Patterns — Unconditional Rejections

The following patterns are never acceptable in generated code:

| Anti-Pattern | Rejection Reason |
|---|---|
| `catch (e) {}` or `catch (e) { console.log(e) }` | Swallowed errors are invisible failures |
| `SELECT *` in application queries | Overfetching, schema coupling, index bypass |
| SQL string interpolation | SQL injection vector |
| Synchronous file I/O in request path | Event loop blocking |
| `process.env.VAR` without validation | Silent misconfiguration |
| Business logic in route handlers | Untestable, violates separation of concerns |
| Unbounded `Promise.all` | Resource exhaustion under load |
| Storing secrets in environment variables in production | Secret sprawl, rotation difficulty |
| `any` type in TypeScript without justification | Type safety erosion |
| Pagination with `OFFSET` on large tables | O(n) cost per page |
| Fire-and-forget external API calls in request path | Unhandled failures, latency coupling |
| `npm install` in Dockerfile without `--ci` | Non-deterministic builds |
| Hardcoded timeouts (e.g., `setTimeout(fn, 5000)`) without rationale | Magic numbers, unmaintainable |
| Global mutable state in services | Concurrency bugs, test contamination |

---

## 12. Decision Heuristics

Apply these when choosing between approaches:

1. **DB vs Application Logic:** Compute in the application unless the DB operation would eliminate a round-trip, use native set operations, or enforce data integrity that the application cannot guarantee.
2. **Sync vs Async Processing:** If the operation takes >200ms or involves external I/O that is not user-blocking, move to a queue.
3. **Cache vs DB:** Cache only when the data is read-heavy, the staleness tolerance is defined, and invalidation is implementable. Never cache for performance without measuring the bottleneck first.
4. **REST vs WebSocket:** REST unless the use case requires real-time bidirectional state sync. SSE before WebSocket when the flow is server-to-client only.
5. **Add Index vs Rewrite Query:** Analyze the query plan first. An index on a bad query often just hides the real problem.
6. **Retry vs Circuit Break:** Retry for transient failures with bounded attempts. Circuit break when a dependency is persistently unavailable to prevent cascade failure.

---

*End of Agent Instruction Manual. All code generated by this agent must conform to these standards by default.*