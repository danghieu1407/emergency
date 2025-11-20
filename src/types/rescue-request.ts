import type { Coords } from "./location";

export type RescueRequest = {
  id: string;
  created_at: string;
  full_name: string;
  phone_number: string | null;
  status: string;
  notes: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  manual_override: boolean;
  source: string | null;
};

export type RescueRequestPayload = {
  fullName: string;
  phoneNumber?: string;
  status: string;
  notes?: string;
  address?: string;
  coords?: Coords | null;
  accuracy?: number | null;
  manualOverride?: boolean;
};


