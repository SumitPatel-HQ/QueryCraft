import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

interface Database {
  id: number;
  name: string;
  display_name: string;
  description: string;
  db_type: string;
  table_count: number;
  row_count: number;
  size_mb: number;
  created_at: string;
  last_accessed: string;
  is_active: boolean;
}

const Dashboard: React.FC = () => {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const API_BASE = 'http://localhost:8000';

  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/databases`);
      const data = await response.json();
      setDatabases(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch databases:', error);
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !displayName) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('display_name', displayName);
    formData.append('description', description);

    try {
      const response = await fetch(`${API_BASE}/api/v1/databases/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ ${result.message}`);
        setShowUploadModal(false);
        setUploadFile(null);
        setDisplayName('');
        setDescription('');
        fetchDatabases(); // Refresh list
      } else {
        const error = await response.json();
        alert(`❌ Upload failed: ${error.detail}`);
      }
    } catch (error) {
      alert('❌ Upload failed: ' + error);
    } finally {
      setUploading(false);
    }
  };

  const handleDatabaseClick = (db: Database) => {
    setSelectedDatabase(db);
    setShowDatabaseModal(true);
  };

  const handleViewSchema = () => {
    if (selectedDatabase) {
      navigate(`/database/${selectedDatabase.id}/schema`);
    }
  };

  const handleViewERD = () => {
    if (selectedDatabase) {
      navigate(`/database/${selectedDatabase.id}/erd`);
    }
  };

  const handleChatbot = () => {
    if (selectedDatabase) {
      navigate(`/database/${selectedDatabase.id}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const formatSize = (mb: number) => {
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>My Databases</h1>
          <p>Manage and query your databases with AI</p>
        </div>
        <button className="upload-btn" onClick={() => setShowUploadModal(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Upload Database
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading databases...</p>
        </div>
      ) : databases.length === 0 ? (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
          <h2>No databases yet</h2>
          <p>Upload your first database to get started</p>
          <button className="upload-btn-large" onClick={() => setShowUploadModal(true)}>
            Upload Database
          </button>
        </div>
      ) : (
        <div className="database-grid">
          {databases.map((db) => (
            <div key={db.id} className="database-card" onClick={() => handleDatabaseClick(db)}>
              <div className="card-header">
                <div className="db-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/>
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                  </svg>
                </div>
                <span className="db-type-badge">{db.db_type}</span>
              </div>
              
              <h3>{db.display_name}</h3>
              {db.description && <p className="db-description">{db.description}</p>}
              
              <div className="card-stats">
                <div className="stat">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  <span>{db.table_count} tables</span>
                </div>
                <div className="stat">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  </svg>
                  <span>{db.row_count.toLocaleString()} rows</span>
                </div>
                <div className="stat">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                  <span>{formatSize(db.size_mb)}</span>
                </div>
              </div>
              
              <div className="card-footer">
                <span className="last-accessed">Last accessed {formatDate(db.last_accessed)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Database</h2>
              <button className="close-btn" onClick={() => setShowUploadModal(false)} disabled={uploading}>
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label>Database File</label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    accept=".db,.sqlite,.sqlite3,.sql,.csv"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    required
                  />
                  <div className="file-input-display">
                    {uploadFile ? uploadFile.name : 'Choose file...'}
                  </div>
                </div>
                <small>Supported: .db, .sqlite, .sql, .csv</small>
              </div>

              <div className="form-group">
                <label>Display Name *</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="My E-commerce Database"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of your database..."
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowUploadModal(false)} disabled={uploading}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={uploading || !uploadFile || !displayName}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Database Options Modal */}
      {showDatabaseModal && selectedDatabase && (
        <div className="modal-overlay" onClick={() => setShowDatabaseModal(false)}>
          <div className="modal-content database-options-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedDatabase.display_name}</h2>
              <button className="close-btn" onClick={() => setShowDatabaseModal(false)}>×</button>
            </div>
            
            <div className="database-options">
              <button className="option-btn" onClick={handleChatbot}>
                <div className="option-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
                    />
                  </svg>
                </div>
                <h3>Query Chatbot</h3>
                <p>Ask natural language questions about your data</p>
              </button>

              <button className="option-btn" onClick={handleViewSchema}>
                <div className="option-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" 
                    />
                  </svg>
                </div>
                <h3>Database Schema</h3>
                <p>View tables, columns, and data types</p>
              </button>

              <button className="option-btn" onClick={handleViewERD}>
                <div className="option-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v6m0 6v6m8.66-15l-3 5.2M6.34 15.8l-3 5.2m17.32-10.4l-5.2 3M3.54 9.2l-5.2 3" strokeLinecap="round" />
                  </svg>
                </div>
                <h3>ERD Diagram</h3>
                <p>Visualize table relationships</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
