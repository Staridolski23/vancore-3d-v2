import VeraReception from '@/components/VeraReception';
import { redirect } from 'next/navigation';
export default async function AIAnalystPage({ searchParams }: { searchParams: Promise<{ conversation?: string }> }) {
 const query = await searchParams;
 if (typeof query.conversation === 'string' && /^[0-9a-f-]{36}$/i.test(query.conversation)) redirect('/vera-history?conversation=' + encodeURIComponent(query.conversation));
 return <main className="min-h-screen bg-white border-t border-[#e5e5e5]"><div className="max-w-3xl mx-auto px-5 sm:px-6 py-14 sm:py-20"><h1 className="font-display text-4xl md:text-5xl text-[#111] mb-4">Meet Vera.</h1><p className="text-[#555] text-base leading-relaxed mb-8">Your first conversation with VANCORE. Prepare an enquiry without creating an account.</p><VeraReception /></div></main>;
}
