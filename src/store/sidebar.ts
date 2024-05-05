import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type TState = {
  labels: string[];
  label: string;
  setLabel(label: string): void;
  removeLabel(label: string): void;
};

const useSidebarLabels = create<TState>()(
  immer((set, _get) => ({
    labels: ["AAPL"],
    label: "AAPL",
    setLabel: (label: string) => {
      set((state) => {
        if (!state.labels.includes(label)) {
          state.labels.push(label);
        }
      });
    },
    removeLabel: (label) => {
      set((state) => {
        state.labels = state.labels.filter((item) => item !== label);
      });
    }
  }))
);

export { useSidebarLabels };
