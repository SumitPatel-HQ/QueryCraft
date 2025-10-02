import React, { useState, useEffect, useRef } from 'react';
import './QueryInterface.css';
import mermaid from 'mermaid';
import ChartVisualization from './ChartVisualization';

interface QueryResult {
  original_question: string;
  sql_query: string;
  explanation: string;
  results: any[];
  confidence?: number;
  generation_method?: string;
  tables_used?: string[];
  execution_time_ms?: number;
  query_complexity?: string;
  why_this_query?: string;
}

interface SchemaTable {
  [tableName: string]: Array<{
    name: string;
    type: string;
    nullable?: boolean;
    primary_key?: boolean;
  }>;
}

interface SampleQuery {
  question: string;
  description: string;
  difficulty: string;
}

interface SampleQueries {
  easy: SampleQuery[];
  medium: SampleQuery[];
  advanced: SampleQuery[];
}

interface ERDData {
  tables: any[];
  relationships: any[];
  mermaid_diagram: string;
}

const QueryInterface: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schema, setSchema] = useState<SchemaTable>({});
  const [sampleQueries, setSampleQueries] = useState<SampleQueries | null>(null);
  const [showSchema, setShowSchema] = useState(false);
  const [showWhyQuery, setShowWhyQuery] = useState(false);
  const [showERD, setShowERD] = useState(false);
  const [erdData, setErdData] = useState<ERDData | null>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);

  const API_BASE = 'http://localhost:8000';

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    });
  }, []);

  // Render ERD when data changes
  useEffect(() => {
    const renderDiagram = async () => {
      if (showERD && erdData && erdData.mermaid_diagram && mermaidRef.current) {
        try {
          console.log('Rendering Mermaid diagram...');
          console.log('Diagram code:', erdData.mermaid_diagram);
          
          // Clear previous content
          mermaidRef.current.removeAttribute('data-processed');
          mermaidRef.current.innerHTML = erdData.mermaid_diagram;
          
          // Re-initialize and render
          await mermaid.run({
            nodes: [mermaidRef.current]
          });
          
          console.log('Mermaid diagram rendered successfully');
        } catch (error) {
          console.error('Mermaid rendering error:', error);
          mermaidRef.current.innerHTML = `
            <div style="padding: 20px; color: #666;">
              <p><strong>Unable to render diagram</strong></p>
              <p>Tables: ${erdData.tables?.length || 0}</p>
              <p>Check browser console for details</p>
            </div>
          `;
        }
      }
    };
    
    renderDiagram();
  }, [showERD, erdData]);

  useEffect(() => {
    // Fetch schema and sample queries on component mount
    fetchSchema();
    fetchSampleQueries();
    fetchERD();
  }, []);

  const fetchSchema = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/schema`);
      const data = await response.json();
      setSchema(data.schema);
    } catch (err) {
      console.error('Failed to fetch schema:', err);
    }
  };

  const fetchSampleQueries = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/sample-queries`);
      const data = await response.json();
      setSampleQueries(data.sample_queries);
    } catch (err) {
      console.error('Failed to fetch sample queries:', err);
    }
  };

  const fetchERD = async () => {
    try {
      console.log('Fetching ERD from:', `${API_BASE}/api/v1/schema/erd`);
      const response = await fetch(`${API_BASE}/api/v1/schema/erd`);
      
      if (!response.ok) {
        console.error('ERD fetch failed with status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('ERD Data received:', data);
      console.log('Tables count:', data.tables?.length);
      console.log('Mermaid diagram length:', data.mermaid_diagram?.length);
      setErdData(data);
    } catch (err) {
      console.error('Failed to fetch ERD:', err);
      // Set empty data to stop loading state
      setErdData({ tables: [], relationships: [], mermaid_diagram: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/v1/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSampleQueryClick = (sampleQuery: string) => {
    setQuestion(sampleQuery);
  };

  const renderTable = (data: any[]) => {
    if (!data || data.length === 0) {
      return <p>No results found.</p>;
    }

    const columns = Object.keys(data[0]);

    return (
      <div className="table-container">
        <table className="results-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column}>{String(row[column])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSchema = () => {
    return (
      <div className="schema-container">
        <h3>Database Schema</h3>
        {Object.entries(schema).map(([tableName, columns]) => (
          <div key={tableName} className="table-schema">
            <h4>{tableName}</h4>
            <table className="schema-table">
              <thead>
                <tr>
                  <th>Column</th>
                  <th>Type</th>
                  <th>Key</th>
                </tr>
              </thead>
              <tbody>
                {columns.map((column, index) => (
                  <tr key={index}>
                    <td>{column.name}</td>
                    <td>{column.type}</td>
                    <td>{column.primary_key ? 'PK' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="query-interface">
      <div className="header">
        <h1>QueryCraft - Natural Language to SQL</h1>
        <p>Ask questions about your data in plain English!</p>
      </div>

      <div className="main-content">
        <div className="query-section">
          <form onSubmit={handleSubmit} className="query-form">
            <div className="input-group">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about your data (e.g., 'What are the top 10 customers by spending?')"
                className="question-input"
                rows={3}
              />
              <button 
                type="submit" 
                disabled={loading || !question.trim()}
                className="submit-button"
              >
                {loading ? 'Processing...' : 'Submit Query'}
              </button>
            </div>
          </form>

          <div className="controls">
            <button 
              onClick={() => setShowSchema(!showSchema)}
              className="schema-toggle"
            >
              {showSchema ? 'Hide Schema' : 'Show Schema'}
            </button>
            <button 
              onClick={() => setShowERD(!showERD)}
              className="erd-toggle"
            >
              {showERD ? 'Hide ERD' : 'Show Database Diagram'}
            </button>
          </div>

          {sampleQueries && (
            <div className="sample-queries">
              <h3>📝 Try these sample questions:</h3>
              
              <div className="difficulty-section">
                <h4 className="difficulty-easy">🟢 Easy Queries</h4>
                <p className="difficulty-desc">Simple questions to get started</p>
                <div className="sample-buttons">
                  {sampleQueries.easy.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handleSampleQueryClick(query.question)}
                      className="sample-button easy"
                      title={query.description}
                    >
                      {query.question}
                    </button>
                  ))}
                </div>
              </div>

              <div className="difficulty-section">
                <h4 className="difficulty-medium">🟡 Medium Queries</h4>
                <p className="difficulty-desc">Multi-table joins and aggregations</p>
                <div className="sample-buttons">
                  {sampleQueries.medium.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handleSampleQueryClick(query.question)}
                      className="sample-button medium"
                      title={query.description}
                    >
                      {query.question}
                    </button>
                  ))}
                </div>
              </div>

              <div className="difficulty-section">
                <h4 className="difficulty-advanced">🔴 Advanced Queries</h4>
                <p className="difficulty-desc">Complex business analytics and insights</p>
                <div className="sample-buttons">
                  {sampleQueries.advanced.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handleSampleQueryClick(query.question)}
                      className="sample-button advanced"
                      title={query.description}
                    >
                      {query.question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {showSchema && (
          <div className="schema-section">
            {renderSchema()}
          </div>
        )}

        {showERD && (
          <div className="erd-section">
            <h3>📊 Database Entity Relationship Diagram</h3>
            {!erdData ? (
              <div className="erd-container">
                <p>Loading ERD data from backend...</p>
              </div>
            ) : erdData.tables && erdData.tables.length > 0 ? (
              <>
                <div className="erd-container">
                  <div ref={mermaidRef} className="mermaid">
                    Loading diagram...
                  </div>
                </div>
                <div className="erd-info">
                  <p><strong>Tables:</strong> {erdData.tables.length}</p>
                  <p><strong>Relationships:</strong> {erdData.relationships?.length || 0}</p>
                </div>
                <div className="table-list" style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <h4>Database Tables:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                    {erdData.tables.map((table: any, index: number) => (
                      <div key={index} style={{ padding: '8px', background: 'white', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                        <strong>{table.name}</strong>
                        <div style={{ fontSize: '0.85em', color: '#6c757d', marginTop: '4px' }}>
                          {table.columns?.length || 0} columns
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="erd-container">
                <p>No ERD data available. Backend may not be running.</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="error-message">
            <h3>Error:</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="results-section">
            {/* Enhanced Confidence Badge */}
            {result.confidence && (
              <div className={`confidence-badge confidence-${result.confidence >= 90 ? 'high' : 'medium'}`}>
                <div className="confidence-circle">
                  <span className="confidence-number">{result.confidence}%</span>
                </div>
                <div className="confidence-label">
                  <strong>Confidence Score</strong>
                  <p>{result.confidence >= 90 ? 'High confidence' : 'Good confidence'}</p>
                </div>
              </div>
            )}

            {/* Query Complexity Badge */}
            {result.query_complexity && (
              <div className={`complexity-badge complexity-${result.query_complexity.toLowerCase()}`}>
                {result.query_complexity === 'Easy' && '🟢'}
                {result.query_complexity === 'Medium' && '🟡'}
                {result.query_complexity === 'Advanced' && '🔴'}
                <span> {result.query_complexity} Query</span>
              </div>
            )}

            {/* AI Metadata Section */}
            {(result.confidence || result.generation_method || result.execution_time_ms) && (
              <div className="ai-metadata">
                <h3>🤖 AI Metadata:</h3>
                <div className="metadata-grid">
                  {result.generation_method && (
                    <div className="metadata-item">
                      <span className="metadata-label">Generation Method:</span>
                      <span className={`metadata-value method-${result.generation_method}`}>
                        {result.generation_method === 'llm' && '🧠 Google Gemini AI'}
                        {result.generation_method === 'fallback' && '🔄 Pattern-Matching'}
                        {result.generation_method === 'hybrid' && '⚡ Hybrid (LLM + Rules)'}
                      </span>
                    </div>
                  )}
                  {result.confidence !== undefined && (
                    <div className="metadata-item">
                      <span className="metadata-label">Confidence Score:</span>
                      <span className={`metadata-value confidence-${result.confidence >= 80 ? 'high' : result.confidence >= 60 ? 'medium' : 'low'}`}>
                        {result.confidence}%
                      </span>
                    </div>
                  )}
                  {result.tables_used && result.tables_used.length > 0 && (
                    <div className="metadata-item">
                      <span className="metadata-label">Tables Used:</span>
                      <span className="metadata-value">
                        {result.tables_used.join(', ')}
                      </span>
                    </div>
                  )}
                  {result.execution_time_ms !== undefined && (
                    <div className="metadata-item">
                      <span className="metadata-label">Execution Time:</span>
                      <span className="metadata-value">
                        {result.execution_time_ms}ms
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="sql-query">
              <h3>Generated SQL Query:</h3>
              <pre className="sql-code">{result.sql_query}</pre>
            </div>

            <div className="explanation">
              <h3>Explanation:</h3>
              <p>{result.explanation}</p>
            </div>

            {/* Why This Query Section */}
            {result.why_this_query && (
              <div className="why-query-section">
                <button 
                  className="why-query-toggle"
                  onClick={() => setShowWhyQuery(!showWhyQuery)}
                >
                  {showWhyQuery ? '▼' : '▶'} Why this query? (Transparency & Trust)
                </button>
                {showWhyQuery && (
                  <div className="why-query-content">
                    <div dangerouslySetInnerHTML={{ __html: result.why_this_query.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </div>
                )}
              </div>
            )}

            <div className="results">
              <h3>Results ({result.results.length} rows):</h3>
              {renderTable(result.results)}
            </div>

            {/* Chart Visualization */}
            {result.results.length > 0 && (
              <ChartVisualization 
                data={result.results} 
                columns={Object.keys(result.results[0] || {})}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryInterface;