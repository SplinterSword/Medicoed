import React, { useEffect, useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../styles/notes-editor.css';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { getApiUrl } from '../../../env-config.js';

const NotesEditor = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCriteria, setSearchCriteria] = useState('title');
  const [userEmail, setUserEmail] = useState('');
  const quillRef = useRef();

  useEffect(() => {
    const checkAuthAndFetchFiles = async () => {
      const userId = localStorage.getItem('id');
      if (!userId) {
        console.error('No user id found in localStorage');
        return;
      }

      try {
        // 1) Get user by id
        const response = await fetch(getApiUrl('/api/get-user-by-userid'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: userId }),
        });

        if (!response.ok) {
          console.error('Failed to fetch user');
          return;
        }

        let userData = await response.json();

        // Case 1 — backend returns JSON string
        if (typeof userData === 'string') {
          try {
            userData = JSON.parse(userData);
          } catch (e) {
            console.error('Failed to parse userData string:', e);
            return;
          }
        }

        // Case 2 — backend wraps as { payload: "..." } or { payload: {...} }
        if (
          userData &&
          typeof userData === 'object' &&
          'payload' in userData
        ) {
          const payload = userData.payload;

          if (typeof payload === 'string') {
            try {
              userData = JSON.parse(payload);
            } catch (e) {
              console.error('Failed to parse userData.payload string:', e);
              return;
            }
          } else if (payload && typeof payload === 'object') {
            userData = payload;
          }
        }

        const email =
          userData &&
          typeof userData === 'object' &&
          'email' in userData
            ? userData.email
            : undefined;

        if (!email) {
          console.error('Email not found on userData:', userData);
          return;
        }

        setUserEmail(email);

        // 2) Now fetch files using that email
        fetchFiles(email);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    checkAuthAndFetchFiles();
  }, []);

  const fetchFiles = async (emailParam) => {
    try {
      const email = emailParam || userEmail;

      if (!email) {
        console.error('Cannot fetch files — email is missing');
        return;
      }

      const response = await fetch(getApiUrl(`/api/fetch?email=${encodeURIComponent(email)}`));
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleEdit = (file) => {
    setSelectedFile(file);
    setEditorContent(file.text);
  };

  const handleDelete = async (title) => {
    try {
      const email = userEmail;
      const response = await fetch(getApiUrl(`/api/delete`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, email }),
      });
      if (!response.ok) {
        throw new Error('Failed to delete file');
      }
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleSave = async () => {
    try {
      const email = userEmail;
      const response = await fetch(getApiUrl(`/api/update`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: editorContent,
          title: selectedFile.title,
          email,
          tags: selectedFile.tags,
          type: selectedFile.type,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update file');
      }
      fetchFiles();
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  const getSuggestions = () => {
    const inputValue = searchTerm.trim().toLowerCase();

    if (!inputValue) {
      return files;
    }

    return files.filter((file) => {
      switch (searchCriteria) {
        case 'title':
          return file.title.toLowerCase().includes(inputValue);
        case 'tags':
          return file.tags.some((tag) => tag.toLowerCase().includes(inputValue));
        case 'type':
          return file.type.toLowerCase().includes(inputValue);
        default:
          return false;
      }
    });
  };

  const onChangeSearchCriteria = (event) => {
    setSearchCriteria(event.target.value);
    setSearchTerm('');
  };

  const inputProps = {
    placeholder: 'Search by ' + searchCriteria,
    value: searchTerm,
    onChange: (_, { newValue }) => setSearchTerm(newValue),
  };

  const filteredFiles = getSuggestions();

  return (
    <div className="NotesEditor-container">
      <div className="NotesEditor-table-section">
        <h2>Saved <span>Files</span></h2>
        <div className="NotesEditor-search">
          <select value={searchCriteria} onChange={onChangeSearchCriteria}>
            <option value="title">Search by Title</option>
            <option value="tags">Search by Tags</option>
            <option value="type">Search by Type</option>
          </select>
          <input
            type="text"
            className="NotesEditor-search-input"
            placeholder={'Search by ' + searchCriteria}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <table className="NotesEditor-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Tags</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.map((file) => (
              <tr key={file.title}>
                <td>{file.title}</td>
                <td>
                  <div className="NotesEditor-tags">
                    {file.tags.map((tag, index) => (
                      <span key={index} className="NotesEditor-tag">{tag}</span>
                    ))}
                  </div>
                </td>
                <td>{file.type}</td>
                <td>
                  <button className="NotesEditor-action-button" onClick={() => handleEdit(file)}>
                    <FaEdit />
                  </button>
                  <button className="NotesEditor-action-button" onClick={() => handleDelete(file.title)}>
                    <FaTrashAlt />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="NotesEditor-editor-section">
        {selectedFile && (
          <>
            <h2>Edit File: <span>{selectedFile.title}</span></h2>
            <ReactQuill
              ref={quillRef}
              value={editorContent}
              onChange={setEditorContent}
            />
            <div>
              <button className="NotesEditor-save-button" onClick={handleSave}>
                Save
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NotesEditor;
