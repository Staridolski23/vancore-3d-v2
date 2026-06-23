'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white text-[#111]">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="font-display text-4xl md:text-5xl text-[#111] leading-[1.05] mb-8">Cookie Policy</h1>
        <p className="text-sm text-[#6b6b6b] mb-8">Last updated: June 2026</p>

        <div className="space-y-8 text-sm text-[#333] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">1. What Are Cookies</h2>
            <p>
              Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work efficiently and to provide information to website owners.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">2. How We Use Cookies</h2>
            <p className="mb-3">We use cookies for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Necessary Cookies:</strong> Essential for the website to function properly. These cannot be disabled.</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website by collecting anonymous data.</li>
              <li><strong>Preference Cookies:</strong> Remember your preferences and settings.</li>
              <li><strong>Marketing Cookies:</strong> Used to deliver relevant business insights and track campaign effectiveness.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">3. Types of Cookies We Use</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-[#e5e5e5] text-sm">
                <thead>
                  <tr className="bg-[#f7f6f2]">
                    <th className="border border-[#e5e5e5] px-4 py-2 text-left">Cookie</th>
                    <th className="border border-[#e5e5e5] px-4 py-2 text-left">Purpose</th>
                    <th className="border border-[#e5e5e5] px-4 py-2 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#e5e5e5] px-4 py-2 font-mono text-xs">vancore_cookie_consent</td>
                    <td className="border border-[#e5e5e5] px-4 py-2">Stores your cookie consent preferences</td>
                    <td className="border border-[#e5e5e5] px-4 py-2">12 months</td>
                  </tr>
                  <tr>
                    <td className="border border-[#e5e5e5] px-4 py-2 font-mono text-xs">vancore_client_token</td>
                    <td className="border border-[#e5e5e5] px-4 py-2">Authentication token for client portal</td>
                    <td className="border border-[#e5e5e5] px-4 py-2">30 days</td>
                  </tr>
                  <tr>
                    <td className="border border-[#e5e5e5] px-4 py-2 font-mono text-xs">_ga</td>
                    <td className="border border-[#e5e5e5] px-4 py-2">Google Analytics - distinguishes users</td>
                    <td className="border border-[#e5e5e5] px-4 py-2">2 years</td>
                  </tr>
                  <tr>
                    <td className="border border-[#e5e5e5] px-4 py-2 font-mono text-xs">_gid</td>
                    <td className="border border-[#e5e5e5] px-4 py-2">Google Analytics - distinguishes users</td>
                    <td className="border border-[#e5e5e5] px-4 py-2">24 hours</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">4. Managing Cookies</h2>
            <p className="mb-3">
              You can control and/or delete cookies as you wish. You can delete all cookies that are already on your device and you can set most browsers to prevent them from being placed. However, if you do this, you may have to manually adjust some preferences every time you visit our Service.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
              <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
              <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">5. Do Not Track</h2>
            <p>
              Some browsers have a &quot;Do Not Track&quot; feature that signals to websites that you do not want your online activity tracked. At this time, our Service does not respond to &quot;Do Not Track&quot; signals.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">6. Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">7. Contact Us</h2>
            <p>
              If you have any questions about our use of cookies, please contact us at hello@vancoresys.com.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
