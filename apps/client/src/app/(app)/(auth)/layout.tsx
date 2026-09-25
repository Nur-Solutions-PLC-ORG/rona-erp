import ThemeToggle from "@/components/custom/theme-toggle";
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
    <main className="flex min-h-screen bg-card">
      <aside className="brand-gradient-teal relative hidden lg:flex w-[42%] flex-col justify-between overflow-hidden p-10 text-ink">
        <div className="brand-waves absolute inset-0" />
        <div className="relative">
          <Logo lockup className="h-9" />
        </div>

        <div className="relative space-y-8">
          <h2 className="max-w-md font-sans text-3xl font-normal leading-snug tracking-tight">
            <span className="text-tagline">Streamline Your Success with</span>{" "}
            <span className="text-tagline-strong">RONA.</span>
          </h2>
          <ul className="space-y-5">
            {BRAND_POINTS.map((point) => (
              <li key={point.title} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-semibold text-ink">{point.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-2">
                    {point.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-ink-3">
          © {new Date().getFullYear()} Rona · Enterprise Business Management
          Platform
        </p>
      </aside>

      <section className="relative flex flex-1 items-center justify-center bg-card px-6 py-12">
        <ThemeToggle className="absolute right-4 top-4" />
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
