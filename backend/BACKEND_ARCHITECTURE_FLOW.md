# QueryCraft Backend Architecture Diagram

This is a flow-first backend architecture diagram.
No class diagram. No API logging internals.

## 1) System Architecture (Runtime)

```text
+------------------------+
| Frontend Client        |
| (Next.js / Browser)    |
+-----------+------------+
            |
            v
+------------------------+
| FastAPI App            |
| main.py                |
+-----------+------------+
            |
            v
+------------------------+
| Auth Middleware        |
| Firebase Token Verify  |
+-----------+------------+
            |
            v
+------------------------+      +------------------------+
| API Route Layer        |----->| Chat Router            |
| api/routers/*          |      | /api/v1/chat*          |
+----+----+----+----+----+      +-----------+------------+
     |    |    |    |                       |
     |    |    |    |                       v
     |    |    |    |              +------------------------+
     |    |    |    |              | Metadata Storage       |
     |    |    |    |              | PostgreSQL             |
     |    |    |    |              | databases/query_history|
     |    |    |    |              | chat/bookmarks         |
     |    |    |    |              +------------------------+
     |    |    |    |
     |    |    |    +----------> +--------------------------+
     |    |    |                 | Schema Router            |
     |    |    |                 | /api/v1/schema*          |
     |    |    |                 +------------+-------------+
     |    |    |                              |
     |    |    |                              v
     |    |    |                 +--------------------------+
     |    |    |                 | Schema/ERD Services      |
     |    |    |                 +------------+-------------+
     |    |    |                              |
     |    |    |                              v
     |    |    |                 +--------------------------+
     |    |    |                 | User Data Sources        |
     |    |    |                 | SQLite files / Live MySQL|
     |    |    |                 +--------------------------+
     |    |    |
     |    |    +-------------> +----------------------------+
     |    |                    | Session Query Router       |
     |    |                    | /api/query                 |
     |    |                    +-------------+--------------+
     |    |                                  |
     |    |                                  v
     |    |                    +----------------------------+
     |    |                    | AI Pipeline                |
     |    |                    | prompt -> SQL -> validate |
     |    |                    +-------------+--------------+
     |    |                                  |
     |    |                                  v
     |    |                    +----------------------------+
     |    |                    | Executor (session-bound)   |
     |    |                    +-------------+--------------+
     |    |                                  |
     |    |                                  v
     |    |                    +----------------------------+
     |    |                    | User Data Sources          |
     |    |                    | SQLite files / Live MySQL  |
     |    |                    +----------------------------+
     |    |
     |    +------------------> +----------------------------+
     |                         | Queries Router             |
     |                         | /api/v1/databases/{id}/query|
     |                         +-------------+--------------+
     |                                       |
     |                                       v
     |                         +----------------------------+
     |                         | NL-to-SQL Processor        |
     |                         | LLM path / fallback path   |
     |                         +-------------+--------------+
     |                                       |
     |                                       v
     |                         +----------------------------+
     |                         | DB Execution Layer         |
     |                         | SQLite / MySQL             |
     |                         +-------------+--------------+
     |                                       |
     |                                       v
     |                         +----------------------------+
     |                         | Query History Persistence  |
     |                         | PostgreSQL metadata        |
     |                         +----------------------------+
     |
     +-----------------------> +----------------------------+
                               | Databases Router           |
                               | /api/v1/databases*         |
                               +-------------+--------------+
                                             |
                                             v
                               +----------------------------+
                               | Upload/Connection Services |
                               | file import + schema stats |
                               +------+---------------------+
                                      |
                  +-------------------+-------------------+
                  |                                       |
                  v                                       v
       +------------------------+              +------------------------+
       | Metadata Storage       |              | User Data Sources      |
       | PostgreSQL             |              | SQLite / Live MySQL    |
       +------------------------+              +------------------------+
```

## 2) Query Processing Diagram (Primary Path)

```text
Client Question
      |
      v
[POST /api/v1/databases/{id}/query]
      |
      v
[Auth + User-scoped DB lookup]
      |
      v
[Fetch Fresh Schema]
      |
      v
+-------------------------+
| Cache Check             |
+-----------+-------------+
            |hit
            v
      [Return Cached]
            |
            +-------------------------------> Response
            |
            |miss
            v
[Build NLToSQLProcessor]
      |
      v
+-------------------------+
| SQL Generation Strategy |
+-----------+-------------+
            |LLM available
            v
      [LLM SQL Generation]
            |
            v
      [SQL Validation]
            |
            +---- invalid + provider responsive -> [Blocked/Error Response]
            |
            +---- invalid + provider unavailable -> [Fallback Pattern SQL]
            |
            v
      [Execute Query]
            |
            v
[SQLite file or Live MySQL]
            |
            v
[Build response metadata]
            |
            v
[Persist query_history in PostgreSQL]
            |
            v
Response
```

## 3) Upload and Database Registration Diagram

```text
[POST /api/v1/databases/upload]
              |
              v
      [Validate File Type]
              |
              v
       [Save Uploaded File]
              |
              v
      +---------------------+
      | File Type Branch    |
      +----+--------+-------+
           |        |
           |        +------------------------+
           |                                 |
       .sqlite/.db                         .sql
           |                                 |
           v                                 v
 [Validate SQLite]                [Import SQL -> SQLite]
           |                                 |
           +--------------+------------------+
                          |
                          |            .csv
                          |             |
                          |             v
                          |     [Import CSV -> SQLite]
                          |             |
                          +-------------+
                                |
                                v
                      [Read Schema + Stats]
                                |
                 +--------------+---------------+
                 |                              |
                 v                              v
      [Persist metadata in PostgreSQL]   [Keep created SQLite file]
                 |                              |
                 +--------------+---------------+
                                |
                                v
                             Response
```

## 4) Session Query Diagram (api/query)

```text
[POST /api/query]
       |
       v
[Find executor by session_id]
       |
       v
+------------------------------+
| Sensitive request keywords?  |
+-----------+------------------+
            |yes
            v
   [Refusal response]
            |
            +---------------------------> Response
            |
            |no
            v
 [Executor introspects schema]
            |
            v
 [Load conversation history]
            |
            v
 [Build prompt]
            |
            v
 [Get LLM provider chain]
            |
            v
 [Generate SQL]
            |
            v
 [Validate SQL safety]
            |
            v
 [Execute query]
            |
            v
 [Format summary/table output]
            |
            v
 [Store assistant message]
            |
            v
          Response
```

## 5) Data Ownership Boundary

```text
+-------------------------------------------------------------+
| PostgreSQL Metadata DB                                      |
| - databases (registered DB connections/files)               |
| - query_history                                              |
| - chat_sessions / chat_messages / bookmarks                 |
+-------------------------------------------------------------+

+-------------------------------------------------------------+
| User Query Data Sources                                     |
| - Uploaded SQLite files                                     |
| - Live MySQL databases                                      |
| (actual business data queried by NL-to-SQL flow)            |
+-------------------------------------------------------------+
```
