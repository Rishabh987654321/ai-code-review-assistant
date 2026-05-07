import { create } from "zustand";

export const useReviewStore = create((set) => ({
  currentReview: null,
  isAnalyzing: false,
  setReview: (review) => set({ currentReview: review }),
  clearReview: () => set({ currentReview: null, isAnalyzing: false }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
}));

