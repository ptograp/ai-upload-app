// pages/index.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from('Files')
      .select('*')
      .order('uploaded_at', { ascending: false });
    if (data) setUploadedFiles(data);
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
    const fileName = file.name;
    const encodedName = encodeURIComponent(fileName);
    const filePath = `${Date.now()}-${encodedName}`;

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      setMessage('업로드 실패: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    const { error: insertError } = await supabase
      .from('Files')
      .insert([{ filename: file.name, url: publicUrl }]);

    if (insertError) {
      setMessage('DB 저장 실패: ' + insertError.message);
    } else {
      setMessage('✅ 업로드 완료!');
      setFile(null);
      fetchFiles();
    }

    setUploading(false);
  };

  const filteredFiles = uploadedFiles.filter((item) =>
    item.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      <img src="/t3q-logo.png" alt="T3Q Logo" className="w-[160px] mb-4" />
      <div className="flex items-center gap-2 mb-4 w-full max-w-lg">
        <input
          type="text"
          placeholder="파일 이름 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-4 py-2 rounded w-full"
        />
        <input type="file" onChange={handleFileChange} className="hidden" id="file-upload" />
        <label
          htmlFor="file-upload"
          className="bg-gray-200 text-sm px-3 py-2 rounded cursor-pointer hover:bg-gray-300"
        >
          파일 선택
        </label>
        <button
          onClick={handleUpload}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={uploading}
        >
          {uploading ? '업로드 중...' : '업로드'}
        </button>
      </div>
      {message && <p className="text-red-500 text-sm mb-4">{message}</p>}

      <div className="w-full max-w-lg space-y-2">
        {filteredFiles.map((item) => (
          <div key={item.url} className="flex justify-between items-center border rounded p-2">
            <span className="text-sm truncate w-3/4">📄 {item.filename}</span>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 text-sm hover:underline"
              download={item.filename}
            >
              다운로드
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
