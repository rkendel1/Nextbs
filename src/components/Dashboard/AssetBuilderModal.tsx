"use client";

import { useState } from "react";
import { X, Code, FileText, Layout, Layers, Zap, CheckCircle2, Copy, Eye, Sparkles, Package, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import toast from "react-hot-toast";
import Loader from "@/components/Common/Loader";

interface AssetBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockTypes = {
  pages: { icon: FileText, title: "Page", description: "Full embeddable pages like pricing or account portals" },
  collections: { icon: Layout, title: "Collection", description: "Grouped components like product grids" },
  components: { icon: Package, title: "Component", description: "Individual UI elements like buttons or headers" },
  widgets: { icon: Layers, title: "Widget", description: "Interactive elements like modals or trackers" },
} as const;

type MockTypeKey = keyof typeof mockTypes;

const AssetBuilderModal = ({ open, onOpenChange }: AssetBuilderModalProps) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [assetType, setAssetType] = useState<MockTypeKey>("pages");
  const [assetData, setAssetData] = useState({
    name: "",
    description: "",
    isActive: true,
  });
  const [configData, setConfigData] = useState({
    style: "brand",
    customDomain: "",
    previewUrl: "",
  });
  const [features, setFeatures] = useState([""]);
  const [generatedSnippet, setGeneratedSnippet] = useState("");
  const [copied, setCopied] = useState(false);

  const addFeature = () => setFeatures([...features, ""]);
  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };
  const removeFeature = (index: number) => setFeatures(features.filter((_, i) => i !== index));

  const generateSnippet = () => {
    const baseUrl = window.location.origin;
    const snippet = `<script src="${baseUrl}/embed.js" data-type="${assetType}" data-id="${assetData.name.toLowerCase().replace(/\s+/g, '-')}" data-style="${configData.style}"></script>`;
    setGeneratedSnippet(snippet);
    toast.success("Embed asset created successfully!");
    setStep(5);
  };

  const handleClose = (updated = false) => {
    if (updated) {
      onOpenChange(false);
      // TODO: Save to backend if needed
    } else {
      onOpenChange(false);
    }
    setStep(0);
    setAssetData({ name: "", description: "", isActive: true });
    setConfigData({ style: "brand", customDomain: "", previewUrl: "" });
    setFeatures([""]);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Code className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-dark dark:text-white mb-2">Choose Your Embed Type</h3>
              <p className="text-sm text-body-color dark:text-dark-6">Select the embed type that fits your needs</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(mockTypes).map(([type, { icon: Icon, title, description }]) => {
                const isSelected = assetType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setAssetType(type as MockTypeKey)}
                    className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                      isSelected ? "border-primary bg-primary/5 dark:bg-primary/10" : "border-stroke hover:border-primary/50 dark:border-dark-3"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-dark dark:text-white mb-1">{title}</h4>
                        <p className="text-sm text-body-color dark:text-dark-6 mb-2">{description}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="h-6 w-6 text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => handleClose(false)} className="flex-1">Cancel</Button>
              <Button onClick={() => setStep(1)} className="flex-1 bg-primary hover:bg-primary/90">Continue</Button>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-dark dark:text-white mb-2">Embed Information</h3>
              <p className="text-sm text-body-color dark:text-dark-6">Enter details for your {mockTypes[assetType].title.toLowerCase()}</p>
            </div>
            <div>
              <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">Name *</label>
              <input
                type="text"
                placeholder={`e.g., Custom ${mockTypes[assetType].title}`}
                value={assetData.name}
                onChange={(e) => setAssetData({ ...assetData, name: e.target.value })}
                className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">Description</label>
              <textarea
                placeholder="Brief description of this embed..."
                value={assetData.description}
                onChange={(e) => setAssetData({ ...assetData, description: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
              />
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex gap-2">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Naming Tips</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Keep it descriptive but concise for easy identification in your dashboard.</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(0)} className="flex-1">Back</Button>
              <Button onClick={() => setStep(2)} disabled={!assetData.name.trim()} className="flex-1 bg-primary hover:bg-primary/90">Next: Configuration</Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-dark dark:text-white mb-2">Configuration</h3>
              <p className="text-sm text-body-color dark:text-dark-6">Customize your {mockTypes[assetType].title.toLowerCase()}</p>
            </div>
            <div>
              <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">Style</label>
              <select
                value={configData.style}
                onChange={(e) => setConfigData({ ...configData, style: e.target.value })}
                className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary"
              >
                <option value="brand">Branded</option>
                <option value="minimal">Minimal</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">Custom Domain (optional)</label>
              <input
                type="text"
                placeholder="e.g., embeds.yourdomain.com"
                value={configData.customDomain}
                onChange={(e) => setConfigData({ ...configData, customDomain: e.target.value })}
                className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
              />
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex gap-2">
                <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">Configuration Tips</p>
                  <ul className="text-sm text-green-700 dark:text-green-300 mt-2 space-y-1">
                    <li>• Branded style uses your white-label colors</li>
                    <li>• Custom domain makes embeds feel native to your site</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button onClick={() => setStep(3)} className="flex-1 bg-primary hover:bg-primary/90">Next: Features</Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-dark dark:text-white mb-2">Add Features</h3>
              <p className="text-sm text-body-color dark:text-dark-6">What capabilities does this embed provide?</p>
            </div>
            <div className="space-y-3">
              <label className="block text-base font-medium text-dark dark:text-white">Features</label>
              {features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Feature ${index + 1}`}
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    className="flex-1 rounded-md border border-stroke bg-transparent px-4 py-2 text-sm text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary"
                  />
                  {features.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeFeature(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={addFeature} className="w-full">+ Add Another Feature</Button>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="flex gap-2">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Feature Tips</p>
                  <ul className="text-sm text-purple-700 dark:text-purple-300 mt-2 space-y-1">
                    <li>• Be specific: &quot;Responsive on all devices&quot; not &quot;Mobile friendly&quot;</li>
                    <li>• Highlight unique value: &quot;One-click subscribe&quot; or &quot;Real-time previews&quot;</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
              <Button onClick={() => setStep(4)} disabled={features.every(f => !f.trim())} className="flex-1 bg-primary hover:bg-primary/90">Next: Review</Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-dark dark:text-white mb-2">Review Your Embed</h3>
              <p className="text-sm text-body-color dark:text-dark-6">Confirm details before generating</p>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg border-2 border-dashed border-primary/30">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-body-color dark:text-dark-6 mb-1">Type</p>
                  <p className="text-lg font-semibold text-dark dark:text-white">{mockTypes[assetType].title}</p>
                </div>
                <div className="h-px bg-stroke dark:bg-dark-3" />
                <div>
                  <p className="text-xs text-body-color dark:text-dark-6 mb-1">Name</p>
                  <p className="text-lg font-semibold text-dark dark:text-white">{assetData.name}</p>
                  {assetData.description && <p className="text-sm text-body-color dark:text-dark-6 mt-1">{assetData.description}</p>}
                </div>
                <div className="h-px bg-stroke dark:bg-dark-3" />
                <div>
                  <p className="text-xs text-body-color dark:text-dark-6 mb-1">Style</p>
                  <p className="text-lg font-semibold text-dark dark:text-white">{configData.style}</p>
                </div>
                {features.filter(f => f.trim()).length > 0 && (
                  <>
                    <div className="h-px bg-stroke dark:bg-dark-3" />
                    <div>
                      <p className="text-xs text-body-color dark:text-dark-6 mb-2">Features</p>
                      <ul className="space-y-1">
                        {features.filter(f => f.trim()).map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-dark dark:text-white">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(3)} className="flex-1">Back</Button>
              <Button onClick={generateSnippet} disabled={loading} className="flex-1 bg-primary hover:bg-primary/90">
                {loading ? <Loader /> : "Generate Embed"}
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full animate-ping opacity-75" />
              <div className="relative bg-gradient-to-r from-green-400 to-emerald-600 rounded-full p-6">
                <Code className="h-12 w-12 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold mb-2">Embed Created Successfully!</h3>
              <p className="text-xl text-body-color dark:text-dark-6 mb-4">{assetData.name} is ready to use!</p>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg">
              <h4 className="font-semibold text-dark dark:text-white mb-3 flex items-center gap-2 justify-center">
                <Eye className="h-5 w-5 text-primary" /> Preview
              </h4>
              <iframe
                src="/embed/platform"
                width="100%"
                height="200"
                className="w-full rounded border"
              />
            </div>
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 rounded-lg">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-3xl">🔗</span>
                  <p className="text-lg font-semibold text-dark dark:text-white">Embed Code</p>
                </div>
                <p className="text-sm text-body-color dark:text-dark-6 mb-4">Add this to your website:</p>
                <div className="relative">
                  <textarea
                    readOnly
                    value={generatedSnippet}
                    className="w-full h-20 p-3 border rounded-lg text-sm font-mono bg-gray-100 dark:bg-dark-3 resize-none"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedSnippet);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? <ClipboardCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-center pt-8">
              <Button onClick={() => handleClose(true)} className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white px-8 py-3 rounded-lg font-semibold transition-all">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Done & Create Another
              </Button>
            </div>
          </div>
        );

      default:
        return <div className="text-center p-8"><p className="text-body-color dark:text-dark-6">Invalid step.</p></div>;
    }
  };

  if (!open) return null;

  if (loading && step < 5) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-dark-2 p-6 rounded-lg shadow-xl">
          <Loader />
          <p className="mt-4 text-center text-dark dark:text-white">Generating embed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={() => handleClose(false)}
          aria-hidden="true"
        />
        <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 sm:align-middle dark:bg-dark-2 max-h-[90vh] overflow-y-auto">
          <div className="mb-6">
            <p className="text-center text-sm mb-2 text-muted-foreground">Step {step + 1} of 5</p>
            <Progress value={(step / 4) * 100} className="w-full" />
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetBuilderModal;