/**
 * Disposable / temporary email domains (owner, 2026-11-13): registrations
 * from these addresses are refused, so a throwaway inbox can never
 * become a member. This is the well-known-services list only - it
 * stops the temp-mail sites most people reach for, not every obscure
 * domain on the internet; the admin approval queue is still the
 * backstop for anything the list misses, and email verification
 * (see auth-context) proves the inbox is real before a registration
 * reaches that queue at all.
 */

/** Lowercase domains, no leading dots. Subdomains match too. */
const DISPOSABLE_DOMAINS = new Set([
  // 10 Minute Mail family
  "10minutemail.com",
  "10minutemail.net",
  "10minutemail.co.za",
  "10minutemail.de",
  "10minute-mail.com",
  "10mail.org",
  "20minutemail.com",
  "20minutemail.it",
  "20mail.it",
  // 1 Second Mail
  "1secmail.com",
  "1secmail.net",
  "1secmail.org",
  // Guerrilla Mail family
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.biz",
  "guerrillamail.de",
  "guerrillamailblock.com",
  "sharklasers.com",
  "pokemail.net",
  "spam4.me",
  // Temp Mail family (temp-mail.org and lookalikes)
  "temp-mail.org",
  "temp-mail.com",
  "temp-mail.io",
  "temp-mail.net",
  "temp-mail.ru",
  "temp-mail.de",
  "temp-mail.live",
  "temp-mail.xyz",
  "temp-mail.pp.ua",
  "tempmail.com",
  "tempmail.net",
  "tempmail.org",
  "tempmail.de",
  "tempmailaddress.com",
  "tempmailo.com",
  "tempmailplus.com",
  "tempmail24.com",
  "tempail.com",
  "tempemail.net",
  "tempemail.co",
  "tempemail.com",
  "tempinbox.com",
  "tempinbox.co.uk",
  "tempomail.fr",
  // Mailinator family
  "mailinator.com",
  "mailinator.net",
  "mailinator.org",
  "mailinator2.com",
  // YOPmail family
  "yopmail.com",
  "yopmail.net",
  "yopmail.fr",
  "yopmail.org",
  // MailDrop family
  "maildrop.cc",
  "maildrop.cf",
  "maildrop.ga",
  "maildrop.ml",
  "maildrop.tk",
  // GetNada
  "getnada.com",
  "getnada.net",
  // Throwaway / trash mail
  "throwawaymail.com",
  "throwawaymailbox.com",
  "throwawayemail.com",
  "trashmail.com",
  "trashmail.net",
  "trashmail.org",
  "trashmail.me",
  "trashmail.ws",
  "trashemail.com",
  // Fake-mail generators
  "fakemail.net",
  "fakemailgenerator.com",
  "fakeinbox.com",
  "emailfake.com",
  // Other well-known throwaways
  "anonbox.net",
  "anonymbox.com",
  "dispostable.com",
  "disposablemail.com",
  "emailondeck.com",
  "inboxbear.com",
  "mailcatch.com",
  "mailnesia.com",
  "mailnull.com",
  "mailtemp.info",
  "mail.tm",
  "mintemail.com",
  "moakt.com",
  "mohmal.com",
  "mytemp.email",
  "mytempemail.com",
  "mailme24.com",
  "mailmetrash.com",
  "mail1a.de",
  "tmail.com",
  "spamgourmet.com",
  "spamgourmet.net",
  "spamgourmet.org",
  "spambox.us",
  "spamhole.com",
  "spaml.com",
  "spaml.de",
  "spamthis.co.uk",
]);

/** True when the address belongs to a known disposable-mail service.
 *  Matches the domain itself and any of its subdomains; anything
 *  without an "@" (or an empty domain) is not disposable, the form's
 *  own validation reports those. */
export function isDisposableEmail(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  let domain = email.slice(at + 1).trim().toLowerCase();
  if (!domain) return false;
  if (domain.endsWith(".")) domain = domain.slice(0, -1);
  let cur = domain;
  while (cur) {
    if (DISPOSABLE_DOMAINS.has(cur)) return true;
    const dot = cur.indexOf(".");
    if (dot < 0) break;
    cur = cur.slice(dot + 1);
  }
  return false;
}
