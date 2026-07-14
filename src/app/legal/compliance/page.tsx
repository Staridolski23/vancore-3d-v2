'use client';


export default function LegalCompliancePage() {
  return (
    <div className="min-h-screen bg-white text-[#111]">
      <main className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="font-display text-4xl md:text-5xl text-[#111] leading-[1.05] mb-8">Legal & Compliance</h1>
        <p className="text-sm text-[#6b6b6b] mb-8">Last updated: July 2026</p>
        <div className="space-y-10 text-sm text-[#333] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">Overview</h2>
            <p>Vancore Systems operates as a boutique business analysis and development consultancy. We process personal data solely to deliver our services — bookings, document workflows, AI-assisted reporting, and client portal access. We do not sell data. We do not use data for advertising. We do not share data with unauthorized third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">Data Protection</h2>
            <p className="mb-3">We process personal data in accordance with the General Data Protection Regulation (EU) 2016/679 (GDPR) and applicable Bulgarian law.</p>
            <h3 className="font-semibold text-[#111] mb-2">Lawful basis for processing</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Contract performance:</strong> bookings, client communications, invoicing, and service delivery.</li>
              <li><strong>Legitimate interest:</strong> operational analytics, security logging, and service improvement.</li>
              <li><strong>Consent:</strong> optional marketing communications, non-essential cookies. Consent can be withdrawn at any time.</li>
            </ul>
            <h3 className="font-semibold text-[#111] mb-2">Data minimization</h3>
            <p>We collect only the personal data strictly necessary to perform the requested service. Account, booking, and document data are limited to operational fields required for delivery.</p>
            <h3 className="font-semibold text-[#111] mb-2">Retention periods</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Account data: retained for 12 months after last activity, then eligible for deletion.</li>
              <li>Booking data: retained for 36 months, unless a longer statutory period applies.</li>
              <li>Document metadata and audit logs: retained for 24 months.</li>
              <li>Support tickets / chat logs: retained for 12 months.</li>
            </ul>
            <h3 className="font-semibold text-[#111] mb-2">Your rights</h3>
            <p>You may request access, correction, restriction, portability, or deletion of your personal data. To exercise any of these rights, email <a href="mailto:hello@vancoresys.com" className="text-[#991930] hover:underline">hello@vancoresys.com</a> or use the contact form on our <a href="/contact" className="text-[#991930] hover:underline">Contact page</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">Data Processing</h2>
            <p className="mb-3">We work with processors that support our ability to deliver the Service securely and reliably. All listed processors operate under data processing terms consistent with GDPR Article 28.</p>
            <h3 className="font-semibold text-[#111] mb-2">Processors</h3>
            <ul className="list-disc pl-6 space-y-2 mb-2">
              <li><strong>Supabase</strong> — authentication and database services, EU region.</li>
              <li><strong>Vercel</strong> — frontend hosting and edge delivery.</li>
              <li><strong>DigitalOcean</strong> — backend API hosting and file storage, Frankfurt region.</li>
            </ul>
            <p>We maintain Data Processing Agreements with these providers where available. Subprocessor lists are reviewed periodically.</p>
            <h3 className="font-semibold text-[#111] mb-2 mt-4">Data residency</h3>
            <p>Primary data processing is performed within the EU. Authentication and database operations are hosted in the EU region; backend storage is hosted in Frankfurt.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">Security</h2>
            <p className="mb-3">We design and operate our systems using established security practices. No method of transmission or storage is 100% secure, but we apply layered controls to reduce risk.</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Encryption in transit:</strong> All external connections use TLS 1.2 or higher.</li>
              <li><strong>Authentication:</strong> JWT-based authentication for API and portal access. Optional role-based access control for team environments.</li>
              <li><strong>Access control:</strong> Scoped access for authenticated users; administrative actions require authorization.</li>
              <li><strong>Audit logging:</strong> Administrative actions, booking changes, and document interactions are logged with timestamp, actor, and action type.</li>
              <li><strong>Backup and recovery:</strong> System backups are stored according to retention settings. Backup integrity is verified periodically to support restoration where feasible.</li>
              <li><strong>Security headers:</strong> The site uses security headers including HSTS, CSP, and X-Frame-Options where applicable by deployment layer.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">Cookies</h2>
            <p>We use cookies and similar technologies to operate the Service, remember authentication, support analytics, and deliver technical functionality. Marketing cookies are only used with explicit consent. For details, see our <a href="/cookies" className="text-[#991930] hover:underline">Cookie Policy</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">Children’s Privacy</h2>
            <p>The Service is not directed to individuals under 16. We do not knowingly collect personal data from children under 16.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">Changes to This Page</h2>
            <p>We may update this Legal & Compliance page when our practices, processors, or technical controls change. Updated content will be reflected by the “Last updated” date.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111] mb-3">Contact</h2>
            <p>For legal, privacy, or compliance questions, contact us at <a href="mailto:hello@vancoresys.com" className="text-[#991930] hover:underline">hello@vancoresys.com</a> or via our <a href="/contact" className="text-[#991930] hover:underline">Contact page</a>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
