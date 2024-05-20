import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { TIMESTAMPS } from "../types";
dayjs.extend(utc);

type TimeState = {
  timestamp: (typeof TIMESTAMPS)[number];
  setTimeStamp(timestamp: TimeState["timestamp"]): void;
};

const useTimeStamp = create<TimeState>()(
  immer((set) => ({
    timestamp: "1D",
    setTimeStamp: (timestamp) => {
      set((state) => {
        state.timestamp = timestamp;
      });
    }
  }))
);

export { useTimeStamp };
