import { cn } from "@/lib/utils";
import { useId } from "react";

/**
 * Rona wordmark, traced from the brand book (Rona_Branding.pdf, p.4).
 * Each piece carries its own gradient so the folded-ribbon shading survives.
 */
const PIECES: {
  d: string;
  x1: number;
  x2: number;
  transform: string;
  stops: [number, string][];
}[] = [
  {
    d: "M 126.2 301.72 L 126.2 333.57 L 199.14 333.57 C 207.7 333.57 214.73 340.13 215.44 348.51 C 215.48 348.97 215.5 349.45 215.5 349.92 C 215.5 356.11 212.05 361.49 206.99 364.27 C 204.65 365.55 201.98 366.27 199.14 366.27 L 126.2 366.27 L 126.2 398.93 L 165.59 398.93 C 165.73 398.92 165.86 398.92 166 398.92 C 166.14 398.92 166.29 398.92 166.43 398.93 C 172.39 399.08 177.55 402.41 180.29 407.31 C 180.54 407.75 180.76 408.2 180.96 408.66 C 193.12 432.61 217.97 449.03 246.68 449.03 C 247.04 449.03 247.4 449.03 247.75 449.02 L 247.75 416.56 C 247.4 416.57 247.04 416.57 246.68 416.57 C 232.68 416.57 220.32 409.59 212.87 398.93 C 212.49 398.39 212.13 397.84 211.77 397.27 C 224.04 393.99 234.4 386 240.81 375.38 C 245.21 368.06 247.75 359.5 247.75 350.33 C 247.75 344.68 246.79 339.26 245 334.21 C 240.75 322.07 231.81 312.13 220.35 306.57 C 213.93 303.46 206.74 301.72 199.14 301.72 Z M 126.2 301.72",
    x1: 0.0608,
    x2: 0.7736,
    transform: "matrix(165.435, 210.654, -210.654, 165.435, 122.405, 284.005)",
    stops: [[0.0, "#81cabf"], [0.195, "#79beb4"], [0.328, "#6fb0a8"], [0.461, "#65a29c"], [0.602, "#5b938f"], [0.734, "#518583"], [0.867, "#477776"], [1.0, "#3e696a"]],
  },
  {
    d: "M 220.35 306.57 C 231.81 312.13 240.75 322.07 245 334.21 C 245.55 334.19 246.11 334.18 246.68 334.18 C 247.04 334.18 247.4 334.18 247.75 334.19 C 270.01 334.76 287.87 352.98 287.87 375.38 L 320.33 375.38 C 320.33 335.05 287.93 302.3 247.75 301.73 C 247.4 301.72 247.04 301.72 246.68 301.72 C 237.4 301.72 228.52 303.43 220.35 306.57",
    x1: -0.1388,
    x2: 0.8223,
    transform: "matrix(-112.496, -61.027, 61.027, -112.496, 310.217, 356.765)",
    stops: [[0.0, "#81cabf"], [0.363, "#77bcb3"], [0.469, "#6dada6"], [0.574, "#629e98"], [0.684, "#588e8b"], [0.789, "#4d7f7e"], [0.895, "#437070"], [1.0, "#386163"]],
  },
  {
    d: "M 126.2 398.93 L 158.66 398.93 L 158.66 449.03 L 126.2 449.03 Z M 126.2 398.93",
    x1: 0.3971,
    x2: 0.7868,
    transform: "matrix(9.558, -133.818, 133.818, 9.558, 136.774, 503.192)",
    stops: [[0.0, "#64a09a"], [0.141, "#5f9994"], [0.281, "#59918d"], [0.422, "#538886"], [0.578, "#4d7f7e"], [0.719, "#477776"], [0.859, "#426f6f"], [1.0, "#3c6768"]],
  },
  {
    d: "M 287.87 375.38 C 287.87 397.76 270.01 415.98 247.75 416.56 L 247.75 449.02 C 287.93 448.45 320.33 415.68 320.33 375.38 Z M 287.87 375.38",
    x1: 0.0317,
    x2: 0.8052,
    transform: "matrix(-99.996, 88.232, -88.232, -99.996, 324.639, 373.872)",
    stops: [[0.0, "#81cabf"], [0.219, "#79beb4"], [0.344, "#6fb0a8"], [0.477, "#64a09a"], [0.609, "#59918d"], [0.742, "#4f8280"], [0.867, "#457473"], [1.0, "#3a6466"]],
  },
  {
    d: "M 507.59 301.72 L 507.59 301.74 C 521.18 309.36 532.45 320.62 540.05 334.21 L 540.05 301.72 Z M 507.59 301.72",
    x1: 0.4889,
    x2: 0.7403,
    transform: "matrix(-124.995, 133.083, -133.083, -124.995, 600.647, 236.175)",
    stops: [[0.0, "#5b938f"], [0.141, "#578e8a"], [0.281, "#538986"], [0.422, "#508381"], [0.578, "#4c7d7c"], [0.719, "#487877"], [0.859, "#447373"], [1.0, "#416e6e"]],
  },
  {
    d: "M 430.2 311.22 C 428.48 312.18 426.82 313.2 425.2 314.3 L 425.2 375.38 C 425.2 368.23 427.01 361.53 430.2 355.69 C 435.57 345.82 444.85 338.41 455.95 335.51 C 459.28 334.64 462.79 334.18 466.4 334.18 C 489.16 334.18 507.6 352.62 507.6 375.38 L 540.05 375.38 C 540.05 349.96 527.17 327.54 507.6 314.3 C 495.84 306.36 481.65 301.72 466.4 301.72 C 453.24 301.72 440.89 305.16 430.2 311.22",
    x1: 0.2323,
    x2: 0.7984,
    transform: "matrix(-219.844, -87.497, 87.497, -219.844, 591.852, 393.854)",
    stops: [[0.0, "#75b9b0"], [0.141, "#6dada6"], [0.289, "#64a19b"], [0.43, "#5c9591"], [0.57, "#548986"], [0.711, "#4c7d7c"], [0.859, "#437171"], [1.0, "#3b6567"]],
  },
  {
    d: "M 507.6 375.38 L 540.05 375.38 L 540.05 449.03 L 507.6 449.03 Z M 507.6 375.38",
    x1: 0.2788,
    x2: 0.7347,
    transform: "matrix(2.206, 162.494, -162.494, 2.206, 522.708, 329.858)",
    stops: [[0.0, "#70b2aa"], [0.141, "#6aa9a2"], [0.289, "#639f99"], [0.43, "#5c9591"], [0.57, "#568c88"], [0.711, "#4f8280"], [0.859, "#487877"], [1.0, "#416f6f"]],
  },
  {
    d: "M 393.99 301.72 C 393.58 301.72 393.15 301.72 392.74 301.73 C 378.06 301.97 364.43 306.51 353.03 314.14 C 334.86 326.32 322.42 346.37 320.57 369.42 L 320.57 449.03 L 353.03 449.03 L 353.03 379.81 C 352.87 378.36 352.79 376.87 352.79 375.38 C 352.79 373.88 352.87 372.39 353.03 370.93 C 355.2 350.67 372.04 334.81 392.74 334.2 L 392.74 375.38 C 392.74 390.05 397.04 403.74 404.44 415.23 C 409.87 423.62 416.94 430.86 425.2 436.45 C 426.82 437.55 428.48 438.57 430.2 439.53 C 440.89 445.59 453.24 449.03 466.4 449.03 C 481.65 449.03 495.84 444.39 507.6 436.45 L 507.6 375.38 C 507.6 398.12 489.16 416.57 466.4 416.57 C 462.79 416.57 459.28 416.11 455.95 415.23 C 444.85 412.33 435.57 404.91 430.2 395.06 C 427.01 389.21 425.2 382.5 425.2 375.38 L 425.2 301.72 Z M 393.99 301.72",
    x1: -0.1349,
    x2: 1.0322,
    transform: "matrix(173.124, 104.996, -104.996, 173.124, 325.327, 346.531)",
    stops: [[0.0, "#81cabf"], [0.297, "#77bcb3"], [0.387, "#6caca5"], [0.477, "#629d97"], [0.566, "#578d8a"], [0.656, "#4c7e7c"], [0.746, "#416e6e"], [1.0, "#386163"]],
  },
];

