import { Layers } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-4 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-6 sm:text-left lg:px-8">
        <div className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" />
          <span>© 2026 GeoData Logger · v0.1.0</span>
        </div>
        <div>
          <span>Support: </span>
          <a
            href="mailto:support@geodatalogger.com"
            className="underline underline-offset-2 transition-colors hover:text-foreground"
          >
            support@geodatalogger.com
          </a>
        </div>
      </div>
    </footer>
  );
}
