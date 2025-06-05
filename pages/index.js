import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');

  const handleUpload = async () => {
    if (!file) return;

    const filePath = `public/${file.name}`;
    const { data, error } = await supabase.storage
      .from('uploads') // 📝 supabase에서 만든 bucket 이름이 'uploads'여야 함
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error('❌ 업로드 실패:', error.message);
      setMessage('❌ 업로드 실패');
    } else {
      const { data: publicUrl } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      setUrl(publicUrl.publicUrl);
      setMessage('✅ 업로드 성공!');
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>📤 파일 업로드</h1>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload} style={{ marginLeft: '10px' }}>
        업로드
      </button>
      <p>{message}</p>
      {url && (
        <p>
          🔗 <a href={url} target="_blank">업로드된 파일 보기</a>
        </p>
      )}
    </div>
  );
}
