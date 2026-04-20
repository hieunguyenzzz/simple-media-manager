"use client";

import { useState, useRef } from "react";

interface UploadResult {
  name: string;
  shareLink: string;
  url: string;
}

interface FileUploadProps {
  onUploadComplete: () => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setProgress(0);
    setResults([]);

    const totalFiles = files.length;
    let completed = 0;
    const uploaded: UploadResult[] = [];

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/media", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (response.ok) {
          uploaded.push({
            name: file.name,
            shareLink: data.shareLink,
            url: data.media.url,
          });
        } else {
          console.error(`Failed to upload ${file.name}:`, data.error);
        }
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }

      completed++;
      setProgress((completed / totalFiles) * 100);
    }

    setUploading(false);
    setProgress(0);
    setResults(uploaded);
    onUploadComplete();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="mb-8">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.csv,.json,.zip"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          id="file-upload"
        />

        {uploading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto">
              <svg className="animate-spin text-blue-600" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-gray-600">Uploading... {Math.round(progress)}%</p>
          </div>
        ) : (
          <>
            <svg
              className="w-12 h-12 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-gray-600 mb-2">
              Drag and drop files here, or{" "}
              <label
                htmlFor="file-upload"
                className="text-blue-600 hover:underline cursor-pointer"
              >
                browse
              </label>
            </p>
            <p className="text-sm text-gray-500">
              Supports images, videos, PDF, CSV, JSON, and ZIP files
            </p>
            <p className="text-sm text-gray-500">Max file size: 100MB</p>
          </>
        )}
      </div>

      {results.length > 0 && (
        <div className="mt-4 border rounded-lg divide-y">
          {results.map((result, index) => (
            <div key={index} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-700 truncate">{result.name}</p>
                <p className="text-xs text-gray-400 truncate">{result.shareLink}</p>
              </div>
              <button
                onClick={() => copyToClipboard(result.shareLink, index)}
                className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                {copiedIndex === index ? "Copied!" : "Copy Link"}
              </button>
              <a
                href={result.url}
                download
                className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Download
              </a>
            </div>
          ))}
          <div className="p-2 text-center">
            <button
              onClick={() => setResults([])}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
