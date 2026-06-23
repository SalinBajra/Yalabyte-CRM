import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { navigateTo } from '../utils/routes.js';

export default function DemoLauncher({ project, className = '', children }) {
  const [isLaunching, setIsLaunching] = useState(false);
  const destination = `/portfolio/${project.slug}`;

  useEffect(() => {
    if (!isLaunching) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => navigateTo(destination), 2400);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [destination, isLaunching]);

  const launchNow = () => navigateTo(destination);

  return (
    <>
      <button type="button" onClick={() => setIsLaunching(true)} className={className}>
        {children}
      </button>
      {isLaunching && createPortal(
        <div className="demo-launcher fixed inset-0 z-[100] overflow-hidden bg-[#070716] text-white" role="dialog" aria-modal="true" aria-label={`Launching ${project.title}`}>
          <img src={project.image} alt="" className="demo-launcher-image absolute inset-0 h-full w-full object-cover opacity-25" aria-hidden="true" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,7,22,0.98)_0%,rgba(7,7,22,0.88)_48%,rgba(7,7,22,0.45)_100%)]" />
          <div className="demo-launcher-grid absolute inset-0 opacity-30" />

          <div className="relative mx-auto flex min-h-full max-w-7xl flex-col justify-between px-5 py-7 sm:px-8 sm:py-10">
            <div className="flex items-center justify-between border-b border-white/15 pb-5">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyanbrand-300">YalaByte · Website demo</p>
              <button type="button" onClick={() => setIsLaunching(false)} className="text-xs font-bold uppercase tracking-[0.16em] text-white/55 transition hover:text-white">Cancel</button>
            </div>

            <div className="demo-launcher-copy max-w-3xl py-16">
              <div className="mb-7 flex items-center gap-2" role="status" aria-label={`Loading ${project.title}`}>
                <span className="demo-launcher-spinner h-5 w-5 rounded-full border border-white/20 border-t-cyanbrand-300" />
                <span className="demo-launcher-loader-dot h-1 w-1 rounded-full bg-white/35" />
                <span className="demo-launcher-loader-dot h-1 w-1 rounded-full bg-white/35" />
                <span className="demo-launcher-loader-dot h-1 w-1 rounded-full bg-white/35" />
              </div>
              <p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: project.accent }}>{project.category}</p>
              <h2 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-7xl lg:text-8xl">
                Opening {project.title}.
              </h2>
              <p className="mt-7 max-w-xl text-base leading-8 text-white/65 sm:text-lg">
                Explore the pages, navigation, content, and inquiry flow in this complete website demo.
              </p>
            </div>

            <div className="border-t border-white/15 pt-5">
              <div className="demo-launcher-track h-px overflow-hidden bg-white/15"><div className="demo-launcher-progress h-full bg-cyanbrand-300" /></div>
              <div className="mt-5 flex items-center justify-between gap-5">
                <p className="text-xs font-bold uppercase tracking-[0.17em] text-white/45">Opening {project.title}</p>
                <button type="button" onClick={launchNow} className="text-xs font-black uppercase tracking-[0.16em] text-white transition hover:text-cyanbrand-300">Enter now ↗</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
