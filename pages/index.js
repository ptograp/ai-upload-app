import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [publicUrl, setPublicUrl] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("⚠️ 파일을 먼저 선택하세요.");
      return;
    }

    setUploading(true);

    // 안전한 파일 경로 (영문+숫자만 사용)
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_"); // 특수문자 제거
    const filePath = `${timestamp}_${safeFileName}`;

    // 1. Supabase Storage에 업로드
    const { error: uploadError } = await supabase.storage
      .from("files")
      .upload(filePath, file);

    if (uploadError) {
      console.error("🚫 업로드 오류:", uploadError);
      setMessage("업로드 실패: " + uploadError.message);
      setUploading(false);
      return;
    }

    // 2. Public URL 가져오기
    const {
      data: { publicUrl },
    } = supabase.storage.from("files").getPublicUrl(filePath);
    setPublicUrl(publicUrl);

    // 3. DB에 메타데이터 기록
    const { error: insertError } = await supabase
      .from("Files")
      .insert([{ filename: file.name, url: publicUrl }]);

    if (insertError) {
      console.error("🚫 DB 저장 오류:", insertError);
      setMessage("DB 저장 실패: " + insertError.message);
    } else {
      setMessage("✅ 업로드 완료!");
      setFile(null);
    }

    setUploading(false);
  };

  return (
    <div className="p-8 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">📂 파일 업로드</h1>
      <input type="file" onChange={handleFileChange} />
      <button
        onClick={handleUpload}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={uploading}
      >
        {uploading ? "업로드 중..." : "업로드"}
      </button>
      {message && <p>{message}</p>}
      {publicUrl && (
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          🔗 업로드된 파일 보기
        </a>
      )}
    </div>
  );
}
