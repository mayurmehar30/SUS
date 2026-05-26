"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function useRequireRole(allowedRoles: string[]): boolean {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && !allowedRoles.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  return !user || allowedRoles.includes(user.role);
}
