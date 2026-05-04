import { SiteShell } from "@/src/presentation/layout/site-shell";
import FeaturedVehicles from "@/src/presentation/components/marketplace/FeaturedVehicles/FeaturedVehicles";

export default function MarketplaceHighlightsPage() {
  return (
    <SiteShell theme="light">
      <div className="pt-24">
        <FeaturedVehicles />
      </div>
    </SiteShell>
  );
}
