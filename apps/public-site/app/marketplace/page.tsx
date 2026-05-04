import { SiteShell } from "@/src/presentation/layout/site-shell";
import { MarketplaceModule } from "@/src/presentation/components/marketplace";

export default function MarketplacePage() {
  return (
    <SiteShell theme="dark">
      <MarketplaceModule />
    </SiteShell>
  );
}
