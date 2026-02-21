"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { listContracts, deleteContract } from "@/lib/api";
import type { ContractTemplate } from "@/lib/api";
import {
  FileText,
  Plus,
  Trash2,
  Clock,
  Shield,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const CLAUSE_LABELS: Record<string, string> = {
  scope_of_work: "Scope",
  payment_terms: "Payment",
  content_rights: "Rights",
  ftc_disclosure: "FTC/ASA",
  termination: "Termination",
  exclusivity: "Exclusivity",
  confidentiality: "NDA",
  custom: "Custom",
};

// ── Skeleton ──────────────────────────────────────────────────

function ContractsSkeleton() {
  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <div className="h-7 bg-gray-100 rounded w-40" />
          <div className="h-10 bg-gray-100 rounded-lg w-40" />
        </div>
        <div className="h-4 bg-gray-100 rounded w-64 mt-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
            <div className="h-3 bg-gray-100 rounded w-full mb-2" />
            <div className="h-3 bg-gray-100 rounded w-2/3 mb-4" />
            <div className="flex gap-2 mb-4">
              <div className="h-5 bg-gray-100 rounded-full w-14" />
              <div className="h-5 bg-gray-100 rounded-full w-14" />
              <div className="h-5 bg-gray-100 rounded-full w-14" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 bg-gray-100 rounded w-20" />
              <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function ContractsPage() {
  const { checking } = useRequireAuth();
  const [contracts, setContracts] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    listContracts()
      .then(setContracts)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteContract(deleteId);
      setContracts((prev) => prev.filter((c) => c.id !== deleteId));
    } catch {
      // ignore
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  if (checking || loading) {
    return <ContractsSkeleton />;
  }

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Contracts</h1>
          <p className="text-sm text-gray-500 mt-1">
            {contracts.length === 0
              ? "Create clickwrap contracts to protect your campaigns"
              : `${contracts.length} contract template${contracts.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/contracts/new"
          className="bg-[#2F4538] hover:bg-[#243a2d] text-white rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Contract</span>
        </Link>
      </div>

      {/* Empty state */}
      {contracts.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[#2F4538]/10 flex items-center justify-center mx-auto mb-5">
            <Shield className="w-8 h-8 text-[#2F4538]" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            No contracts yet
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            Create a clickwrap contract template to protect your campaigns.
            Creators will agree to your terms before work begins, giving you a
            legally-binding record of acceptance.
          </p>
          <Link
            href="/contracts/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2F4538] text-white text-sm font-medium rounded-lg hover:bg-[#243a2d] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Your First Contract
          </Link>
        </div>
      )}

      {/* Contract list */}
      {contracts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow group"
            >
              <Link href={`/contracts/${contract.id}`} className="block p-5 sm:p-6">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#2F4538]/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-[#2F4538]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#2F4538] transition-colors truncate">
                        {contract.name}
                      </h3>
                      <span className="text-xs text-gray-400">v{contract.version}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#2F4538] transition-colors flex-shrink-0 mt-1" />
                </div>

                {/* Description */}
                {contract.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {contract.description}
                  </p>
                )}

                {/* Clause pills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {contract.clauses.map((clause, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium"
                    >
                      {CLAUSE_LABELS[clause.type] || clause.title}
                    </span>
                  ))}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {contract.clauses.length} clause{contract.clauses.length !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(contract.created_at)}
                  </span>
                </div>
              </Link>

              {/* Delete */}
              <div className="px-5 sm:px-6 pb-4 border-t border-gray-100 pt-3">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteId(contract.id);
                  }}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Delete Contract</h3>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  This will deactivate the template. Existing acceptances are preserved.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting\u2026" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
