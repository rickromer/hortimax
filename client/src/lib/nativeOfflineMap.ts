import { registerPlugin } from "@capacitor/core";

export type NativeMapPoint = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  selected?: boolean;
};

type NativeOfflineMapPlugin = {
  show(options: {
    markers: NativeMapPoint[];
    focus?: { latitude: number; longitude: number } | null;
    userPosition?: { latitude: number; longitude: number } | null;
  }): Promise<void>;
  hide(): Promise<void>;
  addListener(eventName: "markerTap" | "chooseLocation" | "dismissed", listener: (event: { id?: number; name?: string; latitude?: number; longitude?: number }) => void): Promise<{ remove: () => Promise<void> }>;
};

export const NativeOfflineMap = registerPlugin<NativeOfflineMapPlugin>("OfflineNativeMap");
