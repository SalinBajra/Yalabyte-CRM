import PageHero from '../components/PageHero.jsx';
import { navigateTo } from '../utils/routes.js';
import usePageReveal from '../hooks/usePageReveal.js';

const coreServices = [
  ['01', 'Business Websites', 'Premium, responsive websites that make your business easier to understand, trust, and contact.', 'Strategy · Design · Development'],
  ['02', 'Custom Web Applications', 'Focused portals, platforms, booking flows, and internal tools built around the way your business works.', 'Product UX · Frontend · Backend'],
  ['03', 'UI/UX Design', 'Clear page structures and polished interfaces that turn complex information into simple journeys.', 'Wireframes · Interface systems · Prototypes'],
  ['04', 'SEO & Launch Support', 'Technical foundations, performance checks, deployment, and post-launch care handled properly.', 'SEO setup · Deployment · Support']
];

const launchSupport = [
  'Website redesigns', 'Domain and hosting setup', 'Analytics and search tools',
  'Contact and inquiry flows', 'Content updates', 'Ongoing maintenance'
];

export default function ServicesPage() {
  usePageReveal();

  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Everything your website needs. Nothing it doesn’t."
        text="Strategy, design, development, and launch support—brought together around a clear business goal."
      />

      <section className="service-detail-section">
        <div className="studio-container">
          <div className="page-reveal inner-section-heading">
            <p>Core capabilities / 01</p>
            <h2>Focused expertise,<br />from idea to launch.</h2>
          </div>
          <div className="service-detail-list">
            {coreServices.map(([number, title, text, scope], index) => (
              <article className="page-reveal service-detail-row" style={{ '--page-delay': `${index * 70}ms` }} key={title}>
                <span>{number}</span>
                <h3>{title}</h3>
                <div><p>{text}</p><small>{scope}</small></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="service-support-section">
        <div className="studio-container service-support-grid">
          <div className="page-reveal">
            <p className="inner-label">Practical support / 02</p>
            <h2>The details that make launch feel effortless.</h2>
            <p className="service-support-intro">We can handle the surrounding technical work too, so your team is not left connecting the final pieces alone.</p>
          </div>
          <div className="service-support-list">
            {launchSupport.map((item, index) => <p className="page-reveal" style={{ '--page-delay': `${index * 55}ms` }} key={item}><span>0{index + 1}</span>{item}</p>)}
          </div>
        </div>
      </section>

      <section className="inner-page-cta">
        <div className="studio-container page-reveal"><div><p>Have a project in mind?</p><h2>Let’s build it properly.</h2></div><button onClick={() => navigateTo('/contact')}>Discuss a Project <span>↗</span></button></div>
      </section>
    </>
  );
}
