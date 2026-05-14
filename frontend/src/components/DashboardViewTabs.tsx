"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashboardViewTabs() {
  const pathname = usePathname();
  const isBusiness = pathname === "/business";

  return (
    <div className="view-tabs-wrap">
      <nav className="view-tabs" aria-label="Dashboard view">
        <Link href="/consumer" className={!isBusiness ? "active" : undefined}>
          Consumer
        </Link>
        <Link href="/business" className={isBusiness ? "active" : undefined}>
          Business
        </Link>
      </nav>
    </div>
  );
}