const VIEW_BOX = "126 301.5 414.5 148";

export type LogoVariant = "gradient" | "light" | "dark" | "mark";

// "dark" is the wordmark for light surfaces, so it turns pale in dark mode.
const FLAT_FILL: Record<"light" | "dark", string> = {
  light: "fill-brand-pale",
  dark: "fill-brand-deep dark:fill-brand-pale",
};

type Props = {
  className?: string;
  /**
   * gradient: teal gradient wordmark, for dark surfaces (default)
   * light: flat pale wordmark, for always-dark surfaces
   * dark: flat deep-teal wordmark for light surfaces; pale in dark mode
   * mark: square app-icon tile
   */
  variant?: LogoVariant;
  /** Adds the "RONA / Enterprise Business Management Platform" lockup text. */
  lockup?: boolean;
  lockupClassName?: string;
};

function Wordmark({
  variant,
  className,
}: {
  variant: Exclude<LogoVariant, "mark">;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");

  return (
    <svg
      viewBox={VIEW_BOX}
      role="img"
      aria-label="Rona"
      className={cn("h-8 w-auto shrink-0", className)}
    >
      {variant === "gradient" ? (
        <>
          <defs>
            {PIECES.map((piece, index) => (
              <linearGradient
                key={index}
                id={`${id}-g${index}`}
                gradientUnits="userSpaceOnUse"
                x1={piece.x1}
                y1={0}
                x2={piece.x2}
                y2={0}
                gradientTransform={piece.transform}
              >
                {piece.stops.map(([offset, color]) => (
                  <stop key={offset} offset={offset} stopColor={color} />
                ))}
              </linearGradient>
            ))}
          </defs>
          {PIECES.map((piece, index) => (
            <path
              key={index}
              d={piece.d}
              fill={`url(#${id}-g${index})`}
              stroke={`url(#${id}-g${index})`}
              strokeWidth={0.6}
            />
          ))}
        </>
      ) : (
        <path
          d={PIECES.map((piece) => piece.d).join(" ")}
          className={FLAT_FILL[variant]}
        />
      )}
    </svg>
  );
}

function Mark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-[22%] bg-linear-135 from-brand-ink to-brand-deep",
        className,
      )}
    >
      <Wordmark variant="gradient" className="h-auto w-[74%]" />
    </span>
  );
}

const Logo = ({
  className,
  variant = "gradient",
  lockup,
  lockupClassName,
}: Props) => {
  const logo =
    variant === "mark" ? (
      <Mark className={className} />
    ) : (
      <Wordmark variant={variant} className={className} />
    );

  if (!lockup) return logo;

  return (
    <span className="inline-flex items-center gap-3">
      {logo}
      <span
        className={cn(
          "font-heading text-[0.8rem] leading-[1.1] font-medium",
          "text-tagline",
          lockupClassName,
        )}
      >
        <span
          className={cn(
            "block font-bold",
            variant === "dark" ? "text-tagline-strong" : "text-tagline",
          )}
        >
          RONA
        </span>
        <span className="block">Enterprise Business</span>
        <span className="block">Management Platform</span>
      </span>
    </span>
  );
};

export default Logo;
