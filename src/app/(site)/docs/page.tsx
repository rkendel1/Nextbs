import Documentation from "@/components/Docs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Documentation | SaaS for SaaS Platform",
  description: "Learn how to integrate with the SaaS for SaaS platform",
};

const DocsPage = () => {
  return <Documentation />;
};

export default DocsPage;
