import { SiteShell } from "@/src/presentation/layout/site-shell";
import VehicleDetails from "@/src/presentation/components/marketplace/VehicleDetails/VehicleDetails";

export default function MarketplaceVehicleDetailsPage() {
  return (
    <SiteShell theme="light">
      <div className="pt-24">
        <VehicleDetails />
      </div>
    </SiteShell>
  );
}
