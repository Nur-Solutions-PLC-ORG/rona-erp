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
      <aside className="relative hidden lg:flex w-[42%] flex-col justify-between overflow-hidden bg-zinc-950 p-10 text-white">
        <div className="relative">
          <Logo className="w-16 invert" />
        </div>

        <div className="relative space-y-8">
          <h2 className="max-w-sm text-3xl font-bold leading-snug tracking-tight">
            The operating system for modern manufacturers.
          </h2>
          <ul className="space-y-5">
            {BRAND_POINTS.map((point) => (
              <li key={point.title} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                <div>
                  <p className="text-sm font-semibold">{point.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-zinc-400">
                    {point.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-zinc-500">
          © {new Date().getFullYear()} Rona ERP
        </p>
      </aside>

      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden">
            <Logo className="w-12" />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
};

export default Layout;
