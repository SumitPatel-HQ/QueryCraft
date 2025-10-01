# **Product Requirements Document: QueryCraft v1.0**

**Document Status:** DRAFT **Version:** 0.9 **Last Updated:** 2024-09-17 **Owner:** Senior Technical Product Manager

## **1\. Product Vision and Strategic Context**

### **1.1. The Problem: The Data Analysis Bottleneck**

In the modern enterprise, data is the most valuable asset, yet it remains largely inaccessible to the majority of decision-makers. Business stakeholders—from product managers shaping future features to marketing analysts measuring campaign efficacy—are fundamentally disconnected from the data required to make timely, informed decisions. The primary barrier is a skills gap: proficiency in Structured Query Language (SQL) remains the domain of specialized data teams.  
This dependency creates a critical operational inefficiency known as the "Analyst Bottleneck." Data analytics and engineering teams report spending as much as 50% of their time servicing a queue of ad-hoc, often repetitive, data pull requests from across the organization. This process introduces significant delays, with simple business questions taking days to answer, which in turn slows down strategic decision-making and reduces the overall analytical throughput of the enterprise.  
While Business Intelligence (BI) platforms were intended to address this gap, their adoption remains low. Industry data suggests that only about a quarter of employees use these tools regularly, leaving most decision-makers reliant on intermediaries for data access. The rigid, dashboard-centric nature of many BI tools is ill-suited for the kind of exploratory, iterative analysis that drives true discovery.  
Furthermore, the current ad-hoc workflow poses a significant and often overlooked security risk. To circumvent the bottleneck, data is frequently shared via hand-crafted SQL scripts or direct data exports. These informal methods often bypass centralized auditing, access control, and compliance checks, creating severe "Governance Gaps." This uncontrolled access increases the risk of data leakage and non-compliance with data protection regulations. The problem, therefore, is not merely one of inefficiency but of systemic risk to the organization's data integrity and security.

### **1.2. The Vision: Democratizing Data-Driven Decisions**

QueryCraft's vision is to create an intelligent data interface that empowers every business user to become a self-sufficient data explorer. Our mission is to translate human curiosity, expressed in natural language, into precise, secure, and efficient database queries. We aim to eliminate the analyst bottleneck, accelerate the speed of insight from days to seconds, and foster a pervasive culture of data-driven decision-making across every level of the organization. By making data conversational, QueryCraft will transform it from a resource guarded by specialists into a utility accessible to all.

### **1.3. Core Principles**

All development and product decisions for QueryCraft will be guided by three foundational principles:

* **Verifiable Accuracy:** The system's output must be objectively and demonstrably correct. A generated SQL query is a piece of code; it is either syntactically valid and semantically correct, or it is not. This principle of verifiability is our core differentiator. Success is not subjective; it is measured by whether the query executes without error and whether its output matches that of a human-written "golden" query. This commitment to hard, quantitative success metrics will be embedded in our testing and evaluation frameworks.  
* **Enterprise-Grade Security:** We will not compromise on security. The democratization of data access cannot come at the cost of data protection. QueryCraft must integrate seamlessly with and rigorously enforce existing enterprise security protocols, including authentication, authorization, and data governance policies. Security is a foundational feature, not an add-on, ensuring that expanded access does not lead to data leakage or unauthorized use.  
* **Intuitive Usability:** The user experience must be frictionless for non-technical users. The product must build trust through transparency, not opacity. This means clearly explaining its actions in plain English, visualizing the path from question to answer, and guiding users toward successful and insightful data discovery. The interface should feel less like a tool and more like a conversation with a knowledgeable data analyst.

## **2\. User Personas and Journeys**

### **2.1. Target User Personas**

We are building QueryCraft for a specific set of users whose work is currently hampered by the data analysis bottleneck.

* **Primary Persona: "Priya," the Product Manager**  
  * **Goal:** To rapidly validate product hypotheses and inform the roadmap by understanding user behavior. She needs to answer questions like, "Which features are most used by users in their first week after signup?" or "What is the adoption rate of our new checkout flow among enterprise customers?"  
  * **Pain Point:** The agile development cycle moves in days, but getting answers from the data team takes just as long. This friction forces her to make decisions with incomplete information or delay critical roadmap adjustments. She does not know SQL, and the company's BI dashboards are too high-level for the granular, exploratory questions she needs to ask.  
