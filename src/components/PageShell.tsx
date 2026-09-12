import type { ReactNode } from "react";
import { Seo } from "@/components/Seo";

type Props = {
  title: string;
  heading?: string;
  description?: string;
  path?: string;
  noindex?: boolean;
  children: ReactNode;
};

export function PageShell({ title, heading, description, path, noindex, children }: Props) {
  return (
    <div className="container-page py-6">
      <Seo title={title} description={description} path={path} noindex={noindex} />
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">{heading ?? title}</h1>
      {children}
    </div>
  );
}
