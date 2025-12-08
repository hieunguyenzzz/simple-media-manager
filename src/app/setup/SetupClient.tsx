"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SetupClient() {
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch("/api/auth/token");
        if (!res.ok) {
          throw new Error("Failed to fetch token");
        }
        const data = await res.json();
        setToken(data.token);
      } catch (err) {
        setError("Failed to load your authentication token");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchToken();
  }, []);

  const apiUrl = typeof window !== "undefined"
    ? window.location.origin
    : "https://media.hieunguyen.dev";

  const installCommand = token
    ? `curl -fsSL "${apiUrl}/api/setup/install.sh?token=${token}" | bash`
    : "";

  const handleCopy = async () => {
    if (!installCommand) return;
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <p className="text-red-600">{error}</p>
          <Link href="/" className="text-blue-600 hover:underline mt-4 block">
            Go back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            macOS Quick Share Setup
          </h1>
          <p className="text-gray-600 mb-8">
            Set up Quick Share on your Mac with a single command.
          </p>

          {/* Command Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Run this command in Terminal:
            </label>
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                {installCommand}
              </pre>
              <button
                onClick={handleCopy}
                className={`absolute top-2 right-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
                  copied
                    ? "bg-green-600 text-white"
                    : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                }`}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* What Gets Installed */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              This will install:
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-500 mr-3 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <div>
                  <span className="font-medium">Quick Share Action</span>
                  <p className="text-sm text-gray-500">
                    Right-click any image or video to upload and get a share link
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-500 mr-3 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <div>
                  <span className="font-medium">Menu Bar App</span>
                  <p className="text-sm text-gray-500">
                    View your last 20 uploads from the menu bar
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Requirements */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Requirements:
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• macOS (Apple Silicon or Intel)</li>
              <li>• Homebrew will be installed automatically if not present</li>
            </ul>
          </div>

          {/* Dependencies Info */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Dependencies installed:
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                jq
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                SwiftBar
              </span>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Need help?{" "}
            <Link href="/docs/MACOS_SETUP.md" className="text-blue-600 hover:underline">
              View detailed documentation
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