* **Primary Persona: "Mark," the Marketing Analyst**  
  * **Goal:** To segment customer bases, measure the return on investment (ROI) of marketing campaigns, and identify trends in customer acquisition. He needs to ask questions like, "Show me the lifetime value of customers acquired through the Q2 social media campaign versus the email campaign, broken down by region."  
  * **Pain Point:** The data team is overwhelmed with requests from across the company, so he cannot iterate on his analysis quickly. A single question often leads to another, but the long feedback loop makes this exploratory process impossible. He has basic BI tool skills but is constantly hitting the limits of pre-defined dashboards and needs true ad-hoc querying power.  
* **Secondary Persona: "David," the Junior Data Analyst**  
  * **Goal:** To increase his efficiency and focus on high-impact, complex analytical projects while also improving his SQL skills.  
  * **Pain Point:** David spends over half his day writing simple, repetitive SQL queries for business users like Priya and Mark. This boilerplate work is unfulfilling and prevents him from tackling more challenging analyses that would add greater value. He sees QueryCraft as a force multiplier: it can automate the simple requests, freeing up his time. He also views it as a learning tool, allowing him to see how natural language questions are translated into efficient, well-structured SQL, thereby accelerating his own professional development.

### **2.2. Key User Stories**

The following user stories, grouped under the epic of "Self-Serve Data Exploration," define the core user-facing functionality for v1.0.

* **QC-US-001:** As Priya, I want to ask "Show me the top 10 customers by purchase value in the last 60 days in Germany" in a simple text box, so I can quickly identify key accounts for user interviews without needing to write a formal data request ticket and wait for days.  
* **QC-US-002:** As Mark, I want to ask "What is the average order value for each marketing channel in Q2, sorted from highest to lowest?" so I can rapidly assess channel effectiveness and include the data in my quarterly performance report.  
* **QC-US-003:** As David, I want to input a business user's vague question, such as "How are sales doing in our new product line?", see the initial SQL generated by the system, and then have the ability to copy and refine it myself, so I can speed up my workflow while still maintaining final control over complex queries.  
* **QC-US-004:** As Priya, after QueryCraft returns a table of data, I want to see a simple, one-sentence English explanation of the query that was run, so I can be confident that the data I'm looking at is the correct answer to my specific question and build trust in the system's output.

## **3\. System Architecture and End-to-End Workflow**

### **3.1. High-Level System Diagram**

QueryCraft is designed as a modern, multi-tiered, service-oriented architecture to ensure scalability, security, and maintainability. The system comprises five major logical layers:

1. **Frontend (UI):** A responsive web application, likely built with a modern framework like React or Streamlit, that serves as the primary user interaction point. It is responsible for rendering the query interface, schema explorer, and results grid.  
2. **Backend API (Orchestration Layer):** A stateless API, built with a high-performance framework like FastAPI, serves as the central nervous system. It handles user authentication, manages requests for schema introspection, and orchestrates the complex, multi-step workflow of the NL-to-SQL generation process.  
3. **Core AI Services (Containerized Microservices):** This layer contains the specialized intelligence of the platform, with each component designed as a scalable, containerized microservice:  
   * **Schema Intelligence Service:** Responsible for connecting to user databases, performing schema introspection, and constructing the semantic representations needed by the language model.  
   * **NL-to-SQL Generation Engine:** Houses the fine-tuned Large Language Model (LLM) and the constrained decoding logic (PICARD) that performs the core natural language to SQL translation.  
   * **Execution & Reranking Service:** Manages a pool of secure, sandboxed environments for safely executing candidate SQL queries and implementing the execution-guided reranking algorithm to select the optimal query.  
4. **Database Connectors:** A layer of secure, read-only connectors responsible for establishing and managing connections to a variety of customer SQL databases (e.g., PostgreSQL, MySQL, SQL Server).  
5. **Security & Logging Services:** A cross-cutting layer that integrates with enterprise identity providers (e.g., LDAP/IAM) for authentication and authorization, and streams comprehensive audit logs to a centralized logging system like the ELK stack (Elasticsearch, Logstash, Kibana).

