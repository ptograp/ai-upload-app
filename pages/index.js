// pages/index.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (user) fetchFiles();
  }, [user]);

  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from("Files")
      .select("id, filename, url")
      .eq("user_id", user.id);

    if (error) {
      console.error("❌ 파일 조회 오류:", error.message);
    } else {
      setFiles(data);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    const filePath = `${user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("files")
      .upload(filePath, file);

    if (uploadError) {
      console.error("🚫 Upload error:", uploadError);
      setMessage("업로드 실패: " + uploadError.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("files").getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("Files").insert([
      {
        filename: file.name,
        url: publicUrl,
        user_id: user.id,
      },
    ]);

    if (insertError) {
      setMessage("DB 저장 실패: " + insertError.message);
    } else {
      setMessage("✅ 업로드 완료!");
      fetchFiles();
      setFile(null);
    }

    setUploading(false);
  };

  const handleDelete = async (id, url) => {
    const filename = url.split("/").pop();
    const filePath = `${user.id}/${filename}`;

    const { error: deleteError } = await supabase.storage
      .from("files")
      .remove([filePath]);

    if (deleteError) {
      console.error("삭제 실패:", deleteError);
      return;
    }

    await supabase.from("Files").delete().eq("id", id);
    setFiles(files.filter((f) => f.id !== id));
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center">📁 파일 업로드</h1>

      <input
        className="w-full border px-4 py-2 rounded"
        type="file"
        onChange={handleFileChange}
      />
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        {uploading ? "업로드 중..." : "업로드"}
      </button>
      {message && <p className="text-center text-red-600">{message}</p>}

      <input
        className="w-full border px-4 py-2 rounded"
        type="text"
        placeholder="폴더/파일명 검색"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {files
          .filter((f) => f.filename.toLowerCase().includes(search.toLowerCase()))
          .map((file) => (
            <div
              key={file.id}
              className="border p-4 rounded shadow flex flex-col justify-between"
            >
              <p className="font-medium break-all">📄 {file.filename}</p>
              <div className="flex justify-between mt-2">
                <a
                  className="text-blue-600 underline"
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  다운로드
                </a>
                <button
                  onClick={() => handleDelete(file.id, file.url)}
                  className="text-red-500 hover:text-red-700"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
