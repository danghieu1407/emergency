import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type {
  RescueRequest,
  RescueRequestPayload,
} from "@/types/rescue-request";

const TABLE_NAME = "rescue_requests";

function normalizeSort(sortBy?: string) {
  const allowed = new Set([
    "created_at",
    "status",
    "full_name",
    "phone_number",
    "address",
  ]);
  if (!sortBy || !allowed.has(sortBy)) {
    return "created_at";
  }
  return sortBy;
}

function normalizeDirection(sortDir?: string) {
  return sortDir === "asc" ? "asc" : "desc";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const sortBy = normalizeSort(searchParams.get("sortBy") ?? undefined);
  const sortDir = normalizeDirection(searchParams.get("sortDir") ?? undefined);

  let query = supabaseAdmin
    .from(TABLE_NAME)
    .select("*")
    .order(sortBy, { ascending: sortDir === "asc" });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,phone_number.ilike.%${search}%,address.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json({ requests: data as RescueRequest[] });
}

export async function POST(request: Request) {
  const body = (await request.json()) as RescueRequestPayload;

  if (!body.fullName || !body.phoneNumber || !body.status) {
    return NextResponse.json(
      { error: "Thiếu họ tên, số điện thoại hoặc tình trạng." },
      {
        status: 400,
      },
    );
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .insert({
      full_name: body.fullName,
      phone_number: body.phoneNumber,
      status: body.status,
      notes: body.notes ?? null,
      address: body.address ?? null,
      latitude: body.coords?.lat ?? null,
      longitude: body.coords?.lng ?? null,
      accuracy: body.accuracy ?? null,
      manual_override: body.manualOverride ?? false,
      source: "webapp",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json(
    { request: data as RescueRequest },
    {
      status: 201,
    },
  );
}