### **3.2. The User's Journey: From Question to Insight**

The system's architecture is designed around a fundamental "trust-but-verify" principle. It does not blindly accept the initial output of the language model. Instead, it subjects the generated queries to a multi-stage validation process that progressively increases the confidence in the final result. This funnel-like approach is critical for delivering the accuracy required for an enterprise-grade product.

1. **Connection:** The journey begins when a user provides secure, read-only credentials for their target database. The Database Connector service establishes a TLS-encrypted connection and validates the credentials.  
2. **Introspection and Semantic Enhancement:** The Schema Intelligence Service is invoked. It performs a standard introspection to map tables, columns, data types, and foreign key relationships. Critically, it goes a step further by creating a "semantic-enhanced schema." This involves sampling a small number of representative data values from key columns, especially those that might be referenced in a user's question. This process, potentially using techniques like BM25 indexing to find relevant values, provides the LLM with vital context that is absent from the schema alone (e.g., knowing that the country\_code column contains values like "US" and "DE" helps it correctly interpret a question about "Germany").  
3. **Question:** The user types a question in plain English (e.g., "Show me total sales by product category in Q2") into the frontend UI. The question is sent to the Backend API.  
4. **Constrained Generation:** The API packages the user's question with the semantic-enhanced schema and forwards it to the NL-to-SQL Generation Engine. The fine-tuned LLM uses this context to generate a set of N candidate SQL queries via a beam search algorithm. During this process, every potential token is validated by the **PICARD** algorithm. PICARD acts as a real-time grammatical guardrail, incrementally parsing the output and immediately rejecting any token that would lead to a syntactically invalid SQL query. This guarantees that 100% of the candidate queries emerging from this stage are parsable and syntactically correct.  
5. **Execution-Guided Verification & Reranking:** The N syntactically valid candidates are passed to the Execution & Reranking Service. This is the ultimate semantic validation step. The service executes each candidate query within a secure, isolated, and resource-limited sandbox environment against a read-only replica of the user's database.  
   * Any query that results in a database error is immediately discarded.  
   * The remaining successfully executed queries are then "reranked." The system selects the best query based on a hierarchy of heuristics, such as execution success and semantic consistency signals (e.g., comparing the result sets of the candidates to find the most likely intended answer). This execution-guided approach ensures the final selected query is not just syntactically correct, but also semantically meaningful in the context of the actual database.  
6. **Explanation & Display:** The single, best-ranked SQL query is chosen as the final answer. This query is executed one last time to fetch the definitive result set. Concurrently, the SQL is passed to a separate process that generates a concise, human-readable English explanation of its logic. The Backend API returns the final SQL, the English explanation, and the data results to the frontend, which displays them to the user in an integrated view.

## **4\. Functional Requirements: The QueryCraft Platform**

This section provides a detailed specification of the features and capabilities—the "what"—of the QueryCraft v1.0 product.

### **4.1. Database Connectivity and Schema Intelligence**

* **QC-FR-101: Secure Database Connectors:** The system must provide secure, read-only connectors for the following SQL databases: PostgreSQL, MySQL, and SQL Server. All connection credentials must be encrypted at rest and all data transfer must be encrypted in transit using industry-standard TLS protocols.  
* **QC-FR-102: Automated Schema Introspection:** Upon establishing a successful connection, the system must automatically and efficiently perform schema introspection. This process must identify and catalog all accessible tables, their respective column names, data types (e.g., VARCHAR, INTEGER, TIMESTAMP), and defined primary and foreign key relationships. This information forms the foundational context for the LLM.  
* **QC-FR-103: Semantic-Enhanced Schema Representation:** To bridge the gap between technical schema names and business terminology, the system must implement a mechanism to enrich the basic schema with contextual data values. For columns identified as potentially relevant to a user's query (e.g., via keyword matching or a BM25 index), the system will retrieve a small, representative sample of the top M values. This "semantic-enhanced schema" provides the LLM with crucial domain-specific knowledge, significantly improving its ability to handle ambiguous terms (e.g., mapping "America" to "USA") and correctly format values in WHERE clauses.

