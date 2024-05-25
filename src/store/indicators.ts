import { invoke } from "@tauri-apps/api/tauri";
import { ISeriesApi, SeriesOptionsMap, UTCTimestamp } from "lightweight-charts";
import create from "zustand";

export interface IndicatorData {
  time: UTCTimestamp;
  value: number;
}

export interface IndicatorState {
  activeIndicators: Map<string, IndicatorData[][]>;
  seriesReferences: Map<string, ISeriesApi<keyof SeriesOptionsMap>[]>;
  indicatorsToDelete: ISeriesApi<keyof SeriesOptionsMap>[];
  addIndicator: (label: string, timeframe: string, type: string) => void;
  initIndicators: (label: string, timeframe: string) => void;
  removeIndicator: (type: string) => void;
}

export interface IndicatorFetchedData {
  time: UTCTimestamp;
  value: number;
}

export const useIndicatorStore = create<IndicatorState>((set, get) => ({
  activeIndicators: new Map(),
  seriesReferences: new Map(),
  indicatorsToDelete: [],
  addIndicator: async (label, timeframe, type) => {
    const variant = type.split(" ")[0];
    let lengths = [];
    if (get().activeIndicators.has(type)) {
      return;
    }

    if (variant === "MACD") {
      for (let i = 0; i < 3; i++) {
        lengths.push(parseInt(type.split(" ")[i + 1]));
      }
    } else if (variant !== "VOLUME") {
      lengths.push(parseInt(type.split(" ")[1]));
    }
    const fetchIndicatorData = await invoke<IndicatorFetchedData[][]>(
      "get_indicators",
      {
        symbol: label,
        timeframe,
        variant,
        lengths
      }
    );

    set((state) => {
      const activeIndicators = new Map(state.activeIndicators);
      activeIndicators.set(type, fetchIndicatorData);
      return { ...state, activeIndicators };
    });
  },
  initIndicators: async (label, timeframe) => {
    const fetchAllIndicators = async () => {
      const state = get();
      const activeIndicators = new Map(state.activeIndicators);
      for (const type of activeIndicators.keys()) {
        const variant = type.split(" ")[0];
        let lengths = [];
        if (variant === "MACD") {
          for (let i = 0; i < 3; i++) {
            lengths.push(parseInt(type.split(" ")[i + 1]));
          }
        } else if (variant !== "VOLUME") {
          lengths.push(parseInt(type.split(" ")[1]));
        }
        const fetchIndicatorData = await invoke<IndicatorFetchedData[][]>(
          "get_indicators",
          {
            symbol: label,
            timeframe,
            variant,
            lengths
          }
        );
        activeIndicators.set(type, fetchIndicatorData);
      }
      set({ activeIndicators: activeIndicators });
    };

    fetchAllIndicators();
  },
  removeIndicator: (type: string) => {
    set((state) => {
      const activeIndicators = new Map(state.activeIndicators);
      const seriesReferences = new Map(state.seriesReferences);
      const indicatorsToDelete = [...state.indicatorsToDelete];

      const seriesToDelete = seriesReferences.get(type);

      if (seriesToDelete) {
        indicatorsToDelete.push(...seriesToDelete);
      }
      activeIndicators.delete(type);
      seriesReferences.delete(type);

      return { activeIndicators, seriesReferences, indicatorsToDelete };
    });
  }
}));
