'use client';


export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-[#111]">
      <main className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="font-display text-4xl md:text-5xl text-[#111] leading-[1.05] mb-8">Terms of Service</h1>
        <p className="text-sm text-[#6b6b6b] mb-8">Last updated: July 2026</p>
        <div className="space-y-8 text-sm text-[#333] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">1. Agreement to Terms</h2>
            <p>By accessing or using Vancore Systems’ website, client portal, or any related service, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use the Service.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">2. Services</h2>
            <p>Vancore Systems provides business analysis, operational automation, booking management, document workflows, and AI-assisted reporting (collectively, the “Service”). Services are delivered through our website, client portal, and API integrations.</p>
            <p className="mt-3">We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with notice where reasonably possible.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">3. Account Registration</h2>
            <p>To use certain features, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information as needed. You are responsible for safeguarding your credentials and for all activity under your account.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">4. Acceptable Use</h2>
            <p>You agree not to misuse the Service or help anyone else do so. Specifically, you will not:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>attempt to gain unauthorized access to any portion of the Service or its systems;</li>
              <li>use the Service for any unlawful, fraudulent, or harmful purpose;</li>
              <li>reverse-engineer, decompile, or attempt to extract source code from the Service;</li>
              <li>interfere with or disrupt the integrity or performance of the Service;</li>
              <li>upload or transmit malicious code, spam, or infringing content.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">5. Booking and Payments</h2>
            <p>Bookings made through the Service are subject to availability and confirmation. Fees, if applicable, are disclosed before confirmation. Payment terms are specified at the point of purchase. Cancellation and rescheduling policies may apply per booking or plan.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">6. Intellectual Property</h2>
            <p>The Service and its original content, features, and functionality are owned by Vancore Systems and are protected by intellectual property laws. You retain ownership of the data you upload or create within the Service, subject to our right to process it for delivering the Service.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">7. Confidentiality</h2>
            <p>We treat your business information as confidential. We do not share client data with third parties except as required to operate the Service (processors under GDPR Article 28) or as required by law.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">8. Disclaimers</h2>
            <p>The Service is provided on an “as is” and “as available” basis. We do not guarantee that the Service will be uninterrupted, timely, secure, or error-free. We do not warrant that results obtained from the use of the Service will be accurate or reliable.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">9. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, Vancore Systems shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, goodwill, or data, arising out of or related to your use of the Service.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">10. Indemnification</h2>
            <p>You agree to indemnify and hold harmless Vancore Systems from any claim, liability, loss, damage, or expense arising from your use of the Service, violation of these Terms, or infringement of any third-party right.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">11. Governing Law</h2>
            <p>These Terms are governed by and construed in accordance with the laws of the Republic of Bulgaria. Any disputes shall be resolved in the competent courts of Bulgaria, unless mandatory consumer protection rules provide otherwise.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">12. Changes to Terms</h2>
            <p>We may update these Terms from time to time. Continued use of the Service after changes constitute acceptance of the updated Terms. We will update the “Last updated” date and notify users of material changes.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">13. Contact</h2>
            <p>For questions about these Terms, contact us at <a href="mailto:hello@vancoresys.com" className="text-[#991930] hover:underline">hello@vancoresys.com</a> or via our <a href="/contact" className="text-[#991930] hover:underline">contact page</a>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
