"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Globe, AlertCircle } from "lucide-react";

interface URLScrapeStepProps {
  data: any;
  onComplete: (data: any) => void;
  loading: boolean;
}

const URLScrapeStep = ({ data, onComplete, loading }: URLScrapeStepProps) => {
  const [url, setUrl] = useState(data.website || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const validateURL = (urlString: string): boolean => {
    try {
      new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    if (!normalizedUrl) {
      setError("Please enter your website URL");
      setIsSubmitting(false);
      return;
    }

    if (!validateURL(normalizedUrl)) {
      setError("Please enter a valid URL (e.g., example.com)");
      setIsSubmitting(false);
      return;
    }

    try {
      // Trigger scrape (both lightweight and deep scraping happen in one call)
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Failed to start scraping: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to start scraping");
      }

      toast.success("Scraping started in the background! Moving to next step...", {
        duration: 4000,
        icon: "🔍",
      });

      // Pass original user input as website, normalized for API
      onComplete({ website: url });

    } catch (err) {
      console.error("Error triggering scrapes:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to start scraping. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-6 w-6" />
          Enter Your Site URL
        </CardTitle>
        <CardDescription>
          We&apos;ll automatically analyze your website in the background to prepopulate your profile and branding details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="website">Website URL</Label>
            <Input
              id="website"
              type="text"
              placeholder="example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isSubmitting || loading}
              className="w-full"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <Button type="submit" disabled={isSubmitting || loading || !url.trim()} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting scrape...
              </>
            ) : (
              "Start Analysis & Continue"
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          We&apos;ll analyze your site for branding details and design tokens automatically.
        </p>
      </CardContent>
    </Card>
  );
};

export default URLScrapeStep;