"use client";

import { useState, useCallback } from "react";
import Header from "./Header";
import FileUpload from "./FileUpload";
import MediaGallery from "./MediaGallery";

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FileUpload onUploadComplete={handleUploadComplete} />
        <MediaGallery key={refreshKey} />
      </main>
    </div>
  );
}
