# QueryCraft — Execution Decision Layer (Flow-Based Design)

---

# 🎯 Purpose

This layer determines **how a generated SQL query should be executed**, based on:

* what the user intended (IntentPlan)
* what the SQL actually does

It does not block understanding.
It only decides execution behavior.

---

# 🧩 Position in Pipeline

The decision layer operates after SQL is generated and validated.

```text
IntentPlan → SQL Generation → SQL Validation → Execution Decision → Execution
```

---

# 🧠 Core Idea

Execution is not a binary decision.

Each query is mapped to one of three execution paths:

* direct execution
* preview execution
* confirmation-required execution

---

# 🧩 Step-by-Step Flow

---

## Step 1 — Read Semantic Intent

From IntentPlan, extract:

* operation category (READ / WRITE / DDL)

This represents what the user is trying to do.

---

## Step 2 — Read SQL Behavior

From the generated SQL, determine:

* actual operation type

This represents what the system is about to do.

---

## Step 3 — Compare Intent vs SQL

Evaluate alignment:

* If both match → normal flow
* If mismatch → treat as unsafe

This ensures:

* user intent is respected
* LLM output is verified

---

## Step 4 — Assign Execution Path

---

### Case A — Read Operations

* nature: non-mutating
* behavior: execute immediately

Result:

* query runs directly
* response returned

---

### Case B — Write Operations

* nature: data mutation
* behavior: simulate before execution

Result:

* run in controlled environment (transaction / dry-run)
* collect:

  * affected rows
  * sample output
* return preview to user

---

### Case C — Structural Operations (DDL)

* nature: schema-level impact
* behavior: require explicit user action

Result:

* do not execute automatically
* return SQL + explanation
* wait for confirmation

---

## Step 5 — Return Execution Metadata

Every response includes:

* operation type
* execution path
* whether user action is required

This enables UI-level control without backend complexity.

---

# 🧩 Failure Handling

---

## Case: Intent and SQL do not align

Example:

* intent → READ
* SQL → DELETE

Behavior:

* do not execute
* treat as high-risk
* route to confirmation

---

## Case: Preview cannot be generated

Behavior:

* fallback to confirmation
* still avoid direct execution

---

# 🧠 Design Characteristics

---

## 1. Intent-aware

Decisions are based on structured intent, not raw text.

---

## 2. SQL-aware

Decisions are verified using actual SQL behavior.

---

## 3. Non-blocking

No query is rejected at this stage.
Only execution path changes.

---

## 4. Incremental

This layer works with current pipeline without restructuring it.

---

# 🧠 Why This Works

This design ensures:

* safe execution without limiting capability
* consistent behavior across all query types
* compatibility with future layers (isolation, sandbox)

---

# 🚀 Resulting System Behavior

---

## Before

* all queries treated the same
* no control over execution risk

---

## After

* execution adapts to query type
* system becomes predictable and safe
* foundation ready for advanced features

---

# 🔥 Key Insight

The system does not decide:

> “Should this query exist?”

It decides:

> “How should this query be executed?”
