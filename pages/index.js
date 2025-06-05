import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    const { data, error } = await supabase.from('Files').select('*').order('uploaded_at', { ascending: false });
    if (error) {
      console.error('Fetch error:', error.message);
    } else {
      setFiles(data);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('파일을 먼저 선택하세요.');
      return;
    }

    setUploading(true);
    const encodedName = encodeURIComponent(file.name);
    const filePath = `${Date.now()}-${encodedName}`;

    const { error: uploadError } = await supabase.storage.from('files').upload(filePath, file);

    if (uploadError) {
      console.error('🚫 Upload error:', uploadError.message);
      setMessage('업로드 실패: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('files').getPublicUrl(filePath);

    const { error: insertError } = await supabase.from('Files').insert([
      {
        filename: file.name,
        url: publicUrl,
        uploaded_at: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      setMessage('DB 저장 실패: ' + insertError.message);
    } else {
      setMessage('✅ 업로드 완료!');
      setFile(null);
      fetchFiles();
    }

    setUploading(false);
  };

  const handleDelete = async (url) => {
    const key = decodeURIComponent(url.split('/').pop());
    const { error: deleteError } = await supabase.storage.from('files').remove([key]);

    if (deleteError) {
      alert('삭제 실패: ' + deleteError.message);
      return;
    }

    await supabase.from('Files').delete().eq('url', url);
    fetchFiles();
  };

  const filteredFiles = files.filter(f => f.filename.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-white text-center p-8">
      <h1 className="text-3xl font-semibold mb-4">📂 파일 업로드</h1>
      <input type="file" onChange={handleFileChange} className="mb-2" />
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="ml-2 px-4 py-1 bg-blue-500 text-white rounded"
      >
        {uploading ? '업로드 중...' : '업로드'}
      </button>
      {message && <p className="mt-2 text-sm text-red-500">{message}</p>}

      <div className="mt-6">
        <input
          type="text"
          placeholder="파일 이름 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-64"
        />
      </div>

      <ul className="mt-6 space-y-2 max-w-xl mx-auto text-left">
        {filteredFiles.map((f) => (
          <li key={f.url} className="border p-3 rounded flex justify-between items-center">
            <span className="truncate max-w-xs">{f.filename}</span>
            <div className="space-x-2">
              <a href={f.url} download={f.filename} className="text-blue-500 underline" target="_blank">다운로드</a>
              <button onClick={() => handleDelete(f.url)} className="text-red-600">삭제</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}