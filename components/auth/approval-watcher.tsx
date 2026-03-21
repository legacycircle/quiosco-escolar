"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ApprovalWatcher() {
  const router = useRouter();

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      router.refresh();
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [router]);

  return null;
}
