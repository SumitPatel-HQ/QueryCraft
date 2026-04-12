# 🔧 Pre-Refactor Cleanup — Remove Keyword-Based Logic

---

# 🎯 Purpose

Eliminate all heuristic and keyword-driven logic before introducing structured semantic parsing.

This ensures the new system does not inherit or depend on legacy behavior.

---

# 🧩 Scope

This cleanup applies ONLY to the semantic layer and related helpers.

---

# 🧩 What Must Be Removed

---

## 1. Keyword-Based Classification

Remove any logic that:

* maps specific words to actions
* assigns intent based on word presence
* uses lookup tables for intent detection

---

## 2. Regex-Based Intent Detection

Remove any patterns used to:

* detect operations
* split or classify based on connectors
* infer intent from syntax patterns

---

## 3. Heuristic Scoring Systems

Remove:

* scoring logic for intent selection
* priority weights based on keywords

---

## 4. String-Based Decision Logic

Remove any logic of the form:

* substring checks
* conditional branches based on text content

---

# 🧩 What Should Remain

---

## 1. Structural Utilities

Keep:

* clause splitting (if purely structural, not semantic)
* entity extraction (schema-based)

---

## 2. Data Flow

Preserve:

* input → decomposition → IntentPlan

---

# 🧩 Expected Result After Cleanup

The semantic layer should:

* no longer assign meaning using rules
* no longer infer intent from keywords
* only pass raw or minimally processed query forward

---

# ⚠️ Important Constraint

After cleanup:

* the system may temporarily produce weaker intents
* this is expected and acceptable

---

# 🧠 Key Principle

> Remove incorrect intelligence before adding correct intelligence.

---

# 🚀 Transition

After this cleanup is complete:

→ proceed with Semantic Engine Refactor (structured representation)
