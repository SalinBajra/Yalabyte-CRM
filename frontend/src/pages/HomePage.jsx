import { useEffect } from 'react';
import Hero from '../components/Hero.jsx';
import { navigateTo } from '../utils/routes.js';

const services = [
  ['01', 'Business Websites', 'Distinctive, responsive websites that communicate your value clearly and turn attention into action.'],
  ['02', 'Custom Web Applications', 'Purpose-built portals, platforms, and digital tools shaped around your users and business.'],
  ['03', 'UI/UX Design', 'Thoughtful structure and polished interfaces that make every interaction feel simple and intentional.'],
  ['04', 'SEO & Launch Support', 'Performance, search foundations, deployment, and practical support for a confident launch.']
];

const process = [
  ['01', 'Discover', 'We clarify the business, audience, content, and outcomes your website needs to deliver.'],
  ['02', 'Design', 'We shape the visual direction, page structure, and user experience around real content.'],
  ['03', 'Develop', 'We build a fast, responsive experience with clean implementation and careful quality control.'],
  ['04', 'Launch', 'We test, deploy, connect the essentials, and stay close after your website goes live.']
];

export default function HomePage() {
  useEffect(() => {
    const elements = document.querySelectorAll('.home-reveal');
    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -48px' });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Hero />

      <section id="services" className="studio-section studio-services">
        <div className="studio-container">
          <div className="home-reveal studio-heading">
            <p>Services / 01</p>
            <h2>Web experiences built with clarity, character, and purpose.</h2>
          </div>
          <div className="studio-service-list">
            {services.map(([number, title, text], index) => (
              <article key={title} className="home-reveal studio-service" style={{ '--reveal-delay': `${index * 65}ms` }}>
                <span>{number}</span><h3>{title}</h3><p>{text}</p><i aria-hidden="true">↗</i>
              </article>
            ))}
          </div>
          <button className="home-reveal studio-text-link" onClick={() => navigateTo('/services')}>Explore all services <span>→</span></button>
        </div>
      </section>

      <section className="studio-section studio-process">
        <div className="studio-container studio-process__grid">
          <div className="home-reveal studio-heading studio-heading--compact">
            <p>Process / 02</p>
            <h2>From first conversation to confident launch.</h2>
          </div>
          <div className="studio-process__steps">
            {process.map(([number, title, text], index) => (
              <article key={title} className="home-reveal studio-step" style={{ '--reveal-delay': `${index * 65}ms` }}>
                <span>{number}</span><div><h3>{title}</h3><p>{text}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="studio-about">
        <div className="studio-container home-reveal studio-about__grid">
          <p>About YalaByte / 03</p>
          <div>
            <h2>Based in Nepal.<br />Built for everywhere.</h2>
            <p>YalaByte builds premium websites and web platforms for ambitious businesses—from Nepal to clients worldwide. We bring strategy, design, and development together to create digital work with lasting value.</p>
            <button className="studio-text-link studio-text-link--light" onClick={() => navigateTo('/about')}>Meet YalaByte <span>→</span></button>
          </div>
        </div>
      </section>

      <section className="studio-contact-cta">
        <div className="studio-contact-cta__glow" aria-hidden="true" />
        <div className="studio-container home-reveal">
          <p>Have a project in mind?</p>
          <div><h2>Ready to build<br />your website?</h2><button onClick={() => navigateTo('/contact')}>Discuss a project <span>↗</span></button></div>
        </div>
      </section>
    </>
  );
}
