import type { Coords } from "./location";

export type RescueRequest = {
  id: string;
  created_at: string;
  full_name: string;
  phone_number: string;
  status: string;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  manual_override: boolean;
  source: string | null;
};

export type RescueRequestPayload = {
  fullName: string;
  phoneNumber: string;
  status: string;
  notes?: string;
  coords?: Coords | null;
  accuracy?: number | null;
  manualOverride?: boolean;
};


