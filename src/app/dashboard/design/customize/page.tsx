import { redirect } from "next/navigation";

// Halaman lama; editor desain sekarang ada di /dashboard/design.
export default function CustomizePage() {
  redirect("/dashboard/design");
}
