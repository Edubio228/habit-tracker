"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type ShareButtonsProps = {
  shareToken: string;
};

export function ShareButtons({ shareToken }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const canNativeShare = typeof navigator !== "undefined" && Boolean(navigator.share);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/share/${shareToken}` : "";

  async function copyLink() {
    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function shareNative() {
    if (!shareUrl) {
      return;
    }

    if (!canNativeShare) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({
        title: "Habit challenge",
        url: shareUrl,
      });
      setShared(true);
    } catch {
      setShared(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="secondary" onClick={copyLink}>
        {copied ? "Copied" : "Copy link"}
      </Button>
      <Button type="button" variant="primary" onClick={shareNative}>
        {canNativeShare ? (shared ? "Shared" : "Share") : "Copy link"}
      </Button>
    </div>
  );
}
