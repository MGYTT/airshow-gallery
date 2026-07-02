"use client";

import { useState, useCallback } from "react";
import { Share2, Check, Link as LinkIcon } from "lucide-react";

export default function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Użytkownik anulował lub Web Share API nieobsługiwane — fallback poniżej
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ostateczny fallback — nic nie robimy, unikamy crashu
    }
  }, [title, url]);

  return (
    <button
      className="sp-share-btn"
      aria-label={copied ? "Link skopiowany" : "Udostępnij ten pokaz"}
      onClick={handleShare}
      type="button"
    >
      {copied ? <Check size={13}/> : <Share2 size={13}/>}
      {copied ? "Skopiowano!" : "Udostępnij"}
    </button>
  );
}