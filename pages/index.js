// pages/index.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchFiles();
  }, [search]);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('Files')
        .select('*')
        .ilike('filename', `%${search}%`)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('📛 검색 오류:', error.message);
        setMessage(`검색 실패: ${error.message}`);
        setUploadedFiles([]);
        return;
      }

      console.log('🔍 검색결과:', data);
      setUploadedFiles(data || []);
    } catch (err) {
      console.error('❌ 예외 발생:', err.message);
      setMessage(`검색 중 오류 발생: ${err.message}`);
      setUploadedFiles([]);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('⚠️ 파일을 먼저 선택하세요.');
      return;
    }

    const duplicateCheck = uploadedFiles.find(
      (item) => item.filename === file.name
    );
    if (duplicateCheck) {
      setMessage('⚠️ 이미 업로드된 파일입니다.');
      return;
    }

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${Date.now()}-${uuidv4()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('files').getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('Files')
        .insert([{ filename: file.name, url: publicUrl }]);

      if (insertError) throw insertError;

      setMessage('✅ 업로드 완료!');
      setFile(null);
      fetchFiles();
    } catch (error) {
      console.error('Upload error:', error);
      if (
        error?.message?.includes('duplicate key value') ||
        error?.message?.includes('Files_pkey')
      ) {
        setMessage('⚠️ 이미 업로드된 파일입니다.');
      } else {
        setMessage(`업로드 실패: ${error.message || '알 수 없는 오류'}`);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4 relative">
      <button
        onClick={() => router.push('/files')}
        className="absolute top-4 right-4 text-sm text-blue-500 hover:underline"
      >
        업로드된 파일 목록
      </button>

      <img src="/t3q-logo.png" alt="T3Q Logo" className="w-[160px] mb-4" />

      <div className="flex flex-col items-center gap-1 mb-4 w-full max-w-lg">
        <div className="flex flex-col sm:flex-row sm:items-center w-full gap-2 justify-center">
          <input
            type="text"
            placeholder="파일 이름 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchFiles();
            }}
            className="border px-4 py-2 rounded w-full sm:w-1/2"
          />

          <div className="flex gap-2">
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
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
        </div>
        {file && <span className="text-xs text-gray-500 mt-1">선택된 파일: {file.name}</span>}
      </div>

      {message && (
        <p
          className={`text-sm mb-4 ${message.includes('✅') ? 'text-green-600' : 'text-red-500'}`}
        >
          {message}
        </p>
      )}

      <div className="w-full max-w-lg max-h-[300px] overflow-y-auto space-y-2 border rounded p-2 bg-gray-50">
        {Array.isArray(uploadedFiles) && uploadedFiles.length > 0 ? (
          uploadedFiles.map((item) => (
            <div
              key={item.url}
              className="flex justify-between items-center border-b pb-1"
            >
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
          ))
        ) : (
          <p className="text-sm text-gray-400 text-center">❌ 검색 결과가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
