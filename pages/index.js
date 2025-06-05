// pages/index.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchFiles = async () => {
    const { data, error } = await supabase.from('Files').select('*').order('uploaded_at', { ascending: false });
    if (!error) setFiles(data);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) {
      setMessage('⚠️ 파일을 먼저 선택하세요.');
      return;
    }
    setUploading(true);
    const encodedName = encodeURIComponent(file.name);
    const filePath = `${Date.now()}-${encodedName}`;
    const { error: uploadError } = await supabase.storage.from('files').upload(filePath, file);
    if (uploadError) {
      console.error('Upload error:', uploadError);
      setMessage(`업로드 실패: ${uploadError.message}`);
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('files').getPublicUrl(filePath);
    const { error: insertError } = await supabase.from('Files').insert([{ filename: file.name, url: publicUrl, uploaded_at: new Date().toISOString() }]);
    if (insertError) {
      setMessage('DB 저장 실패: ' + insertError.message);
    } else {
      setMessage('✅ 업로드 성공!');
      setFile(null);
      fetchFiles();
    }
    setUploading(false);
  };

  const filteredFiles = files.filter(f => f.filename.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png" alt="Google Logo" width={200} style={{ marginBottom: '20px' }} />

      <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '600px', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="파일 이름 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '12px', borderRadius: '24px 0 0 24px', border: '1px solid #ccc', outline: 'none', fontSize: '16px' }}
        />
        <input
          type="file"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="fileUpload"
        />
        <label htmlFor="fileUpload" style={{ backgroundColor: '#eee', padding: '12px', borderTop: '1px solid #ccc', borderBottom: '1px solid #ccc' }}>📎</label>
        <button
          onClick={handleUpload}
          disabled={uploading}
          style={{ padding: '12px 16px', borderRadius: '0 24px 24px 0', backgroundColor: '#4285f4', color: 'white', border: 'none', fontWeight: 'bold' }}
        >
          업로드
        </button>
      </div>

      <div style={{ color: 'red', marginBottom: '16px' }}>{message}</div>

      <div style={{ width: '100%', maxWidth: '600px' }}>
        {filteredFiles.map(file => (
          <div key={file.url} style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
            <a href={file.url} target="_blank" rel="noopener noreferrer" download={file.filename}>
              📄 {file.filename}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
