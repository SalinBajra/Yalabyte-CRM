import PageHero from '../components/PageHero.jsx';
import Portfolio from '../components/Portfolio.jsx';
import { portfolioDemos } from '../data/portfolioDemos.js';
import DemoLauncher from '../components/DemoLauncher.jsx';

export default function PortfolioPage() {
  return (
    <>
      <PageHero
        eyebrow="Portfolio"
        title="Live Demos, ready to explore"
        text="Browse complete Travel, Café, and Logistics Live Demos with realistic pages, content, and navigation."
        actions={portfolioDemos.map((demo) => (
          <DemoLauncher key={demo.slug} project={demo} className="rounded-lg border border-white/20 px-4 py-2.5 text-sm font-bold text-white transition hover:border-cyanbrand-400 hover:bg-white/[0.08]">
            {demo.title}
          </DemoLauncher>
        ))}
      />
      <Portfolio showIntro={false} />
    </>
  );
}
