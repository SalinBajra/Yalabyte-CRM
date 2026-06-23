import { portfolioDemos } from '../data/portfolioDemos.js';
import { navigateTo } from '../utils/routes.js';

function DemoBar({ name }) {
  return (
    <div className="sticky top-0 z-[60] border-b border-white/10 bg-[#07101a]/95 text-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <button onClick={() => navigateTo('/portfolio')} className="text-sm font-bold text-slate-300 transition hover:text-white">
          <span aria-hidden="true">←</span> Portfolio
        </button>
        <p className="hidden text-xs font-bold uppercase tracking-[0.18em] text-slate-400 sm:block">Live Demo · {name}</p>
        <button onClick={() => navigateTo('/contact')} className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#07101a] transition hover:bg-cyanbrand-300 sm:text-sm">
          Request this website
        </button>
      </div>
    </div>
  );
}

function ArrowIcon() {
  return <span aria-hidden="true" className="ml-2">↗</span>;
}

function DemoLink({ to, className = '', children }) {
  return <a href={to} className={className} onClick={(event) => { event.preventDefault(); navigateTo(to); }}>{children}</a>;
}

const travelNav = [
  ['Journeys', 'journeys'], ['Destinations', 'destinations'], ['About', 'about'], ['Journal', 'journal']
];

function TravelHeader({ overlay = false }) {
  return (
    <header className={`${overlay ? 'absolute left-0 right-0 top-[53px] z-40 bg-transparent' : 'bg-[#17332d]'} text-white`}>
      <nav className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-y-4 px-5 py-5 sm:px-8 lg:flex-nowrap lg:px-12" aria-label="Aster Travels navigation">
        <DemoLink to="/portfolio/travel" className="text-xl font-black tracking-tight">ASTER<span className="text-[#f4b860]">.</span></DemoLink>
        <div className="order-3 flex w-full items-center gap-6 overflow-x-auto border-t border-white/10 pt-4 lg:order-none lg:w-auto lg:border-0 lg:pt-0">
          {travelNav.map(([label, path]) => <DemoLink key={path} to={`/portfolio/travel/${path}`} className="text-xs font-bold uppercase tracking-[0.17em] text-white/80 transition hover:text-white">{label}</DemoLink>)}
        </div>
        <DemoLink to="/portfolio/travel/inquire" className="rounded-full border border-white/50 px-5 py-2.5 text-xs font-black uppercase tracking-wider transition hover:bg-white hover:text-[#17332d]">Plan a trip</DemoLink>
      </nav>
    </header>
  );
}

function TravelFooter() {
  return <footer className="flex flex-col justify-between gap-5 bg-[#102823] px-6 py-8 text-sm text-white/60 sm:flex-row sm:px-12"><strong className="text-white">ASTER.</strong><span>Travel Live Demo by YalaByte</span><span>Instagram · Journal · Contact</span></footer>;
}

const travelPageContent = {
  journeys: {
    eyebrow: 'Curated journeys', title: 'Travel with room to wonder.', intro: 'Small-group and private journeys with thoughtful pacing, expert hosts, and places that stay with you.',
    items: [['Himalayan Light', '9 days · Nepal', 'High trails, village kitchens, and quiet mornings above the clouds.'], ['Desert & Stone', '7 days · Jordan', 'Ancient paths, Bedouin hospitality, and nights beneath open skies.'], ['The Atlantic Edge', '6 days · Portugal', 'Clifftop walks, fishing villages, and the generous food of the coast.'], ['Islands of the North', '8 days · Scotland', 'Wild shorelines, local whisky, and beautifully remote stays.']]
  },
  destinations: {
    eyebrow: 'Explore the world', title: 'Places with a story to tell.', intro: 'Browse our favorite regions, then let us shape the route, pace, and details around the way you like to travel.',
    items: [['Nepal', 'Asia · Mountains', 'Community-led trekking, heritage towns, and unforgettable high country.'], ['Jordan', 'Middle East · Culture', 'Desert landscapes, living history, and exceptional local guides.'], ['Portugal', 'Europe · Coast', 'Salt air, quiet villages, and seriously good tables.'], ['Scotland', 'Europe · Wilderness', 'Island roads, dramatic weather, and warm Highland welcomes.']]
  },
  journal: {
    eyebrow: 'Field notes', title: 'Stories from the road.', intro: 'Practical ideas, local voices, and the small details that help a destination come alive before you arrive.',
    items: [['A slower guide to Kathmandu', '8 min read · City guide', 'Courtyards, craft studios, and our favorite early-morning walks.'], ['What to pack for the high trail', '6 min read · Field guide', 'A simple, tested list for staying comfortable without overpacking.'], ['At the table in Amman', '5 min read · Food', 'The dishes, people, and generous rituals that define a Jordanian welcome.'], ['Why shoulder season wins', '4 min read · Travel well', 'Better light, fewer crowds, and more meaningful encounters.']]
  }
};

