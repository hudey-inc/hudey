"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/lib/useRequireAuth";
import {
  getContract,
  getDefaultClauses,
  createContract,
  updateContract,
} from "@/lib/api";
import type { ContractClause } from "@/lib/api";
import {
  ArrowLeft,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  GripVertical,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  FileText,
} from "lucide-react";

const CLAUSE_TYPES = [
  { value: "scope_of_work", label: "Scope of Work" },
  { value: "payment_terms", label: "Payment Terms" },
  { value: "content_rights", label: "Content Rights & Usage" },
  { value: "ftc_disclosure", label: "FTC / ASA Disclosure" },
  { value: "termination", label: "Termination" },
  { value: "exclusivity", label: "Exclusivity" },
  { value: "confidentiality", label: "Confidentiality / NDA" },
  { value: "custom", label: "Custom Clause" },
];

// ── Skeleton ──────────────────────────────────────────────────

function EditorSkeleton() {
  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto animate-pulse">
      <div className="max-w-3xl">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-lg" />
            <div>
              <div className="h-6 bg-gray-100 rounded w-40 mb-1" />
              <div className="h-3 bg-gray-100 rounded w-16" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 bg-gray-100 rounded-lg w-32" />
            <div className="h-9 bg-gray-100 rounded-lg w-20" />
          </div>
        </div>
        {/* Name/desc card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 mb-6">
          <div className="space-y-4">
            <div>
              <div className="h-3 bg-gray-100 rounded w-24 mb-2" />
              <div className="h-10 bg-gray-100 rounded-lg w-full" />
            </div>
            <div>
              <div className="h-3 bg-gray-100 rounded w-20 mb-2" />
              <div className="h-10 bg-gray-100 rounded-lg w-full" />
            </div>
          </div>
        </div>
        {/* Clause skeletons */}
        <div className="h-4 bg-gray-100 rounded w-28 mb-4" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 mb-4">
            <div className="h-10 bg-gray-100 rounded-lg w-full mb-3" />
            <div className="h-10 bg-gray-100 rounded-lg w-full mb-3" />
            <div className="h-24 bg-gray-100 rounded-lg w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function ContractEditorPage() {
  const { checking } = useRequireAuth();
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === "new";
  const contractId = isNew ? null : (params.id as string);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [version, setVersion] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isNew) {
        const defaults = await getDefaultClauses();
        setClauses(defaults);
      } else if (contractId) {
        const tmpl = await getContract(contractId);
        if (!tmpl) {
          router.replace("/contracts");
          return;
        }
        setName(tmpl.name);
        setDescription(tmpl.description || "");
        setClauses(tmpl.clauses);
        setVersion(tmpl.version);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [isNew, contractId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSave() {
    if (!name.trim()) {
      setError("Contract name is required");
      return;
    }
    if (clauses.length === 0) {
      setError("At least one clause is required");
      return;
    }
    setError(null);
    setSaving(true);
    setSuccess(false);

    try {
      if (isNew) {
        const { id } = await createContract({
          name: name.trim(),
          description: description.trim(),
          clauses,
        });
        router.replace(`/contracts/${id}`);
      } else if (contractId) {
        await updateContract(contractId, {
          name: name.trim(),
          description: description.trim(),
          clauses,
        });
        setSuccess(true);
        setVersion((v) => v + 1);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    const defaults = await getDefaultClauses();
    setClauses(defaults);
  }

  function addClause() {
    setClauses((prev) => [
      ...prev,
      {
        type: "custom",
        title: "",
        body: "",
        required: false,
        order: prev.length,
      },
    ]);
  }

  function removeClause(index: number) {
    setClauses((prev) => prev.filter((_, i) => i !== index).map((c, i) => ({ ...c, order: i })));
  }

  function updateClause(index: number, updates: Partial<ContractClause>) {
    setClauses((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...updates } : c))
    );
  }

  if (checking || loading) {
    return <EditorSkeleton />;
  }

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
      <div className="max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/contracts"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#2F4538]/10 flex items-center justify-center">
                <FileText className="w-4.5 h-4.5 text-[#2F4538]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {isNew ? "New Contract" : "Edit Contract"}
                </h1>
                {!isNew && (
                  <span className="text-xs text-gray-400">Version {version}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Defaults
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 bg-[#2F4538] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#243a2d] transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving\u2026" : "Save"}
            </button>
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Contract saved successfully
          </div>
        )}

        {/* Name & Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Contract Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard Influencer Agreement"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2F4538]/20 focus:border-[#2F4538] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Description{" "}
                <span className="text-gray-300 font-normal normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of when to use this contract"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2F4538]/20 focus:border-[#2F4538] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Clauses Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Clauses
            <span className="ml-2 text-sm font-normal text-gray-400">({clauses.length})</span>
          </h2>
          <button
            onClick={handleReset}
            className="sm:hidden flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>

        {/* Clause Cards */}
        <div className="space-y-4">
          {clauses.map((clause, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="pt-2.5 text-gray-300 cursor-grab">
                  <GripVertical className="w-4 h-4" />
                </div>

                <div className="flex-1 space-y-3">
                  {/* Top row: type + required + delete */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <select
                        value={clause.type}
                        onChange={(e) =>
                          updateClause(index, { type: e.target.value })
                        }
                        className="w-full appearance-none px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2F4538]/20 focus:border-[#2F4538] transition-colors"
                      >
                        {CLAUSE_TYPES.map((ct) => (
                          <option key={ct.value} value={ct.value}>
                            {ct.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <label className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clause.required}
                        onChange={(e) =>
                          updateClause(index, { required: e.target.checked })
                        }
                        className="rounded border-gray-300 text-[#2F4538] focus:ring-[#2F4538]"
                      />
                      Required
                    </label>

                    <button
                      onClick={() => removeClause(index)}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded"
                      title="Remove clause"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title */}
                  <input
                    type="text"
                    value={clause.title}
                    onChange={(e) =>
                      updateClause(index, { title: e.target.value })
                    }
                    placeholder="Clause title"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2F4538]/20 focus:border-[#2F4538] transition-colors"
                  />

                  {/* Body */}
                  <textarea
                    value={clause.body}
                    onChange={(e) =>
                      updateClause(index, { body: e.target.value })
                    }
                    placeholder="Clause content..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#2F4538]/20 focus:border-[#2F4538] transition-colors"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add clause button */}
          <button
            onClick={addClause}
            className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-[#2F4538]/30 hover:text-[#2F4538] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Clause
          </button>
        </div>
      </div>
    </div>
  );
}
