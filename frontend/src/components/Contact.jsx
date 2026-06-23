import { useState } from 'react';

const initialState = {
  name: '',
  email: '',
  phone: '',
  company: '',
  service: '',
  message: ''
};

const serviceOptions = [
  'Company Website',
  'Website Redesign',
  'Custom Web Applications',
  'UX and Interface Design',
  'SEO-ready Website Setup',
  'Maintenance and Support',
  'Digital Consulting'
];

export default function Contact() {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const validate = () => {
    if (!form.name.trim() || !form.email.trim() || !form.service.trim() || !form.message.trim()) {
      return 'Please complete your name, email, service, and message.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return 'Please enter a valid email address.';
    }
    if (form.message.trim().length < 20) {
      return 'Please share a little more context so we can respond properly.';
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setStatus({ type: 'error', message: validationError });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const configuredApiUrl = import.meta.env.VITE_API_URL || '';
      const isLocalApiUrl = configuredApiUrl.includes('localhost') || configuredApiUrl.includes('127.0.0.1');
      const apiUrl = configuredApiUrl && !(import.meta.env.PROD && isLocalApiUrl)
        ? configuredApiUrl
        : import.meta.env.DEV
          ? 'http://localhost:8000'
          : '';
      const response = await fetch(`${apiUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.detail || 'Unable to send message right now.');
      }

      setStatus({ type: 'success', message: result.message });
      setForm(initialState);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Unable to send your inquiry right now. Please email us directly at info@yalabyte.com.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-navy-950 px-5 py-24 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyanbrand-400">Contact</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-normal text-white sm:text-4xl lg:text-5xl">
            Tell us what you are building. We will shape the next step.
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-300">
            Share your project details, timeline, and the kind of support you need. YalaByte will review your message and respond with a practical starting point.
          </p>
          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.06] p-6">
            <p className="font-semibold">Project inquiries</p>
            <a className="mt-3 block text-sm leading-7 text-cyanbrand-100 transition hover:text-white" href="mailto:info@yalabyte.com">info@yalabyte.com</a>
            <p className="text-sm leading-7 text-slate-300">Available for website, web app, and digital consulting inquiries.</p>
          </div>
        </div>
        <form className="rounded-lg border border-white/10 bg-white p-5 text-navy-950 shadow-soft sm:p-7" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-navy-950">
              Name
              <input className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyanbrand-500 focus:ring-4 focus:ring-cyanbrand-100" name="name" value={form.name} onChange={handleChange} autoComplete="name" />
            </label>
            <label className="text-sm font-semibold text-navy-950">
              Email
              <input className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyanbrand-500 focus:ring-4 focus:ring-cyanbrand-100" name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" />
            </label>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-navy-950">
              Contact number
              <input className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyanbrand-500 focus:ring-4 focus:ring-cyanbrand-100" name="phone" value={form.phone} onChange={handleChange} autoComplete="tel" inputMode="tel" placeholder="+977 98XXXXXXXX" />
            </label>
            <label className="text-sm font-semibold text-navy-950">
              Company
              <input className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyanbrand-500 focus:ring-4 focus:ring-cyanbrand-100" name="company" value={form.company} onChange={handleChange} autoComplete="organization" />
            </label>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-navy-950">
              Service needed
              <select className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyanbrand-500 focus:ring-4 focus:ring-cyanbrand-100" name="service" value={form.service} onChange={handleChange}>
                <option value="">Select a service</option>
                {serviceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-5 block text-sm font-semibold text-navy-950">
            Message
            <textarea className="mt-2 min-h-36 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyanbrand-500 focus:ring-4 focus:ring-cyanbrand-100" name="message" value={form.message} onChange={handleChange} />
          </label>
          {status.message ? (
            <p className={`mt-5 rounded-lg px-4 py-3 text-sm font-medium ${status.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`} role="status">
              {status.message}
            </p>
          ) : null}
          <button className="mt-6 w-full rounded-lg bg-cyanbrand-500 px-6 py-3.5 text-sm font-bold text-navy-950 transition hover:bg-cyanbrand-400 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Project Inquiry'}
          </button>
        </form>
      </div>
    </section>
  );
}
