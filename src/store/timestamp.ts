import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
dayjs.extend(utc);

type TimeState = {
  timestamp: string;
  period1: string;
  period2: string;
  setTimeStamp(timestamp: string): void;
};

const useTimeStamp = create<TimeState>()(
  immer((set) => ({
    timestamp: "1D",
    period1: "2014-01-01",
    period2: dayjs().utc().format("YYYY-MM-DD"),
    setTimeStamp: (timestamp) => {
      set((state) => {
        if (timestamp == "1D") {
          state.period1 = "2014-01-01";
          state.period2 = dayjs().utc().format("YYYY-MM-DD");
        } else {
          state.period2 = dayjs().utc().startOf("minute").format();
          if (timestamp == "1M") {
            state.period1 = dayjs()
              .utc()
              .subtract(7, "day")
              .startOf("minute")
              .format();
          } else if (timestamp == "1H") {
            state.period1 = dayjs()
              .utc()
              .subtract(720, "day")
              .startOf("minute")
              .format();
          } else if (timestamp == "1WK") {
            state.period1 = dayjs().utc().subtract(100000, "day").format();
          }
        }
        state.timestamp = timestamp;
      });
    }
  }))
);

export { useTimeStamp };
