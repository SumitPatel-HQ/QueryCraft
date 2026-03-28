"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function RouteSyncer() {
  const pathname = usePathname();

  useEffect(() => {
    // Check if we're in an iframe before sending message
    if (window.self !== window.top) {
      window.parent.postMessage(
        { type: "iframe-route-change", path: pathname },
        "*",
      );
    }
  }, [pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}
