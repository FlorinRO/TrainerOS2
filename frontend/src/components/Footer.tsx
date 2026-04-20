import { Link } from 'react-router-dom';

export default function Footer() {
  const productLinks = [
    { name: 'Funcționalități', path: '/features' },
    { name: 'Prețuri', path: '/pricing' },
  ];

  const companyLinks = [
    { name: 'Despre noi', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const legalLinks = [
    { name: 'Termeni și condiții', path: '/terms' },
    { name: 'Politică de confidențialitate', path: '/privacy' },
  ];

  return (
    <footer className="relative z-10 mt-20 px-3 pb-6 sm:px-5">
      <div className="console-panel mx-auto max-w-7xl rounded-[32px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
          <div>
            <p className="console-kicker mb-1">System Status</p>
            <p className="text-sm text-slate-300/78">Unified operating layer for content, niche, chat, and review.</p>
          </div>
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-slate-400">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse-soft" />
              live
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse-soft" />
              ready
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Logo & Description */}
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo.jpeg"
                alt="TrainerOS Logo"
                className="h-11 w-11 rounded-2xl border border-cyan-300/20 object-cover"
              />
              <div>
                <p className="console-kicker text-[10px]">Operating Layer</p>
                <span className="text-white font-bold text-xl font-display">TrainerOS</span>
              </div>
            </div>
            <p className="text-sm text-slate-300/72">
              Sistemul de content care transformă postările în clienți.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/84">Produs</h3>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-slate-300/68 transition-colors hover:text-white"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/84">Companie</h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-slate-300/68 transition-colors hover:text-white"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/84">Legal</h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-slate-300/68 transition-colors hover:text-white"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="console-divider mt-8 border-t pt-8 text-center">
          <p className="text-sm text-slate-400/80">
            © {new Date().getFullYear()} TrainerOS. Toate drepturile rezervate.
          </p>
        </div>
      </div>
    </footer>
  );
}
