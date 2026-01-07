import { api } from './api';

export interface NutritionGoals {
  id: string;
  userId: string;
  dailyCalories: number;
  dailyProteinG: number;
  dailyCarbsG: number;
  dailyFatG: number;
  dailyFiberG: number | null;
  dailySodiumMg: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNutritionGoalsDto {
  dailyCalories?: number;
  dailyProteinG?: number;
  dailyCarbsG?: number;
  dailyFatG?: number;
  dailyFiberG?: number;
  dailySodiumMg?: number;
}

export interface NutritionPreset {
  dailyCalories: number;
  dailyProteinG: number;
  dailyCarbsG: number;
  dailyFatG: number;
  dailyFiberG: number;
  dailySodiumMg: number;
}

export type NutritionPresetKey = 'weightLoss' | 'maintenance' | 'muscleGain' | 'lowCarb';

export type NutritionPresets = Record<NutritionPresetKey, NutritionPreset>;

// Preset display metadata
export const PRESET_METADATA: Record<
  NutritionPresetKey,
  { label: string; description: string }
> = {
  weightLoss: {
    label: 'Weight Loss',
    description: '1,500 calories with higher protein for satiety',
  },
  maintenance: {
    label: 'Maintenance',
    description: '2,000 calories with balanced macros',
  },
  muscleGain: {
    label: 'Muscle Gain',
    description: '2,500 calories with high protein for muscle building',
  },
  lowCarb: {
    label: 'Low Carb',
    description: '1,800 calories with minimal carbs and higher fat',
  },
};

class NutritionGoalsService {
  /**
   * Get current user's nutrition goals
   */
  async getGoals(): Promise<NutritionGoals> {
    const response = await api.get('/nutrition/goals');
    return response.data;
  }

  /**
   * Update current user's nutrition goals
   */
  async updateGoals(dto: UpdateNutritionGoalsDto): Promise<NutritionGoals> {
    const response = await api.put('/nutrition/goals', dto);
    return response.data;
  }

  /**
   * Get available nutrition presets
   */
  async getPresets(): Promise<NutritionPresets> {
    const response = await api.get('/nutrition/presets');
    return response.data;
  }

  /**
   * Apply a preset to current user's nutrition goals
   */
  async applyPreset(presetKey: NutritionPresetKey): Promise<NutritionGoals> {
    const response = await api.post(`/nutrition/goals/preset/${presetKey}`);
    return response.data;
  }
}

export const nutritionGoalsService = new NutritionGoalsService();
