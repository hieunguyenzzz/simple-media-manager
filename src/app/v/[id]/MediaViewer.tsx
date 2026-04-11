"use client";

import { useState } from "react";

interface MediaViewerProps {
  url: string;
  originalName: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT";
  mimeType: string;
  size: number;
}

export default function MediaViewer({ url, originalName, type, mimeType, size }: MediaViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isVideo = type === "VIDEO";
  const isImage = type === "IMAGE";
  const isDocument = type === "DOCUMENT";
  const isPdf = mimeType === "application/pdf";

  return (
    <>
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="max-w-6xl w-full">
          {isVideo && (
            <video
              src={url}
              controls
              autoPlay
              className="w-full max-h-[85vh] object-contain"
            >
              Your browser does not support the video tag.
            </video>
          )}
          {isImage && (
            <img
              src={url}
              alt={originalName}
              className="w-full max-h-[85vh] object-contain cursor-zoom-in"
              onClick={() => setIsFullscreen(true)}
            />
          )}
          {isDocument && isPdf && (
            <iframe
              src={url}
              className="w-full h-[85vh]"
              title={originalName}
            />
          )}
          {isDocument && !isPdf && (
            <div className="flex flex-col items-center justify-center py-20">
              <svg className="w-20 h-20 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-300 text-lg">{originalName}</p>
            </div>
          )}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left text-gray-400">
              <p className="text-lg">{originalName}</p>
              <p className="text-sm mt-1">
                {isVideo ? "Video" : isImage ? "Image" : "Document"} &bull;{" "}
                {(size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <div className="flex gap-2">
              {isImage && (
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  View Full Size
                </button>
              )}
              <a
                href={url}
                download={originalName}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && isImage && (
        <div
          className="fixed inset-0 bg-black z-50 flex items-center justify-center cursor-zoom-out"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-colors z-10"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={url}
            alt={originalName}
            className="max-w-full max-h-full object-contain p-4"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
