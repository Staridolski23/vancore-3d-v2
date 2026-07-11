'use client';

import Header from '@/components/Header';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white text-[#111]">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="font-display text-4xl md:text-5xl text-[#111] leading-[1.05] mb-8">Cookie Policy</h1>
        <p className="text-sm text-[#6b6b6b] mb-8">Last updated: July 2026</p>
        <div className="space-y-8 text-sm text-[#333] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">1. What Are Cookies</h2>
            <p>Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work more efficiently, to remember user preferences, and to provide information to website owners.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">2. How We Use Cookies</h2>
            <p>Vancore Systems uses cookies and similar technologies to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>operate and secure the website and client portal;</li>
              <li>remember your authentication session after login;</li>
              <li>understand how the Service is used so we can improve it;</li>
              <li>support analytics and performance monitoring.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">3. Types of Cookies We Use</h2>
            <div className="mt-3 space-y-4">
              <div>
                <h3 className="font-semibold text-[#111]">Essential cookies</h3>
                <p>Required for the Service to function. They enable authentication, security, and core navigation. These cannot be disabled.</p>
              </div>
              <div>
                <h3 className="font-semibold text-[#111]">Functional cookies</h3>
                <p>Remember choices you make to provide a more personalized experience, such as interface preferences.</p>
              </div>
              <div>
                <h3 className="font-semibold text-[#111]">Analytics cookies</h3>
                <p>Help us understand how visitors interact with the website so we can improve content, performance, and usability.</p>
              </div>
              <div>
                <h3 className="font-semibold text-[#111]">Marketing cookies</h3>
                <p>Used to deliver relevant messaging and measure campaign effectiveness. These are only set with your explicit consent.</p>
              </div>
            </div>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">4. Third-Party Cookies</h2>
            <p>Some cookies are placed by third-party services integrated into our website, such as analytics and hosting providers. These providers may process data in accordance with their own privacy policies and applicable data protection agreements.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">5. Managing Cookies</h2>
            <p>You can control or disable cookies through your browser settings. Disabling essential cookies may affect the functionality of the Service. You can also withdraw consent for non-essential cookies where consent prompts are provided.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">6. Updates</h2>
            <p>We may update this Cookie Policy from time to time. The updated version will be posted on this page with a revised “Last updated” date. Continued use of the Service after changes constitutes acceptance of the updated policy.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">7. Contact</h2>
            <p>If you have questions about our use of cookies, please contact us at <a href="mailto:hello@vancoresys.com" className="text-[#991930] hover:underline">hello@vancoresys.com</a> or via our <a href="/contact" className="text-[#991930] hover:underline">contact page</a>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
