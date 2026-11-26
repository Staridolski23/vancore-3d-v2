import VeraWorkspace from '@/components/VeraWorkspace';
export default function VeraHistoryPage() {
  return <main className="min-h-screen bg-[#0a0a0a] px-5 py-16"><div className="max-w-4xl mx-auto"><h1 className="text-3xl text-white mb-4">Your saved Vera history</h1><p className="text-[#dedede] mb-6">Automated analysis is temporarily paused. Your saved conversations and reports remain available only through your verified account. <a className="underline" href="/ai-analyst">Send a new enquiry</a></p><VeraWorkspace /></div></main>;
}
