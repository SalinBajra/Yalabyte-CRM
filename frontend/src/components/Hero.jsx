import { useRef } from 'react';
import { navigateTo } from '../utils/routes.js';

const capabilities = ['Business Websites', 'Web Platforms', 'Launch Support'];

export default function Hero() {
  const visualRef = useRef(null);

  const handlePointerMove = (event) => {
    if (!visualRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    visualRef.current.style.setProperty('--parallax-x', `${x * 14}px`);
    visualRef.current.style.setProperty('--parallax-y', `${y * 10}px`);
  };

  const resetPointer = () => {
    visualRef.current?.style.setProperty('--parallax-x', '0px');
    visualRef.current?.style.setProperty('--parallax-y', '0px');
  };

  return (
    <section id="home" className="studio-hero" onPointerMove={handlePointerMove} onPointerLeave={resetPointer}>
      <div className="studio-hero__scene" aria-hidden="true">
        <div className="studio-hero__grid" />
        <div className="studio-hero__beam" />
        <div className="studio-hero__particles">
          {Array.from({ length: 10 }, (_, index) => <i key={index} />)}
        </div>
      </div>

      <div ref={visualRef} className="studio-visual" aria-hidden="true">
        <div className="studio-visual__float">
          <div className="studio-visual__halo" />
          <img
            src="/images/yalabyte-hero-digital-system.png"
            alt=""
            className="studio-visual__image"
            loading="eager"
            fetchPriority="high"
          />
          <div className="studio-visual__light" />
        </div>
      </div>

      <div className="studio-hero__fade" aria-hidden="true" />

      <div className="studio-hero__inner">
        <div className="studio-hero__copy">
          <h1 className="studio-hero__title">
            DESIGN.<br />BUILD.<br /><em>LAUNCH.</em>
          </h1>
          <div className="studio-hero__intro-row">
            <p>Premium business websites and custom web applications, designed and developed by YalaByte in Nepal.</p>
            <div className="studio-hero__actions">
              <button onClick={() => navigateTo('/portfolio')} className="studio-button studio-button--outline">View Work</button>
              <button onClick={() => navigateTo('/contact')} className="studio-button studio-button--solid">Contact</button>
            </div>
          </div>
        </div>

        <div className="studio-hero__strip">
          <span className="studio-hero__strip-label">Built for what’s next</span>
          <div className="studio-hero__capabilities">
            {capabilities.map((item, index) => <span key={item}><b>0{index + 1}</b>{item}</span>)}
          </div>
          <a href="#services" onClick={(event) => {
            event.preventDefault();
            document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' });
          }}>Explore <i>↓</i></a>
        </div>
      </div>
    </section>
  );
}
