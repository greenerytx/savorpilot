import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shoppingService } from '../services/shopping.service';
import type {
  ShoppingList,
  ShoppingListItem,
  CreateShoppingListDto,
  CreateShoppingListItemDto,
  UpdateShoppingListItemDto,
  GenerateFromRecipeDto,
  GenerateFromMealPlanDto,
} from '../services/shopping.service';

// Query keys
export const shoppingKeys = {
  all: ['shopping-lists'] as const,
  lists: () => [...shoppingKeys.all, 'list'] as const,
  list: () => [...shoppingKeys.lists()] as const,
  details: () => [...shoppingKeys.all, 'detail'] as const,
  detail: (id: string) => [...shoppingKeys.details(), id] as const,
};

// Get all shopping lists
export function useShoppingLists() {
  return useQuery({
    queryKey: shoppingKeys.list(),
    queryFn: () => shoppingService.getShoppingLists(),
  });
}

// Get single shopping list
export function useShoppingList(id: string) {
  return useQuery({
    queryKey: shoppingKeys.detail(id),
    queryFn: () => shoppingService.getShoppingList(id),
    enabled: !!id,
  });
}

// Create shopping list
export function useCreateShoppingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateShoppingListDto) => shoppingService.createShoppingList(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppingKeys.all });
    },
  });
}

// Update shopping list
export function useUpdateShoppingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CreateShoppingListDto }) =>
      shoppingService.updateShoppingList(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: shoppingKeys.all });
      queryClient.setQueryData(shoppingKeys.detail(data.id), data);
    },
  });
}

// Delete shopping list
export function useDeleteShoppingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => shoppingService.deleteShoppingList(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppingKeys.all });
    },
  });
}

// Add item
export function useAddShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, dto }: { listId: string; dto: CreateShoppingListItemDto }) =>
      shoppingService.addItem(listId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: shoppingKeys.detail(variables.listId) });
      queryClient.invalidateQueries({ queryKey: shoppingKeys.lists() });
    },
  });
}

// Update item
export function useUpdateShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      listId,
      itemId,
      dto,
    }: {
      listId: string;
      itemId: string;
      dto: UpdateShoppingListItemDto;
    }) => shoppingService.updateItem(listId, itemId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: shoppingKeys.detail(variables.listId) });
    },
  });
}

// Toggle item
export function useToggleShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, itemId }: { listId: string; itemId: string }) =>
      shoppingService.toggleItem(listId, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: shoppingKeys.detail(variables.listId) });
      queryClient.invalidateQueries({ queryKey: shoppingKeys.lists() });
    },
  });
}

// Delete item
export function useDeleteShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, itemId }: { listId: string; itemId: string }) =>
      shoppingService.deleteItem(listId, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: shoppingKeys.detail(variables.listId) });
      queryClient.invalidateQueries({ queryKey: shoppingKeys.lists() });
    },
  });
}

// Clear checked items
export function useClearCheckedItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listId: string) => shoppingService.clearChecked(listId),
    onSuccess: (_, listId) => {
      queryClient.invalidateQueries({ queryKey: shoppingKeys.detail(listId) });
      queryClient.invalidateQueries({ queryKey: shoppingKeys.lists() });
    },
  });
}

// Generate from recipe
export function useGenerateFromRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: GenerateFromRecipeDto) => shoppingService.generateFromRecipe(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppingKeys.all });
    },
  });
}

// Generate from meal plan
export function useGenerateFromMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: GenerateFromMealPlanDto) => shoppingService.generateFromMealPlan(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppingKeys.all });
    },
  });
}
