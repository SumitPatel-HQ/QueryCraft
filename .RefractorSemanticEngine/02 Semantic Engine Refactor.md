# QueryCraft — Semantic Engine Refactor (Final Architecture & Pipeline)

---

# 🎯 OBJECTIVE

Transform the semantic layer into a **deterministic meaning extraction system** that:

* produces structured intent (Intermediate Representation)
* contains NO keyword-based logic
* integrates cleanly into existing pipeline
* is safe for downstream execution control

---

# 🧠 CORE ARCHITECTURE PRINCIPLE

This system follows the same principle used in compilers:

```text
Input → Interpretation → Intermediate Representation → Execution
```

In NL→SQL systems:

```text
Natural Language → Semantic Parsing → IR → SQL
```

This is necessary because natural language and SQL have a **semantic mismatch**, and IR bridges that gap ([qmro.qmul.ac.uk][1]).

---

# 🧩 SYSTEM ARCHITECTURE

---

## FULL PIPELINE (AFTER REFACTOR)

```text
User Query
   ↓
Query Layer (no decision)
   ↓
Semantic Engine  ← (THIS PHASE)
   ↓
IntentPlan (Structured IR)
   ↓
Prompt Builder
   ↓
LLM SQL Generation
   ↓
SQL Validation
   ↓
(Next Phase: Execution Decision Layer)
```

---

# 🧩 ROLE OF SEMANTIC ENGINE

---

## What it DOES

* Converts natural language into structured meaning
* Produces a consistent representation (IntentPlan)

---

## What it DOES NOT DO

* does not block
* does not validate SQL
* does not enforce safety
* does not execute logic

---

## Mental Model

> Semantic Engine = **Parser**, not **Controller**

---

# 🧩 INTENTPLAN — FINAL SCHEMA (STRICT CONTRACT)

---

## Root Structure

```json
{
  "query": "string",
  "intents": [Intent],
  "is_compound": boolean,
  "primary_action": "DATA_READ | DATA_WRITE | SCHEMA_CHANGE | UNKNOWN"
}
```

---

## Intent Object

```json
{
  "action": "DATA_READ | DATA_WRITE | SCHEMA_CHANGE | UNKNOWN",

  "target": {
    "tables": ["string"],
    "columns": ["string"],
    "relationships": ["string"]
  },

  "modifiers": {
    "filters": [],
    "aggregations": [],
    "sorting": [],
    "limits": null
  },

  "confidence": float
}
```

---

# 🧩 PIPELINE BEHAVIOR (STEP-BY-STEP)

---

## STEP 1 — Input

User query enters system as raw natural language.

---

## STEP 2 — Semantic Parsing

The semantic engine transforms the query into structured meaning.

This is NOT:

* keyword matching
* rule-based classification

This IS:

> mapping natural language → formal meaning representation
> (as defined in semantic parsing systems) ([Wikipedia][2])

---

## STEP 3 — Structure Construction

The engine extracts:

* action (what is being done)
* target (what it applies to)
* modifiers (how it is applied)

---

## STEP 4 — Intent Aggregation

If multiple intents exist:

* combine them
* determine primary_action using precedence:

```text
SCHEMA_CHANGE > DATA_WRITE > DATA_READ
```

---

## STEP 5 — Output

Return a fully structured IntentPlan.

No decision is made at this stage.

---

# 🧩 IMPLEMENTATION MODEL (IMPORTANT FOR AGENT)

---

## Allowed Implementation Approach

The semantic engine must:

* use a meaning extraction mechanism
* produce structured JSON
* map JSON → IntentPlan

---

## Strict Constraints

---

### ❌ NOT ALLOWED

* substring matching
* keyword lookup tables
* regex-based intent classification
* rule-based “if contains” logic

---

### ✅ REQUIRED

* representation-first extraction
* structure-driven output
* consistent schema

---

# 🧩 VALIDATION LAYER (MANDATORY)

---

## Purpose

Ensure LLM output is usable and deterministic.

---

## Validation Rules

After semantic extraction:

---

### 1. Schema Validation

* all required fields must exist
* structure must match Intent schema

---

### 2. Normalization

* missing fields → default values
* invalid types → corrected

---

### 3. Fallback Behavior

If parsing fails:

* return Intent with action = UNKNOWN
* do NOT block pipeline

---

---

# 🧩 DETERMINISM GUARANTEE

---

## Problem

LLM output can be inconsistent.

---

## Solution

System enforces:

* fixed schema
* normalization step
* rejection of malformed structure

---

This converts:

```text
non-deterministic LLM → deterministic system behavior
```

---

# 🧩 FAILURE MODES (HANDLED)

---

## Case 1 — Ambiguous Query

→ action = UNKNOWN
→ pipeline continues

---

## Case 2 — Partial Extraction

→ missing fields filled with defaults

---

## Case 3 — Multi-Intent Confusion

→ still produce structured list
→ no blocking

---

# 🧩 WHY THIS DESIGN WORKS

---

## 1. Matches proven architecture

Modern NL→SQL systems rely on:

* intermediate representations (IR)
* semantic parsing layer
  ([ACL Anthology][3])

---

## 2. Removes keyword dependency completely

No logic depends on:

* specific words
* phrasing variations

---

## 3. Enables next phases

This structure is REQUIRED for:

* execution decision layer
* preview system
* sandboxing

---

# 🧩 WHAT DOES NOT CHANGE

---

* query routing
* prompt builder
* SQL generation
* database execution

---

# 🧠 FINAL SYSTEM MODEL

---

## BEFORE

```text
User → keyword logic → fragile intent → SQL
```

---

## AFTER

```text
User → semantic parsing → structured IR → SQL
```

---

# 🔥 FINAL PRINCIPLE

The system must not interpret language using rules.

It must represent meaning in a form that:

> can be reliably understood by the rest of the system.

[1]: https://qmro.qmul.ac.uk/xmlui/bitstream/handle/123456789/82330/Accurate_and_Robust_Text_to_SQL_Parsing_using_Intermediate_Representation%20%283%29.pdf?isAllowed=y&sequence=2&utm_source=chatgpt.com "Accurate and Robust Text-to-SQL Parsing using ..."
[2]: https://en.wikipedia.org/wiki/Semantic_parsing?utm_source=chatgpt.com "Semantic parsing"
[3]: https://aclanthology.org/P19-1444.pdf?utm_source=chatgpt.com "Towards Complex Text-to-SQL in Cross-Domain Database ..."
