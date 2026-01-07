import { api } from './api';
import type {
  SmartCollection,
  SmartCollectionWithRecipes,
  CreateSmartCollectionDto,
  UpdateSmartCollectionDto,
  FilterRules,
  FilterPreviewResult,
  CollectionVisibility,
} from '../types/smart-collection';

export const smartCollectionService = {
  // Get all smart collections
  async getSmartCollections(): Promise<SmartCollection[]> {
    const response = await api.get<SmartCollection[]>('/smart-collections');
    return response.data;
  },

  // Get a single smart collection with recipes
  async getSmartCollection(id: string): Promise<SmartCollectionWithRecipes> {
    const response = await api.get<SmartCollectionWithRecipes>(`/smart-collections/${id}`);
    return response.data;
  },

  // Create a new smart collection
  async createSmartCollection(data: CreateSmartCollectionDto): Promise<SmartCollection> {
    const response = await api.post<SmartCollection>('/smart-collections', data);
    return response.data;
  },

  // Update a smart collection
  async updateSmartCollection(id: string, data: UpdateSmartCollectionDto): Promise<SmartCollection> {
    const response = await api.put<SmartCollection>(`/smart-collections/${id}`, data);
    return response.data;
  },

  // Delete a smart collection
  async deleteSmartCollection(id: string): Promise<void> {
    await api.delete(`/smart-collections/${id}`);
  },

  // Preview filter results
  async previewFilter(filters: FilterRules): Promise<FilterPreviewResult> {
    const response = await api.post<FilterPreviewResult>('/smart-collections/preview', filters);
    return response.data;
  },

  // Initialize system collections
  async initSystemCollections(): Promise<void> {
    await api.post('/smart-collections/init-system');
  },

  // Update visibility of a smart collection
  async updateVisibility(id: string, visibility: CollectionVisibility): Promise<SmartCollection> {
    const response = await api.put<SmartCollection>(`/smart-collections/${id}`, { visibility });
    return response.data;
  },
};
