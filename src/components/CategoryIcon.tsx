import type { SVGProps } from "react";

type Props = {
  categoryId: string;
  categoryName: string;
  className?: string;
};

function normalizeCategoryKey(categoryId: string, categoryName: string): string {
  const id = categoryId.toLowerCase();
  const name = categoryName.toLowerCase();

  if (id.includes("latex-giant") || name.includes("гигант")) return "latex-giants";
  if (id.includes("latex") || name.includes("латекс")) return "latex";
  if (id.includes("bubble") || name.includes("бабл")) return "bubbles";
  if (id.includes("foil") || name.includes("фольг")) return "foil";
  if (id.includes("figure") || name.includes("фигур")) return "figures";
  if (id.includes("box") || name.includes("короб")) return "boxes";
  if (id.includes("decor") || name.includes("декор")) return "decor";
  if (id.includes("gender") || name.includes("гендер")) return "gender";
  if (id.includes("extra") || name.includes("дополн")) return "extra";
  if (id.includes("delivery") || name.includes("достав")) return "delivery";

  return "default";
}

function IconBase({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" {...props}>
      {children}
    </svg>
  );
}

export function CategoryIcon({ categoryId, categoryName, className }: Props) {
  const key = normalizeCategoryKey(categoryId, categoryName);

  switch (key) {
    case "latex":
      return (
        <IconBase className={className}>
          <circle cx="12" cy="8" r="5" />
          <path d="M12 13v5M10.5 18.5L12 21l1.5-2.5" strokeLinecap="round" strokeLinejoin="round" />
        </IconBase>
      );
    case "latex-giants":
      return (
        <IconBase className={className}>
          <circle cx="12" cy="7.5" r="5.5" />
          <path d="M12 13.5v6M9.5 20h5" strokeLinecap="round" />
          <path d="M12 3.5v-1" strokeLinecap="round" />
        </IconBase>
      );
    case "bubbles":
      return (
        <IconBase className={className}>
          <circle cx="8" cy="9" r="3.2" />
          <circle cx="14.5" cy="8" r="2.6" />
          <circle cx="12" cy="14.2" r="4.1" />
        </IconBase>
      );
    case "foil":
      return (
        <IconBase className={className}>
          <path d="M12 2.5l2.4 5 5.6.8-4 3.8.9 5.4L12 15l-4.9 2.5.9-5.4-4-3.8 5.6-.8 2.4-5z" />
        </IconBase>
      );
    case "figures":
      return (
        <IconBase className={className}>
          <circle cx="12" cy="6.5" r="2.5" />
          <path d="M12 9.5v5M8.5 21l2.3-4.2M15.5 21l-2.3-4.2M8.5 14.5l3.5-2.2 3.5 2.2" strokeLinecap="round" />
        </IconBase>
      );
    case "boxes":
      return (
        <IconBase className={className}>
          <path d="M4 8.5L12 4l8 4.5-8 4.5-8-4.5z" />
          <path d="M4 8.5V16L12 20.5 20 16V8.5M12 13v7.5" />
        </IconBase>
      );
    case "decor":
      return (
        <IconBase className={className}>
          <path d="M12 3.5l1.6 3.4 3.7.5-2.7 2.6.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.7-2.6 3.7-.5L12 3.5z" />
          <path d="M18.5 15l.8 1.8 1.9.3-1.4 1.3.3 1.8-1.6-.9-1.6.9.3-1.8-1.4-1.3 1.9-.3.8-1.8z" />
        </IconBase>
      );
    case "gender":
      return (
        <IconBase className={className}>
          <circle cx="12" cy="8" r="5" />
          <path d="M12 3v10M7 8h10M12 13v6" strokeLinecap="round" />
        </IconBase>
      );
    case "extra":
      return (
        <IconBase className={className}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 8v8M8 12h8" strokeLinecap="round" />
        </IconBase>
      );
    case "delivery":
      return (
        <IconBase className={className}>
          <path d="M3.5 6.5h10v8h-10z" />
          <path d="M13.5 10h4l2 2.3v2.2h-6z" />
          <circle cx="7.5" cy="17.5" r="1.7" />
          <circle cx="16.5" cy="17.5" r="1.7" />
        </IconBase>
      );
    default:
      return (
        <IconBase className={className}>
          <rect x="4.5" y="5.5" width="15" height="13" rx="2.5" />
          <path d="M8 10h8M8 14h6" strokeLinecap="round" />
        </IconBase>
      );
  }
}
