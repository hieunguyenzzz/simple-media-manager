"use client";

import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface HeaderProps {
  user: User;
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Media Manager</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">
            {user.name || user.email}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
