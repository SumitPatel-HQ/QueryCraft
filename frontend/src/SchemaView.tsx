import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './SchemaView.css';

const API_BASE = 'http://localhost:8000';

interface Column {
  name: string;
  type: string;
  nullable?: boolean;
  primary_key?: boolean;
}

interface SchemaTable {
  [tableName: string]: Column[];
}

const SchemaView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [schema, setSchema] = useState<SchemaTable | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSchema();
  }, [id]);

  const fetchSchema = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/databases/${id}/schema`);
      const data = await response.json();
      setSchema(data.schema);
    } catch (err) {
      console.error('Failed to fetch schema:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTables = schema
    ? Object.entries(schema).filter(([tableName]) =>
        tableName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <div className="schema-view">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading schema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schema-view">
      <div className="schema-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1>Database Schema</h1>
      </div>

      <div className="schema-controls">
        <input
          type="text"
          className="search-input"
          placeholder="Search tables..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="table-count">
          {filteredTables.length} {filteredTables.length === 1 ? 'table' : 'tables'}
        </div>
      </div>

      <div className="tables-grid">
        {filteredTables.map(([tableName, columns]) => (
          <div key={tableName} className="table-card">
            <div className="table-header">
              <div className="table-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
                  <line x1="3" y1="9" x2="21" y2="9" strokeWidth={2} />
                  <line x1="9" y1="21" x2="9" y2="9" strokeWidth={2} />
                </svg>
              </div>
              <h3>{tableName}</h3>
              <span className="column-count">{columns.length} columns</span>
            </div>

            <div className="columns-list">
              {columns.map((column) => (
                <div key={column.name} className="column-item">
                  <div className="column-name">
                    {column.primary_key && <span className="pk-badge">PK</span>}
                    {column.name}
                  </div>
                  <div className="column-type">{column.type}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredTables.length === 0 && (
        <div className="empty-state">
          <p>No tables found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

export default SchemaView;