### **4.2. The NL-to-SQL Generation Engine**

#### **4.2.1. Model Architecture and Fine-Tuning**

* **QC-FR-201: Base Model Selection:** The system shall be architected around a pre-trained sequence-to-sequence transformer model. The primary candidate for the v1.0 release is **T5-3B**, selected for its well-documented strong performance on text-to-SQL benchmarks, especially when paired with constrained decoding techniques like PICARD. As part of our R\&D, we will concurrently evaluate the performance of emerging open-source, code-specialized models such as **CodeS**, which have shown state-of-the-art results on SQL generation tasks.  
* **QC-FR-202: Composite Fine-Tuning Dataset:** The selected base model must undergo a rigorous fine-tuning process on a composite dataset designed to impart a comprehensive set of SQL generation skills. This dataset will be an amalgamation of:  
  * **Spider:** Used to train the model on generating complex, multi-table queries involving JOINs, subqueries, and aggregations. Its cross-domain nature is essential for teaching the model to generalize to new, unseen database schemas.  
  * **WikiSQL:** Included to augment the training data with a high volume of simpler, single-table queries. This improves the model's fluency and accuracy on the most common types of business questions, which often do not require complex joins.  
  * **CoSQL:** Incorporated to introduce conversational context. While full conversational capabilities are a post-v1.0 feature, training on CoSQL will prepare the model architecture to handle dialogue history and follow-up questions in future iterations.

#### **4.2.2. Syntactic Correctness via Constrained Decoding**

* **QC-FR-203: Mandatory PICARD Integration:** The SQL generation process must integrate the **PICARD** algorithm for constrained auto-regressive decoding. During the beam search decoding phase, PICARD will function as an active filter. It will incrementally parse the generated token sequence and preemptively reject any token that would violate the strict grammar of the SQL language. This is a non-negotiable architectural requirement to guarantee that all candidate queries passed to the execution stage are 100% syntactically valid, thereby eliminating an entire class of potential model errors.

#### **4.2.3. Semantic Accuracy via Execution-Guided Reranking**

* **QC-FR-204: Multi-Candidate Generation (Beam Search):** For each natural language input, the model must generate a list of N candidate SQL queries using a beam search strategy. The beam width (N) shall be a configurable parameter, with an initial default of N=8.  
* **QC-FR-205: Secure Sandboxed Query Execution:** The system must provide a secure, ephemeral, and containerized sandbox environment (e.g., using Docker) for each user session. This sandbox will be strictly configured to execute queries against a read-only replica of the user's database or using a database user role with severely restricted permissions. Each sandbox must have strict resource limits (CPU, memory, execution time) to prevent runaway queries.  
* **QC-FR-206: Execution-Guided Reranking Logic:** The N candidate queries generated in QC-FR-204 will be passed to the execution sandbox. The system will implement a reranking algorithm that first filters out any queries that produce execution errors. The remaining successfully executed queries will be reranked based on execution success and semantic consistency heuristics. The top-ranked query from this process will be selected as the final, definitive answer. This execution-guided methodology is the primary mechanism for ensuring the semantic correctness of the generated SQL.

### **4.3. The User Interface and Experience (UI/UX)**

* **QC-FR-301: Main Query Interface:** The UI will feature a clean, minimalist design centered around a primary text input box where the user enters their natural language question. The design will prioritize simplicity and ease of use for non-technical users.  
* **QC-FR-302: Interactive Schema Explorer:** A collapsible side panel will be available to the user, displaying the schema of the connected database in a hierarchical, easy-to-navigate tree view (Database \> Tables \> Columns). This allows users to browse and understand the data available to them, aiding in question formulation.  
* **QC-FR-303: Context-Aware Autocomplete Suggestions:** To guide users and reduce ambiguity, the query input box shall provide intelligent autocomplete suggestions. As the user types, the system will suggest relevant table and column names from the connected schema.  
* **QC-FR-304: Rich Results Display Grid:** The results of the executed query must be displayed in a modern, interactive data grid. This grid must support essential features for data exploration, including: pagination for large result sets, client-side sorting by clicking on column headers, and a one-click option to download the full result set as a CSV file.

### **4.4. The Trust and Transparency Layer**

