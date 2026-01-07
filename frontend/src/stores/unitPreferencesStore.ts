import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UnitDisplaySystem = 'metric' | 'imperial' | 'original';

interface UnitPreferencesState {
  // The user's preferred system from their account settings
  userPreferredSystem: 'metric' | 'imperial';

  // Current display overrides (null means use userPreferredSystem)
  recipePageOverride: UnitDisplaySystem | null;
  shoppingPageOverride: UnitDisplaySystem | null;

  // Actions
  setUserPreferredSystem: (system: 'metric' | 'imperial') => void;
  setRecipePageOverride: (system: UnitDisplaySystem | null) => void;
  setShoppingPageOverride: (system: UnitDisplaySystem | null) => void;
  getEffectiveSystem: (page: 'recipe' | 'shopping') => UnitDisplaySystem;
  resetOverrides: () => void;
}

export const useUnitPreferencesStore = create<UnitPreferencesState>()(
  persist(
    (set, get) => ({
      userPreferredSystem: 'metric',
      recipePageOverride: null,
      shoppingPageOverride: null,

      setUserPreferredSystem: (system) => {
        set({ userPreferredSystem: system });
      },

      setRecipePageOverride: (system) => {
        set({ recipePageOverride: system });
      },

      setShoppingPageOverride: (system) => {
        set({ shoppingPageOverride: system });
      },

      getEffectiveSystem: (page) => {
        const state = get();
        if (page === 'recipe' && state.recipePageOverride !== null) {
          return state.recipePageOverride;
        }
        if (page === 'shopping' && state.shoppingPageOverride !== null) {
          return state.shoppingPageOverride;
        }
        // Default to user's preferred system
        return state.userPreferredSystem;
      },

      resetOverrides: () => {
        set({
          recipePageOverride: null,
          shoppingPageOverride: null,
        });
      },
    }),
    {
      name: 'unit-preferences-storage',
      partialize: (state) => ({
        userPreferredSystem: state.userPreferredSystem,
        recipePageOverride: state.recipePageOverride,
        shoppingPageOverride: state.shoppingPageOverride,
      }),
    }
  )
);
