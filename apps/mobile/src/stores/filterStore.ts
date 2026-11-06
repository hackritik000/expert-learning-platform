import { create } from 'zustand';

interface FilterState {
  search: string;
  subjectId?: string;
  subjectName?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  isOnline?: boolean;
  sortBy: 'rating' | 'price_asc' | 'price_desc' | 'experience';
  setSearch: (search: string) => void;
  setSubject: (id?: string, name?: string) => void;
  setMinPrice: (price?: number) => void;
  setMaxPrice: (price?: number) => void;
  setMinRating: (rating?: number) => void;
  setIsOnline: (online?: boolean) => void;
  setSortBy: (sort: 'rating' | 'price_asc' | 'price_desc' | 'experience') => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  search: '',
  subjectId: undefined,
  subjectName: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  minRating: undefined,
  isOnline: undefined,
  sortBy: 'rating',

  setSearch: (search) => set({ search }),
  setSubject: (subjectId, subjectName) => set({ subjectId, subjectName }),
  setMinPrice: (minPrice) => set({ minPrice }),
  setMaxPrice: (maxPrice) => set({ maxPrice }),
  setMinRating: (minRating) => set({ minRating }),
  setIsOnline: (isOnline) => set({ isOnline }),
  setSortBy: (sortBy) => set({ sortBy }),
  resetFilters: () =>
    set({
      search: '',
      subjectId: undefined,
      subjectName: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      isOnline: undefined,
      sortBy: 'rating',
    }),
}));
