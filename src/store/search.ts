import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type SearchState = {
  searchLabel: string;
  searchResults: string[];
  setSearchLabel(searchLabel: string): void;
  setSearchResults(searchResults: string[]): void;
};

const useSearchState = create<SearchState>()(
  immer((set) => ({
    searchLabel: "",
    searchResults: [],
    setSearchLabel: (searchLabel) => {
      set((state) => {
        state.searchLabel = searchLabel;
      });
    },
    setSearchResults: (searchResults) => {
      set((state) => {
        state.searchResults = searchResults;
      });
    }
  }))
);

export { useSearchState };
