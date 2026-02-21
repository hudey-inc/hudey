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

export default function ContractsPage() {
  useRequireAuth();
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contracts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage reusable clickwrap contracts for your campaigns
          </p>
        </div>
        <Link
          href="/contracts/new"
          className="flex items-center gap-2 bg-[#2F4538] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#263a2d] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Contract
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
            >
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-4" />
              <div className="flex gap-2">
                <div className="h-5 bg-gray-100 rounded-full w-16" />
                <div className="h-5 bg-gray-100 rounded-full w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && contracts.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No contracts yet
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Create a clickwrap contract template to protect your campaigns.
            Contracts ensure creators agree to your terms before work begins.
          </p>
          <Link
            href="/contracts/new"
            className="inline-flex items-center gap-2 bg-[#2F4538] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#263a2d] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Your First Contract
          </Link>
        </div>
      )}

      {/* Contract list */}
      {!loading && contracts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors group"
            >
              <Link href={`/contracts/${contract.id}`} className="block p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#2F4538]/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-[#2F4538]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#2F4538] transition-colors">
                        {contract.name}
                      </h3>
                      <span className="text-xs text-gray-400">
                        v{contract.version}
                      </span>
                    </div>
                  </div>
                </div>

                {contract.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {contract.description}
                  </p>
                )}

                {/* Clause pills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {contract.clauses.map((clause, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                    >
                      {CLAUSE_LABELS[clause.type] || clause.title}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {contract.clauses.length} clauses
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(contract.created_at)}
                  </span>
                </div>
              </Link>

              {/* Delete button */}
              <div className="px-6 pb-4">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Delete contract?
                </h3>
                <p className="text-sm text-gray-500">
                  This will deactivate the template. Existing acceptances are
                  preserved.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
