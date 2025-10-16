"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion, 
  AccordionItem, 
  AccordionTrigger, 
  AccordionContent 
} from "@/components/ui/accordion";
import { 
  TrendingUp, 
  Users,
  DollarSign, 
  Package,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  CreditCard,
  BarChart3,
  Copy,
  User,
  MapPin,
  Mail,
  Phone,
  MessageCircle,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface DesignToken {
  tokenKey: string;
  tokenType: string;
  tokenValue: string;
  source?: string;
  meta?: any;
}

interface WhiteLabelConfig {
  subdomain?: string;
  customDomain?: string;
  successRedirect?: string;
}

interface DesignTokensState {
  currentTokens: any;
  currentConfig: any;
  versions: any[];
  editingToken: number | null;
  editingValue: string;
}

interface DesignStudioProps {
  saasCreator: any;
  onUpdate?: () => void;
}

const ReviewSection = ({ designTokens, saasCreator, onRerunScrape, onSaveDesign, saving }: {
  designTokens: {
    currentTokens: {
      groupedTokens?: Record<string, DesignToken[]>;
      deepTokens?: DesignToken[];
      primaryColor?: string;
      secondaryColor?: string;
      logoUrl?: string;
      companyName?: string;
      companyInfo?: {
        emails?: string[];
      };
      brandVoice?: {
        summary?: string;
      };
      confidenceScores?: {
        colors?: number;
        logo?: number;
        fonts?: number;
      };
    } | null;
    currentConfig: any;
    versions: any[];
    editingToken: number | null;
    editingValue: string;
  };
  saasCreator: any;
  onRerunScrape: () => void;
  onSaveDesign: () => void;
  saving: boolean;
}) => {
  const tokens = designTokens.currentTokens;
  if (!tokens) {
    return (
      <Card className="border-dashed border-primary/30">
        <CardHeader>
          <CardTitle className="text-primary">Review Your Captured Setup</CardTitle>
          <CardDescription>No brand data captured yet. Run a scrape to analyze your site.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pt-4">
          <Button onClick={onRerunScrape} variant="outline">
            Scrape My Website
          </Button>
        </CardContent>
      </Card>
    );
  }

  const primaryColor = tokens.primaryColor || '#667eea';
  const secondaryColor = tokens.secondaryColor || '#f5f5f5';
  const logoUrl = tokens.logoUrl || '/placeholder-logo.svg';
  const companyName = tokens.companyName || saasCreator?.businessName || 'Your Company';
  const brandSummary = tokens.brandVoice?.summary || 'Professional and innovative SaaS brand.';
  const confidence = tokens.confidenceScores || { colors: 0.8, logo: 0.5, fonts: 0.7 };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Review Your Captured Setup</CardTitle>
        <CardDescription className="text-sm">
          See your brand data from the site analysis and profile. We analyzed your website and Stripe profile to capture your visual identity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Brand Info */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Your Brand</h4>
              <p className="text-muted-foreground mb-3">{brandSummary}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Company: {companyName}</Badge>
                {tokens.companyInfo?.emails?.[0] && <Badge>{tokens.companyInfo.emails[0]}</Badge>}
              </div>
            </div>
            {/* Confidence Scores */}
            <div>
              <h5 className="font-medium mb-2">Analysis Confidence</h5>
              <div className="flex flex-wrap gap-2">
                <Badge variant={confidence.colors! > 0.7 ? "default" : "secondary"}>Colors: {Math.round((confidence.colors || 0) * 100)}%</Badge>
                <Badge variant={confidence.logo! > 0.7 ? "default" : "secondary"}>Logo: {Math.round((confidence.logo || 0) * 100)}%</Badge>
                <Badge variant={confidence.fonts! > 0.7 ? "default" : "secondary"}>Fonts: {Math.round((confidence.fonts || 0) * 100)}%</Badge>
              </div>
            </div>
          </div>
          {/* Right: Palette & Preview */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2" style={{ color: primaryColor }}>Your Palette</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Primary Color</span>
                  <div 
                    className="w-16 h-16 rounded-lg border shadow-sm flex items-center justify-center text-xs font-mono hover:scale-105 transition-transform duration-200 cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {primaryColor}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Secondary Color</span>
                  <div 
                    className="w-16 h-16 rounded-lg border shadow-sm flex items-center justify-center text-xs font-mono hover:scale-105 transition-transform duration-200 cursor-pointer"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    {secondaryColor}
                  </div>
                </div>
              </div>
            </div>
            {/* Preview */}
            <div className="text-center">
              <h5 className="font-medium mb-2">Brand Preview</h5>
              <div 
                className="w-full h-48 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg border flex items-center justify-center p-4"
                style={{ 
                  '--primary': primaryColor, 
                  '--secondary': secondaryColor 
                } as React.CSSProperties}
              >
                <div className="text-center">
                  {logoUrl !== '/placeholder-logo.svg' ? (
                    <img src={logoUrl} alt="Logo" className="h-12 w-auto mx-auto mb-2 rounded" />
                  ) : (
                    <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <p className="font-semibold text-primary" style={{ color: primaryColor }}>Welcome to {companyName}</p>
                  <p className="text-sm text-muted-foreground">Your SaaS Platform</p>
                  <p className="text-base font-medium mt-2" style={{ 
                    fontFamily: tokens.deepTokens?.find((t: DesignToken) => t.tokenType === 'typography')?.tokenValue || 'sans-serif',
                    color: primaryColor 
                  }}>
                    Sample text in your font
                  </p>
                  <p className="text-sm italic mt-2" style={{ color: primaryColor }}>
                    &#34;{brandSummary}&#34;
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-3" 
                    style={{ 
                      padding: tokens.deepTokens?.find((t: DesignToken) => t.tokenType === 'spacing' && t.tokenKey.includes('md'))?.tokenValue || '1rem 2rem',
                      borderColor: primaryColor 
                    }}
                  >
                    Example CTA
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={onRerunScrape}
            className="flex-1"
          >
            Back - Edit & Rescrape
          </Button>
          <Button 
            onClick={onSaveDesign} 
            disabled={saving}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {saving ? 'Completing...' : 'Complete Setup'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const DesignStudio = ({ saasCreator, onUpdate }: DesignStudioProps) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig | null>(null);
  const [formData, setFormData] = useState({
    subdomain: '',
    customDomain: '',
    successRedirect: '',
  });
  const [saving, setSaving] = useState(false);
  const [designTokens, setDesignTokens] = useState<DesignTokensState>({
    currentTokens: null,
    currentConfig: null,
    versions: [],
    editingToken: null,
    editingValue: '',
  });
  const [showVersions, setShowVersions] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [logoPreview, setLogoPreview] = useState('');

  const fetchDesignTokens = useCallback(async () => {
    try {
      const response = await fetch('/api/saas/design');
      if (response.ok) {
        const data = await response.json();
        setDesignTokens({
          currentTokens: data.currentTokens,
          currentConfig: data.currentConfig,
          versions: data.versions,
          editingToken: null,
          editingValue: '',
        });
        setLogoPreview(''); // Clear preview on refresh
      }
    } catch (error) {
      console.error('Failed to fetch design tokens:', error);
    }
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/tiff', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a PNG, JPG, TIFF, or WEBP image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (!base64) return;

      setLogoPreview(base64);

      try {
        const response = await fetch('/api/saas/design', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update-logo', logoData: base64 }),
        });

        if (response.ok) {
          toast.success('Logo uploaded and updated successfully!');
          // Refresh to sync with DB
          await fetchDesignTokens();
        } else {
          const errorData = await response.json();
          const errorMessage = errorData.error?.message || errorData.message || errorData.error || 'Failed to update logo';
          toast.error(errorMessage);
          setLogoPreview(''); // Revert on error
        }
      } catch (error) {
        console.error('Logo upload error:', error);
        toast.error('Failed to upload logo');
        setLogoPreview('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRerunScrape = async () => {
    if (!saasCreator?.website) {
      toast.error('No website URL set. Please set your website URL in settings.');
      return;
    }

    try {
      const response = await fetch('/api/saas/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rerun', url: saasCreator.website }),
      });

      if (response.ok) {
        toast.success('Scrape rerun started. Check back in a few minutes.');
        setTimeout(fetchDesignTokens, 5000);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || errorData.message || errorData.error || 'Failed to rerun scrape';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('Failed to rerun scrape');
    }
  };

  const handleSaveDesign = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/saas/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens: designTokens.currentTokens,
          config: designTokens.currentConfig,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Design saved successfully. New version created.');
        fetchDesignTokens();
        onUpdate?.();
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || errorData.message || errorData.error || 'Failed to save design';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('Failed to save design');
    } finally {
      setSaving(false);
    }
  };

  const handleEditToken = (index: number) => {
    setDesignTokens({
      ...designTokens,
      editingToken: index,
      editingValue: designTokens.currentTokens.deepTokens[index].tokenValue,
    });
  };

  const handleTokenChange = (index: number, value: string) => {
    setDesignTokens({
      ...designTokens,
      editingValue: value,
    });
  };

  const handleConfigChange = (key: string, value: string) => {
    setDesignTokens(prev => ({
      ...prev,
      currentConfig: {
        ...prev.currentConfig,
        [key]: value,
      },
    }));
  };

  const handleRevertVersion = async (versionId: string) => {
    try {
      const response = await fetch('/api/saas/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revert', versionId }),
      });

      if (response.ok) {
        toast.success('Version reverted successfully.');
        fetchDesignTokens();
        onUpdate?.();
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || errorData.message || errorData.error || 'Failed to revert version';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('Failed to revert version');
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/saas/white-label/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setWhiteLabelConfig({
          subdomain: data.config.subdomain,
          customDomain: data.config.customDomain,
        });
        toast.success('Configuration saved successfully');
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || errorData.message || errorData.error || 'Failed to save configuration';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const fetchWhiteLabelConfig = useCallback(async () => {
    try {
      const response = await fetch("/api/saas/white-label/config");
      if (response.ok) {
        const data = await response.json();
        setWhiteLabelConfig({
          subdomain: data.subdomain,
          customDomain: data.customDomain,
        });
        setFormData({
          subdomain: data.subdomain || '',
          customDomain: data.customDomain || '',
          successRedirect: data.successRedirect || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch white label config:', error);
    }
  }, []);

  useEffect(() => {
    fetchDesignTokens();
    fetchWhiteLabelConfig();
  }, [fetchDesignTokens, fetchWhiteLabelConfig]);

  if (!designTokens.currentTokens) {
    return <ReviewSection designTokens={designTokens} saasCreator={saasCreator} onRerunScrape={handleRerunScrape} onSaveDesign={handleSaveDesign} saving={saving} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-4 mt-4">
        <Button variant="outline" size="sm" onClick={handleRerunScrape} className="border-primary/50">
          🔄 Rerun Extraction
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowVersions(true)}>
          📋 Manage Versions
        </Button>
      </div>

      {/* Brand Identity Section */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold" style={{ color: designTokens.currentTokens.primaryColor || '#667eea' }}>
              Brand Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              {logoPreview || designTokens.currentTokens?.logoUrl ? (
                <img
                  src={logoPreview || designTokens.currentTokens.logoUrl}
                  alt="Brand Logo"
                  className="h-20 w-auto rounded-xl shadow-lg object-contain border-2 border-primary/20"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="h-20 w-20 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white font-bold shadow-lg border-2 border-primary/20">
                  Logo
                </div>
              )}
            </div>
            <div className="text-center space-y-2">
              {!logoPreview && !designTokens.currentTokens?.logoUrl && (
                <p className="text-sm text-muted-foreground">Upload your logo to customize your brand identity</p>
              )}
              <Input
                type="file"
                accept="image/png,image/jpeg,image/tiff,image/webp"
                onChange={handleLogoUpload}
                className="mx-auto max-w-xs"
              />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2" style={{ 
                color: designTokens.currentTokens.primaryColor || '#667eea',
                fontFamily: designTokens.currentTokens.deepTokens?.find((t: DesignToken) => t.tokenType === 'typography' && t.tokenKey.includes('heading'))?.tokenValue || 'Inter, sans-serif'
              }}>
                {designTokens.currentTokens.companyName || saasCreator?.businessName || 'Your Brand'}
              </h3>
              {designTokens.currentTokens.brandVoice?.summary && (
                <p className="text-muted-foreground italic text-sm" style={{ 
                  fontFamily: designTokens.currentTokens.deepTokens?.find((t: DesignToken) => t.tokenType === 'typography' && t.tokenKey.includes('body'))?.tokenValue || 'serif',
                  fontStyle: 'italic'
                }}>
                  &#34;{designTokens.currentTokens.brandVoice.summary}&#34;
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {designTokens.currentTokens.companyInfo?.name || 'Company'}
                </Badge>
                {designTokens.currentTokens.companyInfo?.emails?.[0] && (
                  <Badge variant="outline">{designTokens.currentTokens.companyInfo.emails[0]}</Badge>
                )}
                {designTokens.currentTokens.brandVoice?.tone && (
                  <Badge variant="default" className="bg-secondary text-secondary-foreground">
                    {designTokens.currentTokens.brandVoice.tone} Tone
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-muted/5 hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-secondary-foreground">
              Company Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {designTokens.currentTokens.companyInfo ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-4 w-4 text-primary" />
                  <div>
                    <span className="font-medium">Emails:</span>
                    {designTokens.currentTokens.companyInfo.emails.length > 0 ? (
                      designTokens.currentTokens.companyInfo.emails.map((email: string, i: number) => (
                        <Badge key={i} variant="secondary" className="mr-1 mt-1">{email}</Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No emails</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="h-4 w-4 text-primary" />
                  <div>
                    <span className="font-medium">Phones:</span>
                    {designTokens.currentTokens.companyInfo.phones.length > 0 ? (
                      designTokens.currentTokens.companyInfo.phones.map((phone: string, i: number) => (
                        <Badge key={i} variant="outline" className="mr-1 mt-1">{phone}</Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No phones</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <div>
                    <span className="font-medium">Social:</span>
                    {designTokens.currentTokens.companyInfo.socialLinks.length > 0 ? (
                      designTokens.currentTokens.companyInfo.socialLinks.map((link: {url: string, platform: string}, i: number) => (
                        <Badge key={i} variant="secondary" className="mr-1 mt-1">
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-inherit no-underline hover:underline">{link.platform}</a>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No social links</span>
                    )}
                  </div>
                </div>
                {designTokens.currentTokens.brandVoice && (
                  <div className="p-3 rounded-lg bg-primary/5">
                    <span className="font-medium block mb-1">Personality Traits:</span>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(designTokens.currentTokens.brandVoice.personality) ? (
                        designTokens.currentTokens.brandVoice.personality.map((trait: string, i: number) => (
                          <Badge key={i} variant="outline">{trait}</Badge>
                        ))
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No company details captured yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Colors & Typography Sections */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Color Palette */}
        <Card className="border-primary/20 hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-xl font-bold flex items-center gap-2" style={{ color: designTokens.currentTokens?.primaryColor || '#667eea' }}>
              <span className="text-2xl">🎨</span> Color Palette
            </CardTitle>
            <CardDescription>Primary, secondary, and extracted colors from your brand</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Primary & Secondary */}
              {designTokens.currentTokens?.primaryColor && (
                <div 
                  className="group relative w-full h-20 rounded-xl border-2 border-primary/20 cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg"
                  style={{ backgroundColor: designTokens.currentTokens.primaryColor }}
                  onClick={() => {
                    navigator.clipboard.writeText(designTokens.currentTokens.primaryColor);
                    toast.success('Primary color copied!');
                  }}
                  title="Click to copy"
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Copy className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute bottom-2 right-2 text-xs font-mono text-white/90 bg-black/20 rounded px-1">
                    Primary
                  </div>
                </div>
              )}
              {designTokens.currentTokens?.secondaryColor && (
                <div 
                  className="group relative w-full h-20 rounded-xl border-2 border-secondary/20 cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg"
                  style={{ backgroundColor: designTokens.currentTokens.secondaryColor }}
                  onClick={() => {
                    navigator.clipboard.writeText(designTokens.currentTokens.secondaryColor);
                    toast.success('Secondary color copied!');
                  }}
                  title="Click to copy"
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Copy className="h-4 w-4 text-black" />
                  </div>
                  <div className="absolute bottom-2 right-2 text-xs font-mono text-black/90 bg-white/20 rounded px-1">
                    Secondary
                  </div>
                </div>
              )}
              {/* Grouped Colors */}
              {designTokens.currentTokens?.groupedTokens?.color && designTokens.currentTokens.groupedTokens.color.slice(0, 6).map((token: DesignToken, i: number) => (
                <div 
                  key={i}
                  className="group relative w-full h-16 rounded-lg border cursor-pointer hover:scale-105 transition-all duration-300 shadow-md"
                  style={{ backgroundColor: token.tokenValue }}
                  onClick={() => {
                    navigator.clipboard.writeText(token.tokenValue);
                    toast.success(`${token.tokenKey} copied!`);
                  }}
                  title={`${token.tokenKey}: Click to copy`}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                    <Copy className="h-3 w-3 text-white" />
                  </div>
                  <div className="absolute -bottom-8 left-0 right-0 text-center text-xs font-mono bg-background/90 backdrop-blur-sm rounded px-2 py-1 text-white/90">
                    {token.tokenKey}
                  </div>
                </div>
              ))}
            </div>
            {designTokens.currentTokens?.groupedTokens?.color?.length > 6 && (
              <Button variant="link" className="mt-4 p-0 h-auto text-primary">
                View all {designTokens.currentTokens.groupedTokens.color.length} colors
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Typography */}
        <Card className="border-secondary/20 hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-secondary/5">
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-secondary-foreground">
              <span className="text-2xl">📝</span> Typography
            </CardTitle>
            <CardDescription>Font families, sizes, and weights from your design</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              {/* Heading Demo */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Heading (H1)</Label>
                <h1 className="text-3xl font-bold" style={{ 
                  fontFamily: designTokens.currentTokens?.deepTokens?.find((t: DesignToken) => t.tokenType === 'typography' && t.tokenKey.includes('heading'))?.tokenValue || 'Inter, sans-serif',
                  color: designTokens.currentTokens?.primaryColor || '#667eea'
                }}>
                  Your Brand Heading
                </h1>
                <p className="text-xs text-muted-foreground">Applied: {designTokens.currentTokens?.deepTokens?.find((t: DesignToken) => t.tokenType === 'typography' && t.tokenKey.includes('heading'))?.tokenValue || 'Default'}</p>
              </div>
              {/* Body Demo */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Body Text</Label>
                <p className="text-base leading-relaxed" style={{ 
                  fontFamily: designTokens.currentTokens?.deepTokens?.find((t: DesignToken) => t.tokenType === 'typography' && t.tokenKey.includes('body'))?.tokenValue || 'serif'
                }}>
                  This is sample body text showcasing your brand typography. It should feel professional and aligned with your voice.
                </p>
                <p className="text-xs text-muted-foreground">Applied: {designTokens.currentTokens?.deepTokens?.find((t: DesignToken) => t.tokenType === 'typography' && t.tokenKey.includes('body'))?.tokenValue || 'Default'}</p>
              </div>
              {/* Accent Demo */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Accent / Caption</Label>
                <p className="text-sm italic font-light" style={{ 
                  fontFamily: designTokens.currentTokens?.deepTokens?.find((t: DesignToken) => t.tokenType === 'typography' && t.tokenKey.includes('caption'))?.tokenValue || 'serif',
                  color: designTokens.currentTokens?.secondaryColor || '#764ba2'
                }}>
                  This is an italic caption or quote style.
                </p>
                <p className="text-xs text-muted-foreground">Applied: {designTokens.currentTokens?.deepTokens?.find((t: DesignToken) => t.tokenType === 'typography' && t.tokenKey.includes('caption'))?.tokenValue || 'Default'}</p>
              </div>
            </div>
            {/* Token List if many */}
            {designTokens.currentTokens?.groupedTokens?.typography && (
              <div className="mt-6 pt-4 border-t">
                <h5 className="font-medium mb-3">All Typography Tokens ({designTokens.currentTokens.groupedTokens.typography.length})</h5>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                  {designTokens.currentTokens.groupedTokens.typography.map((token: DesignToken, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm font-medium">{token.tokenKey}</span>
                      <span className="text-xs" style={{ fontFamily: token.tokenValue }}>Aa {token.tokenValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>Page templates using your brand styles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => router.push(`/whitelabel/${whiteLabelConfig?.subdomain || 'preview'}/pricing`)} className="justify-start">
              <Package className="mr-2 h-4 w-4" /> Pricing Page
            </Button>
            <Button variant="outline" onClick={() => router.push(`/whitelabel/${whiteLabelConfig?.subdomain || 'preview'}/products`)} className="justify-start">
              <Users className="mr-2 h-4 w-4" /> Products Page
            </Button>
            <Button variant="outline" onClick={() => router.push(`/whitelabel/${whiteLabelConfig?.subdomain || 'preview'}/account`)} className="justify-start">
              <User className="mr-2 h-4 w-4" /> Account Portal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* White Label Configuration */}
      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            White Label Settings
          </CardTitle>
          <CardDescription>Configure your custom domain and redirects for white-label experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain (e.g., mycompany)</Label>
              <Input
                id="subdomain"
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                placeholder="Enter subdomain"
              />
              <p className="text-xs text-muted-foreground">Your white-label site will be at {window.location.origin}/{formData.subdomain}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customDomain">Custom Domain (optional)</Label>
              <Input
                id="customDomain"
                value={formData.customDomain}
                onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                placeholder="e.g., app.mycompany.com"
              />
              <p className="text-xs text-muted-foreground">Full custom domain for advanced setup (requires DNS configuration).</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="successRedirect">Success Redirect URL (optional)</Label>
              <Input
                id="successRedirect"
                value={formData.successRedirect}
                onChange={(e) => setFormData({ ...formData, successRedirect: e.target.value })}
                placeholder="e.g., https://mycompany.com/thank-you"
              />
              <p className="text-xs text-muted-foreground">Where users are redirected after successful subscription.</p>
            </div>
          </div>
          <Button onClick={handleSaveConfig} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save White Label Config'}
          </Button>
          {whiteLabelConfig && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                Current: {whiteLabelConfig.subdomain ? `Subdomain: ${whiteLabelConfig.subdomain}` : 'No config set'}
                {whiteLabelConfig.customDomain && ` | Domain: ${whiteLabelConfig.customDomain}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Versions Management - Integrated */}
      {showVersions && (
        <Card className="border-warning/20 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <span className="text-xl">📋</span> Design Versions History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 items-center">
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="flex-1 p-3 border rounded-md focus:border-primary focus:ring-primary/20"
                style={{ 
                  borderRadius: designTokens.currentTokens?.deepTokens?.find((t: DesignToken) => t.tokenType === 'border' && t.tokenKey.includes('md'))?.tokenValue || '0.375rem'
                }}
              >
                <option value="">Select a version to revert</option>
                {designTokens.versions?.map((version) => (
                  <option key={version.id} value={version.id}>
                    v{version.version} - {new Date(version.createdAt).toLocaleDateString()} {version.isActive && '(Active)'} • {version.confidence || 'N/A'}% confidence
                  </option>
                ))}
              </select>
              <Button 
                onClick={() => handleRevertVersion(selectedVersion)} 
                variant="destructive" 
                disabled={!selectedVersion}
                className="px-6"
                style={{ 
                  borderRadius: designTokens.currentTokens?.deepTokens?.find((t: DesignToken) => t.tokenType === 'border' && t.tokenKey.includes('md'))?.tokenValue || '0.375rem'
                }}
              >
                🔄 Revert
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowVersions(false)}
                className="px-6"
              >
                ❌ Close
              </Button>
            </div>
            {designTokens.versions?.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No versions yet. Save your first design to create one.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DesignStudio;