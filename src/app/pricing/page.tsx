'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('vancore_client_token');
    if (!token) { setUser(null); setLoading(false); return; }
    fetch('/api/auth/profile', {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handlePlanClick = (planId: string) => {
    router.push(`/contact?plan=${planId}`);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Pricing</h1>
            <p className="text-lg text-[#9a9a9a] max-w-2xl mx-auto">Choose the plan that fits your business. No hidden fees, cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: 'payg', name: 'Pay-As-You-Go', price: '€25', period: 'one-time', features: ['500 AI questions', 'No monthly commitment', 'Valid for 3 months', 'Basic support'], highlighted: false },
              { id: 'professional', name: 'Professional', price: '€49/mo', period: 'billed monthly', features: ['Unlimited AI questions', 'Monthly business report', 'Client portal access', 'Priority support'], highlighted: true },
              { id: 'business', name: 'Business', price: '€99/mo', period: 'billed monthly', features: ['Everything in Professional', 'Weekly auto-analysis', '2 human consultant calls/month', 'Growth plan', 'API access'], highlighted: false },
            ].map((plan) => (
              <div key={plan.id} className={`p-6 rounded-2xl border ${plan.highlighted ? 'border-[#991930] bg-[#991930]/10' : 'border-white/10 bg-[#111]'}`}>
                {plan.highlighted && <div className="text-xs font-semibold text-[#991930] uppercase tracking-wider mb-3">Most Popular</div>}
                <div className="text-sm text-[#9a9a9a] mb-2">{plan.period}</div>
                <div className="text-4xl font-bold text-white mb-6">{plan.price}</div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, i) => (
                    <li key={i} className="text-sm text-[#9a9a9a]">✓ {f}</li>
                  ))}
                </ul>
                <button onClick={() => handlePlanClick(plan.id)} className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${plan.highlighted ? 'bg-[#991930] text-white hover:bg-[#a83d1f]' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}>
                  Book a call
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
