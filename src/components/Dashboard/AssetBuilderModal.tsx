"use client";

import { useState } from "react";
import { X, Code, FileText, Layout, Layers, Zap, CheckCircle2, Copy, Eye, Sparkles, Package, ClipboardCheck, Bot, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import toast from "react-hot-toast";
import Loader from "@/components/Common/Loader";

interface AssetBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GeneratedEmbed {
  name: string;
  type: 'PAGE' | 'COLLECTION' | 'COMPONENT' | 'WIDGET';
  description: string;
  features: string[];
  customHTML: string;
  customCSS: string;
  customJS: string;
  designVersionId?: string;
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
  
  // AI-guided experience states
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generatedEmbed, setGeneratedEmbed] = useState<GeneratedEmbed | null>(null);
  const [showAiInput, setShowAiInput] = useState(false);

  // Custom code editing states
  const [customHTML, setCustomHTML] = useState("");
  const [customCSS, setCustomCSS] = useState("");
  const [customJS, setCustomJS] = useState("");

  const addFeature = () => setFeatures([...features, ""]);
  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };
  const removeFeature = (index: number) => setFeatures(features.filter((_, i) => i !== index));

  const typeMap: Record<MockTypeKey, string> = {
    pages: 'page',
    collections: 'collection',
    components: 'component',
    widgets: 'widget',
  };

  const generateSnippet = async () => {
    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      const singularType = typeMap[assetType];
      const featuresJson = JSON.stringify(features.filter(f => f.trim()));
      const configJson = JSON.stringify(configData);

      const embedData = {
        name: assetData.name,
        type: singularType.toUpperCase(),
        description: assetData.description,
        features: featuresJson,
        config: configJson,
        customHTML: customHTML || undefined,
        customCSS: customCSS || undefined,
        customJS: customJS || undefined,
        // designVersionId can be fetched from context if needed
      };

      const response = await fetch('/api/saas/embeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(embedData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create embed');
      }

      const createdEmbed = await response.json();
      const id = createdEmbed.id;

      const snippet = `<script src="${baseUrl}/embed.js" data-type="${singularType}" data-id="${id}" data-style="${configData.style}"></script>`;
      setGeneratedSnippet(snippet);
      toast.success("Embed created and saved successfully!");
      setStep(2); // Now step 2 is success/review
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create embed');
    } finally {
      setLoading(false);
    }
  };
  
  const generateAIEmbed = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a prompt for the AI");
      return;
    }
    
    setIsGeneratingAI(true);
    try {
      // Safely get the base URL, defaulting to relative path if window is not available
      let apiUrl = '/api/saas/embeds/ai-generate';
      try {
        if (typeof window !== 'undefined') {
          apiUrl = `${window.location.origin}/api/saas/embeds/ai-generate`;
        }
      } catch (e) {
        console.warn('Could not access window.location, using relative path');
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      
      let data;
      try {
        const responseText = await response.text();
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', responseText);
          throw new Error('Invalid response format from server');
        }
      } catch (textError) {
        console.error('Failed to get response text:', textError);
        throw new Error('Failed to read server response');
      }
      
      if (!response.ok) {
        throw new Error(data?.error || `Server error: ${response.status}`);
      }
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response data from server');
      }
      
      setGeneratedEmbed(data);
      
      // Pre-fill form with AI-generated data, with validation
      const typeMap: Record<string, MockTypeKey> = {
        'page': 'pages',
        'collection': 'collections',
        'component': 'components',
        'widget': 'widgets'
      };
      if (data.type && typeof data.type === 'string') {
        const lowerType = data.type.toLowerCase();
        const mappedType = typeMap[lowerType as keyof typeof typeMap];
        if (mappedType) {
          setAssetType(mappedType);
        }
      }
      
      setAssetData({
        name: data.name || 'AI Generated Embed',
        description: data.description || '',
        isActive: true,
      });
      
      if (Array.isArray(data.features) && data.features.length > 0) {
        setFeatures(data.features);
      } else {
        setFeatures([""]);
      }

      // Set custom code from AI
      setCustomHTML(data.customHTML || '');
      setCustomCSS(data.customCSS || '');
      setCustomJS(data.customJS || '');
      
      // Move to form step
      setStep(1);
      toast.success("AI generated your embed! Review and customize as needed.");
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate embed');
    } finally {
      setIsGeneratingAI(false);
      setShowAiInput(false);
    }
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
    setAiPrompt("");
    setGeneratedEmbed(null);
    setShowAiInput(false);
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
              <h3 className="text-2xl font-bold text-dark dark:text-white mb-2">Create Your Embed</h3>
              <p className="text-sm text-body-color dark:text-dark-6">Use AI to generate or build manually</p>
            </div>
            
            {showAiInput ? (
              <div className="space-y-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl border-2 border-primary/30">
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="h-6 w-6 text-primary" />
                  <h4 className="text-lg font-semibold text-dark dark:text-white">AI-Guided Creation</h4>
                </div>
                <p className="text-sm text-body-color dark:text-dark-6 mb-2">
                  Describe what kind of embed you want, and our AI will generate it for you.
                </p>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="E.g., Create a product showcase widget with a carousel that displays product images, titles, and prices with a buy now button"
                  rows={4}
                  className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
                />
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAiInput(false)} 
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={generateAIEmbed} 
                    disabled={isGeneratingAI || !aiPrompt.trim()} 
                    className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                  >
                    {isGeneratingAI ? (
                      <Loader />
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <>
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
                
                <Button 
                  onClick={() => setShowAiInput(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  <Wand2 className="h-5 w-5 mr-2" />
                  Let AI Create Your Embed
                </Button>
                
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => handleClose(false)} className="flex-1">Cancel</Button>
                  <Button onClick={() => setStep(1)} className="flex-1 bg-primary hover:bg-primary/90">Build Manually</Button>
                </div>
              </>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-dark dark:text-white mb-2">Embed Details</h3>
              <p className="text-sm text-body-color dark:text-dark-6">Customize your {mockTypes[assetType].title.toLowerCase()} embed</p>
            </div>
            
            {generatedEmbed && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-4">
                <div className="flex gap-2">
                  <Wand2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">AI Generated</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Edit the details and custom code below. Preview updates in real-time.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <label className="block text-base font-medium text-dark dark:text-white">Name *</label>
              <input
                type="text"
                placeholder={`e.g., Custom ${mockTypes[assetType].title}`}
                value={assetData.name}
                onChange={(e) => setAssetData({ ...assetData, name: e.target.value })}
                className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
                autoFocus
              />
              <label className="block text-base font-medium text-dark dark:text-white">Description</label>
              <textarea
                placeholder="Brief description of this embed..."
                value={assetData.description}
                onChange={(e) => setAssetData({ ...assetData, description: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
              />
            </div>

            {/* Configuration */}
            <div className="space-y-4">
              <label className="block text-base font-medium text-dark dark:text-white">Style</label>
              <select
                value={configData.style}
                onChange={(e) => setConfigData({ ...configData, style: e.target.value })}
                className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary"
              >
                <option value="brand">Branded</option>
                <option value="minimal">Minimal</option>
                <option value="custom">Custom</option>
              </select>
              <label className="block text-base font-medium text-dark dark:text-white">Custom Domain (optional)</label>
              <input
                type="text"
                placeholder="e.g., embeds.yourdomain.com"
                value={configData.customDomain}
                onChange={(e) => setConfigData({ ...configData, customDomain: e.target.value })}
                className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
              />
            </div>

            {/* Features */}
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
              <Button type="button" variant="outline" onClick={addFeature} className="w-full">+ Add Another Feature</Button>
            </div>

            {/* Custom Code - only show if AI generated or manual custom */}
            {(generatedEmbed || customHTML || customCSS || customJS) && (
              <div className="space-y-4">
                <label className="block text-base font-medium text-dark dark:text-white">Custom Code (AI Generated)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-dark dark:text-white mb-1">HTML</label>
                    <textarea
                      value={customHTML}
                      onChange={(e) => setCustomHTML(e.target.value)}
                      placeholder="Custom HTML content..."
                      rows={6}
                      className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark dark:text-white mb-1">CSS</label>
                    <textarea
                      value={customCSS}
                      onChange={(e) => setCustomCSS(e.target.value)}
                      placeholder="Custom CSS..."
                      rows={6}
                      className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark dark:text-white mb-1">JavaScript</label>
                  <textarea
                    value={customJS}
                    onChange={(e) => setCustomJS(e.target.value)}
                    placeholder="Custom JS..."
                    rows={4}
                    className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary font-mono"
                  />
                </div>

                {/* Preview */}
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-dark-3">
                  <label className="block text-sm font-medium text-dark dark:text-white mb-2">Live Preview</label>
                  <iframe
                    srcDoc={`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <style>${customCSS || ''}</style>
                      </head>
                      <body style="margin: 0; padding: 1rem; font-family: system-ui;">
                        ${customHTML || '<p>Preview: Enter custom HTML above</p>'}
                        <script>${customJS || ''}<\/script>
                      </body>
                      </html>
                    `}
                    className="w-full h-48 border rounded-md"
                    sandbox="allow-scripts"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(0)} className="flex-1">Back</Button>
              <Button onClick={() => setStep(2)} disabled={!assetData.name.trim()} className="flex-1 bg-primary hover:bg-primary/90">
                Next: Review & Save
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-dark dark:text-white mb-2">Review & Create</h3>
              <p className="text-sm text-body-color dark:text-dark-6">Confirm details and generate your embed</p>
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
                {(customHTML || customCSS || customJS) && (
                  <>
                    <div className="h-px bg-stroke dark:bg-dark-3" />
                    <div>
                      <p className="text-xs text-body-color dark:text-dark-6 mb-2">Custom Code</p>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                        <p className="text-xs text-green-700 dark:text-green-300">
                          Includes custom HTML, CSS, and JavaScript for advanced functionality.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Snippet Preview */}
            <div className="bg-gray-50 dark:bg-dark-3 p-4 rounded-lg">
              <h4 className="font-semibold text-dark dark:text-white mb-3 flex items-center gap-2">
                <Code className="h-4 w-4" /> Embed Code Preview
              </h4>
              <div className="relative">
                <textarea
                  readOnly
                  value={generatedSnippet || `<script src="${window.location.origin}/embed.js" data-type="${typeMap[assetType]}" data-id="[ID]" data-style="${configData.style}"></script>`}
                  className="w-full h-20 p-3 border rounded-lg text-sm font-mono bg-white dark:bg-dark-2 resize-none"
                  placeholder="Snippet will appear after saving..."
                />
                {generatedSnippet && (
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
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">Back to Edit</Button>
              <Button onClick={generateSnippet} disabled={loading || !assetData.name.trim()} className="flex-1 bg-primary hover:bg-primary/90">
                {loading ? <Loader /> : "Create & Save Embed"}
              </Button>
            </div>
          </div>
        );

      // Remove cases 3 and 4, merged into 1 and 2

      case 2:
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
                <Eye className="h-5 w-5 text-primary" /> Live Preview
              </h4>
              <iframe
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <style>${customCSS || ''}</style>
                  </head>
                  <body style="margin: 0; padding: 1rem; font-family: system-ui;">
                    ${customHTML || '<p>Preview: Embed saved successfully!</p>'}
                    <script>${customJS || ''}<\/script>
                  </body>
                  </html>
                `}
                width="100%"
                height="300"
                className="w-full rounded border"
                sandbox="allow-scripts"
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