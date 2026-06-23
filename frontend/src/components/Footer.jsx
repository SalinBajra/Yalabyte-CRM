import { services } from '../data/siteData.js';
import BrandLogo from './BrandLogo.jsx';
import { navigateTo, routes } from '../utils/routes.js';
import { whatsappUrl } from './ContactShortcuts.jsx';

function FooterLink({ to, children }) {
  return (
    <a
      href={to}
      onClick={(event) => {
        event.preventDefault();
        navigateTo(to);
      }}
      className="transition hover:text-navy-950"
    >
      {children}
    </a>
  );
}

function SocialLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={children}
      className="inline-grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-700 transition hover:border-cyanbrand-500 hover:bg-white hover:text-navy-950"
    >
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
        <circle cx="17" cy="7" r="1.1" fill="currentColor" />
      </svg>
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="bg-slate-100 px-5 py-12 text-navy-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_0.7fr_1fr_0.8fr]">
        <div>
          <BrandLogo />
          <p className="mt-5 max-w-sm text-sm leading-7 text-slate-600">
            Focused websites and digital tools for service businesses and growing teams.
          </p>
        </div>
        <div>
          <p className="font-semibold">Quick links</p>
          <div className="mt-4 grid gap-3 text-sm text-slate-600">
            {routes.map((route) => (
              <FooterLink key={route.path} to={route.path}>{route.label}</FooterLink>
            ))}
          </div>
        </div>
        <div>
          <p className="font-semibold">Services</p>
          <div className="mt-4 grid gap-3 text-sm text-slate-600">
            {services.slice(0, 5).map((service) => (
              <FooterLink key={service.title} to="/services">{service.title}</FooterLink>
            ))}
          </div>
        </div>
        <div>
          <p className="font-semibold">Contact</p>
          <a className="mt-4 block text-sm leading-7 text-slate-600 transition hover:text-navy-950" href="mailto:info@yalabyte.com">info@yalabyte.com</a>
          <p className="text-sm leading-7 text-slate-600">Business inquiries and project consultations</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <SocialLink href="https://www.instagram.com/yalabyte/">Instagram</SocialLink>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="inline-grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-700 transition hover:border-[#25D366] hover:bg-white hover:text-[#1aaa50]"
            >
              <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2a9.84 9.84 0 0 0-8.51 14.77L2 22l5.38-1.49A9.98 9.98 0 0 0 12.04 22 9.96 9.96 0 0 0 22 12.04 9.96 9.96 0 0 0 12.04 2Zm0 18.32a8.24 8.24 0 0 1-4.2-1.15l-.3-.18-3.2.89.85-3.12-.2-.32a8.2 8.2 0 0 1-1.27-4.4 8.32 8.32 0 1 1 8.32 8.28Zm4.56-6.23c-.25-.13-1.48-.73-1.71-.81-.23-.09-.4-.13-.57.12-.17.25-.65.82-.8.99-.15.17-.3.19-.55.06-.25-.12-1.06-.39-2.01-1.24a7.53 7.53 0 0 1-1.39-1.73c-.15-.25-.02-.38.11-.5.11-.11.25-.29.38-.43.12-.15.16-.25.25-.42.08-.17.04-.32-.02-.44-.06-.13-.57-1.38-.78-1.89-.21-.5-.42-.43-.57-.44h-.49c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.12.16 1.78 2.71 4.3 3.8.6.26 1.07.41 1.44.52.6.19 1.15.16 1.58.1.48-.08 1.48-.61 1.69-1.19.21-.59.21-1.09.15-1.19-.06-.11-.23-.17-.48-.29Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-slate-200 pt-6 text-sm text-slate-500">
        &copy; {new Date().getFullYear()} YalaByte. All rights reserved.
      </div>
    </footer>
  );
}
