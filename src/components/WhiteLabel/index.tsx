"use client";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Loader from "@/components/Common/Loader";

interface WhiteLabelConfig {
  id?: string;
  brandName: string;
  primaryColor: string;
  logoUrl: string;
  customDomain: string;
  subdomain: string;
  customCss: string;
  isActive: boolean;
  pageVisibility: 'public' | 'private' | 'unlisted';
}

const WhiteLabelConfiguration = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<WhiteLabelConfig>({
    brandName: "",
    primaryColor: "#667eea",
    logoUrl: "",
    customDomain: "",
    subdomain: "",
    customCss: "",
    isActive: true,
    pageVisibility: "public",
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/saas/white-label");
      const data = await response.json();
      
      if (response.ok && data.config) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error("Failed to load configuration:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/saas/white-label", {
        method: config.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("White-label configuration saved successfully!");
        setConfig(data.config);
      } else {
        toast.error(data.message || "Failed to save configuration");
      }
    } catch (error) {
      console.error("Failed to save configuration:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
        <div className="flex items-center justify-center p-12">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Configuration */}
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
        <h2 className="mb-6 text-xl font-bold text-dark dark:text-white">
          Branding Settings
        </h2>

        <div className="space-y-4">
          {/* Brand Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              Brand Name
            </label>
            <input
              type="text"
              value={config.brandName}
              onChange={(e) => setConfig({ ...config, brandName: e.target.value })}
              placeholder="Your Brand Name"
              className="w-full rounded-md border border-stroke bg-transparent px-4 py-2 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
            />
            <p className="mt-1 text-xs text-body-color dark:text-dark-6">
              This name will be displayed throughout your platform.
            </p>
          </div>

          {/* Primary Color */}
          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              Primary Color
            </label>
            <div className="flex gap-3">
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                className="h-10 w-20 cursor-pointer rounded border border-stroke dark:border-dark-3"
              />
              <input
                type="text"
                value={config.primaryColor}
                onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                placeholder="#667eea"
                className="flex-1 rounded-md border border-stroke bg-transparent px-4 py-2 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              />
            </div>
            <p className="mt-1 text-xs text-body-color dark:text-dark-6">
              Choose your brand&apos;s primary color for buttons and accents.
            </p>
          </div>

          {/* Logo URL */}
          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              Logo URL
            </label>
            <input
              type="url"
              value={config.logoUrl}
              onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="w-full rounded-md border border-stroke bg-transparent px-4 py-2 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
            />
            <p className="mt-1 text-xs text-body-color dark:text-dark-6">
              URL to your logo image. Recommended size: 200x50px
            </p>
          </div>
        </div>
      </div>

      {/* Domain Configuration */}
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
        <h2 className="mb-6 text-xl font-bold text-dark dark:text-white">
          Domain Settings
        </h2>

        <div className="space-y-4">
          {/* Subdomain */}
          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              Subdomain
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={config.subdomain}
                onChange={(e) => setConfig({ ...config, subdomain: e.target.value })}
                placeholder="mycompany"
                className="flex-1 rounded-md border border-stroke bg-transparent px-4 py-2 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              />
              <span className="text-body-color dark:text-dark-6">
                .saasinasnap.com
              </span>
            </div>
            <p className="mt-1 text-xs text-body-color dark:text-dark-6">
              Your unique subdomain for accessing your platform.
            </p>
          </div>

          {/* Custom Domain */}
          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              Custom Domain
            </label>
            <input
              type="text"
              value={config.customDomain}
              onChange={(e) => setConfig({ ...config, customDomain: e.target.value })}
              placeholder="app.yourdomain.com"
              className="w-full rounded-md border border-stroke bg-transparent px-4 py-2 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
            />
            <p className="mt-1 text-xs text-body-color dark:text-dark-6">
              Use your own domain (requires DNS configuration).
            </p>
          </div>
        </div>
      </div>

      {/* Visibility Settings */}
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
        <h2 className="mb-6 text-xl font-bold text-dark dark:text-white">
          Page Visibility
        </h2>

        <div className="space-y-4">
          {/* Page Visibility Options */}
          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              Visibility Setting
            </label>
            <div className="space-y-3">
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="pageVisibility"
                  value="public"
                  checked={config.pageVisibility === "public"}
                  onChange={(e) => setConfig({ ...config, pageVisibility: e.target.value as 'public' | 'private' | 'unlisted' })}
                  className="mt-1 h-4 w-4 text-primary focus:ring-primary"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-dark dark:text-white">
                    Public
                  </div>
                  <p className="text-xs text-body-color dark:text-dark-6">
                    Your white label page is visible to everyone and can be accessed via your domain.
                  </p>
                </div>
              </label>

              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="pageVisibility"
                  value="unlisted"
                  checked={config.pageVisibility === "unlisted"}
                  onChange={(e) => setConfig({ ...config, pageVisibility: e.target.value as 'public' | 'private' | 'unlisted' })}
                  className="mt-1 h-4 w-4 text-primary focus:ring-primary"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-dark dark:text-white">
                    Unlisted
                  </div>
                  <p className="text-xs text-body-color dark:text-dark-6">
                    Your white label page is accessible via direct link but won&apos;t appear in search results.
                  </p>
                </div>
              </label>

              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="pageVisibility"
                  value="private"
                  checked={config.pageVisibility === "private"}
                  onChange={(e) => setConfig({ ...config, pageVisibility: e.target.value as 'public' | 'private' | 'unlisted' })}
                  className="mt-1 h-4 w-4 text-primary focus:ring-primary"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-dark dark:text-white">
                    Private
                  </div>
                  <p className="text-xs text-body-color dark:text-dark-6">
                    Your white label page is hidden and will not be accessible to anyone.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Active Status Toggle */}
          <div className="pt-4 border-t border-stroke dark:border-dark-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.isActive}
                onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-primary rounded"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-dark dark:text-white">
                  Active
                </div>
                <p className="text-xs text-body-color dark:text-dark-6">
                  Enable or disable your white label configuration entirely.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Advanced Customization */}
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
        <h2 className="mb-6 text-xl font-bold text-dark dark:text-white">
          Advanced Customization
        </h2>

        <div>
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
            Custom CSS
          </label>
          <textarea
            value={config.customCss}
            onChange={(e) => setConfig({ ...config, customCss: e.target.value })}
            placeholder=".custom-button { background-color: #667eea; }"
            rows={10}
            className="w-full rounded-md border border-stroke bg-transparent px-4 py-2 font-mono text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
          />
          <p className="mt-1 text-xs text-body-color dark:text-dark-6">
            Add custom CSS to further customize your platform&apos;s appearance.
          </p>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
        <h2 className="mb-6 text-xl font-bold text-dark dark:text-white">
          Preview
        </h2>
        <div className="rounded-lg border border-stroke p-6 dark:border-dark-3">
          <div
            className="mb-4 rounded-lg p-4"
            style={{ backgroundColor: config.primaryColor }}
          >
            <h3 className="text-xl font-bold text-white">
              {config.brandName || "Your Brand Name"}
            </h3>
            {config.logoUrl && (
              <img
                src={config.logoUrl}
                alt="Logo"
                className="mt-2 max-h-12"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-body-color dark:text-dark-6">
              <strong>Subdomain:</strong> {config.subdomain || "not-set"}.saasinasnap.com
            </p>
            {config.customDomain && (
              <p className="text-body-color dark:text-dark-6">
                <strong>Custom Domain:</strong> {config.customDomain}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center rounded-md bg-primary px-6 py-3 text-base font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </div>
  );
};

export default WhiteLabelConfiguration;
