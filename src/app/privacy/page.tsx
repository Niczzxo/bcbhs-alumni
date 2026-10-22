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

/** Privacy Policy, prepared in accordance with the laws of Bangladesh. */
export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="bg-ink">
        <PageHero
          eyebrow="Your trust matters"
          title={<>Privacy <span className="text-gold-gradient">Policy</span></>}
          subtitle="How we collect, use, and protect the personal information of our alumni community."
        />
        <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
          <Reveal>
            <p className="rounded-2xl border border-ivory/10 bg-ink-2 px-5 py-4 text-sm text-muted">
              Effective date: <span className="font-semibold text-ivory/90">October 15, 2026</span>.
              This Privacy Policy applies to the BCBHS Alumni Portal
              (bcbhs-alumni-niczzxos-projects.vercel.app), operated by the BCBHS Alumni Association
              (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;), a voluntary alumni community based in
              Bogura, Bangladesh. It is prepared in accordance with the laws of Bangladesh, including the
              Information and Communication Technology Act, 2006 and the Cyber Security Act, 2023.
            </p>
          </Reveal>

          <div className="mt-10">
            <Section title="1. Definitions">
              <ul className="list-disc space-y-2 pl-6">
                <li><span className="text-ivory/90 font-medium">&ldquo;Personal data&rdquo;</span> means any information relating to an identified or identifiable individual, such as name, contact details, or photographs.</li>
                <li><span className="text-ivory/90 font-medium">&ldquo;Processing&rdquo;</span> means any operation performed on personal data, including collection, storage, display, and deletion.</li>
                <li><span className="text-ivory/90 font-medium">&ldquo;Member&rdquo;</span> means a registered and approved user of the portal.</li>
              </ul>
            </Section>

            <Section title="2. Information we collect">
              <p>When you register and use the portal, we collect:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li><span className="text-ivory/90 font-medium">Account details</span>, your name, email address, and password (stored securely via Firebase Authentication; we never see your password).</li>
                <li><span className="text-ivory/90 font-medium">Profile information</span>, batch / passing year, department, district, country (if living abroad), profession, company, blood group, date of birth, and profile photo.</li>
                <li><span className="text-ivory/90 font-medium">Contact numbers</span>, your private phone number and, only if you choose to share it, a public WhatsApp number.</li>
                <li><span className="text-ivory/90 font-medium">Community content</span>, photos you appear in within the gallery / memory wall, job circulars you post, and event participation.</li>
              </ul>
            </Section>

            <Section title="3. Legal basis for processing">
              <p>
                We process your personal data on the basis of <span className="text-ivory/90 font-medium">your
                consent</span>, given when you register and accept our Terms of Service and this Policy, and
                for the <span className="text-ivory/90 font-medium">legitimate purpose</span> of operating a
                verified alumni community, including membership verification, community safety, and
                communication. You may withdraw your consent at any time by requesting account deletion
                (see Section 8); content you voluntarily made public may remain in community archives.
              </p>
            </Section>

            <Section title="4. How we use your information">
              <ul className="list-disc space-y-2 pl-6">
                <li>To verify that you are a genuine BCBHS alumnus and approve your membership.</li>
                <li>To display your public profile in the member directory, blood donor list, and committee pages.</li>
                <li>To generate your official Alumni ID card with a verification QR code.</li>
                <li>To send membership updates, event invitations, and urgent community notices (e.g. blood requests).</li>
                <li>To keep the portal secure and prevent misuse or fake registrations.</li>
              </ul>
              <p>We <span className="text-ivory/90 font-medium">never sell</span> your personal information to anyone, and we never use it for advertising.</p>
            </Section>

            <Section title="5. What stays private">
              <p>
                Your <span className="text-ivory/90 font-medium">phone number is always private</span>, it is
                stored separately from your public profile and is visible only to you and authorized
                administrators. Your WhatsApp number appears publicly{" "}
                <span className="text-ivory/90 font-medium">only if you explicitly choose to share it</span> in
                your profile settings. Your email address is never shown publicly without your consent.
              </p>
            </Section>

            <Section title="6. Who can see your profile">
              <ul className="list-disc space-y-2 pl-6">
                <li>Basic directory information (name, batch, profession, district, photo) is visible to fellow members and, in limited preview form, to website visitors.</li>
                <li>Detailed contact options (WhatsApp chat, email) are available to signed-in members only.</li>
                <li>Administrators may view member details solely for verification and community management.</li>
              </ul>
            </Section>

            <Section title="7. Data storage, security & retention">
              <p>
                Your data is stored securely with Google Firebase (Firestore database, Asia-South region) and
                protected by strict access rules, private phone numbers are technically blocked from ever
                appearing in public profile records. Profile photos are compressed in your browser before
                upload, and access to member data is limited to authorized administrators on a need-to-know basis.
              </p>
              <p>
                We retain your data for as long as your membership remains active. If you request deletion, we
                will erase your personal data within <span className="text-ivory/90 font-medium">30 days</span>,
                except for minimal records we are legally obliged to preserve (for example, under the ICT Act,
                2006 or a lawful order of a competent authority). While we take reasonable steps to protect
                your information, no online system is completely immune to risk.
              </p>
            </Section>

            <Section title="8. Your rights">
              <ul className="list-disc space-y-2 pl-6">
                <li><span className="text-ivory/90 font-medium">Access</span>, view all data we hold about you from your Profile page.</li>
                <li><span className="text-ivory/90 font-medium">Correction</span>, edit your profile at any time to keep it accurate and up to date.</li>
                <li><span className="text-ivory/90 font-medium">Withdrawal</span>, remove your public WhatsApp number or donor listing whenever you wish.</li>
                <li><span className="text-ivory/90 font-medium">Deletion</span>, request a copy of your data or ask us to delete your account and data (see Section 13).</li>
              </ul>
            </Section>

            <Section title="9. Cookies & local data">
              <p>
                The portal uses Firebase Authentication session cookies/tokens to keep you signed in, and your
                browser&apos;s local storage may hold non-sensitive preferences. We do not use third-party
                advertising or tracking cookies.
              </p>
            </Section>

            <Section title="10. Children&apos;s privacy">
              <p>
                This portal is a community for school alumni and is not directed at children under 13.
                If you believe a child&apos;s data has been provided to us, contact us and we will remove it promptly.
              </p>
            </Section>

            <Section title="11. Legal compliance">
              <p>
                We handle your data in line with the laws of Bangladesh, including the{" "}
                <span className="text-ivory/90 font-medium">Information and Communication Technology Act, 2006</span>{" "}
                and the <span className="text-ivory/90 font-medium">Cyber Security Act, 2023</span>. Where the law
                requires us to preserve or disclose information, for example, in response to a lawful order
                from a competent court or authority in Bangladesh, we will comply as required. Misuse of
                personal data through the portal may be reported to the relevant authorities under these laws.
              </p>
            </Section>

            <Section title="12. Changes to this policy">
              <p>
                We may update this policy as the portal grows. Significant changes will be announced on the
                portal, and the effective date above will always reflect the latest version. Continued use of
                the portal after changes take effect constitutes acceptance of the updated policy.
              </p>
            </Section>

            <Section title="13. Contact & grievance">
              <p>
                For any privacy question, data request, or complaint, contact us at{" "}
                <a href="mailto:bcbhs.alumni2023@gmail.com" className="text-gold-2 hover:underline">
                  bcbhs.alumni2023@gmail.com
                </a>{" "}
                or via the <Link href="/contact" className="text-gold-2 hover:underline">Contact page</Link>.
                We aim to respond to all privacy-related requests within 30 days.
              </p>
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
