import { invoke } from "@tauri-apps/api/tauri";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type TState = {
  labels: string[];
  label: string;
  setLabel(label: string): void;
  removeLabel(label: string): void;
  refreshLabels(): Promise<void>;
};

async function getInitialLabels() {
  try {
    const labels = await invoke<string[]>("get_labels");
    return labels;
  } catch (error) {
    console.error("Failed to get labels:", error);
    return [];
  }
}

const useSidebarLabels = create<TState>()(
  persist(
    immer((set, _get) => ({
      labels: [],
      label: "",
      setLabel: (label: string) => {
        set((state) => {
          if (!state.labels.includes(label)) {
            state.labels.push(label);
            state.label = label;
          } else {
            state.label = label;
          }
        });
      },
      removeLabel: (label) => {
        set(async (state) => {
          await invoke("delete_label", { label });
          state.labels = state.labels.filter((item) => item !== label);
          if (state.labels.length > 0) {
            state.label = state.labels[0];
          } else state.label = "";
        });
      },
      refreshLabels: async () => {
        const labels = await invoke<string[]>("get_labels");
        set((state) => {
          state.labels = labels;
        });
      }
    })),
    { name: "sidebar-labels" }
  )
);

getInitialLabels().then((labels) => {
  useSidebarLabels.setState({ labels });
});

export { useSidebarLabels };
