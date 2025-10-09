import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ProductModal from "./ProductModal";
import ProductsList from "./ProductsList";
import type { FeelData } from "@/types/saas";
import { OnboardingStep } from "@/types/saas";

interface ProductSetupStepProps {
  currentStep: OnboardingStep;
  onNext: (data: any) => void;
}

export default function ProductSetupStep({ currentStep, onNext }: ProductSetupStepProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feelData, setFeelData] = useState<FeelData | null>(null);
  const [merged, setMerged] = useState<any | null>(null);
  const [status, setStatus] = useState<'idle' | 'lightweight' | 'processing' | 'completed' | 'failed'>('idle');
  const [pollId, setPollId] = useState<NodeJS.Timeout | null>(null);
  const [url, setUrl] = useState<string>('');

  const { data: session } = useSession();
  const router = useRouter();

  const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    url: z.string().url('Invalid URL').optional(),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      url: '',
    },
  });

  const onSubmit = async (data: any) => {
    if (loading) return;

    if (data.url && currentStep < OnboardingStep.STRIPE_CONNECT) {
      setError('Complete Stripe connection first');
      return;
    }

    setLoading(true);
    setError(null);

    if (data.url) {
      try {
        const res = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: data.url }),
        });
        if (res.ok) {
          const { feelData: fd } = await res.json();
          setFeelData(fd);
          setStatus('lightweight');
        } else {
          const { error: err } = await res.json();
          setError(err || 'Scrape failed');
        }
      } catch (err) {
        setError('Scrape failed');
      }
    } else {
      // Original product add logic
      const res = await fetch('/api/saas/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const newProduct = await res.json();
        setProducts((prev) => [...prev, newProduct]);
        form.reset();
      } else {
        setError('Failed to add product');
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (feelData && status !== 'completed') {
      const id = setInterval(async () => {
        try {
          const res = await fetch('/api/saas/my-account');
          if (res.ok) {
            const { saasCreator } = await res.json();
            if (saasCreator.crawlStatus === 'completed') {
              setMerged(saasCreator.mergedScrapeData.merged);
              setStatus('completed');
              clearInterval(id);
            }
          }
        } catch (err) {
          console.error('Poll error:', err);
        }
      }, 5000);
      setPollId(id);
      return () => {
        if (pollId) clearInterval(pollId);
      };
    }
  }, [feelData, status]);

  if (currentStep !== OnboardingStep.PRODUCT_SETUP) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Product Setup</CardTitle>
        <CardDescription>Add your first product to get started with your SaaS platform.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" {...form.register("name", { required: true })} />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Website URL (for scrape)</Label>
              <Input id="url" {...form.register("url")} value={url} onChange={(e) => setUrl(e.target.value)} />
              {form.formState.errors.url && <p className="text-sm text-destructive">{form.formState.errors.url.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...form.register("description")} />
            </div>
          </div>
          <div className="flex space-x-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Product'}
            </Button>
            <ProductModal
              onAdd={(product) => setProducts((prev) => [...prev, product])}
              disabled={loading}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
        <ProductsList
          products={products}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
        />
        {feelData && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>White-label Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <style dangerouslySetInnerHTML={{ __html: `:root { --primary-color: ${feelData.colors[0] || '#1A73E8'}; --font-family: ${feelData.fonts[0] || 'sans-serif'}; }` }} />
              <div style={{ color: feelData.colors[0], fontFamily: feelData.fonts[0] }}>
                Tone: {feelData.tone} | Headings: {feelData.headings.slice(0, 3).join(', ')} | Images: {feelData.images.slice(0, 2).map((i) => (
                  <img key={i.src} src={i.src} alt={i.alt} style={{ maxWidth: '100px', margin: '5px' }} />
                ))}
              </div>
              {status === 'lightweight' && <p className="text-yellow-600">Deep scrape in progress...</p>}
              {merged && <p className="text-green-600">Preview refined with deep data.</p>}
            </CardContent>
          </Card>
        )}
        <Button
          onClick={() => {
            if (status === 'completed') {
              onNext({ products, scrapeData: merged });
            } else if (feelData) {
              setError('Waiting for deep completion to continue');
            } else {
              onNext({ products });
            }
          }}
          className="w-full"
        >
          Continue to Business Info
        </Button>
      </CardContent>
    </Card>
  );
}