"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Copy, Loader2 } from "lucide-react";
import AssetBuilderModal from "./AssetBuilderModal";
import EmbedGenerator from "@/components/EmbedGenerator";
import toast from "react-hot-toast";

const typeMap = {
  pages: 'PAGE',
  collections: 'COLLECTION',
  components: 'COMPONENT',
  widgets: 'WIDGET',
} as const;

interface EmbedAssetsProps {
  onCreateEmbed?: () => void;
}

const EmbedAssets = ({ onCreateEmbed }: EmbedAssetsProps) => {
  const { data: session } = useSession();
  const [openModal, setOpenModal] = useState(false);
  const [embeds, setEmbeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (session) {
      fetch('/api/saas/embeds')
        .then(res => res.json())
        .then(setEmbeds)
        .catch(err => toast.error('Failed to load embeds'))
        .finally(() => setLoading(false));
    }
  }, [session]);

  const copySnippet = (snippet: string) => {
    navigator.clipboard.writeText(snippet);
    toast.success("Snippet copied!");
  };

  const generateSnippet = (embed: any) => {
    const baseUrl = window.location.origin;
    const designId = embed.designVersionId || '';
    const snippet = `<script src="${baseUrl}/embed.js" data-type="${embed.type.toLowerCase()}" data-id="${embed.id}" data-design="${designId}"></script>`;
    copySnippet(snippet);
  };

  const generateIframe = (embed: any) => {
    const designId = embed.designVersionId || '';
    const url = `${embed.config?.previewUrl || `/embed/${embed.type.toLowerCase()}/${embed.id}`}?design=${designId}`;
    const iframe = `<iframe src="${url}" width="400" height="600" style="border:none;" loading="lazy" allowfullscreen></iframe>`;
    copySnippet(iframe);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
          <TabsTrigger value="generator">Generator</TabsTrigger>
          <TabsTrigger value="snippets">Snippets</TabsTrigger>
          <TabsTrigger value="playground">Playground</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="pages" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Pages</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {embeds.filter(e => e.type === 'PAGE').map((embed) => (
              <Card key={embed.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {embed.name}
                    <Badge variant="secondary">{embed.type}</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{embed.description}</p>
                </CardHeader>
                <CardContent className="p-4">
                  <iframe
                    src={`/embed/${embed.type.toLowerCase()}/${embed.id}?design=${embed.designVersionId || ''}`}
                    width="100%"
                    height="200"
                    className="w-full rounded border"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateSnippet(embed)}
                    >
                      Copy JS
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateIframe(embed)}
                    >
                      Copy iFrame
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {embeds.filter(e => e.type === 'PAGE').length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No pages created yet. Create your first page embed.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        <TabsContent value="collections" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Collections</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {embeds.filter(e => e.type === 'COLLECTION').map((embed) => (
              <Card key={embed.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {embed.name}
                    <Badge variant="secondary">{embed.type}</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{embed.description}</p>
                </CardHeader>
                <CardContent className="p-4">
                  <iframe
                    src={`/embed/${embed.type.toLowerCase()}/${embed.id}?design=${embed.designVersionId || ''}`}
                    width="100%"
                    height="200"
                    className="w-full rounded border"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateSnippet(embed)}
                    >
                      Copy JS
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateIframe(embed)}
                    >
                      Copy iFrame
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {embeds.filter(e => e.type === 'COLLECTION').length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No collections created yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        <TabsContent value="components" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Components</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {embeds.filter(e => e.type === 'COMPONENT').map((embed) => (
              <Card key={embed.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {embed.name}
                    <Badge variant="secondary">{embed.type}</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{embed.description}</p>
                </CardHeader>
                <CardContent className="p-4">
                  <iframe
                    src={`/embed/${embed.type.toLowerCase()}/${embed.id}?design=${embed.designVersionId || ''}`}
                    width="100%"
                    height="150"
                    className="w-full rounded border"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateSnippet(embed)}
                    >
                      Copy JS
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateIframe(embed)}
                    >
                      Copy iFrame
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {embeds.filter(e => e.type === 'COMPONENT').length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No components created yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        <TabsContent value="widgets" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Widgets</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {embeds.filter(e => e.type === 'WIDGET').map((embed) => (
              <Card key={embed.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {embed.name}
                    <Badge variant="secondary">{embed.type}</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{embed.description}</p>
                </CardHeader>
                <CardContent className="p-4">
                  <iframe
                    src={`/embed/${embed.type.toLowerCase()}/${embed.id}?design=${embed.designVersionId || ''}`}
                    width="100%"
                    height="200"
                    className="w-full rounded border"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateSnippet(embed)}
                    >
                      Copy JS
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateIframe(embed)}
                    >
                      Copy iFrame
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {embeds.filter(e => e.type === 'WIDGET').length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No widgets created yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="generator" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Embed Generator</h2>
          <EmbedGenerator />
        </TabsContent>
        <TabsContent value="snippets" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Generated Snippets</h2>
          <p className="text-muted-foreground mb-4">Code snippets for common embeds. Use the Create New Embed button for custom.</p>
          <div className="space-y-2">
            <pre className="bg-muted p-4 rounded text-sm font-mono overflow-auto">
{`<script src="/embed.js" data-type="widgets" data-id="chatbot" data-design="version123"></script>

<iframe src="/embed/widget/chatbot?design=version123" width="100%" height="600" style="border:none;" loading="lazy"></iframe>`}
              <Button
                variant="outline"
                size="sm"
                onClick={() => copySnippet(`<script src="/embed.js" data-type="widgets" data-id="chatbot" data-design="version123"></script>`)}
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
                <Input id="embed-url" placeholder="/embed/widget/chatbot?design=version123" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="width">Width</Label>
                <Input id="width" type="number" defaultValue="400" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="height">Height</Label>
                <Input id="height" type="number" defaultValue="600" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="design">Design ID</Label>
                <Input id="design" placeholder="version123" className="mt-2" />
              </div>
            </div>
            <Button className="w-full">Load Preview</Button>
            <iframe
              src="/embed/product/1?design="
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
              <CardContent className="text-2xl font-bold text-primary">{embeds.reduce((sum, e) => sum + (e.views || 0), 0)}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Clicks</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold text-primary">{embeds.reduce((sum, e) => sum + (e.clicks || 0), 0)}</CardContent>
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