import React, { useState, useEffect } from 'react';
import './QueryInterface.css';

interface QueryResult {
  original_question: string;
  sql_query: string;
  explanation: string;
  results: any[];
}

interface SchemaTable {
  [tableName: string]: Array<{
    name: string;
    type: string;
    nullable?: boolean;
    primary_key?: boolean;
  }>;
}

const QueryInterface: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schema, setSchema] = useState<SchemaTable>({});
  const [sampleQueries, setSampleQueries] = useState<string[]>([]);
  const [showSchema, setShowSchema] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');

  const API_BASE = 'http://localhost:8000';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Fetch schema and sample queries on component mount
    fetchSchema();
    fetchSampleQueries();
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
      setNotificationType('success');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setNotificationType('error');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
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
    <div className={`query-interface ${mounted ? 'mounted' : ''}`}>
      {showNotification && (
        <div className={`notification ${notificationType} ${showNotification ? 'show' : ''}`}>
          {notificationType === 'success' ? '✓ Query executed successfully!' : '✗ Error processing query'}
        </div>
      )}

      <div className="header">
        <h1 className="main-title">
          <span className="gradient-text">QueryCraft</span>
        </h1>
        <p className="subtitle">Transform natural language into powerful SQL queries</p>
      </div>

      <div className="main-content">
        <div className="query-section glass-card">
          <form onSubmit={handleSubmit} className="query-form">
            <div className="input-group">
              <div className="input-wrapper">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about your data (e.g., 'What are the top 10 customers by spending?')"
                  className="question-input"
                  rows={3}
                />
                <div className="input-glow"></div>
              </div>
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="submit-button"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="button-icon">✨</span>
                    Generate SQL
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="controls">
            <button
              onClick={() => setShowSchema(!showSchema)}
              className="schema-toggle"
            >
              <span className="button-icon">{showSchema ? '▼' : '▶'}</span>
              {showSchema ? 'Hide Schema' : 'Show Schema'}
            </button>
          </div>

          {sampleQueries.length > 0 && (
            <div className="sample-queries">
              <h3>Try these sample questions:</h3>
              <div className="sample-buttons">
                {sampleQueries.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => handleSampleQueryClick(query)}
                    className="sample-button"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {showSchema && (
          <div className="schema-section glass-card slide-in">
            {renderSchema()}
          </div>
        )}

        {error && (
          <div className="error-message glass-card slide-in">
            <div className="error-icon">⚠</div>
            <div>
              <h3>Error</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="results-section glass-card slide-up">
            <div className="sql-query">
              <h3>
                <span className="section-icon">💾</span>
                Generated SQL Query
              </h3>
              <pre className="sql-code">{result.sql_query}</pre>
            </div>

            <div className="explanation">
              <h3>
                <span className="section-icon">💡</span>
                Explanation
              </h3>
              <p>{result.explanation}</p>
            </div>

            <div className="results">
              <h3>
                <span className="section-icon">📊</span>
                Results
                <span className="result-count">{result.results.length} rows</span>
              </h3>
              {renderTable(result.results)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryInterface;