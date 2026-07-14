'use client';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-[#111]">
      <main className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="font-display text-4xl md:text-5xl text-[#111] leading-[1.05] mb-8">Privacy Policy</h1>
        <p className="text-sm text-[#6b6b6b] mb-8">Last updated: June 2026</p>

        <div className="space-y-8 text-sm text-[#333] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">1. Introduction</h2>
            <p>
              VANCORE (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal data when you use our website, AI business analysis tools, and services (collectively, the &quot;Service&quot;).
            </p>
            <p className="mt-3">
              By using our Service, you consent to the collection and use of information in accordance with this policy. If you do not agree with the terms of this Privacy Policy, please do not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">2. Data Controller</h2>
            <p>
              VANCORE, Bulgaria<br />
              Email: hello@vancoresys.com<br />
              Website: vancoresys.com
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">3. Information We Collect</h2>
            <p className="mb-3">We collect the following types of personal data:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, company name, phone number when you register or use our lead capture forms.</li>
              <li><strong>Conversation Data:</strong> Messages exchanged with our AI assistant (Vera), including business information you share during consultations.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our Service, including pages visited, features used, and timestamps.</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, cookies, and similar technologies.</li>
              <li><strong>Payment Information:</strong> When you subscribe to our paid plans, payment is processed through Revolut. We do not store your full payment card details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">4. How We Use Your Information</h2>
            <p className="mb-3">We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Providing and improving our AI business analysis service</li>
              <li>Personalizing your experience and delivering relevant insights</li>
              <li>Processing subscriptions and payments</li>
              <li>Communicating with you about your account and service updates</li>
              <li>Analyzing usage patterns to improve our Service</li>
              <li>Complying with legal obligations</li>
              <li>Preventing fraud and ensuring security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">5. Legal Basis for Processing (GDPR)</h2>
            <p className="mb-3">We process your personal data under the following legal bases:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Consent:</strong> When you opt in to marketing communications or accept non-essential cookies</li>
              <li><strong>Contract:</strong> To provide the services you have requested</li>
              <li><strong>Legitimate Interest:</strong> To improve our Service and communicate with you about relevant offerings</li>
              <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">6. Data Sharing and Disclosure</h2>
            <p className="mb-3">We share personal data only with processors necessary to deliver the Service, under agreements that protect your data. None of these processors are located outside the EU in a way that would bypass GDPR transfer rules.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase</strong> — authentication and database hosting, EU region. <a href="https://supabase.com/dpa" className="text-[#991930] hover:underline">DPA</a></li>
              <li><strong>Vercel</strong> — frontend hosting and edge delivery. <a href="https://vercel.com/legal/dpa" className="text-[#991930] hover:underline">DPA</a></li>
              <li><strong>DigitalOcean</strong> — backend API hosting and file storage, Frankfurt region. <a href="https://www.digitalocean.com/legal/dpa" className="text-[#991930] hover:underline">DPA</a></li>
            </ul>
            <p className="mt-3">We do not sell your personal data. We do not share data for advertising purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">7. Data Retention</h2>
            <p>
              We retain your personal data for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law. Account data is retained for 12 months after your last activity. You may request deletion of your data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">8. Your Rights (GDPR)</h2>
            <p className="mb-3">Under GDPR, you have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Right of Access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> Correct inaccurate personal data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
              <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Right to Object:</strong> Object to processing of your personal data</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
            </ul>
            <p className="mt-3">To exercise these rights, contact us at hello@vancoresys.com.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">9. Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
            </p>
            <p className="mt-3">
              For more information, please see our <a href="/cookies" className="text-[#991930] hover:underline">Cookie Policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">10. Data Security</h2>
            <p>
              We implement technical and organizational measures designed to protect personal data against unauthorized access, alteration, disclosure, or destruction. Specific controls include:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Encryption in transit:</strong> All external connections use TLS 1.2 or higher through our hosting and CDN providers.</li>
              <li><strong>Authentication:</strong> Portal and API access require authenticated sessions using JWT. Role-based access controls are applied where team environments are enabled.</li>
              <li><strong>Audit logging:</strong> Administrative actions, booking changes, and document upload events are logged with timestamp, actor, and action.</li>
              <li><strong>Backups:</strong> System and database backups are stored according to configured retention schedules. Backup integrity is verified periodically to support restoration within realistic timeframes.</li>
              <li><strong>Security headers:</strong> The site applies security headers such as HSTS, CSP, and X-Frame-Options consistent with deployment platform capabilities.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">11. International Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence. We ensure that such transfers comply with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">12. Children&apos;s Privacy</h2>
            <p>
              Our Service is not intended for individuals under the age of 16. We do not knowingly collect personal data from children under 16.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">13. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">14. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us:<br />
              Email: hello@vancoresys.com<br />
              Website: vancoresys.com/contact
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
