"use client";

import { useAuth } from "@/lib/auth-context";
import { whatsappChatLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "./Footer";

/**
 * WhatsApp action button for a member's public opt-in number.
 * Opens a chat with a pre-filled greeting carrying the sender's
 * name + batch, no typing needed.
 */
export default function WhatsAppButton({
  whatsapp,
  labeled = false,
}: {
  whatsapp?: string;
  labeled?: boolean;
}) {
  const { user } = useAuth();
  if (!whatsapp) return null;
  const href = whatsappChatLink(whatsapp, user?.name, user?.batch);

  if (labeled) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2.5 rounded-full border border-emerald-400/40 px-6 py-3 text-xs font-bold uppercase tracking-widest text-emerald-300 transition-all hover:bg-emerald-500/10"
      >
        <WhatsAppIcon />
        Chat on WhatsApp
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      aria-label="Chat on WhatsApp"
      title="Chat on WhatsApp"
      className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/40 bg-ink/80 text-emerald-300 backdrop-blur transition-all hover:scale-110 hover:bg-emerald-500/20"
    >
      <WhatsAppIcon />
    </a>
  );
}
