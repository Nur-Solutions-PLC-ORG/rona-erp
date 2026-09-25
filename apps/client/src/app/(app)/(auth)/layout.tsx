import Logo from "@/components/custom/logo";

type Props = {
  children: React.ReactNode;
};

const BRAND_POINTS = [
  {
    title: "Run your whole factory",
    description:
      "Inventory, manufacturing, quality, and workforce — unified in one workspace.",
  },
  {
    title: "Trace every lot",
    description:
      "Forward and backward traceability from raw material to finished product.",
  },
  {
    title: "Role-based access",
    description:
      "Organization-scoped permissions keep every team's data isolated and secure.",
  },
];

const Layout = ({ children }: Props) => {
  return (
    <main className="flex min-h-screen bg-white">
      <aside className="brand-gradient-teal relative hidden lg:flex w-[42%] flex-col justify-between overflow-hidden p-10 text-brand-mist">
        <div className="brand-waves absolute inset-0 opacity-20!" />
        <div className="relative">
          <Logo lockup className="h-9" />
        </div>

        <div className="relative space-y-8">
          <h2 className="max-w-md font-sans text-3xl font-normal leading-snug tracking-tight">
            <span className="text-brand-green">Streamline Your Success with</span>{" "}
            <span className="text-brand-pale">RONA.</span>
          </h2>
          <ul className="space-y-5">
            {BRAND_POINTS.map((point) => (
              <li key={point.title} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-aqua" />
                <div>
                  <p className="text-sm font-semibold text-white">{point.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-brand-pale/70">
                    {point.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-brand-pale/50">
          © {new Date().getFullYear()} Rona · Enterprise Business Management
          Platform
        </p>
      </aside>

      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden">
            <Logo variant="dark" className="h-8" />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
};

export default Layout;
