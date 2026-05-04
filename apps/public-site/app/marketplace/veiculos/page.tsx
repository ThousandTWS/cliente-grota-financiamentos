import { SiteShell } from "@/src/presentation/layout/site-shell";
import VehicleSearchListing from "@/src/presentation/components/marketplace/VehicleSearchListing/VehicleSearchListing";

export default function MarketplaceVehiclesPage() {
  return (
    <SiteShell theme="light">
      <div className="pt-24">
        <VehicleSearchListing />
      </div>
    </SiteShell>
  );
}
