import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type TimeState = {
  timestamp: string;
  period1: string;
  period2: string;
  setTimeStamp(timestamp: string): void;
};

const useTimeStamp = create<TimeState>()(
  immer((set, _get) => ({
    timestamp: "1D",
    period1: "2014-01-01",
    period2: new Date().toISOString().split("T")[0],
    setTimeStamp: (timestamp) => {
      set((state) => {
        state.timestamp = timestamp;
      });
      if (timestamp === "1D") {
        set((state) => {
          (state.period1 = "2014-01-01"),
            (state.period2 = new Date().toISOString().split("T")[0]);
        });
      } else {
        set((state) => {
          state.period2 = new Date().toISOString();
        });
        if (timestamp === "1M") {
          set((state) => {
            state.period1 = new Date(
              new Date().setDate(new Date().getDate() - 7)
            ).toISOString();
          });
        } else if (timestamp === "5M" || timestamp === "15M") {
          set((state) => {
            state.period1 = new Date(
              new Date().setDate(new Date().getDate() - 60)
            ).toISOString();
          });
        } else if (timestamp === "1H") {
          set((state) => {
            state.period1 = new Date(
              new Date().setDate(new Date().getDate() - 720)
            ).toISOString();
          });
        }
      }
    }
  }))
);

export { useTimeStamp };
