import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { FaFilePdf, FaFileImage, FaTrash, FaDownload } from 'react-icons/fa';
import '../../styles/pages/client-documents.css';
const BUCKET_NAME = 'client-documents';

const Documents = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadDocuments = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setPageError('');

        const { data, error } = await supabase
          .from('client_documents')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (!isMounted) return;

        setDocuments(data || []);
      } catch (error) {
        console.error('Documents loading failed:', error);

        if (!isMounted) return;

        setPageError(
          lang === 'UA'
            ? 'Не вдалося завантажити документи'
            : 'Failed to load documents'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDocuments();

    return () => {
      isMounted = false;
    };
  }, [user, lang]);

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) {
      return <FaFilePdf />;
    }

    return <FaFileImage />;
  };

  const formatFileSize = (size) => {
    const numericSize = Number(size || 0);

    if (numericSize < 1024) {
      return `${numericSize} B`;
    }

    if (numericSize < 1024 * 1024) {
      return `${(numericSize / 1024).toFixed(1)} KB`;
    }

    return `${(numericSize / 1024 / 1024).toFixed(1)} MB`;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file || !user?.id) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      alert(
        lang === 'UA'
          ? 'Дозволено тільки PDF, JPG, PNG'
          : 'Only PDF, JPG, PNG allowed'
      );
      return;
    }

    const maxSizeMb = 10;
    const maxSizeBytes = maxSizeMb * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      alert(
        lang === 'UA'
          ? `Файл завеликий. Максимум ${maxSizeMb} MB`
          : `File is too large. Maximum ${maxSizeMb} MB`
      );
      return;
    }

    try {
      setUploading(true);

      const fileExtension = file.name.split('.').pop();
      const safeFileName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9а-яА-ЯіІїЇєЄґҐ_-]/g, '_');

      const filePath = `${user.id}/${Date.now()}-${safeFileName}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      const { data: insertedDocument, error: insertError } = await supabase
        .from('client_documents')
        .insert({
          client_id: user.id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_path: filePath,
          file_url: publicUrlData?.publicUrl || null,
        })
        .select('*')
        .single();

      if (insertError) {
        throw insertError;
      }

      setDocuments((prev) => [insertedDocument, ...prev]);

      e.target.value = '';
    } catch (error) {
      console.error('Document upload failed:', error);

      alert(
        lang === 'UA'
          ? `Не вдалося завантажити документ: ${error.message || 'Спробуйте ще раз'}`
          : `Failed to upload document: ${error.message || 'Please try again'}`
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentItem) => {
    const confirmed = window.confirm(
      lang === 'UA' ? 'Видалити документ?' : 'Delete document?'
    );

    if (!confirmed) return;

    try {
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([documentItem.file_path]);

      if (storageError) {
        console.warn('Storage delete failed:', storageError);
      }

      const { error: deleteError } = await supabase
        .from('client_documents')
        .delete()
        .eq('id', documentItem.id)
        .eq('client_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== documentItem.id));
    } catch (error) {
      console.error('Document delete failed:', error);

      alert(
        lang === 'UA'
          ? 'Не вдалося видалити документ'
          : 'Failed to delete document'
      );
    }
  };

  const handleDownload = async (documentItem) => {
    try {
      if (documentItem.file_url) {
        window.open(documentItem.file_url, '_blank', 'noopener,noreferrer');
        return;
      }

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .download(documentItem.file_path);

      if (error) {
        throw error;
      }

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');

      link.href = url;
      link.download = documentItem.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Document download failed:', error);

      alert(
        lang === 'UA'
          ? 'Не вдалося завантажити документ'
          : 'Failed to download document'
      );
    }
  };

  return (
    <div className="documents">
      <h1 className="dashboard-title">
        {lang === 'UA' ? 'Мої документи' : 'My Documents'}
      </h1>

      <div className="upload-section">
        <label className="btn-primary" style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
          {uploading
            ? lang === 'UA'
              ? 'Завантаження...'
              : 'Uploading...'
            : lang === 'UA'
              ? '+ Завантажити документ'
              : '+ Upload document'}

          <input
            type="file"
            accept=".pdf,image/jpeg,image/png"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            disabled={uploading}
          />
        </label>

        <p className="hint">
          {lang === 'UA'
            ? 'Дозволені формати: PDF, JPG, PNG. Максимум 10 MB.'
            : 'Allowed formats: PDF, JPG, PNG. Maximum 10 MB.'}
        </p>
      </div>

      {pageError && (
        <div className="empty-state">
          <p>{pageError}</p>
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          <p>
            {lang === 'UA'
              ? 'Завантаження документів...'
              : 'Loading documents...'}
          </p>
        </div>
      ) : (
        <div className="documents-list">
          {documents.length === 0 ? (
            <div className="empty-state">
              <p>{lang === 'UA' ? 'Немає документів' : 'No documents'}</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="document-card">
                <div className="doc-icon">
                  {getFileIcon(doc.file_type)}
                </div>

                <div className="doc-info">
                  <h3>{doc.file_name}</h3>

                  <p className="doc-date">
                    {doc.created_at
                      ? new Date(doc.created_at).toLocaleDateString(
                          lang === 'UA' ? 'uk-UA' : 'en-US'
                        )
                      : ''}
                    {' · '}
                    {formatFileSize(doc.file_size)}
                  </p>
                </div>

                <div className="doc-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => handleDownload(doc)}
                    title={lang === 'UA' ? 'Завантажити' : 'Download'}
                  >
                    <FaDownload />
                  </button>

                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => handleDelete(doc)}
                    title={lang === 'UA' ? 'Видалити' : 'Delete'}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Documents;