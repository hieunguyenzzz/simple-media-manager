import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import SetupClient from "./SetupClient";

export default async function SetupPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <SetupClient />;
}