* **QC-FR-401: SQL and Explanation Toggle View:** To build user trust and facilitate learning, the interface must clearly display both the final generated SQL query and its corresponding natural language explanation. The user shall be able to easily toggle between these views or see them side-by-side.  
* **QC-FR-402: Natural Language Explanation Generation:** After the final SQL query is selected by the reranking service, the system must invoke a separate process to translate the structured SQL code *back* into a concise, human-readable English summary. For example, a complex SQL query might be summarized as: "This query finds the total sales for each product category in the second quarter, and sorts them from highest to lowest." This feature is critical for assuring non-technical users that the system correctly understood their intent.

## **5\. Non-Functional Requirements**

This section defines the system-wide standards for quality, security, performance, and reliability. These requirements are as critical as the functional features for ensuring QueryCraft is an enterprise-ready product.

### **5.1. Enterprise-Grade Security and Governance**

The security architecture of QueryCraft is paramount. It must not only protect itself but also act as a responsible steward of the sensitive enterprise data it accesses.

| Threat Vector | Description | Risk Level | Mitigation Requirement | PRD ID |
| :---- | :---- | :---- | :---- | :---- |
| **Indirect SQL Injection** | A user's natural language input is crafted to make the LLM generate malicious SQL fragments. | **Critical** | Sanitize all natural language inputs for malicious patterns; The execution sandbox must use parameterized queries or equivalent safe execution methods; Database connection roles must be strictly read-only. | QC-NFR-103 |
| **Data Exfiltration** | A user with limited permissions tricks the LLM into generating a query that accesses unauthorized tables, columns, or rows. | **High** | Enforce RBAC/ABAC at the user session level; All generated queries must be programmatically validated against the user's defined permissions before being passed to the execution sandbox. | QC-NFR-101 |
| **PII Leakage** | A query result inadvertently exposes sensitive customer or employee data (e.g., emails, phone numbers, addresses) to users not authorized to see it. | **High** | Implement automated, policy-driven data masking on columns flagged as containing Personally Identifiable Information (PII) for all non-privileged user roles. | QC-NFR-102 |
| **Denial of Service (DoS)** | A user asks a question that generates a computationally expensive query (e.g., a cross-join on large tables), overwhelming the database. | **Medium** | Impose strict execution time limits (e.g., 30 seconds) and resource quotas (CPU, memory) within the query sandbox; Where possible, analyze the query execution plan for cost before full execution. | QC-NFR-201 |
| **Lack of Accountability** | An improper query is run, and it is impossible to trace who asked the original question that generated it. | **Critical** | Maintain an immutable, comprehensive audit log containing the tuple of (User ID, User Role, Natural Language Question, Final Generated SQL, Timestamp) for every query. | QC-NFR-104 |

* **QC-NFR-101: Authentication and Access Control:** The system must integrate with standard enterprise identity providers (IdP) using protocols such as LDAP, SAML, or OpenID Connect. It must enforce both Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC), mapping authenticated user roles and attributes to specific database permissions. The system must never be able to query data that the authenticated user is not permitted to access through other means.  
* **QC-NFR-102: Data Privacy and Filtering:** The system must be capable of enforcing both row-level and column-level security filters based on defined user roles and data governance policies. For columns containing sensitive data like PII, the system shall apply data masking techniques in the final query results for any user roles not explicitly authorized to view that information.  
* **QC-NFR-103: Proactive Threat Mitigation:** All natural language inputs must be rigorously sanitized to defend against prompt injection attacks designed to manipulate the LLM's behavior. The execution sandbox must be architected to prevent any form of SQL injection, for instance by using parameterized queries or a safe execution wrapper, ensuring that values are never directly concatenated into query strings.  
* **QC-NFR-104: Comprehensive Auditing:** Every query transaction must be logged to a secure, immutable audit trail. This includes the authenticated user's identity, the original natural language question, the final generated SQL query, and a timestamp. These logs must be shipped to a centralized security information and event management (SIEM) system or an equivalent logging stack (e.g., ELK) for compliance monitoring and security analysis.

### **5.2. Performance and Scalability**