function TravelPage({ demo, page }) {
  if (page === 'about') {
    return <div className="bg-[#f4efe6] text-[#17332d]"><DemoBar name={demo.title} /><TravelHeader /><main><section className="mx-auto grid max-w-[1480px] gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:px-12 lg:py-32"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-[#b66f2e]">About Aster</p><h1 className="mt-6 font-serif text-6xl leading-tight sm:text-7xl">Travel should change your point of view.</h1></div><div className="text-lg leading-9 text-[#48645d]"><p>We started Aster to create the sort of journeys we could not find: intimate, intelligent, and connected to the people who make a place what it is.</p><p className="mt-6">Our team researches every route in person. We choose independent stays, work with local guides, and keep groups small enough for plans to stay flexible.</p></div></section><section className="grid bg-[#17332d] text-white md:grid-cols-3">{[['2018', 'Aster was founded'], ['14', 'local travel partners'], ['68%', 'returning travelers']].map(([value,label])=><div key={label} className="border-white/10 p-10 text-center md:border-r"><p className="font-serif text-5xl text-[#f4b860]">{value}</p><p className="mt-3 text-sm text-white/60">{label}</p></div>)}</section><section className="mx-auto max-w-5xl px-5 py-24 text-center sm:px-8"><p className="text-xs font-black uppercase tracking-[0.25em] text-[#b66f2e]">Our promise</p><h2 className="mt-6 font-serif text-5xl">Fewer checklists. More connection.</h2><p className="mx-auto mt-6 max-w-2xl text-lg leading-9 text-[#48645d]">Better travel supports local communities, respects the places we visit, and gives you the time to be fully there.</p></section></main><TravelFooter /></div>;
  }
  if (page === 'inquire') {
    return <div className="min-h-screen bg-[#f4efe6] text-[#17332d]"><DemoBar name={demo.title} /><TravelHeader /><main className="mx-auto grid max-w-[1300px] gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-12 lg:py-28"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-[#b66f2e]">Start a conversation</p><h1 className="mt-6 font-serif text-6xl leading-tight">Tell us where your mind is wandering.</h1><p className="mt-7 text-lg leading-8 text-[#48645d]">Share a few details and a travel designer will respond with thoughtful first ideas within two working days.</p></div><form className="grid gap-5 rounded-[2rem] bg-white p-6 shadow-xl sm:grid-cols-2 sm:p-10" onSubmit={(event)=>{event.preventDefault();navigateTo('/contact');}}>{['Your name','Email address','Where would you like to go?','Preferred travel dates','Number of travelers','Approximate budget'].map((field)=><label key={field} className="text-sm font-bold">{field}<input className="mt-2 w-full rounded-xl border border-[#17332d]/15 px-4 py-3 font-normal outline-none focus:border-[#b66f2e]" /></label>)}<label className="text-sm font-bold sm:col-span-2">What would make this trip special?<textarea className="mt-2 min-h-32 w-full rounded-xl border border-[#17332d]/15 px-4 py-3 font-normal outline-none focus:border-[#b66f2e]" /></label><button className="rounded-full bg-[#17332d] px-7 py-4 text-sm font-black text-white sm:col-span-2">Send trip inquiry</button></form></main><TravelFooter /></div>;
  }
  const content = travelPageContent[page] || travelPageContent.journeys;
  return <div className="bg-[#f4efe6] text-[#17332d]"><DemoBar name={demo.title} /><TravelHeader /><main><section className="bg-[#17332d] px-5 py-20 text-white sm:px-8 lg:px-12 lg:py-28"><div className="mx-auto max-w-[1480px]"><p className="text-xs font-black uppercase tracking-[0.25em] text-[#f4b860]">{content.eyebrow}</p><h1 className="mt-6 max-w-4xl font-serif text-6xl leading-tight sm:text-7xl">{content.title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">{content.intro}</p></div></section><section className="mx-auto grid max-w-[1480px] gap-6 px-5 py-20 sm:px-8 md:grid-cols-2 lg:px-12 lg:py-28">{content.items.map(([title,meta,text],index)=><article key={title} className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm"><div className="h-64 overflow-hidden"><img src={travelImages[index % travelImages.length]} alt={`${title} travel destination`} className="h-full w-full object-cover transition duration-700 hover:scale-105" /></div><div className="p-7"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#b66f2e]">{meta}</p><h2 className="mt-4 font-serif text-3xl">{title}</h2><p className="mt-3 leading-7 text-[#48645d]">{text}</p><DemoLink to="/portfolio/travel/inquire" className="mt-6 inline-block text-sm font-black">Explore this journey <ArrowIcon /></DemoLink></div></article>)}</section></main><TravelFooter /></div>;
}

const travelDestinations = [
  ['Himalayan Light', 'Nepal · 9 days', '/images/travel-nepal.png'],
  ['Desert & Stone', 'Jordan · 7 days', '/images/travel-jordan.png'],
  ['Wild Coastlines', 'Portugal · 6 days', '/images/travel-portugal.png']
];

const travelImages = [
  '/images/travel-nepal.png',
  '/images/travel-jordan.png',
  '/images/travel-portugal.png',
  '/images/travel-scotland.png'
];

const travelPackages = [
  { number: '01', title: 'The slow adventure', text: 'Small groups, thoughtful stays, and enough room for the unexpected.', meta: 'From $1,890 · 8 days' },
  { number: '02', title: 'Above the clouds', text: 'A guided mountain journey balanced with comfort and local connection.', meta: 'From $2,450 · 11 days' },
  { number: '03', title: 'Roads less taken', text: 'A private, flexible route for travelers who prefer their own rhythm.', meta: 'Custom itinerary' }
];

function TravelDemo({ demo, page }) {
  if (page !== 'home') return <TravelPage demo={demo} page={page} />;

  return (
    <div className="bg-[#f4efe6] text-[#17332d]">
      <DemoBar name={demo.title} />
      <TravelHeader overlay />

      <main id="top">
        <section className="relative flex min-h-[760px] items-end overflow-hidden sm:min-h-[820px]">
          <img src={demo.image} alt="Open road through red mountains" className="absolute inset-0 h-full w-full object-cover object-[50%_68%]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071d1a]/90 via-[#071d1a]/45 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071d1a]/80 via-transparent to-black/25" />
          <div className="relative mx-auto w-full max-w-[1480px] px-5 pb-20 pt-40 text-white sm:px-8 lg:px-12 lg:pb-28">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#f4b860]">Travel deeper · 2026 collection</p>
            <h1 className="mt-6 max-w-4xl font-serif text-6xl leading-[0.92] sm:text-7xl lg:text-[7.5rem]">Go where the story takes you.</h1>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <DemoLink to="/portfolio/travel/journeys" className="rounded-full bg-[#f4b860] px-7 py-4 text-sm font-black text-[#17332d] transition hover:bg-white">Explore journeys <ArrowIcon /></DemoLink>
              <p className="max-w-xs text-sm leading-6 text-white/75">Small-group journeys designed around place, people, and unrushed discovery.</p>
            </div>
          </div>
        </section>

        <section id="destinations" className="mx-auto max-w-[1480px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#b66f2e]">Featured destinations</p>
              <h2 className="mt-5 max-w-2xl font-serif text-5xl leading-tight sm:text-6xl">A world worth taking time over.</h2>
            </div>
            <p className="max-w-md text-base leading-8 text-[#48645d]">Every route is researched in person and shaped with local hosts, guides, and independent places to stay.</p>
          </div>
          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {travelDestinations.map(([title, meta, image], index) => (
              <DemoLink to="/portfolio/travel/inquire" key={title} className={`group relative overflow-hidden rounded-[1.5rem] ${index === 1 ? 'lg:mt-16' : index === 2 ? 'lg:mt-32' : ''}`}>
                <img src={image} alt={`${title} destination`} className="h-[470px] w-full object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-7 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/65">{meta}</p>
                  <h3 className="mt-2 font-serif text-3xl">{title}</h3>
                </div>
              </DemoLink>
            ))}
          </div>
        </section>

        <section id="story" className="grid bg-[#17332d] text-white lg:grid-cols-2">
          <div className="min-h-[520px] overflow-hidden"><img src="/images/travel-scotland.png" alt="Remote road through the Scottish Highlands" className="h-full w-full object-cover object-center" /></div>
          <div className="flex items-center px-6 py-20 sm:px-12 lg:px-20">
            <div className="max-w-xl">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#f4b860]">Why Aster</p>
              <h2 className="mt-6 font-serif text-5xl leading-tight sm:text-6xl">The best stories are never rushed.</h2>
              <p className="mt-7 text-lg leading-9 text-white/70">We create journeys that leave space for real encounters—breakfast with a host family, a trail recommended that morning, or another hour simply watching the light change.</p>
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/15 pt-8">
                {demo.stats.map(([value, label]) => <div key={label}><p className="font-serif text-3xl text-[#f4b860]">{value}</p><p className="mt-1 text-xs text-white/55">{label}</p></div>)}
              </div>
            </div>
          </div>
        </section>

        <section id="journeys" className="mx-auto max-w-[1480px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#b66f2e]">Ways to travel</p>
          <div className="mt-6 divide-y divide-[#17332d]/20 border-y border-[#17332d]/20">
            {travelPackages.map((item) => (
              <article key={item.number} className="grid gap-5 py-10 md:grid-cols-[80px_1fr_1fr_auto] md:items-center">
                <span className="text-sm font-bold text-[#b66f2e]">{item.number}</span>
                <h3 className="font-serif text-3xl">{item.title}</h3>
                <p className="max-w-md leading-7 text-[#48645d]">{item.text}</p>
                <p className="text-sm font-black">{item.meta}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="inquire" className="bg-[#e6aa53] px-5 py-24 text-center text-[#17332d] sm:px-8">
          <p className="text-xs font-black uppercase tracking-[0.25em]">Your next story starts here</p>
          <h2 className="mx-auto mt-6 max-w-4xl font-serif text-5xl leading-tight sm:text-7xl">Where would you like to go?</h2>
          <button onClick={() => navigateTo('/contact')} className="mt-10 rounded-full bg-[#17332d] px-8 py-4 text-sm font-black text-white transition hover:bg-white hover:text-[#17332d]">Plan a journey <ArrowIcon /></button>
        </section>
      </main>
      <TravelFooter />
    </div>
  );
}

const menu = [
  ['Espresso', 'Rich, balanced, seasonal roast', '$3.50'],
  ['Flat white', 'Double espresso, silky milk', '$4.50'],
  ['Morrow tonic', 'Espresso, citrus tonic, rosemary', '$5.50'],
  ['Pour over', 'Single-origin, brewed to order', '$6.00'],
  ['Morning bun', 'Cardamom, brown sugar, orange', '$4.25'],
  ['Seasonal toast', 'Sourdough, local produce, herbs', '$9.50']
];

const cafeNav = [['Menu', 'menu'], ['Our story', 'story'], ['Visit', 'visit'], ['Contact', 'contact']];

function CafeHeader() {
  return <header className="bg-[#1d2a20] text-[#f7efe2]"><nav className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-y-4 px-5 py-5 sm:px-8 md:flex-nowrap lg:px-12" aria-label="Morrow Coffee navigation"><DemoLink to="/portfolio/cafe" className="font-serif text-2xl font-bold tracking-tight">Morrow</DemoLink><div className="order-3 flex w-full gap-6 overflow-x-auto border-t border-white/10 pt-4 md:order-none md:w-auto md:border-0 md:pt-0">{cafeNav.map(([label,path])=><DemoLink key={path} to={`/portfolio/cafe/${path}`} className="whitespace-nowrap text-xs font-black uppercase tracking-[0.15em] text-white/70 transition hover:text-white">{label}</DemoLink>)}</div><DemoLink to="/portfolio/cafe/visit" className="rounded-full bg-[#d8a25e] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#1d2a20]">Find us</DemoLink></nav></header>;
}

function CafeFooter() {
  return <footer className="bg-[#141b16] px-6 py-12 text-[#f7efe2] sm:px-12"><div className="mx-auto flex max-w-[1480px] flex-col justify-between gap-8 sm:flex-row"><div><p className="font-serif text-3xl">Morrow</p><p className="mt-2 text-sm text-white/50">Coffee · Kitchen · Neighbourhood</p></div><div className="text-sm leading-7 text-white/55">Instagram<br />hello@morrow.example</div><p className="text-sm text-white/40">Café Live Demo by YalaByte</p></div></footer>;
}

function CafePage({ demo, page }) {
  if (page === 'menu') return <div className="bg-[#f3ecdf] text-[#292218]"><DemoBar name={demo.title} /><CafeHeader /><main><section className="px-5 py-20 text-center sm:px-8 lg:py-28"><p className="text-xs font-black uppercase tracking-[0.25em] text-[#9a642e]">Food and drink</p><h1 className="mt-5 font-serif text-6xl sm:text-7xl">The Morrow menu.</h1><p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-[#6f6252]">Coffee we care about, food made here, and a few good things that change with the season.</p></section><section className="mx-auto max-w-5xl px-5 pb-24 sm:px-8"><div className="grid gap-14 md:grid-cols-2">{[['Coffee & tea', menu.slice(0,4)],['From the kitchen', menu.slice(4).concat([['House granola','Yoghurt, poached fruit, toasted seeds','$8.50'],['Soup & sourdough','Today’s soup, cultured butter','$10.00']])]].map(([group,items])=><div key={group}><h2 className="border-b-2 border-[#292218] pb-4 font-serif text-4xl">{group}</h2>{items.map(([name,desc,price])=><div key={name} className="grid grid-cols-[1fr_auto] gap-4 border-b border-[#292218]/15 py-6"><div><h3 className="font-serif text-xl">{name}</h3><p className="mt-1 text-sm text-[#776959]">{desc}</p></div><strong>{price}</strong></div>)}</div>)}</div><div className="mt-16 rounded-3xl bg-[#d8a25e] p-8 text-center"><h3 className="font-serif text-3xl">Planning a gathering?</h3><p className="mt-3">Our back table seats up to 12. Ask about group menus and private evenings.</p><DemoLink to="/portfolio/cafe/contact" className="mt-6 inline-block rounded-full bg-[#1d2a20] px-6 py-3 text-sm font-black text-white">Make an inquiry</DemoLink></div></section></main><CafeFooter /></div>;
  if (page === 'story') return <div className="bg-[#f3ecdf] text-[#292218]"><DemoBar name={demo.title} /><CafeHeader /><main><section className="grid lg:grid-cols-2"><div className="flex items-center px-6 py-20 sm:px-12 lg:px-20"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-[#9a642e]">Since 2021</p><h1 className="mt-6 font-serif text-6xl leading-tight">Good coffee, without the fuss.</h1><p className="mt-7 text-lg leading-9 text-[#6f6252]">Morrow is an independent neighborhood café built around generous hospitality, seasonal ingredients, and coffee made with attention.</p></div></div><img src={demo.image} alt="Morrow coffee bar" className="min-h-[600px] h-full w-full object-cover object-[70%_center]" /></section><section className="bg-[#1d2a20] px-5 py-24 text-[#f7efe2] sm:px-8"><div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-3">{[['Source thoughtfully','We buy seasonal coffee from transparent importers and trusted local roasters.'],['Make it here','Our kitchen prepares the menu each morning with nearby growers and bakers.'],['Welcome everyone','A comfortable room, kind service, and something good at every price point.']].map(([title,text],i)=><article key={title}><span className="font-serif text-4xl text-[#d8a25e]">0{i+1}</span><h2 className="mt-8 font-serif text-3xl">{title}</h2><p className="mt-4 leading-8 text-white/60">{text}</p></article>)}</div></section></main><CafeFooter /></div>;
  if (page === 'visit') return <div className="bg-[#f3ecdf] text-[#292218]"><DemoBar name={demo.title} /><CafeHeader /><main className="grid min-h-[680px] lg:grid-cols-2"><div className="p-7 sm:p-14 lg:p-20"><p className="text-xs font-black uppercase tracking-[0.25em] text-[#9a642e]">Come by</p><h1 className="mt-6 font-serif text-6xl">Find your new favorite corner.</h1><div className="mt-12 grid gap-9 sm:grid-cols-2"><div><h2 className="text-xs font-black uppercase tracking-wider">Address</h2><p className="mt-3 text-lg leading-8">18 Market Lane<br />Kathmandu</p></div><div><h2 className="text-xs font-black uppercase tracking-wider">Hours</h2><p className="mt-3 text-lg leading-8">Mon–Fri · 7am–6pm<br />Sat–Sun · 8am–5pm</p></div><div><h2 className="text-xs font-black uppercase tracking-wider">Getting here</h2><p className="mt-3 leading-7 text-[#6f6252]">Two minutes from the market bus stop. Bicycle parking outside.</p></div><div><h2 className="text-xs font-black uppercase tracking-wider">Accessibility</h2><p className="mt-3 leading-7 text-[#6f6252]">Step-free entrance, accessible restroom, and movable seating.</p></div></div></div><div className="relative min-h-[520px] overflow-hidden bg-[#c8bca9]"><div className="absolute inset-0 opacity-35" style={{backgroundImage:'linear-gradient(#8c7d68 1px, transparent 1px), linear-gradient(90deg, #8c7d68 1px, transparent 1px)',backgroundSize:'52px 52px',transform:'rotate(-7deg) scale(1.25)'}}/><div className="absolute left-1/2 top-1/2 h-9 w-9 rounded-full border-[9px] border-[#1d2a20] bg-[#d8a25e]"/><span className="absolute left-[52%] top-[58%] rounded-full bg-[#1d2a20] px-4 py-2 text-xs font-black text-white">Morrow Coffee</span></div></main><CafeFooter /></div>;
  return <div className="bg-[#f3ecdf] text-[#292218]"><DemoBar name={demo.title} /><CafeHeader /><main className="mx-auto grid max-w-[1300px] gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-12 lg:py-28"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-[#9a642e]">Contact Morrow</p><h1 className="mt-6 font-serif text-6xl leading-tight">Coffee, questions, or a table for twelve?</h1><p className="mt-7 text-lg leading-8 text-[#6f6252]">For events, wholesale, press, or general questions, send us a note. For today’s menu, it is always best to come by.</p></div><form className="grid gap-5 rounded-[2rem] bg-white p-6 shadow-lg sm:p-10" onSubmit={(event)=>{event.preventDefault();navigateTo('/contact');}}>{['Name','Email','Subject'].map(field=><label key={field} className="text-sm font-bold">{field}<input className="mt-2 w-full rounded-xl border border-[#292218]/15 px-4 py-3 outline-none focus:border-[#9a642e]" /></label>)}<label className="text-sm font-bold">Message<textarea className="mt-2 min-h-40 w-full rounded-xl border border-[#292218]/15 px-4 py-3 outline-none focus:border-[#9a642e]" /></label><button className="rounded-full bg-[#1d2a20] px-7 py-4 text-sm font-black text-white">Send message</button></form></main><CafeFooter /></div>;
}

function CafeDemo({ demo, page }) {
  if (page !== 'home') return <CafePage demo={demo} page={page} />;

  return (
    <div className="bg-[#f3ecdf] text-[#292218]">
      <DemoBar name={demo.title} />
      <CafeHeader />

      <main id="top">
        <section className="relative min-h-[730px] overflow-hidden">
          <img src={demo.image} alt="Warm specialty coffee shop interior" className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/25 to-transparent" />
          <div className="relative mx-auto flex min-h-[730px] max-w-[1480px] items-center px-5 py-24 sm:px-8 lg:px-12">
            <div className="max-w-3xl text-[#fff8ec]">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#e5b87b]">Coffee · Kitchen · Neighbourhood</p>
              <h1 className="mt-7 font-serif text-6xl leading-[0.95] sm:text-7xl lg:text-[7rem]">Coffee made slowly.<br />Days made better.</h1>
              <p className="mt-7 max-w-lg text-base leading-8 text-white/75">Seasonal coffee, daily baking, and a comfortable corner of the city to call your own.</p>
              <div className="mt-9 flex flex-wrap gap-3"><DemoLink to="/portfolio/cafe/menu" className="rounded-full bg-[#d8a25e] px-7 py-4 text-sm font-black text-[#1d2a20]">View our menu</DemoLink><DemoLink to="/portfolio/cafe/visit" className="rounded-full border border-white/50 px-7 py-4 text-sm font-black text-white">Plan a visit</DemoLink></div>
            </div>
          </div>
        </section>

        <section className="bg-[#d8a25e] px-5 py-5 text-[#1d2a20]">
          <div className="mx-auto flex max-w-[1480px] flex-wrap justify-center gap-x-12 gap-y-2 text-xs font-black uppercase tracking-[0.18em] sm:justify-between">
            <span>Open daily from 7am</span><span>Roasted locally</span><span>Baked every morning</span><span>Walk-ins welcome</span>
          </div>
        </section>

        <section id="menu" className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8 lg:py-32">
          <div className="text-center"><p className="text-xs font-black uppercase tracking-[0.25em] text-[#9a642e]">A small, good menu</p><h2 className="mt-5 font-serif text-5xl sm:text-6xl">Made with care.</h2><p className="mx-auto mt-5 max-w-xl leading-8 text-[#6f6252]">Our coffee changes with the seasons. Our kitchen follows what is fresh, local, and worth getting up early for.</p></div>
          <div className="mt-14 grid gap-x-16 md:grid-cols-2">
            {menu.map(([name, description, price]) => (
              <div key={name} className="grid grid-cols-[1fr_auto] gap-4 border-b border-[#292218]/15 py-6">
                <div><h3 className="font-serif text-2xl">{name}</h3><p className="mt-1 text-sm text-[#776959]">{description}</p></div><span className="font-bold">{price}</span>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-xs font-bold uppercase tracking-[0.15em] text-[#8a7a67]">Oat milk available · Ask about allergens · Menu changes seasonally</p>
        </section>

        <section id="story" className="grid bg-[#1d2a20] text-[#f7efe2] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex items-center px-6 py-20 sm:px-12 lg:px-20 lg:py-28">
            <div className="max-w-xl"><p className="text-xs font-black uppercase tracking-[0.25em] text-[#d8a25e]">Our story</p><h2 className="mt-6 font-serif text-5xl leading-tight sm:text-6xl">Good coffee should feel like home.</h2><p className="mt-7 text-lg leading-9 text-white/65">Morrow began with a simple idea: make excellent coffee feel less complicated. We work closely with thoughtful roasters, local bakers, and growers we know by name.</p><DemoLink to="/portfolio/cafe/visit" className="mt-9 inline-block border-b border-[#d8a25e] pb-2 text-sm font-black text-[#d8a25e]">Come say hello <ArrowIcon /></DemoLink></div>
          </div>
          <div className="min-h-[570px] overflow-hidden"><img src={demo.image} alt="Morrow café counter" className="h-full w-full object-cover object-[72%_center]" /></div>
        </section>

        <section id="visit" className="grid lg:grid-cols-2">
          <div className="bg-[#d8a25e] p-8 sm:p-14 lg:p-20">
            <p className="text-xs font-black uppercase tracking-[0.25em]">Visit Morrow</p><h2 className="mt-5 font-serif text-5xl">Your table is waiting.</h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-2"><div><p className="text-xs font-black uppercase tracking-wider">Find us</p><p className="mt-3 leading-7">18 Market Lane<br />Kathmandu</p></div><div><p className="text-xs font-black uppercase tracking-wider">Opening hours</p><p className="mt-3 leading-7">Mon–Fri · 7am–6pm<br />Sat–Sun · 8am–5pm</p></div></div>
            <button onClick={() => navigateTo('/contact')} className="mt-10 rounded-full bg-[#1d2a20] px-7 py-4 text-sm font-black text-white">Request this website <ArrowIcon /></button>
          </div>
          <div className="relative min-h-[430px] overflow-hidden bg-[#c8bca9]">
            <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'linear-gradient(#8c7d68 1px, transparent 1px), linear-gradient(90deg, #8c7d68 1px, transparent 1px)', backgroundSize: '52px 52px', transform: 'rotate(-7deg) scale(1.25)' }} />
            <div className="absolute left-[58%] top-[45%] h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[7px] border-[#1d2a20] bg-[#d8a25e] shadow-xl" />
            <div className="absolute left-[58%] top-[52%] -translate-x-1/2 rounded-full bg-[#1d2a20] px-4 py-2 text-xs font-black text-white">Morrow Coffee</div>
          </div>
        </section>
      </main>
      <CafeFooter />
    </div>
  );
}

const logisticsNav = [['Services', 'services'], ['Coverage', 'coverage'], ['Tracking', 'tracking'], ['Company', 'company']];

function LogisticsHeader() {
  return <header className="bg-[#071a2d] text-white"><nav className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-y-4 px-5 py-5 sm:px-8 lg:flex-nowrap lg:px-12" aria-label="Northstar Logistics navigation"><DemoLink to="/portfolio/logistics" className="flex items-center gap-3 text-xl font-black"><span className="grid h-9 w-9 place-items-center rounded bg-[#ffb547] text-[#071a2d]">N</span>NORTHSTAR</DemoLink><div className="order-3 flex w-full gap-6 overflow-x-auto border-t border-white/10 pt-4 lg:order-none lg:w-auto lg:border-0 lg:pt-0">{logisticsNav.map(([label,path])=><DemoLink key={path} to={`/portfolio/logistics/${path}`} className="whitespace-nowrap text-xs font-black uppercase tracking-[0.14em] text-white/65 transition hover:text-white">{label}</DemoLink>)}</div><DemoLink to="/portfolio/logistics/quote" className="rounded bg-[#ffb547] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#071a2d]">Get a quote</DemoLink></nav></header>;
}

function LogisticsFooter() {
  return <footer className="bg-[#04111e] px-6 py-12 text-white sm:px-12"><div className="mx-auto grid max-w-[1480px] gap-8 text-sm md:grid-cols-4"><div><strong className="text-lg">NORTHSTAR</strong><p className="mt-3 text-white/45">Reliable freight across road, air, and ocean.</p></div><div><strong>Operations</strong><p className="mt-3 leading-7 text-white/45">Services<br/>Coverage<br/>Shipment tracking</p></div><div><strong>Support</strong><p className="mt-3 leading-7 text-white/45">24/7 control tower<br/>Claims support<br/>Documentation</p></div><div><strong>Contact</strong><p className="mt-3 leading-7 text-white/45">operations@northstar.example<br/>+977 01 555 0180</p></div></div></footer>;
}

const logisticsServices = [
  ['Road freight', 'FTL and LTL transport with live milestone updates and dedicated account support.'],
  ['Air cargo', 'Priority and economy air freight for time-sensitive regional and global shipments.'],
  ['Ocean freight', 'FCL and LCL options with customs coordination and destination handling.'],
  ['Warehousing', 'Secure storage, inventory control, pick-and-pack, and distribution services.'],
  ['Customs brokerage', 'Documentation review, tariff support, clearance, and compliance coordination.'],
  ['Project logistics', 'Planned movement of oversized, high-value, or operationally complex cargo.']
];

function LogisticsPage({ demo, page }) {
  if (page === 'services') return <div className="bg-[#f4f7fa] text-[#071a2d]"><DemoBar name={demo.title}/><LogisticsHeader/><main><section className="bg-[#0b2945] px-5 py-20 text-white sm:px-8 lg:px-12 lg:py-28"><div className="mx-auto max-w-[1480px]"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#ffb547]">Freight solutions</p><h1 className="mt-6 max-w-4xl text-6xl font-black leading-[1.02] sm:text-7xl">One partner across your supply chain.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/60">Flexible transport and logistics services built around delivery commitments, cargo requirements, and operational visibility.</p></div></section><section className="mx-auto grid max-w-[1480px] gap-5 px-5 py-20 sm:px-8 md:grid-cols-2 lg:grid-cols-3 lg:px-12 lg:py-28">{logisticsServices.map(([title,text],i)=><article key={title} className="border border-slate-200 bg-white p-7"><span className="text-sm font-black text-[#e38b12]">0{i+1}</span><h2 className="mt-8 text-2xl font-black">{title}</h2><p className="mt-4 leading-7 text-slate-600">{text}</p><DemoLink to="/portfolio/logistics/quote" className="mt-7 inline-block text-sm font-black text-[#0b5e9a]">Discuss your shipment →</DemoLink></article>)}</section></main><LogisticsFooter/></div>;
  if (page === 'coverage') return <div className="bg-white text-[#071a2d]"><DemoBar name={demo.title}/><LogisticsHeader/><main><section className="mx-auto grid max-w-[1480px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:px-12 lg:py-28"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-[#d87908]">Network coverage</p><h1 className="mt-6 text-6xl font-black leading-tight">Connected where your business needs us.</h1><p className="mt-6 text-lg leading-8 text-slate-600">Northstar combines owned operations with vetted partners across 42 markets and five primary trade corridors.</p><div className="mt-10 grid grid-cols-2 gap-4">{[['42','service markets'],['86','operating partners'],['12','regional hubs'],['24/7','control tower']].map(([v,l])=><div key={l} className="bg-[#edf3f7] p-5"><strong className="text-3xl text-[#0b5e9a]">{v}</strong><p className="mt-1 text-sm text-slate-600">{l}</p></div>)}</div></div><div className="relative min-h-[520px] overflow-hidden bg-[#dce6ed]"><div className="absolute inset-0 opacity-50" style={{backgroundImage:'radial-gradient(#0b5e9a 1.5px, transparent 1.5px)',backgroundSize:'24px 24px'}}/><div className="absolute inset-12 border-2 border-dashed border-[#0b5e9a]/30"/><div className="absolute left-[28%] top-[38%] h-5 w-5 rounded-full bg-[#ffb547] ring-8 ring-[#ffb547]/25"/><div className="absolute left-[62%] top-[55%] h-5 w-5 rounded-full bg-[#ffb547] ring-8 ring-[#ffb547]/25"/><div className="absolute bottom-8 left-8 bg-[#071a2d] p-5 text-sm text-white"><strong>Primary corridors</strong><p className="mt-2 text-white/55">South Asia · Middle East · Europe · East Asia · North America</p></div></div></section></main><LogisticsFooter/></div>;
  if (page === 'tracking') return <div className="min-h-screen bg-[#eaf0f4] text-[#071a2d]"><DemoBar name={demo.title}/><LogisticsHeader/><main className="mx-auto max-w-5xl px-5 py-20 sm:px-8 lg:py-28"><div className="text-center"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#d87908]">Shipment visibility</p><h1 className="mt-6 text-6xl font-black">Track your freight.</h1><p className="mx-auto mt-5 max-w-xl text-lg text-slate-600">Enter a Northstar reference, bill of lading, or purchase order number.</p></div><form className="mx-auto mt-12 flex max-w-3xl flex-col gap-3 bg-white p-4 shadow-xl sm:flex-row" onSubmit={e=>e.preventDefault()}><input aria-label="Tracking number" placeholder="e.g. NST-2048-7719" className="min-h-14 flex-1 border border-slate-200 px-5 outline-none focus:border-[#0b5e9a]"/><button className="min-h-14 bg-[#ffb547] px-8 font-black">Track shipment</button></form><div className="mt-14 grid gap-5 md:grid-cols-3">{[['Reference formats','NST number, BOL, container, or client PO'],['Status alerts','Pickup, departure, customs, and delivery milestones'],['Need support?','The control tower is available around the clock']].map(([t,x])=><div key={t} className="bg-white p-6"><h2 className="font-black">{t}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{x}</p></div>)}</div></main><LogisticsFooter/></div>;
  if (page === 'company') return <div className="bg-white text-[#071a2d]"><DemoBar name={demo.title}/><LogisticsHeader/><main><section className="grid lg:grid-cols-2"><div className="flex items-center bg-[#0b2945] px-6 py-20 text-white sm:px-12 lg:px-20"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-[#ffb547]">About Northstar</p><h1 className="mt-6 text-6xl font-black leading-tight">Logistics built on clear commitments.</h1><p className="mt-7 text-lg leading-8 text-white/60">Since 2008, we have helped manufacturers, retailers, and project teams move critical freight with confidence.</p></div></div><img src={demo.image} alt="Northstar delivery operations" className="min-h-[600px] h-full w-full object-cover"/></section><section className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8"><div className="grid gap-10 md:grid-cols-3">{[['Safety first','Documented operating standards, trained partners, and proactive exception management.'],['Visible by design','Clear milestones and accountable people from booking through delivery.'],['Built for continuity','Flexible capacity and escalation plans when conditions change.']].map(([t,x])=><article key={t}><h2 className="text-2xl font-black">{t}</h2><p className="mt-4 leading-8 text-slate-600">{x}</p></article>)}</div><div className="mt-20 border-t border-slate-200 pt-12"><p className="text-xs font-black uppercase tracking-[.2em] text-slate-500">Standards and memberships</p><div className="mt-7 flex flex-wrap gap-4">{['ISO 9001 aligned','GDP-aware handling','IATA partner network','Verified carrier program'].map(x=><span key={x} className="border border-slate-300 px-5 py-3 text-sm font-bold">{x}</span>)}</div></div></section></main><LogisticsFooter/></div>;
  return <div className="bg-[#edf3f7] text-[#071a2d]"><DemoBar name={demo.title}/><LogisticsHeader/><main className="mx-auto grid max-w-[1350px] gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[.75fr_1.25fr] lg:px-12 lg:py-28"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-[#d87908]">Freight quote</p><h1 className="mt-6 text-6xl font-black leading-tight">Tell us what needs to move.</h1><p className="mt-6 text-lg leading-8 text-slate-600">Provide the shipment basics. An operations specialist will review routing, capacity, timing, and any customs requirements.</p><div className="mt-10 border-l-4 border-[#ffb547] pl-5"><strong>Urgent shipment?</strong><p className="mt-1 text-slate-600">Call the 24/7 control tower: +977 01 555 0180</p></div></div><form className="grid gap-5 bg-white p-6 shadow-lg sm:grid-cols-2 sm:p-10" onSubmit={e=>{e.preventDefault();navigateTo('/contact')}}>{['Company name','Contact name','Business email','Phone','Origin city / country','Destination city / country','Cargo type','Estimated weight','Ready date','Required delivery date'].map(x=><label key={x} className="text-sm font-black">{x}<input className="mt-2 w-full border border-slate-200 px-4 py-3 font-normal outline-none focus:border-[#0b5e9a]"/></label>)}<label className="text-sm font-black sm:col-span-2">Additional requirements<textarea className="mt-2 min-h-32 w-full border border-slate-200 px-4 py-3 font-normal outline-none focus:border-[#0b5e9a]"/></label><button className="bg-[#ffb547] px-7 py-4 font-black sm:col-span-2">Request freight quote</button></form></main><LogisticsFooter/></div>;
}

function LogisticsDemo({ demo, page }) {
  if (page !== 'home') return <LogisticsPage demo={demo} page={page}/>;
  return <div className="bg-white text-[#071a2d]"><DemoBar name={demo.title}/><LogisticsHeader/><main><section className="relative min-h-[720px] overflow-hidden"><img src={demo.image} alt="Logistics fleet on the road" className="absolute inset-0 h-full w-full object-cover"/><div className="absolute inset-0 bg-gradient-to-r from-[#04111e]/95 via-[#071a2d]/75 to-transparent"/><div className="relative mx-auto flex min-h-[720px] max-w-[1480px] items-center px-5 py-24 text-white sm:px-8 lg:px-12"><div className="max-w-4xl"><p className="text-xs font-black uppercase tracking-[.25em] text-[#ffb547]">Global logistics · Local accountability</p><h1 className="mt-7 text-6xl font-black leading-[.98] sm:text-7xl lg:text-[6.5rem]">Freight that keeps business moving.</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-white/65">Road, air, and ocean solutions backed by hands-on coordination and clear shipment visibility.</p><div className="mt-9 flex flex-wrap gap-3"><DemoLink to="/portfolio/logistics/quote" className="bg-[#ffb547] px-7 py-4 text-sm font-black text-[#071a2d]">Request a quote</DemoLink><DemoLink to="/portfolio/logistics/services" className="border border-white/40 px-7 py-4 text-sm font-black text-white">Explore services</DemoLink></div></div></div></section><section className="mx-auto max-w-[1480px] px-5 py-24 sm:px-8 lg:px-12"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="text-xs font-black uppercase tracking-[.22em] text-[#d87908]">Core capabilities</p><h2 className="mt-5 max-w-3xl text-5xl font-black">The right mode. One accountable team.</h2></div><DemoLink to="/portfolio/logistics/services" className="text-sm font-black text-[#0b5e9a]">View all services →</DemoLink></div><div className="mt-12 grid gap-5 md:grid-cols-3">{logisticsServices.slice(0,3).map(([t,x],i)=><article key={t} className="border-t-4 border-[#ffb547] bg-[#edf3f7] p-7"><span className="text-sm font-black text-[#0b5e9a]">0{i+1}</span><h3 className="mt-8 text-2xl font-black">{t}</h3><p className="mt-4 leading-7 text-slate-600">{x}</p></article>)}</div></section><section className="grid bg-[#0b2945] text-white lg:grid-cols-2"><div className="p-7 sm:p-14 lg:p-20"><p className="text-xs font-black uppercase tracking-[.22em] text-[#ffb547]">In transit now?</p><h2 className="mt-6 text-5xl font-black">Know where your freight stands.</h2><p className="mt-5 max-w-xl leading-8 text-white/60">Follow operational milestones with a Northstar reference, bill of lading, container number, or purchase order.</p><DemoLink to="/portfolio/logistics/tracking" className="mt-8 inline-block bg-[#ffb547] px-7 py-4 text-sm font-black text-[#071a2d]">Track a shipment</DemoLink></div><div className="grid grid-cols-2 gap-px bg-white/10">{demo.stats.concat([['5','trade corridors']]).map(([v,l])=><div key={l} className="grid place-content-center bg-[#071f36] p-8 text-center"><strong className="text-4xl text-[#ffb547]">{v}</strong><span className="mt-2 text-sm text-white/50">{l}</span></div>)}</div></section><section className="mx-auto max-w-5xl px-5 py-24 text-center sm:px-8"><p className="text-xs font-black uppercase tracking-[.22em] text-[#d87908]">Operational confidence</p><blockquote className="mt-8 text-3xl font-bold leading-snug sm:text-4xl">“Northstar gives our team the visibility and follow-through we need when production depends on the delivery.”</blockquote><p className="mt-6 text-sm text-slate-500">Supply Chain Director · Manufacturing client</p></section></main><LogisticsFooter/></div>;
}

export default function PortfolioDemoPage({ slug, page = 'home' }) {
  const demo = portfolioDemos.find((item) => item.slug === slug) || portfolioDemos[0];
  if (demo.slug === 'cafe') return <CafeDemo demo={demo} page={page} />;
  if (demo.slug === 'logistics') return <LogisticsDemo demo={demo} page={page} />;
  return <TravelDemo demo={demo} page={page} />;
}
