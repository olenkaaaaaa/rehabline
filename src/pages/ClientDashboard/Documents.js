import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { FaFilePdf, FaFileImage, FaTrash, FaDownload } from 'react-icons/fa';

const Documents = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`docs_${user?.id}`);
    if (stored) setDocuments(JSON.parse(stored));
  }, [user]);

  const saveDocuments = (newDocs) => {
    setDocuments(newDocs);
    localStorage.setItem(`docs_${user?.id}`, JSON.stringify(newDocs));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('application/pdf|image/jpeg|image/png')) {
      alert(lang === 'UA' ? 'Дозволено тільки PDF, JPG, PNG' : 'Only PDF, JPG, PNG allowed');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const newDoc = {
        id: Date.now(),
        name: file.name,
        type: file.type,
        size: file.size,
        data: event.target.result,
        uploadedAt: new Date().toISOString(),
      };
      saveDocuments([...documents, newDoc]);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (id) => {
    if (window.confirm(lang === 'UA' ? 'Видалити документ?' : 'Delete document?')) {
      saveDocuments(documents.filter(doc => doc.id !== id));
    }
  };

  const handleDownload = (doc) => {
    const link = document.createElement('a');
    link.href = doc.data;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="documents">
      <h1 className="dashboard-title">{lang === 'UA' ? 'Мої документи' : 'My Documents'}</h1>

      <div className="upload-section">
        <label className="btn-primary" style={{ cursor: 'pointer' }}>
          {uploading ? (lang === 'UA' ? 'Завантаження...' : 'Uploading...') : (lang === 'UA' ? '+ Завантажити документ' : '+ Upload document')}
          <input
            type="file"
            accept=".pdf,image/jpeg,image/png"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="documents-list">
        {documents.length === 0 ? (
          <p className="no-data">{lang === 'UA' ? 'Немає документів' : 'No documents'}</p>
        ) : (
          documents.map(doc => (
            <div key={doc.id} className="document-card">
              <div className="doc-icon">
                {doc.type.includes('pdf') ? <FaFilePdf /> : <FaFileImage />}
              </div>
              <div className="doc-info">
                <h3>{doc.name}</h3>
                <p className="doc-date">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
              </div>
              <div className="doc-actions">
                <button className="icon-btn" onClick={() => handleDownload(doc)} title={lang === 'UA' ? 'Завантажити' : 'Download'}>
                  <FaDownload />
                </button>
                <button className="icon-btn" onClick={() => handleDelete(doc.id)} title={lang === 'UA' ? 'Видалити' : 'Delete'}>
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Documents;