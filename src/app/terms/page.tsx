'use client';
import Header from '@/components/Header';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-[#111]">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="font-display text-4xl md:text-5xl text-[#111] leading-[1.05] mb-8">Terms of Service</h1>
        <p className="text-sm text-[#6b6b6b] mb-8">Last updated: June 2026</p>

        <div className="space-y-8 text-sm text-[#333] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using VANCORE&apos;s website, AI business analysis tools, and services (collectively, the &quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">2. Description of Service</h2>
            <p>
              VANCORE provides AI-powered business analysis tools, including an AI business analyst assistant (Vera), business diagnostic services, and related consulting services. The Service includes both free and paid subscription tiers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">3. User Accounts</h2>
            <p className="mb-3">
              When you create an account, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password and account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">4. Acceptable Use</h2>
            <p className="mb-3">You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>Transmit malicious code or harmful content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with the proper functioning of the Service</li>
              <li>Use the Service for competitive analysis or to build a competing product</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">5. AI-Generated Content</h2>
            <p>
              Our AI assistant (Vera) provides business analysis and recommendations based on the information you provide. AI-generated content is for informational purposes only and does not constitute professional advice. You should use your own judgment and consult with qualified professionals before making business decisions.
            </p>
            <p className="mt-3">
              We do not guarantee the accuracy, completeness, or suitability of AI-generated recommendations for your specific situation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">6. Subscription and Payment</h2>
            <p className="mb-3">
              Paid subscriptions are billed monthly in advance. By subscribing, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Pay the applicable subscription fees</li>
              <li>Provide valid payment information</li>
              <li>Allow automatic monthly billing until you cancel</li>
            </ul>
            <p className="mt-3">
              Refunds are available within 14 days of purchase if you are not satisfied with the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">7. Intellectual Property</h2>
            <p>
              The Service, including all content, features, and functionality, is owned by VANCORE and is protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works based on the Service without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, VANCORE shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">9. Termination</h2>
            <p>
              We may terminate or suspend your account at any time for violation of these terms. Upon termination, your right to use the Service will immediately cease. You may request export of your data within 30 days of termination.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">10. Governing Law</h2>
            <p>
              These Terms are governed by the laws of Bulgaria. Any disputes arising from these Terms or the Service shall be resolved in the courts of Bulgaria.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of material changes via email or through the Service. Your continued use of the Service after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">12. Contact</h2>
            <p>
              For questions about these Terms, please contact us at hello@vancoresys.com.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
