import { useEffect, useState } from 'react';

const phoneNumber = '+9779705501969';
const displayPhoneNumber = '+977 9705501969';
const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}`;

export { displayPhoneNumber, phoneNumber, whatsappUrl };

export default function ContactShortcuts() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let animationFrame;

    const checkPageEnd = () => {
      const distanceFromBottom =
        document.documentElement.scrollHeight - window.innerHeight - window.scrollY;

      setIsVisible(distanceFromBottom <= 180);
    };

    const handleScroll = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(checkPageEnd);
    };

    checkPageEnd();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <div
      aria-hidden={!isVisible}
      className={`fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 transition-all duration-500 ease-out motion-reduce:transition-none sm:bottom-6 sm:right-6 ${
        isVisible
          ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none translate-y-8 scale-90 opacity-0'
      }`}
    >
      <a
        href={`tel:${phoneNumber}`}
        tabIndex={isVisible ? 0 : -1}
        aria-label={`Call YalaByte at ${displayPhoneNumber}`}
        title={`Call ${displayPhoneNumber}`}
        className={`group flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 text-navy-950 shadow-lg transition-all duration-500 motion-reduce:transition-none hover:-translate-y-0.5 hover:border-cyanbrand-400 hover:bg-slate-50 ${
          isVisible ? 'translate-y-0 opacity-100 delay-100' : 'translate-y-3 opacity-0 delay-0'
        }`}
      >
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path d="M8.7 3.8 10.3 7c.3.6.2 1.3-.3 1.8L8.8 10c1.1 2.3 2.9 4.1 5.2 5.2l1.2-1.2c.5-.5 1.2-.6 1.8-.3l3.2 1.6c.7.3 1 1 .8 1.7l-.5 2.3c-.2.8-.9 1.4-1.7 1.4C10.2 20.7 3.3 13.8 3.3 5.2c0-.8.6-1.5 1.4-1.7L7 3c.7-.2 1.4.1 1.7.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="hidden text-sm font-semibold sm:inline">Call us</span>
      </a>
      <a
        href={whatsappUrl}
        tabIndex={isVisible ? 0 : -1}
        target="_blank"
        rel="noreferrer"
        aria-label={`Chat with YalaByte on WhatsApp at ${displayPhoneNumber}`}
        title="Chat with us on WhatsApp"
        className={`group flex h-14 items-center gap-3 rounded-full bg-[#25D366] px-4 text-white shadow-lg transition-all duration-500 motion-reduce:transition-none hover:-translate-y-0.5 hover:bg-[#20bd5a] ${
          isVisible ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-3 opacity-0 delay-0'
        }`}
      >
        <svg aria-hidden="true" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.04 2a9.84 9.84 0 0 0-8.51 14.77L2 22l5.38-1.49A9.98 9.98 0 0 0 12.04 22 9.96 9.96 0 0 0 22 12.04 9.96 9.96 0 0 0 12.04 2Zm0 18.32a8.24 8.24 0 0 1-4.2-1.15l-.3-.18-3.2.89.85-3.12-.2-.32a8.2 8.2 0 0 1-1.27-4.4 8.32 8.32 0 1 1 8.32 8.28Zm4.56-6.23c-.25-.13-1.48-.73-1.71-.81-.23-.09-.4-.13-.57.12-.17.25-.65.82-.8.99-.15.17-.3.19-.55.06-.25-.12-1.06-.39-2.01-1.24a7.53 7.53 0 0 1-1.39-1.73c-.15-.25-.02-.38.11-.5.11-.11.25-.29.38-.43.12-.15.16-.25.25-.42.08-.17.04-.32-.02-.44-.06-.13-.57-1.38-.78-1.89-.21-.5-.42-.43-.57-.44h-.49c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.12.16 1.78 2.71 4.3 3.8.6.26 1.07.41 1.44.52.6.19 1.15.16 1.58.1.48-.08 1.48-.61 1.69-1.19.21-.59.21-1.09.15-1.19-.06-.11-.23-.17-.48-.29Z" />
        </svg>
        <span className="text-sm font-bold">WhatsApp</span>
      </a>
    </div>
  );
}
