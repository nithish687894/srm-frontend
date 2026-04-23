"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

export function useAuth() {
  const { authToken, _hasHydrated } = useAuthStore();
  const router = useRouter();
 
   useEffect(() => {
     if (!_hasHydrated) return;
     if (!authToken) router.push("/");
   }, [_hasHydrated, authToken]);

  return { ready: _hasHydrated && !!authToken };
}
