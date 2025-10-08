"use client";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Loader from "@/components/Common/Loader";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastUsedAt?: Date;
  isActive: boolean;
  createdAt: Date;
}

const ApiKeyManagement = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/saas/api-keys");
      const data = await response.json();
      if (response.ok) {
        setApiKeys(data.apiKeys || []);
      } else {
        toast.error(data.message || "Failed to load API keys");
      }
    } catch (error) {
      console.error("Failed to load API keys:", error);
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/saas/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("API key created successfully!");
        setApiKeys([data.apiKey, ...apiKeys]);
        setShowCreateModal(false);
        setNewKeyName("");
        
        // Show the API key in a modal for copying
        navigator.clipboard.writeText(data.apiKey.key);
        toast.success("API key copied to clipboard!");
      } else {
        toast.error(data.message || "Failed to create API key");
      }
    } catch (error) {
      console.error("Failed to create API key:", error);
      toast.error("Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/saas/api-keys/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("API key revoked successfully");
        setApiKeys(apiKeys.filter((key) => key.id !== id));
      } else {
        toast.error(data.message || "Failed to revoke API key");
      }
    } catch (error) {
      console.error("Failed to revoke API key:", error);
      toast.error("Failed to revoke API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("API key copied to clipboard!");
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
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
    <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark dark:text-white">
          API Key Management
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          <svg
            className="mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create New Key
        </button>
      </div>

      {apiKeys.length === 0 ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-3">
            <svg
              className="h-6 w-6 text-body-color dark:text-dark-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <p className="text-body-color dark:text-dark-6">
            No API keys yet. Create your first API key to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stroke dark:border-dark-3">
                <th className="pb-3 text-left text-sm font-semibold text-dark dark:text-white">
                  Name
                </th>
                <th className="pb-3 text-left text-sm font-semibold text-dark dark:text-white">
                  API Key
                </th>
                <th className="pb-3 text-left text-sm font-semibold text-dark dark:text-white">
                  Last Used
                </th>
                <th className="pb-3 text-left text-sm font-semibold text-dark dark:text-white">
                  Status
                </th>
                <th className="pb-3 text-right text-sm font-semibold text-dark dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key) => (
                <tr
                  key={key.id}
                  className="border-b border-stroke dark:border-dark-3"
                >
                  <td className="py-4 text-sm text-dark dark:text-white">
                    {key.name}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-gray-100 px-2 py-1 text-xs text-dark dark:bg-dark-3 dark:text-white">
                        {maskApiKey(key.key)}
                      </code>
                      <button
                        onClick={() => copyToClipboard(key.key)}
                        className="text-primary hover:text-primary/80"
                        title="Copy to clipboard"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="py-4 text-sm text-body-color dark:text-dark-6">
                    {key.lastUsedAt
                      ? new Date(key.lastUsedAt).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        key.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      }`}
                    >
                      {key.isActive ? "Active" : "Revoked"}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    {key.isActive && (
                      <button
                        onClick={() => handleRevokeKey(key.id)}
                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 dark:bg-dark-2">
            <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
              Create New API Key
            </h3>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                Key Name
              </label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production API Key"
                className="w-full rounded-md border border-stroke bg-transparent px-4 py-2 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                disabled={creating}
              />
              <p className="mt-1 text-xs text-body-color dark:text-dark-6">
                Choose a descriptive name to help you identify this key later.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewKeyName("");
                }}
                className="rounded-md border border-stroke px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKey}
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
                disabled={creating}
              >
                {creating ? "Creating..." : "Create Key"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeyManagement;
