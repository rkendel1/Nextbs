"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
import AssetBuilderModal from "./AssetBuilderModal";
import toast from "react-hot-toast";

const mockAssets = {
  pages: [
    { id: "pricing", name: "Pricing Page", description: "Full pricing portal with tiers and subscribe button", previewUrl: "/embed/platform" },
    { id: "account", name: "Customer Account", description: "User account portal for managing subscriptions", previewUrl: "/embed/platform" },
  ],
  collections: [
    { id: "product-grid", name: "Product Grid", description: "Multi-product showcase grid", previewUrl: "/embed/product/1" },
    { id: "featured", name: "Featured Sections", description: "Highlighted features or testimonials", previewUrl: "/embed/product/1" },
  ],
  components: [
    { id: "button", name: "Subscribe Button", description: "Single subscribe CTA button", previewUrl: "/embed/platform" },
    { id: "header", name: "Header", description: "Branded header with logo and nav", previewUrl: "/embed/platform" },
    { id: "footer", name: "Footer", description: "Branded footer with links", previewUrl: "/embed/platform" },
    { id: "navbar", name: "Navbar", description: "Navigation bar", previewUrl: "/embed/platform" },
  ],
  widgets: [
    { id: "checkout", name: "Checkout Modal", description: "Popup for subscription checkout", previewUrl: "/embed/product/1" },
    { id: "usage", name: "Usage Tracker", description: "Real-time usage monitoring widget", previewUrl: "/embed/product/1" },
    { id: "upsell", name: "Upsell Modal", description: "Upgrade or add-on suggestions", previewUrl: "/embed/product/1" },
  ],
};

interface EmbedAssetsProps {
  onCreateEmbed?: () => void;
}

const EmbedAssets = ({ onCreateEmbed }: EmbedAssetsProps) => {
  const [openModal, setOpenModal] = useState(false);

  const copySnippet = (snippet: string) => {
    navigator.clipboard.writeText(snippet);
    toast.success("Snippet copied!");
  };

  const generateSnippet = (type: string, id?: string) => {
    const baseUrl = window.location.origin;
    const snippet = `<script src="${baseUrl}/embed.js" data-type="${type}" data-id="${id || ''}"></script>`;
    copySnippet(snippet);
  };

  const generateIframe = (url: string) => {
    const iframe = `<iframe src="${url}" width="400" height="600" style="border:none;" loading="lazy" allowfullscreen></iframe>`;
    copySnippet(iframe);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Embeds / Assets</h1>
        <Button onClick={() => setOpenModal(true)}>
          Create New Embed
        </Button>
      </div>

      <Tabs defaultValue="pages">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="widgets">Widgets</TabsTrigger>
          <TabsTrigger value="snippets">Snippets</TabsTrigger>
          <TabsTrigger value="playground">Playground</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Prebuilt Pages</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockAssets.pages.map((asset) => (
              <Card key={asset.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {asset.name}
                    <Badge variant="secondary">Page</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{asset.description}</p>
                </CardHeader>
                <CardContent className="p-4">
                  <iframe
                    src={asset.previewUrl}
                    width="100%"
                    height="200"
                    className="w-full rounded border"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateSnippet("page", asset.id)}
                    >
                      Copy JS
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateIframe(asset.previewUrl)}
                    >
                      Copy iFrame
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="collections" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Collections</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockAssets.collections.map((asset) => (
              <Card key={asset.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {asset.name}
                    <Badge variant="secondary">Collection</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{asset.description}</p>
                </CardHeader>
                <CardContent className="p-4">
                  <iframe
                    src={asset.previewUrl}
                    width="100%"
                    height="200"
                    className="w-full rounded border"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateSnippet("collection", asset.id)}
                    >
                      Copy JS
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateIframe(asset.previewUrl)}
                    >
                      Copy iFrame
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Atomic Components</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockAssets.components.map((asset) => (
              <Card key={asset.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {asset.name}
                    <Badge variant="secondary">Component</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{asset.description}</p>
                </CardHeader>
                <CardContent className="p-4">
                  <iframe
                    src={asset.previewUrl}
                    width="100%"
                    height="150"
                    className="w-full rounded border"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateSnippet("component", asset.id)}
                    >
                      Copy JS
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateIframe(asset.previewUrl)}
                    >
                      Copy iFrame
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="widgets" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Dynamic Widgets</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockAssets.widgets.map((asset) => (
              <Card key={asset.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {asset.name}
                    <Badge variant="secondary">Widget</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{asset.description}</p>
                </CardHeader>
                <CardContent className="p-4">
                  <iframe
                    src={asset.previewUrl}
                    width="100%"
                    height="200"
                    className="w-full rounded border"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateSnippet("widget", asset.id)}
                    >
                      Copy JS
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateIframe(asset.previewUrl)}
                    >
                      Copy iFrame
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="snippets" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Generated Snippets</h2>
          <p className="text-muted-foreground mb-4">Code snippets for common embeds. Use the Create New Embed button for custom.</p>
          <div className="space-y-2">
            <pre className="bg-muted p-4 rounded text-sm font-mono overflow-auto">
{`<script src="/embed.js" data-type="pricing-grid" data-style="brand"></script>

<iframe src="/embed/page/pricing" width="100%" height="600" style="border:none;" loading="lazy"></iframe>`}
              <Button
                variant="outline"
                size="sm"
                onClick={() => copySnippet(`<script src="/embed.js" data-type="pricing-grid" data-style="brand"></script>`)}
              >
                Copy Example
              </Button>
            </pre>
          </div>
        </TabsContent>

        <TabsContent value="playground" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Embed Playground</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="embed-url">Embed URL</Label>
                <Input id="embed-url" placeholder="/embed/product/1" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="width">Width</Label>
                <Input id="width" type="number" defaultValue="400" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="height">Height</Label>
                <Input id="height" type="number" defaultValue="600" className="mt-2" />
              </div>
            </div>
            <Button className="w-full">Load Preview</Button>
            <iframe
              src="/embed/product/1"
              width="400"
              height="600"
              className="w-full rounded border"
            />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Embed Analytics</h2>
          <p className="text-muted-foreground mb-4">Track views, clicks, and conversions for your embeds.</p>
          <div className="h-64 bg-muted rounded p-4">
            {/* Placeholder for Recharts chart */}
            <p className="text-center text-muted-foreground">Embed Metrics Chart (views/clicks)</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Views</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold text-primary">1,234</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Clicks</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold text-primary">567</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold text-primary">4.2%</CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <AssetBuilderModal
        open={openModal}
        onOpenChange={setOpenModal}
      />
    </div>
  );
};

export default EmbedAssets;