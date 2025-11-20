"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { RescueRequest } from "@/types/rescue-request";

const STATUS_FILTERS = [
  { label: "Tất cả", value: "all" },
  { label: "Khẩn cấp", value: "khẩn cấp" },
  { label: "Cần hỗ trợ sớm", value: "cần hỗ trợ sớm" },
  { label: "An toàn tạm thời", value: "an toàn tạm thời" },
];

const SORT_OPTIONS = [
  { label: "Mới nhất", value: "created_at", direction: "desc" },
  { label: "Tên (A-Z)", value: "full_name", direction: "asc" },
  { label: "Tình trạng", value: "status", direction: "asc" },
];

type FetchState = "idle" | "loading" | "error";

export default function RequestsPage() {
  const [requests, setRequests] = useState<RescueRequest[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [state, setState] = useState<FetchState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [notePreview, setNotePreview] = useState<{
    name: string;
    content: string;
    createdAt: string;
  } | null>(null);

  const fetchRequests = useMemo(
    () => async () => {
      setState("loading");
      setError(null);
      const params = new URLSearchParams({
        status,
        sortBy,
        sortDir,
      });
      if (search.trim()) {
        params.append("search", search.trim());
      }

      try {
        const res = await fetch(`/api/requests?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error("Không thể tải danh sách.");
        }
        const payload = (await res.json()) as { requests: RescueRequest[] };
        setRequests(payload.requests);
        setState("idle");
      } catch (err) {
        setError((err as Error).message);
        setState("error");
      }
    },
    [search, sortBy, sortDir, status],
  );

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">
          Trung tâm cứu hộ
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Danh sách tín hiệu cầu cứu
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Lọc theo tình trạng, sắp xếp theo thời gian hoặc tên, tìm nhanh bằng
          số điện thoại.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
          >
            ← Quay về trang cầu cứu
          </Link>
        </div>
      </header>

      <section className="grid gap-4 rounded-3xl border border-white/70 bg-white/95 p-6 shadow-lg shadow-blue-900/5 backdrop-blur-xl lg:grid-cols-4">
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700 lg:col-span-2">
          Tìm kiếm
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nhập tên hoặc số điện thoại..."
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-normal text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          Tình trạng
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-normal text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          Sắp xếp
          <select
            value={`${sortBy}:${sortDir}`}
            onChange={(e) => {
              const [field, dir] = e.target.value.split(":");
              setSortBy(field);
              setSortDir(dir as "asc" | "desc");
            }}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-normal text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          >
            {SORT_OPTIONS.map((option) => (
              <option
                key={option.label}
                value={`${option.value}:${option.direction}`}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="lg:col-span-4 flex justify-end">
          <button
            onClick={fetchRequests}
            className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition hover:brightness-110"
          >
            Làm mới danh sách
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/95 p-0 shadow-lg shadow-blue-900/5 backdrop-blur-xl">
        {state === "loading" ? (
          <div className="p-6 text-center text-sm text-slate-500">
            Đang tải danh sách cầu cứu...
          </div>
        ) : state === "error" ? (
          <div className="p-6 text-center text-sm text-rose-500">
            {error ?? "Có lỗi xảy ra."}
          </div>
        ) : requests.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            Chưa có tín hiệu nào phù hợp.
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2 text-xs text-slate-500 sm:hidden">
              <span className="text-base">⇆</span>
              <span>Vuốt ngang bảng để xem đầy đủ thông tin.</span>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm text-slate-600">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="border-b border-slate-100 px-6 py-3">Thời gian</th>
                  <th className="border-b border-slate-100 px-6 py-3">Người cầu cứu</th>
                  <th className="border-b border-slate-100 px-6 py-3">Liên hệ</th>
                  <th className="border-b border-slate-100 px-6 py-3">Địa chỉ / mô tả</th>
                  <th className="border-b border-slate-100 px-6 py-3">Tình trạng</th>
                  <th className="border-b border-slate-100 px-6 py-3">Toạ độ</th>
                  <th className="border-b border-slate-100 px-6 py-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b border-slate-100 last:border-none">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {new Date(request.created_at).toLocaleString("vi-VN", {
                        hour12: false,
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{request.full_name}</p>
                      {request.manual_override ? (
                        <p className="text-xs text-amber-600">Đặt toạ độ thủ công</p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      {request.phone_number ?? (
                        <span className="text-xs text-slate-400">
                          Không có SĐT
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {request.address ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {request.latitude && request.longitude ? (
                        <a
                          href={`https://www.google.com/maps?q=${request.latitude},${request.longitude}`}
                          target="_blank"
                          className="text-blue-600 underline"
                        >
                          {request.latitude.toFixed(4)}, {request.longitude.toFixed(4)}
                        </a>
                      ) : (
                        "—"
                      )}
                      {request.accuracy ? (
                        <p className="text-[11px] text-slate-400">±{request.accuracy}m</p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {request.notes ? (
                        <button
                          onClick={() =>
                            setNotePreview({
                              name: request.full_name,
                              content: request.notes ?? "",
                              createdAt: request.created_at,
                            })
                          }
                          className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                        >
                          Xem ghi chú
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>

      {notePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl shadow-blue-900/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-blue-500">
                  Ghi chú chi tiết
                </p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">
                  {notePreview.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {new Date(notePreview.createdAt).toLocaleString("vi-VN", {
                    hour12: false,
                  })}
                </p>
              </div>
              <button
                onClick={() => setNotePreview(null)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
              >
                Đóng
              </button>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm leading-relaxed text-slate-700">
              {notePreview.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


