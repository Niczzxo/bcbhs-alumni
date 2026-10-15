import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import Link from "next/link";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <section className="mt-10 first:mt-0">
        <h2 className="font-display text-xl font-bold text-ivory sm:text-2xl">{title}</h2>
        <div className="gold-rule mt-4 w-24" />
        <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-muted">{children}</div>
      </section>
    </Reveal>
  );
}

/** Terms of Service — governed by the laws of Bangladesh. */
export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Community guidelines"
          title={<>Terms of <span className="text-gold-gradient">Service</span></>}
          subtitle="The simple, fair rules that keep our alumni community safe and welcoming."
        />
        <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
          <Reveal>
            <p className="rounded-2xl border border-ivory/10 bg-ink-2 px-5 py-4 text-sm text-muted">
              Effective date: <span className="font-semibold text-ivory/90">October 15, 2026</span>.
              These Terms of Service (&ldquo;Terms&rdquo;) form a binding agreement between you and the BCBHS
              Alumni Association (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) — a voluntary alumni
              community based in Bogura, Bangladesh — under the Contract Act, 1872. By registering for or
              using the BCBHS Alumni Portal, you accept these Terms in full.
            </p>
          </Reveal>

          <div className="mt-10">
            <Section title="1. Definitions">
              <ul className="list-disc space-y-2 pl-6">
                <li><span className="text-ivory/90 font-medium">&ldquo;Portal&rdquo;</span> means the BCBHS Alumni Portal website and its services.</li>
                <li><span className="text-ivory/90 font-medium">&ldquo;Member&rdquo;</span> means a person whose registration has been approved by an administrator.</li>
                <li><span className="text-ivory/90 font-medium">&ldquo;Content&rdquo;</span> means text, photographs, job circulars, and other material posted by users.</li>
              </ul>
            </Section>

            <Section title="2. Eligibility">
              <p>
                The portal is an <span className="text-ivory/90 font-medium">exclusive community for alumni of
                Bogura Cantonment Board High School</span>. You must be at least 18 years old, or have the
                consent of a parent or guardian, to register. Every application is manually verified by our
                administrators before membership is approved; providing false school or identity information
                is grounds for immediate and permanent removal.
              </p>
            </Section>

            <Section title="3. Your account">
              <ul className="list-disc space-y-2 pl-6">
                <li>You must provide accurate and complete information during registration and keep it updated.</li>
                <li>You are responsible for keeping your login credentials confidential and for all activity under your account — do not share your account with anyone.</li>
                <li>One account per person. If you lose access, contact us instead of creating a duplicate account.</li>
                <li>Notify us immediately at <a href="mailto:bcbhs.alumni2023@gmail.com" className="text-gold-2 hover:underline">bcbhs.alumni2023@gmail.com</a> if you suspect unauthorized use of your account.</li>
              </ul>
            </Section>

            <Section title="4. Membership verification & ID card">
              <p>
                Approval may take up to 7 days while administrators verify your alumni status. Once approved,
                you receive an official digital Alumni ID card bearing a verification QR code. The ID card is
                issued by the association — it must not be forged, altered, duplicated, or used to
                misrepresent any person. Misuse of the ID card will result in termination and may be reported
                to the authorities.
              </p>
            </Section>

            <Section title="5. Acceptable conduct">
              <p>As a member of this community, you agree not to:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Harass, threaten, defame, or abuse fellow members — online or offline.</li>
                <li>Post spam, scams, misleading job offers, or unauthorized advertisements.</li>
                <li>Share anyone&apos;s private contact details without their clear permission.</li>
                <li>Upload photos or content you do not have the right to share, or that is obscene, hateful, or otherwise unlawful.</li>
                <li>Attempt to gain unauthorized access to other members&apos; accounts, private data, or restricted administrative areas.</li>
                <li>Impersonate any person, or publish deliberately false or misleading information.</li>
                <li>Commit any act punishable under the <span className="text-ivory/90 font-medium">Cyber Security Act, 2023</span> or the <span className="text-ivory/90 font-medium">Information and Communication Technology Act, 2006</span> of Bangladesh — including identity fraud, cyber fraud, unauthorized access, and transmission of threatening or defamatory content — or under any other law of Bangladesh.</li>
              </ul>
              <p>
                Violations may be reported to the Bangladesh Police Cyber Unit or other competent authorities,
                in addition to action under Section 10 below.
              </p>
            </Section>

            <Section title="6. Content you share">
              <p>
                You retain ownership of the Content you post. By posting, you grant the association a
                non-exclusive, royalty-free license to display that Content within the portal (directory,
                gallery, memory wall, event pages). You confirm that you have the right to share everything
                you post — including the consent of any identifiable person appearing in your photos.
              </p>
              <p>
                If a photo of you has been posted and you want it removed, contact us and we will take it
                down promptly. We reserve the right to remove any Content that violates these Terms without
                prior notice.
              </p>
            </Section>

            <Section title="7. Job board & blood donors">
              <p>
                Job circulars and blood donor listings are member-contributed. The association makes
                reasonable efforts to keep them genuine but <span className="text-ivory/90 font-medium">does not
                guarantee</span> any job offer, employer, salary, or donor availability — always verify details
                independently before acting or sharing personal information. In a medical emergency, contact
                official emergency services first; a donor listing is never a substitute for professional care.
              </p>
            </Section>

            <Section title="8. Privacy">
              <p>
                Our handling of your personal data is described in our{" "}
                <Link href="/privacy" className="text-gold-2 hover:underline">Privacy Policy</Link>, which forms
                part of these Terms. By accepting these Terms, you also accept the Privacy Policy.
              </p>
            </Section>

            <Section title="9. Fees">
              <p>Membership of the portal is currently free of charge. If any paid service is introduced in the future, its terms and pricing will be presented clearly before you are charged anything.</p>
            </Section>

            <Section title="10. Suspension & termination">
              <p>
                Administrators may warn, suspend, or permanently remove any account that violates these Terms,
                provides false information, or harms the community — with or without prior notice in serious
                cases. You may also end your membership at any time by requesting account deletion at{" "}
                <a href="mailto:bcbhs.alumni2023@gmail.com" className="text-gold-2 hover:underline">
                  bcbhs.alumni2023@gmail.com
                </a>.
              </p>
            </Section>

            <Section title="11. Disclaimer & limitation of liability">
              <p>
                The portal is provided <span className="text-ivory/90 font-medium">&ldquo;as is&rdquo;</span> on a
                best-effort, volunteer-run basis. We aim for reliable service but do not warrant uninterrupted,
                error-free operation. To the maximum extent permitted by the laws of Bangladesh, the
                association, its administrators, and volunteers shall not be liable for any direct or indirect
                loss arising from your use of — or inability to use — the portal, including reliance on
                member-posted content.
              </p>
            </Section>

            <Section title="12. Indemnity">
              <p>
                You agree to indemnify and hold harmless the BCBHS Alumni Association, its administrators, and
                volunteers against any claim, loss, or expense arising from your violation of these Terms or
                your misuse of the portal.
              </p>
            </Section>

            <Section title="13. Severability">
              <p>
                If any provision of these Terms is found unenforceable by a competent court, the remaining
                provisions continue in full force, and the unenforceable provision shall be applied to the
                maximum extent permitted by law.
              </p>
            </Section>

            <Section title="14. Entire agreement">
              <p>
                These Terms, together with the Privacy Policy, constitute the entire agreement between you and
                the association regarding the portal, superseding any prior understanding on the same subject.
              </p>
            </Section>

            <Section title="15. Changes to these terms">
              <p>
                We may update these Terms as the community grows. Material changes will be announced on the
                portal; your continued use after changes take effect constitutes acceptance of the updated Terms.
              </p>
            </Section>

            <Section title="16. Governing law & jurisdiction">
              <p>
                These Terms, the Privacy Policy, and your use of the portal are governed by the{" "}
                <span className="text-ivory/90 font-medium">laws of Bangladesh</span>, including the Contract
                Act, 1872, the Information and Communication Technology Act, 2006, and the Cyber Security
                Act, 2023. Any dispute arising out of or in connection with the portal shall be subject to
                the exclusive jurisdiction of the competent courts of Bangladesh.
              </p>
            </Section>

            <Section title="17. Contact">
              <p>
                Questions about these Terms? Reach us at{" "}
                <a href="mailto:bcbhs.alumni2023@gmail.com" className="text-gold-2 hover:underline">
                  bcbhs.alumni2023@gmail.com
                </a>{" "}
                or via the <Link href="/contact" className="text-gold-2 hover:underline">Contact page</Link>.
              </p>
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
