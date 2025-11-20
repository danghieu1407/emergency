"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Coords } from "@/types/location";
import type { RescueRequest } from "@/types/rescue-request";

const STATUS_CHOICES = [
  { label: "Khẩn cấp", value: "khẩn cấp" },
  { label: "Cần hỗ trợ sớm", value: "cần hỗ trợ sớm" },
  { label: "An toàn tạm thời", value: "an toàn tạm thời" },
];

const FALLBACK_COORDS = {
  lat: 16.047079,
  lng: 108.20623,
};

const EmergencyMap = dynamic(() => import("@/components/EmergencyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] items-center justify-center bg-slate-50 text-sm text-slate-500">
      Đang chuẩn bị bản đồ...
    </div>
  ),
});

type FormData = {
  fullName: string;
  phoneNumber: string;
  status: string;
  notes: string;
  address: string;
};

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    phoneNumber: "",
    status: "",
    notes: "",
    address: "",
  });

  const [coords, setCoords] = useState<Coords | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error" | "info">(
    "info",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const manualOverrideRef = useRef(false);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldToastLocationRef = useRef(false);
  const watchIdRef = useRef<number | null>(null);

  const setManualOverrideState = useCallback((value: boolean) => {
    manualOverrideRef.current = value;
    setManualOverride(value);
  }, []);

  const formatCoords = (value: number | null | undefined) =>
    typeof value === "number" ? value.toFixed(5) : "--";

  const locationStatus = useMemo(() => {
    if (locationError) {
      return {
        tone: "error",
        text: "Không thể truy cập GPS. Kiểm tra quyền vị trí.",
      };
    }
    if (coords) {
      return {
        tone: "success",
        text: "Đã cập nhật vị trí thành công.",
      };
    }
    return {
      tone: "warning",
      text: "Đang xác định vị trí...",
    };
  }, [coords, locationError]);

  const showFeedback = useCallback(
    (message: string, tone: "success" | "error" | "info" = "info") => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
      setFeedbackTone(tone);
      setFeedback(message);
      feedbackTimerRef.current = setTimeout(() => {
        setFeedback(null);
      }, 3500);
    },
    [],
  );

  const updateFromPosition = useCallback(
    (position: GeolocationPosition) => {
      if (manualOverrideRef.current) {
        return;
      }
      const { latitude, longitude, accuracy: acc } = position.coords;
      setCoords({ lat: latitude, lng: longitude });
      setAccuracy(Math.round(acc));
      setTimestamp(
        new Date(position.timestamp).toLocaleString("vi-VN", {
          hour12: false,
        }),
      );
      setIsLocating(false);
      if (shouldToastLocationRef.current) {
        showFeedback("Đã lấy toạ độ GPS chính xác.", "success");
        shouldToastLocationRef.current = false;
      }
    },
    [showFeedback],
  );

  const handleGeoError = useCallback((error: GeolocationPositionError) => {
    setLocationError(error.message);
    setIsLocating(false);
  }, []);

  const startWatchingLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocationError("Thiết bị không hỗ trợ định vị GPS.");
      return;
    }
    if (watchIdRef.current !== null) {
      return;
    }
    setManualOverrideState(false);
    shouldToastLocationRef.current = true;
    setLocationError(null);
    watchIdRef.current = navigator.geolocation.watchPosition(
      updateFromPosition,
      handleGeoError,
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 20000,
      },
    );
  }, [handleGeoError, setManualOverrideState, updateFromPosition]);

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocationError("Thiết bị không hỗ trợ định vị GPS.");
      return;
    }

    setManualOverrideState(false);
    shouldToastLocationRef.current = true;
    startWatchingLocation();
    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(updateFromPosition, handleGeoError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    });
  }, [handleGeoError, startWatchingLocation, updateFromPosition, setManualOverrideState]);

  const stopWatchingLocation = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    shouldToastLocationRef.current = true;
    startWatchingLocation();
    return () => {
      stopWatchingLocation();
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, [startWatchingLocation, stopWatchingLocation]);

  const shareMessage = useMemo(() => {
    if (!formData.fullName && !formData.phoneNumber) {
      return "Điền họ tên và số điện thoại để tạo nội dung cầu cứu.";
    }

    const phoneLine = formData.phoneNumber
      ? `SĐT: ${formData.phoneNumber}.`
      : "Chưa cung cấp SĐT.";
    const statusLine = formData.status
      ? `Tình trạng: ${formData.status}.`
      : "Tình trạng: chưa chọn.";
    const addressLine = formData.address
      ? `Địa chỉ báo về: ${formData.address}.`
      : "";
    const locationLine = coords
      ? `Toạ độ: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(
          5,
        )} (±${accuracy ?? "?"}m).`
      : "Toạ độ: chưa xác định.";
    const notesLine = formData.notes
      ? `Chi tiết: ${formData.notes}.`
      : "Chưa có mô tả thêm.";

    return `Tôi là ${formData.fullName}. ${phoneLine} ${statusLine} ${addressLine} ${locationLine} ${notesLine}`;
  }, [accuracy, coords, formData]);

  const handleCopyLocation = async () => {
    if (!coords) {
      showFeedback("Chưa có toạ độ để sao chép.", "info");
      return;
    }

    try {
      await navigator.clipboard.writeText(
        `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
      );
      showFeedback("Đã sao chép toạ độ.", "success");
    } catch {
      showFeedback("Không thể sao chép. Hãy thử thủ công.", "error");
    }
  };

  const submitRequest = useCallback(async (): Promise<RescueRequest | null> => {
    if (!formData.fullName || !formData.status) {
      showFeedback("Vui lòng điền họ tên và tình trạng.", "error");
      return null;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber.trim() || undefined,
          status: formData.status,
          notes: formData.notes,
          address: formData.address || null,
          coords,
          accuracy,
          manualOverride,
        }),
      });
      const payload = (await response.json()) as {
        request?: RescueRequest;
        error?: string;
      };
      if (!response.ok || !payload.request) {
        throw new Error(payload.error ?? "Không thể lưu yêu cầu.");
      }
      showFeedback("Đã lưu yêu cầu vào hệ thống cứu hộ.", "success");
      return payload.request;
    } catch (error) {
      showFeedback((error as Error).message, "error");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [accuracy, coords, formData, manualOverride, showFeedback]);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      showFeedback("Đã sao chép nội dung cầu cứu.", "success");
    } catch {
      showFeedback("Không thể sao chép. Hãy thử lại.", "error");
    }
  };

  const handleShare = async () => {
    const savedRequest = await submitRequest();
    if (!savedRequest) {
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Cầu cứu khẩn cấp",
          text: shareMessage,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          showFeedback("Không thể chia sẻ. Hãy sao chép nội dung.", "error");
        }
      }
      return;
    }

    handleCopyMessage();
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string,
  ): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleManualLocation = useCallback(
    (manualCoords: Coords) => {
      setManualOverrideState(true);
      stopWatchingLocation();
      shouldToastLocationRef.current = false;
      setCoords(manualCoords);
      setAccuracy(null);
      setTimestamp(
        new Date().toLocaleString("vi-VN", {
          hour12: false,
        }),
      );
      showFeedback("Đã chọn vị trí thủ công trên bản đồ.", "info");
    },
    [setManualOverrideState, showFeedback, stopWatchingLocation],
  );

  const handleGeocode = useCallback(async () => {
    const query = formData.address.trim();
    if (!query) {
      showFeedback("Nhập địa chỉ cụ thể để định vị.", "error");
      return;
    }

    setIsGeocoding(true);
    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });
      const payload = (await response.json()) as {
        lat?: number;
        lng?: number;
        displayName?: string;
        error?: string;
      };

      if (!response.ok || payload.lat == null || payload.lng == null) {
        throw new Error(payload.error ?? "Không tìm thấy địa điểm phù hợp.");
      }

      const manualCoords = { lat: payload.lat, lng: payload.lng };
      setManualOverrideState(true);
      stopWatchingLocation();
      setCoords(manualCoords);
      setAccuracy(null);
      setTimestamp(
        new Date().toLocaleString("vi-VN", {
          hour12: false,
        }),
      );
      showFeedback(
        `Đã định vị tại: ${payload.displayName ?? formData.address}.`,
        "success",
      );
    } catch (error) {
      showFeedback((error as Error).message, "error");
    } finally {
      setIsGeocoding(false);
    }
  }, [formData.address, setManualOverrideState, showFeedback, stopWatchingLocation]);

  const statusChipClass =
    locationStatus.tone === "success"
      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
      : locationStatus.tone === "error"
        ? "bg-rose-50 text-rose-600 border border-rose-200"
        : "bg-amber-50 text-amber-700 border border-amber-200";

  const toastToneClass =
    feedbackTone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 shadow-emerald-100"
      : feedbackTone === "error"
        ? "border-rose-200 bg-rose-50 text-rose-700 shadow-rose-100"
        : "border-slate-200 bg-white text-slate-800 shadow-slate-200";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 lg:px-12">
      <header className="flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-blue-900/5 backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">
            Ứng dụng hỗ trợ cứu hộ
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
            Gửi cầu cứu với vị trí chính xác theo thời gian thực
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-600">
            Điền thông tin liên hệ, chọn tình trạng và chia sẻ toạ độ GPS để đội
            cứu hộ tiếp cận bạn nhanh nhất trong mùa lũ.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={requestLocation}
            className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            {isLocating ? "Đang cập nhật..." : "Lấy lại vị trí"}
          </button>
          <Link
            href="/requests"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/10 transition hover:brightness-110"
          >
            Xem danh sách cầu cứu
          </Link>
        </div>
      </header>

      {feedback && (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          <div
            className={`pointer-events-auto flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg ${toastToneClass}`}
          >
            <span>{feedback}</span>
          </div>
        </div>
      )}

      <main className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-lg shadow-blue-900/5 backdrop-blur-xl">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">
              Thông tin người cầu cứu
            </h2>
            <p className="text-sm text-slate-500">
              Họ tên và số điện thoại sẽ giúp đội cứu hộ xác nhận kịp thời.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800">
              Họ và tên
              <input
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                placeholder="VD: Nguyễn Văn A"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-normal text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800">
              Số điện thoại (tuỳ chọn)
              <input
                value={formData.phoneNumber}
                onChange={(e) =>
                  handleInputChange("phoneNumber", e.target.value.replace(/\D/g, "").slice(0, 11))
                }
                inputMode="tel"
                placeholder="VD: 0912345678"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-normal text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
              <span className="text-xs font-normal text-slate-500">
                Có thể bỏ trống nếu chỉ thu thập toạ độ hoặc địa chỉ.
              </span>
            </label>
            <div className="flex flex-col gap-2 text-sm font-semibold text-slate-800">
              Địa chỉ (nếu người thân báo cáo hộ)
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="VD: 12 Trần Phú, phường 5, TP Huế"
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-normal text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={handleGeocode}
                  disabled={isGeocoding}
                  className="rounded-2xl border border-blue-200 bg-white px-4 py-3 text-xs font-semibold text-blue-600 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGeocoding ? "Đang định vị..." : "Định vị theo địa chỉ"}
                </button>
              </div>
              <p className="text-xs font-normal text-slate-500">
                Dùng khi người gặp nạn không có điện thoại. Hệ thống sẽ định vị
                trên bản đồ từ địa chỉ này.
              </p>
            </div>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800">
              Tình trạng
              <select
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-normal text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Chọn tình trạng</option>
                {STATUS_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800">
              Chi tiết mô tả
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={4}
                placeholder="Mực nước, số người, thương tích..."
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-normal text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-lg shadow-blue-900/5 backdrop-blur-xl">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-slate-900">
                Toạ độ GPS hiện tại
              </h2>
              <p className="text-sm text-slate-500">
                Cho phép truy cập vị trí để gửi thông tin chính xác nhất.
              </p>
            </div>

            <div
              className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${statusChipClass}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  locationStatus.tone === "success"
                    ? "bg-emerald-500"
                    : locationStatus.tone === "error"
                      ? "bg-rose-500"
                      : "bg-amber-500"
                }`}
              />
              {locationStatus.text}
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-600 sm:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Vĩ độ
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">
                  {formatCoords(coords?.lat)}
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Kinh độ
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">
                  {formatCoords(coords?.lng)}
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Độ chính xác
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">
                  {accuracy ? `±${accuracy}m` : "--"}
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Cập nhật lúc
                </dt>
                <dd className="mt-1 text-base font-semibold text-slate-900">
                  {timestamp ?? "--"}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={requestLocation}
                className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:brightness-105"
              >
                {isLocating ? "Đang lấy vị trí..." : "Lấy lại vị trí"}
              </button>
              <button
                onClick={handleCopyLocation}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
              >
                Sao chép toạ độ
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-lg shadow-blue-900/5 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-slate-900">
              Bản đồ vị trí của bạn
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Kéo phóng để kiểm tra lại khu vực. Bạn có thể chạm vào bản đồ để
              đặt lại vị trí nếu GPS chưa chính xác.
            </p>

            <div className="mt-4 overflow-hidden rounded-3xl border border-slate-100 shadow-inner">
              <EmergencyMap
                coords={coords}
                fallback={FALLBACK_COORDS}
                className="h-[320px] w-full"
                accuracy={accuracy}
                onManualSelect={handleManualLocation}
              />
            </div>
          </div>
        </section>
      </main>

      <section className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-xl shadow-blue-900/5 backdrop-blur-xl">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">
            Chia sẻ thông tin cầu cứu
          </h2>
          <p className="text-sm text-slate-500">
            Sao chép nội dung hoặc dùng nút chia sẻ nhanh qua Zalo, Messenger,
            SMS...
          </p>
        </div>

        <p className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-relaxed text-slate-700">
          {shareMessage}
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleShare}
            className="flex-1 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang lưu..." : "Lưu & chia sẻ"}
          </button>
          <button
            onClick={handleCopyMessage}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
          >
            Sao chép nội dung
          </button>
        </div>
      </section>

      <footer className="pb-8 text-center text-sm text-slate-500">
        Giữ điện thoại khô ráo, duy trì sóng di động và bật GPS liên tục để dễ
        dàng liên lạc khi cần cứu hộ.
        <br/>        No Copyright © 2025 - Daehyeu
      </footer>
    </div>
  );
}