* **QC-NFR-201: Query Latency:** The end-to-end latency is a critical user experience metric. The system must meet the following Key Performance Indicator (KPI): The 95th percentile (P95) latency, measured from the moment a user submits a question to the moment the first page of results is displayed, must be less than 8 seconds for queries against a standard schema (\<10 tables) with a target database size of \<1 million rows.  
* **QC-NFR-202: Scalable Cloud-Native Infrastructure:** The entire application stack—frontend, backend API, and all AI services—must be containerized using Docker. The production deployment must be managed by a container orchestration platform, specifically Kubernetes, to enable robust auto-scaling of the model inference and query execution pods based on real-time user load.

### **5.3. Accuracy and Reliability Metrics**

The success of QueryCraft v1.0 will be measured against a clear set of quantitative targets.

| Metric Category | KPI | Description | Target (v1.0) | Data Source |
| :---- | :---- | :---- | :---- | :---- |
| **Model Quality** | **Execution Accuracy (EX)** | The percentage of generated queries that execute without error AND return the correct result set when compared against a golden dataset. This is the primary measure of semantic correctness. | **≥ 85%** | Held-out Test Set (based on Spider benchmark) |
| **Model Quality** | **Exact Set Match (EM)** | The percentage of generated queries that are syntactically identical to the golden query. This is a stricter, secondary measure of model precision. | **≥ 75%** | Held-out Test Set (based on Spider benchmark) |
| **Performance** | **P95 Query Latency** | The 95th percentile of end-to-end time from a user submitting a question to the results being displayed. | **\< 8 seconds** | Production Monitoring & Telemetry |
| **Reliability** | **System Uptime** | The percentage of time the QueryCraft service is available and responsive to user requests. | **99.9%** | Infrastructure Monitoring Tools |
| **User Engagement** | **Query Success Rate** | The percentage of all user-submitted natural language questions that result in a successfully executed SQL query and a displayed result set. | **≥ 90%** | Application Logs & Product Analytics |
| **Adoption** | **Weekly Active Users (WAU)** | The number of unique users who submit at least one successful query per week. | \*\*\*\* | Product Analytics Platform |

* **QC-NFR-301: Primary Success Metric \- Execution Accuracy (EX):** The single most important metric for evaluating the quality of the core AI model will be Execution Accuracy. This is defined as the percentage of generated queries that both execute without error and return a result set that is semantically equivalent to the result set from a human-written "golden" query. The launch target for v1.0 is to achieve an Execution Accuracy of **85% or greater** on a held-out test set derived from the Spider benchmark.  
* **QC-NFR-302: Secondary Success Metric \- Exact Set Match (EM):** As a stricter, secondary metric, we will also track Exact Set Match accuracy. This measures the percentage of generated queries that are syntactically identical to the golden query. The launch target for v1.0 is an EM accuracy of **75% or greater** on the Spider test set.

## **6\. Future Considerations (Post-v1.0)**

To inform the v1.0 architecture and provide a strategic roadmap, the following features are identified as high-priority for future releases but are explicitly **out of scope** for the initial launch.

* **Conversational Analysis:** Leveraging the CoSQL fine-tuning data, introduce stateful conversational capabilities. This would allow users to ask follow-up questions that build upon the context of the previous query (e.g., User: "Show me sales by country." \-\> QueryCraft displays results \-\> User: "Okay, now break that down by product category for Germany.").  
* **BI Tool Integration & Data Export:** Develop native connectors to push data from QueryCraft's query results directly into popular BI and visualization tools like Tableau or Power BI. This would bridge the gap between rapid, ad-hoc analysis and formal, persistent business reporting.  
* **Support for NoSQL and Data Warehouses:** Expand connectivity beyond traditional SQL databases to include popular NoSQL databases (e.g., MongoDB, requiring a new NL-to-MQL engine) and cloud data warehouses (e.g., Snowflake, BigQuery), which often have their own SQL dialects and performance characteristics.  
* **Automated Insights and Visualization Suggestions:** Move beyond simply returning data tables. Introduce a layer of intelligence that can proactively identify interesting patterns or outliers in a query result set and automatically suggest appropriate chart types (e.g., bar chart, time series, scatter plot) to help the user visualize and understand the data more quickly.

