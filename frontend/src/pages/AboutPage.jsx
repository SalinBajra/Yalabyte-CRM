import { navigateTo } from '../utils/routes.js';
import usePageReveal from '../hooks/usePageReveal.js';

const principles = [
  ['01', 'Clarity before complexity', 'The goal, audience, and content come first. Technology follows the job it needs to do.'],
  ['02', 'One connected process', 'Strategy, design, and development stay together, keeping decisions fast and the outcome coherent.'],
  ['03', 'Built for real use', 'Every page is considered across devices, with real content and practical business needs in mind.']
];

const responsibilities = [
  ['Direction', 'Discovery, scope, content structure, and the plan that keeps the project focused.'],
  ['Experience', 'Visual design, responsive layouts, and interactions that feel natural to use.'],
  ['Delivery', 'Development, quality checks, deployment, handover, and support after launch.']
];

export default function AboutPage() {
  usePageReveal();

  return (
    <>
      <section className="about-page-hero">
        <div className="about-page-grid" aria-hidden="true" />
        <div className="studio-container page-reveal">
          <p className="inner-label inner-label--cyan">About YalaByte</p>
          <div className="about-page-hero__layout">
            <h1>Based in Nepal.<br /><span>Built for everywhere.</span></h1>
            <p>YalaByte is a website development studio creating premium business websites and custom web applications for ambitious teams in Nepal and worldwide.</p>
          </div>
        </div>
      </section>

      <section className="about-story-section">
        <div className="studio-container about-story-grid">
          <p className="page-reveal inner-label">Our approach / 01</p>
          <div className="page-reveal">
            <h2>Small enough to stay close.<br />Experienced enough to deliver.</h2>
            <p>We keep the working relationship direct from the first conversation through launch. Fewer handoffs mean better context, clearer decisions, and a website that feels considered as one complete experience.</p>
          </div>
        </div>
      </section>

      <section className="about-principles-section">
        <div className="studio-container">
          <div className="page-reveal inner-section-heading inner-section-heading--compact"><p>What guides us / 02</p><h2>Simple principles.<br />Better work.</h2></div>
          <div className="about-principles">
            {principles.map(([number, title, text], index) => (
              <article className="page-reveal" style={{ '--page-delay': `${index * 80}ms` }} key={title}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-team-section">
        <div className="studio-container about-team-grid">
          <div className="page-reveal"><p className="inner-label inner-label--cyan">One connected team / 03</p><h2>The right responsibilities, covered from start to finish.</h2></div>
          <div className="about-team-list">
            {responsibilities.map(([title, text], index) => (
              <article className="page-reveal" style={{ '--page-delay': `${index * 70}ms` }} key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></article>
            ))}
          </div>
        </div>
      </section>

      <section className="inner-page-cta inner-page-cta--light">
        <div className="studio-container page-reveal"><div><p>From Nepal to worldwide</p><h2>Let’s make something useful.</h2></div><button onClick={() => navigateTo('/contact')}>Start a Conversation <span>↗</span></button></div>
      </section>
    </>
  );
}
