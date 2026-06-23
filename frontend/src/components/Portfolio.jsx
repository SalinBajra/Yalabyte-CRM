import { portfolioDemos } from '../data/portfolioDemos.js';
import { navigateTo } from '../utils/routes.js';
import DemoLauncher from './DemoLauncher.jsx';

function PortfolioCard({ project, index }) {
  return (
    <article className="group grid gap-0 overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#0d1016] lg:grid-cols-[0.95fr_1.05fr]">
      <div className={`relative min-h-[420px] overflow-hidden bg-black ${index % 2 ? 'lg:order-2' : ''}`}>
        <img src={project.image} alt={`${project.title} Live Demo preview`} className="absolute inset-0 h-full w-full object-cover opacity-85 transition duration-700 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 grid gap-3 sm:grid-cols-3">
          {project.stats.map(([value, label]) => (
            <div key={label} className="rounded-xl border border-white/10 bg-black/55 p-4 backdrop-blur">
              <p className="text-xl font-black text-white">{value}</p>
              <p className="mt-1 text-[11px] font-semibold text-white/70">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-center p-7 sm:p-10">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyanbrand-300">{project.category}</p>
        <h3 className="mt-5 max-w-xl text-4xl font-semibold leading-tight text-white sm:text-5xl">{project.title}</h3>
        <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">{project.summary}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {project.features.map((item) => (
            <div key={item} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm font-semibold text-slate-200">
              {item}
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <DemoLauncher project={project} className="rounded-xl bg-cyanbrand-400 px-5 py-3 text-sm font-black text-navy-950 transition hover:bg-white">
            View Live Demo
          </DemoLauncher>
          <button onClick={() => navigateTo('/contact')} className="rounded-xl border border-white/25 px-5 py-3 text-sm font-black text-white transition hover:border-cyanbrand-300 hover:text-cyanbrand-200">
            Request similar site
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Portfolio({ showIntro = true }) {
  return (
    <section className={`bg-[#111315] px-5 text-white sm:px-6 lg:px-8 ${showIntro ? 'py-24' : 'py-16 sm:py-20 lg:py-24'}`}>
      <div className="mx-auto max-w-7xl">
        {showIntro ? <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyanbrand-300">Portfolio</p>
          <h2 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-normal sm:text-6xl lg:text-7xl">
            Live Demos with real user flow
          </h2>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-300">
            Open each Live Demo as a complete, standalone website with realistic pages, content, navigation, and conversion paths.
          </p>
        </div> : null}
        <div className={`${showIntro ? 'mt-16' : ''} grid gap-8`}>
          {portfolioDemos.map((project, index) => (
            <PortfolioCard key={project.slug} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
