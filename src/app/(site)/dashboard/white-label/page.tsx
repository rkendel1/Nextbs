import WhiteLabelConfiguration from "@/components/WhiteLabel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "White-Label Configuration | SaaSinaSnap Dashboard",
  description: "Configure your white-label branding and customization options",
};

const WhiteLabelPage = () => {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          White-Label Configuration
        </h1>
        <p className="mt-2 text-body-color dark:text-dark-6">
          Customize your platform with your own branding, colors, and domain.
        </p>
      </div>
      <WhiteLabelConfiguration />
    </div>
  );
};

export default WhiteLabelPage;
