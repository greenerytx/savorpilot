import { useState, useEffect } from 'react';
import {
  Printer,
  Save,
  Trash2,
  Star,
  StarOff,
  Check,
  X,
  FileText,
  ChevronDown,
  Plus,
  Palette,
  FileImage,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { usePrintTemplates, DEFAULT_PRINT_SECTIONS, DEFAULT_PRINT_OPTIONS, type PrintTemplate, type PrintOptions } from '../../hooks/usePrintTemplates';
import { useToast } from '../ui/Toast';

interface PrintSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (enabledSections: Record<string, boolean>, options: PrintOptions) => void;
  recipeTitle: string;
  availableSections?: string[];
}

export function PrintSettingsModal({
  isOpen,
  onClose,
  onPrint,
  recipeTitle,
  availableSections,
}: PrintSettingsModalProps) {
  const toast = useToast();
  const {
    templates,
    defaultTemplateId,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultTemplate,
    getSectionsFromTemplate,
    getOptionsFromTemplate,
  } = usePrintTemplates();

  const [sections, setSections] = useState<Record<string, boolean>>({});
  const [options, setOptions] = useState<PrintOptions>(DEFAULT_PRINT_OPTIONS);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  // Initialize sections and options when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialSections = getSectionsFromTemplate(defaultTemplateId || undefined);
      const initialOptions = getOptionsFromTemplate(defaultTemplateId || undefined);
      setSections(initialSections);
      setOptions(initialOptions);
      setSelectedTemplateId(defaultTemplateId);
    }
  }, [isOpen, defaultTemplateId, getSectionsFromTemplate, getOptionsFromTemplate]);

  // Filter sections based on what's available in the recipe
  const displaySections = DEFAULT_PRINT_SECTIONS.filter(
    section => !availableSections || availableSections.includes(section.id)
  );

  const toggleSection = (sectionId: string) => {
    setSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
    setSelectedTemplateId(null);
  };

  const toggleAll = (enabled: boolean) => {
    const newSections: Record<string, boolean> = {};
    displaySections.forEach(section => {
      newSections[section.id] = enabled;
    });
    setSections(newSections);
    setSelectedTemplateId(null);
  };

  const handleLoadTemplate = (template: PrintTemplate) => {
    setSections(template.sections);
    if (template.options) {
      setOptions(template.options);
    }
    setSelectedTemplateId(template.id);
    setShowTemplateDropdown(false);
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    createTemplate(newTemplateName.trim(), sections, options);
    toast.success(`Template "${newTemplateName}" saved`);
    setNewTemplateName('');
    setShowSaveDialog(false);
  };

  const handleUpdateTemplate = () => {
    if (!selectedTemplateId) return;
    updateTemplate(selectedTemplateId, { sections, options });
    toast.success('Template updated');
  };

  const handleDeleteTemplate = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const template = templates.find(t => t.id === templateId);
    deleteTemplate(templateId);
    toast.success(`Template "${template?.name}" deleted`);
    if (selectedTemplateId === templateId) {
      setSelectedTemplateId(null);
    }
  };

  const handleSetDefault = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (defaultTemplateId === templateId) {
      setDefaultTemplate(null);
      toast.info('Default template cleared');
    } else {
      setDefaultTemplate(templateId);
      const template = templates.find(t => t.id === templateId);
      toast.success(`"${template?.name}" set as default`);
    }
  };

  const handlePrint = () => {
    onPrint(sections, options);
    onClose();
  };

  const enabledCount = Object.values(sections).filter(Boolean).length;
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Printer className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="font-semibold text-neutral-900">Print Settings</h2>
              <p className="text-sm text-neutral-500 truncate max-w-[250px]">{recipeTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Selection */}
        <div className="p-4 border-b border-neutral-100 bg-neutral-50">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <button
                onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm">
                    {selectedTemplate ? selectedTemplate.name : 'Select template...'}
                  </span>
                </span>
                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showTemplateDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showTemplateDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {templates.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-neutral-500 text-center">
                      No saved templates yet
                    </p>
                  ) : (
                    templates.map(template => (
                      <div
                        key={template.id}
                        onClick={() => handleLoadTemplate(template)}
                        className="flex items-center justify-between px-3 py-2 hover:bg-neutral-50 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          {defaultTemplateId === template.id && (
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          )}
                          <span className="text-sm text-neutral-700">{template.name}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleSetDefault(template.id, e)}
                            className="p-1 hover:bg-neutral-200 rounded"
                            title={defaultTemplateId === template.id ? 'Remove as default' : 'Set as default'}
                          >
                            {defaultTemplateId === template.id ? (
                              <StarOff className="w-3.5 h-3.5 text-neutral-500" />
                            ) : (
                              <Star className="w-3.5 h-3.5 text-neutral-500" />
                            )}
                          </button>
                          <button
                            onClick={(e) => handleDeleteTemplate(template.id, e)}
                            className="p-1 hover:bg-red-100 rounded"
                            title="Delete template"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedTemplateId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUpdateTemplate}
                title="Update this template with current settings"
              >
                <Save className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
              title="Save as new template"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Save New Template Dialog */}
          {showSaveDialog && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Template name..."
                className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTemplate();
                  if (e.key === 'Escape') setShowSaveDialog(false);
                }}
              />
              <Button size="sm" onClick={handleSaveTemplate}>
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSaveDialog(false);
                  setNewTemplateName('');
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Print Options */}
        <div className="p-4 border-b border-neutral-100">
          <p className="text-sm font-medium text-neutral-700 mb-3">Print Style</p>
          <div className="flex gap-3">
            {/* Color Mode */}
            <button
              onClick={() => setOptions(prev => ({ ...prev, colorMode: 'color' }))}
              className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                options.colorMode === 'color'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className={`p-2 rounded-lg ${options.colorMode === 'color' ? 'bg-primary-100' : 'bg-neutral-100'}`}>
                <Palette className={`w-5 h-5 ${options.colorMode === 'color' ? 'text-primary-600' : 'text-neutral-500'}`} />
              </div>
              <div className="text-left">
                <p className={`text-sm font-medium ${options.colorMode === 'color' ? 'text-primary-900' : 'text-neutral-700'}`}>
                  Color
                </p>
                <p className="text-xs text-neutral-500">Vibrant & styled</p>
              </div>
            </button>

            {/* B&W Mode */}
            <button
              onClick={() => setOptions(prev => ({ ...prev, colorMode: 'bw' }))}
              className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                options.colorMode === 'bw'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className={`p-2 rounded-lg ${options.colorMode === 'bw' ? 'bg-primary-100' : 'bg-neutral-100'}`}>
                <FileImage className={`w-5 h-5 ${options.colorMode === 'bw' ? 'text-primary-600' : 'text-neutral-500'}`} />
              </div>
              <div className="text-left">
                <p className={`text-sm font-medium ${options.colorMode === 'bw' ? 'text-primary-900' : 'text-neutral-700'}`}>
                  Black & White
                </p>
                <p className="text-xs text-neutral-500">Ink-saving</p>
              </div>
            </button>
          </div>

          {/* Compact Mode Toggle */}
          <label className="flex items-center gap-3 mt-3 p-3 rounded-xl border border-neutral-200 cursor-pointer hover:bg-neutral-50 transition-colors">
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                options.compactMode
                  ? 'bg-primary-500 border-primary-500'
                  : 'border-neutral-300'
              }`}
            >
              {options.compactMode && <Check className="w-3 h-3 text-white" />}
            </div>
            <input
              type="checkbox"
              checked={options.compactMode}
              onChange={(e) => setOptions(prev => ({ ...prev, compactMode: e.target.checked }))}
              className="sr-only"
            />
            <div>
              <p className="text-sm font-medium text-neutral-700">Compact Mode</p>
              <p className="text-xs text-neutral-500">Reduce spacing to fit more on page</p>
            </div>
          </label>
        </div>

        {/* Sections List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-neutral-500">
              {enabledCount} of {displaySections.length} sections selected
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleAll(true)}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Select all
              </button>
              <span className="text-neutral-300">|</span>
              <button
                onClick={() => toggleAll(false)}
                className="text-xs text-neutral-500 hover:text-neutral-700"
              >
                Deselect all
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {displaySections.map(section => (
              <label
                key={section.id}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  sections[section.id]
                    ? 'bg-primary-50 border border-primary-200'
                    : 'bg-neutral-50 border border-transparent hover:bg-neutral-100'
                }`}
              >
                <div
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    sections[section.id]
                      ? 'bg-primary-500 border-primary-500'
                      : 'border-neutral-300'
                  }`}
                >
                  {sections[section.id] && <Check className="w-3 h-3 text-white" />}
                </div>
                <input
                  type="checkbox"
                  checked={sections[section.id] || false}
                  onChange={() => toggleSection(section.id)}
                  className="sr-only"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900">{section.label}</p>
                  {section.description && (
                    <p className="text-xs text-neutral-500 mt-0.5">{section.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-neutral-100 bg-neutral-50">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handlePrint} disabled={enabledCount === 0}>
            <Printer className="w-4 h-4 mr-2" />
            Print ({enabledCount} sections)
          </Button>
        </div>
      </Card>
    </div>
  );
}
