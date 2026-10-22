/* ------------------------------------------------------------------ */
/*  WhatsApp contact helpers.                                          */
/*  Members may publish an opt-in WhatsApp number on their profile;     */
/*  the action button opens a chat with a pre-filled Bangla greeting   */
/*  carrying the sender's name + batch, no typing needed.              */
/* ------------------------------------------------------------------ */

/** Strip a phone number down to digits and normalize to international format. */
export function normalizeWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("880") && digits.length >= 13) return digits;
  if (digits.startsWith("0") && digits.length === 11) return `880${digits.slice(1)}`;
  return digits;
}

/** The auto greeting sent with the chat, carries the sender's identity. */
export function whatsappGreeting(senderName?: string, senderBatch?: string): string {
  if (senderName && senderBatch) {
    return `Assalamu Alaikum! Ami ${senderName}, Batch ${senderBatch}, BCBHS Alumni portal theke bolchi.`;
  }
  return "Assalamu Alaikum! BCBHS Alumni portal theke bolchi.";
}

/** Full wa.me deep link for a member's public WhatsApp number. */
export function whatsappChatLink(
  memberWhatsapp: string,
  senderName?: string,
  senderBatch?: string,
): string {
  const number = normalizeWhatsAppNumber(memberWhatsapp);
  const text = encodeURIComponent(whatsappGreeting(senderName, senderBatch));
  return `https://wa.me/${number}?text=${text}`;
}

/** Pre-filled inquiry message for a job-board circular. */
export function jobInquiryMessage(
  jobTitle: string,
  company: string,
  senderName?: string,
  senderBatch?: string,
): string {
  const who =
    senderName && senderBatch
      ? `Ami ${senderName}, Batch ${senderBatch}`
      : "Ami ekjon BCBHS alumnus";
  return `Assalamu Alaikum! ${who}, BCBHS Alumni portal er Job Board e apnar "${jobTitle}" (${company}) circular ta dekhlam. Ektu details jante chai.`;
}

/** wa.me deep link that opens a chat about a specific job post. */
export function jobWhatsappLink(
  posterWhatsapp: string,
  jobTitle: string,
  company: string,
  senderName?: string,
  senderBatch?: string,
): string {
  const number = normalizeWhatsAppNumber(posterWhatsapp);
  const text = encodeURIComponent(jobInquiryMessage(jobTitle, company, senderName, senderBatch));
  return `https://wa.me/${number}?text=${text}`;
}
