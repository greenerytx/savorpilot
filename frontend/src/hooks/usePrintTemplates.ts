import { useState, useEffect, useCallback } from 'react';

export interface PrintSection {
  id: string;
  label: string;
  description?: string;
  enabled: boolean;
}

export interface PrintOptions {
  colorMode: 'color' | 'bw';
  compactMode: boolean;
}

export interface PrintTemplate {
  id: string;
  name: string;
  sections: Record<string, boolean>;
  options: PrintOptions;
  createdAt: string;
  isDefault?: boolean;
}

export const DEFAULT_PRINT_OPTIONS: PrintOptions = {
  colorMode: 'color',
  compactMode: false,
};

const STORAGE_KEY = 'recipe-print-templates';
const DEFAULT_TEMPLATE_KEY = 'recipe-print-default-template';

// Default sections available for printing
export const DEFAULT_PRINT_SECTIONS: PrintSection[] = [
  { id: 'header', label: 'Recipe Header', description: 'Title, image, author, and basic info', enabled: true },
  { id: 'quickStats', label: 'Quick Stats', description: 'Time, servings, and difficulty', enabled: true },
  { id: 'tags', label: 'Tags & Category', description: 'Difficulty, category, cuisine badges', enabled: true },
  { id: 'ingredients', label: 'Ingredients', description: 'All ingredients with quantities', enabled: true },
  { id: 'steps', label: 'Instructions', description: 'Step-by-step cooking instructions', enabled: true },
  { id: 'nutrition', label: 'Nutrition Info', description: 'Calories, protein, carbs, fat', enabled: true },
  { id: 'notes', label: 'Notes', description: 'Personal and shared notes', enabled: true },
  { id: 'forks', label: 'Forks', description: 'Recipe forks and variations', enabled: false },
  { id: 'comments', label: 'Comments', description: 'User comments and discussion', enabled: false },
  { id: 'allergenWarning', label: 'Allergen Warnings', description: 'Personal allergen alerts', enabled: false },
  { id: 'circleCompatibility', label: 'Circle Compatibility', description: 'Dietary compatibility with circles', enabled: false },
  { id: 'translations', label: 'Translations', description: 'English and Arabic translations', enabled: false },
  { id: 'source', label: 'Source Info', description: 'Original source and link', enabled: true },
  { id: 'forkInfo', label: 'Fork Information', description: 'Parent recipe and fork note', enabled: false },
];

export function usePrintTemplates() {
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [defaultTemplateId, setDefaultTemplateId] = useState<string | null>(null);

  // Load templates from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTemplates(JSON.parse(stored));
      }
      const defaultId = localStorage.getItem(DEFAULT_TEMPLATE_KEY);
      if (defaultId) {
        setDefaultTemplateId(defaultId);
      }
    } catch (error) {
      console.error('Failed to load print templates:', error);
    }
  }, []);

  // Save templates to localStorage
  const saveTemplates = useCallback((newTemplates: PrintTemplate[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
      setTemplates(newTemplates);
    } catch (error) {
      console.error('Failed to save print templates:', error);
    }
  }, []);

  // Create a new template
  const createTemplate = useCallback((name: string, sections: Record<string, boolean>, options: PrintOptions): PrintTemplate => {
    const newTemplate: PrintTemplate = {
      id: `template-${Date.now()}`,
      name,
      sections,
      options,
      createdAt: new Date().toISOString(),
    };
    const newTemplates = [...templates, newTemplate];
    saveTemplates(newTemplates);
    return newTemplate;
  }, [templates, saveTemplates]);

  // Update an existing template
  const updateTemplate = useCallback((id: string, updates: Partial<Pick<PrintTemplate, 'name' | 'sections' | 'options'>>) => {
    const newTemplates = templates.map(t =>
      t.id === id ? { ...t, ...updates } : t
    );
    saveTemplates(newTemplates);
  }, [templates, saveTemplates]);

  // Delete a template
  const deleteTemplate = useCallback((id: string) => {
    const newTemplates = templates.filter(t => t.id !== id);
    saveTemplates(newTemplates);
    if (defaultTemplateId === id) {
      localStorage.removeItem(DEFAULT_TEMPLATE_KEY);
      setDefaultTemplateId(null);
    }
  }, [templates, saveTemplates, defaultTemplateId]);

  // Set default template
  const setDefaultTemplate = useCallback((id: string | null) => {
    if (id) {
      localStorage.setItem(DEFAULT_TEMPLATE_KEY, id);
    } else {
      localStorage.removeItem(DEFAULT_TEMPLATE_KEY);
    }
    setDefaultTemplateId(id);
  }, []);

  // Get default template
  const getDefaultTemplate = useCallback((): PrintTemplate | null => {
    if (!defaultTemplateId) return null;
    return templates.find(t => t.id === defaultTemplateId) || null;
  }, [templates, defaultTemplateId]);

  // Get sections from a template or default sections
  const getSectionsFromTemplate = useCallback((templateId?: string): Record<string, boolean> => {
    const template = templateId
      ? templates.find(t => t.id === templateId)
      : getDefaultTemplate();

    if (template) {
      return template.sections;
    }

    // Return default enabled state
    return DEFAULT_PRINT_SECTIONS.reduce((acc, section) => {
      acc[section.id] = section.enabled;
      return acc;
    }, {} as Record<string, boolean>);
  }, [templates, getDefaultTemplate]);

  // Get options from a template or default options
  const getOptionsFromTemplate = useCallback((templateId?: string): PrintOptions => {
    const template = templateId
      ? templates.find(t => t.id === templateId)
      : getDefaultTemplate();

    if (template?.options) {
      return template.options;
    }

    return DEFAULT_PRINT_OPTIONS;
  }, [templates, getDefaultTemplate]);

  return {
    templates,
    defaultTemplateId,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultTemplate,
    getDefaultTemplate,
    getSectionsFromTemplate,
    getOptionsFromTemplate,
  };
}
