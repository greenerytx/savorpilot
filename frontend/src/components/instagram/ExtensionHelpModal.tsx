import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Download,
  Chrome,
  Settings,
  FolderOpen,
  ToggleRight,
  Upload,
  CheckCircle,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui';

interface ExtensionHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const stepIcons = [Download, FolderOpen, Chrome, ToggleRight, Upload, CheckCircle];
const stepKeys = ['download', 'extract', 'openChrome', 'developerMode', 'loadExtension', 'pinExtension'] as const;

export function ExtensionHelpModal({ isOpen, onClose }: ExtensionHelpModalProps) {
  const { t } = useTranslation('instagram');

  const steps = useMemo(() => stepKeys.map((key, index) => ({
    icon: stepIcons[index],
    title: t(`extension.steps.${key}.title`),
    description: t(`extension.steps.${key}.description`),
  })), [t]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/extension/download`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to download extension');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gramgrab-extension.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadError(t('extension.downloadFailed'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText('chrome://extensions');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-xl shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <Chrome className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">{t('extension.title')}</h2>
              <p className="text-sm text-neutral-500">{t('extension.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Download Section */}
          <div className="bg-gradient-to-r from-primary-50 to-orange-50 rounded-xl p-6 border border-primary-100">
            <h3 className="font-semibold text-neutral-900 mb-2">{t('extension.getExtension')}</h3>
            <p className="text-sm text-neutral-600 mb-4">
              {t('extension.description')}
            </p>
            <div className="flex items-center gap-3">
              <Button onClick={handleDownload} disabled={isDownloading}>
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('extension.downloading')}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    {t('extension.downloadExtension')}
                  </>
                )}
              </Button>
              {downloadError && (
                <span className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {downloadError}
                </span>
              )}
            </div>
          </div>

          {/* Installation Steps */}
          <div>
            <h3 className="font-semibold text-neutral-900 mb-4">{t('extension.installationSteps')}</h3>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-medium text-sm">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <step.icon className="w-4 h-4 text-primary-500" />
                      <span className="font-medium text-neutral-900">{step.title}</span>
                    </div>
                    <p className="text-sm text-neutral-600">{step.description}</p>

                    {/* Special action for Chrome Extensions step */}
                    {index === 2 && (
                      <div className="mt-2 flex items-center gap-2">
                        <code className="px-2 py-1 bg-neutral-100 rounded text-sm text-neutral-700">
                          chrome://extensions
                        </code>
                        <button
                          onClick={handleCopyUrl}
                          className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded"
                          title={t('extension.copyUrl')}
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="bg-neutral-50 rounded-xl p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">{t('extension.howToUse')}</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-neutral-600">
              <li>{t('extension.usageSteps.step1')}</li>
              <li>{t('extension.usageSteps.step2')}</li>
              <li>{t('extension.usageSteps.step3')}</li>
              <li>{t('extension.usageSteps.step4')}</li>
              <li>{t('extension.usageSteps.step5')}</li>
            </ol>
          </div>

          {/* Troubleshooting */}
          <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
            <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {t('extension.troubleshooting')}
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-amber-700">
              <li>{t('extension.troubleshootingItems.notLoggedInInstagram')}</li>
              <li>{t('extension.troubleshootingItems.notLoggedInSavorPilot')}</li>
              <li>{t('extension.troubleshootingItems.syncFailed')}</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-neutral-50">
          <a
            href="https://support.google.com/chrome_webstore/answer/2664769"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            {t('extension.chromeHelp')}
            <ExternalLink className="w-3 h-3" />
          </a>
          <Button variant="outline" onClick={onClose}>
            {t('extension.close')}
          </Button>
        </div>
      </div>
    </div>
  );
}
