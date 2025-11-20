import { NextResponse } from "next/server";

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const DEFAULT_USER_AGENT =
  process.env.GEOCODER_USER_AGENT ?? "FloodRescueApp/1.0 (contact: example@example.com)";

export async function POST(request: Request) {
  const { query } = (await request.json()) as { query?: string };

  if (!query || !query.trim()) {
    return NextResponse.json(
      { error: "Thiếu địa chỉ để tìm kiếm." },
      { status: 400 },
    );
  }

  const url = new URL(NOMINATIM_ENDPOINT);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("q", query.trim());

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
      },
      // enforce server-side request
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Không thể kết nối dịch vụ bản đồ.");
    }

    const results = (await response.json()) as NominatimResult[];
    const match = results[0];

    if (!match) {
      return NextResponse.json(
        { error: "Không tìm thấy địa điểm phù hợp." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      lat: Number(match.lat),
      lng: Number(match.lon),
      displayName: match.display_name,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}


