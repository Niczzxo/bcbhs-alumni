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

/** Terms of Service — the rules for being part of the BCBHS Alumni Portal. */
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
              By registering or using the BCBHS Alumni Portal, you agree to these terms.
            </p>
          </Reveal>

          <div className="mt-10">
            <Section title="1. Who this portal is for">
              <p>
                The BCBHS Alumni Portal is an <span className="text-ivory/90 font-medium">exclusive community for
                alumni of Bogura Cantonment Board High School</span>. Registration is open to former students;
                every application is manually verified by our administrators before membership is approved.
                Providing false school or identity information is grounds for immediate removal.
              </p>
            </Section>

            <Section title="2. Your account">
              <ul className="list-disc space-y-2 pl-6">
                <li>You must provide accurate information during registration.</li>
                <li>You are responsible for keeping your login credentials confidential — do not share your account.</li>
                <li>One account per person. If you lose access, contact us instead of creating a duplicate.</li>
              </ul>
            </Section>

            <Section title="3. Membership verification & ID card">
              <p>
                Approval may take up to 7 days while administrators verify your alumni status. Once approved,
                you receive an official digital Alumni ID card. The ID card and its QR verification are issued
                by the association — they must not be forged, altered, or used to misrepresent anyone else.
              </p>
            </Section>

            <Section title="4. Acceptable conduct">
              <p>As a member of this community, you agree not to:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Harass, threaten, or abuse fellow members — online or offline.</li>
                <li>Post spam, scams, misleading job offers, or unauthorized advertisements.</li>
                <li>Share anyone&apos;s private contact details without their clear permission.</li>
                <li>Upload photos or content you do not have the right to share, or that is offensive, hateful, or unlawful.</li>
                <li>Attempt to access other members&apos; accounts, private data, or restricted admin areas.</li>
                <li>Impersonate another person, spread deliberately false information, or commit any cyber offence punishable under the <span className="text-ivory/90 font-medium">Cyber Security Act, 2023</span> of Bangladesh.</li>
                <li>Use the portal for any unlawful purpose under the laws of Bangladesh.</li>
              </ul>
            </Section>

            <Section title="5. Content you share">
              <p>
                You retain ownership of photos and posts you share, but you grant the association a license
                to display them within the portal (gallery, memory wall, event pages). If a photo of you is
                posted and you want it removed, contact us and we will take it down promptly.
              </p>
            </Section>

            <Section title="6. Job board & blood donors">
              <p>
                Job circulars and blood donor listings are member-contributed. The association does its best
                to keep them genuine but <span className="text-ivory/90 font-medium">does not guarantee</span> any
                job offer, employer, or donor availability — please verify details independently before acting.
                In a medical emergency, always contact official emergency services first.
              </p>
            </Section>

            <Section title="7. Suspension & termination">
              <p>
                Administrators may warn, suspend, or permanently remove any account that violates these terms,
                provides false information, or harms the community — with or without prior notice in serious cases.
                You may also delete your own account at any time via a request to{" "}
                <a href="mailto:bcbhs.alumni2023@gmail.com" className="text-gold-2 hover:underline">
                  bcbhs.alumni2023@gmail.com
                </a>.
              </p>
            </Section>

            <Section title="8. Service availability">
              <p>
                The portal is provided on a best-effort, volunteer-run basis. We aim for reliable service but
                do not guarantee uninterrupted availability, and we are not liable for any loss arising from
                the use of — or inability to use — the portal, to the maximum extent permitted by law.
              </p>
            </Section>

            <Section title="9. Governing law">
              <p>
                These terms, the Privacy Policy, and your use of the portal are governed by the{" "}
                <span className="text-ivory/90 font-medium">laws of Bangladesh</span>, including the Information
                and Communication Technology Act, 2006 and the Cyber Security Act, 2023. Any dispute arising
                from the portal shall be subject to the jurisdiction of the competent courts of Bangladesh.
              </p>
            </Section>

            <Section title="10. Changes to these terms">
              <p>
                We may update these terms as the community grows. Material changes will be announced on the
                portal; continued use after changes take effect means you accept the updated terms.
              </p>
            </Section>

            <Section title="11. Contact">
              <p>
                Questions about these terms? Reach us at{" "}
                <a href="mailto:bcbhs.alumni2023@gmail.com" className="text-gold-2 hover:underline">
                  bcbhs.alumni2023@gmail.com
                </a>{" "}
                or via the <Link href="/contact" className="text-gold-2 hover:underline">Contact page</Link>.
                Also see our <Link href="/privacy" className="text-gold-2 hover:underline">Privacy Policy</Link>.
              </p>
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
