// pages/index.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const userId = supabase.auth.getUser()?.id || "anonymous"; // fallback
  const folder = "uploads";

  useEffect(() => {
    const fetchFiles = async () => {
      const { data, error } = await supabase
        .from("Files")
        .select("*")
        .eq("user_id", userId)
        .order("uploaded_at", { ascending: false });

      if (!error) setUploadedFiles(data);
    };

    fetchFiles();
  }, [message]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("파일을 먼저 선택하세요.");
      return;
    }

    setUploading(true);
    const encodedName = encodeURIComponent(file.name);
    const filePath = `${folder}/${userId}/${Date.now()}-${encodedName}`;

    // 1. Supabase Storage 업로드
    const { error: uploadError } = await supabase.storage
      .from("files")
      .upload(filePath, file);

    if (uploadError) {
      console.error("🚫 Upload error:", uploadError);
      setMessage("업로드 실패: " + uploadError.message);
      setUploading(false);
      return;
    }

    // 2. 공개 URL 얻기
    const {
      data: { publicUrl },
    } = supabase.storage.from("files").getPublicUrl(filePath);

    // 3. Supabase DB에 기록
    const { error: insertError } = await supabase.from("Files").insert([
      {
        filename: file.name,
        url: publicUrl,
        user_id: userId,
        path: filePath,
      },
    ]);

    if (insertError) {
      setMessage("DB 저장 실패: " + insertError.message);
    } else {
      setMessage("✅ 업로드 완료!");
      setFile(null);
    }

    setUploading(false);
  };

  const handleDelete = async (fileEntry) => {
    const { error: deleteStorageError } = await supabase.storage
      .from("files")
      .remove([fileEntry.path]);

    const { error: deleteDbError } = await supabase
      .from("Files")
      .delete()
      .eq("id", fileEntry.id);

    if (!deleteStorageError && !deleteDbError) {
      setMessage("🗑️ 삭제 완료!");
    } else {
      console.error("삭제 오류:", deleteStorageError || deleteDbError);
      setMessage("삭제 실패");
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">📤 파일 업로드</h1>
      <input type="file" onChange={handleFileChange} />
      <button
        onClick={handleUpload}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={uploading}
      >
        {uploading ? "업로드 중..." : "업로드"}
      </button>
      {message && <p>{message}</p>}

      <ul className="mt-8 space-y-2">
        {uploadedFiles.map((file) => (
          <li key={file.id} className="flex items-center gap-2">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              📎 {file.filename}
            </a>
            <button
              onClick={() => handleDelete(file)}
              className="text-sm text-red-500 hover:underline"
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
