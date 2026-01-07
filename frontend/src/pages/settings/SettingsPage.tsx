import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User,
  Mail,
  Lock,
  Bell,
  Globe,
  Palette,
  LogOut,
  Save,
  Loader2,
  ChefHat,
  Camera,
  Languages,
  Dna,
  Target,
} from 'lucide-react';
import { Button, Card, Input, useToast } from '../../components/ui';
import { FlavorProfileCard } from '../../components/profile';
import { NutritionGoalsSettings } from '../../components/settings';
import { useAuthStore } from '../../stores/authStore';
import { useUnitPreferencesStore } from '../../stores/unitPreferencesStore';
import { useUserPreferences, useUpdatePreferences } from '../../hooks/useUserPreferences';

type SettingsTab = 'profile' | 'flavorDna' | 'nutrition' | 'preferences' | 'notifications' | 'security';

export function SettingsPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('settings');
  const toast = useToast();
  const { user, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);

  // Preferences API hooks
  const { data: preferences, isLoading: loadingPreferences } = useUserPreferences();
  const updatePreferences = useUpdatePreferences();
  const { setUserPreferredSystem, resetOverrides } = useUnitPreferencesStore();

  // Profile form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');

  // Preferences state
  const [language, setLanguage] = useState(i18n.language || 'en');
  const [defaultServings, setDefaultServings] = useState(4);
  const [preferredUnits, setPreferredUnits] = useState<'metric' | 'imperial'>('metric');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  // Notification state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  // Initialize preferences from API
  useEffect(() => {
    if (preferences) {
      setLanguage(preferences.language || 'en');
      setDefaultServings(preferences.defaultServings || 4);
      setPreferredUnits(preferences.preferredUnits || 'metric');
      // Sync with unit preferences store
      setUserPreferredSystem(preferences.preferredUnits || 'metric');
    }
  }, [preferences, setUserPreferredSystem]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    // TODO: Implement profile update API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success(t('messages.profileUpdated'));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
  };

  const handleSavePreferences = async () => {
    try {
      await updatePreferences.mutateAsync({
        language,
        defaultServings,
        preferredUnits,
      });
      // Sync with unit preferences store
      setUserPreferredSystem(preferredUnits);
      resetOverrides(); // Reset any page-specific overrides to use new default
      toast.success(t('messages.preferencesUpdated'));
    } catch {
      toast.error('Failed to save preferences');
    }
  };

  const tabs = [
    { id: 'profile' as const, labelKey: 'tabs.profile', icon: User },
    { id: 'flavorDna' as const, label: 'Flavor DNA', icon: Dna },
    { id: 'nutrition' as const, label: 'Nutrition Goals', icon: Target },
    { id: 'preferences' as const, labelKey: 'tabs.preferences', icon: Palette },
    { id: 'notifications' as const, labelKey: 'tabs.notifications', icon: Bell },
    { id: 'security' as const, labelKey: 'tabs.security', icon: Lock },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-primary-900">{t('title')}</h1>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-start transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {'label' in tab ? tab.label : t(tab.labelKey)}
                </button>
              ))}
              <div className="border-t border-neutral-200 my-2" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-start text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                {t('sidebar.signOut', { ns: 'navigation' })}
              </button>
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-2">{t('profile.title')}</h2>
              <p className="text-sm text-neutral-500 mb-6">{t('profile.subtitle')}</p>

              {/* Avatar */}
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.firstName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <ChefHat className="w-10 h-10 text-primary-500" />
                    )}
                  </div>
                  <button className="absolute bottom-0 end-0 w-8 h-8 bg-white border border-neutral-200 rounded-full flex items-center justify-center hover:bg-neutral-50 transition-colors">
                    <Camera className="w-4 h-4 text-neutral-600" />
                  </button>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-sm text-neutral-500">{user?.email}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {t('profile.memberSince')} {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      {t('profile.firstName')}
                    </label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      leftIcon={<User className="w-5 h-5" />}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      {t('profile.lastName')}
                    </label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {t('profile.email')}
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftIcon={<Mail className="w-5 h-5" />}
                  />
                </div>

                <div className="pt-4">
                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('saving', { ns: 'common' })}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {t('buttons.save', { ns: 'common' })}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Flavor DNA Tab */}
          {activeTab === 'flavorDna' && (
            <FlavorProfileCard />
          )}

          {/* Nutrition Goals Tab */}
          {activeTab === 'nutrition' && (
            <NutritionGoalsSettings />
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-2">{t('preferences.title')}</h2>
              <p className="text-sm text-neutral-500 mb-6">{t('preferences.subtitle')}</p>

              <div className="space-y-6">
                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    <Languages className="w-4 h-4 inline me-2" />
                    {t('preferences.language')}
                  </label>
                  <p className="text-xs text-neutral-500 mb-2">
                    {t('preferences.languageDescription')}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        language === 'en'
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'border-neutral-200 hover:border-primary-300'
                      }`}
                    >
                      {t('languages.en')}
                    </button>
                    <button
                      onClick={() => handleLanguageChange('ar')}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        language === 'ar'
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'border-neutral-200 hover:border-primary-300'
                      }`}
                    >
                      {t('languages.ar')}
                    </button>
                  </div>
                </div>

                {/* Default Servings */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {t('preferences.defaultServings')}
                  </label>
                  <p className="text-xs text-neutral-500 mb-2">
                    {t('preferences.defaultServingsDescription')}
                  </p>
                  <Input
                    type="number"
                    value={defaultServings}
                    onChange={(e) => setDefaultServings(parseInt(e.target.value) || 4)}
                    min={1}
                    max={100}
                    className="w-32"
                  />
                </div>

                {/* Preferred Units */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {t('preferences.preferredUnits')}
                  </label>
                  <p className="text-xs text-neutral-500 mb-2">
                    {t('preferences.preferredUnitsDescription')}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPreferredUnits('imperial')}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        preferredUnits === 'imperial'
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'border-neutral-200 hover:border-primary-300'
                      }`}
                    >
                      <Globe className="w-4 h-4 inline me-2" />
                      {t('preferences.imperial')}
                    </button>
                    <button
                      onClick={() => setPreferredUnits('metric')}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        preferredUnits === 'metric'
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'border-neutral-200 hover:border-primary-300'
                      }`}
                    >
                      <Globe className="w-4 h-4 inline me-2" />
                      {t('preferences.metric')}
                    </button>
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {t('preferences.theme')}
                  </label>
                  <p className="text-xs text-neutral-500 mb-2">
                    {t('preferences.themeDescription')}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setTheme('light')}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        theme === 'light'
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'border-neutral-200 hover:border-primary-300'
                      }`}
                    >
                      {t('preferences.themeLight')}
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'border-neutral-200 hover:border-primary-300'
                      }`}
                    >
                      {t('preferences.themeDark')}
                    </button>
                    <button
                      onClick={() => setTheme('system')}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        theme === 'system'
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'border-neutral-200 hover:border-primary-300'
                      }`}
                    >
                      {t('preferences.themeSystem')}
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleSavePreferences}
                    disabled={isSaving || updatePreferences.isPending}
                  >
                    {(isSaving || updatePreferences.isPending) ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('saving', { ns: 'common' })}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {t('buttons.save', { ns: 'common' })}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-2">{t('notifications.title')}</h2>
              <p className="text-sm text-neutral-500 mb-6">{t('notifications.subtitle')}</p>

              <div className="space-y-4">
                {/* Email Notifications */}
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                  <div>
                    <p className="font-medium text-neutral-900">{t('notifications.emailNotifications')}</p>
                    <p className="text-sm text-neutral-500">
                      {t('notifications.emailNotificationsDescription')}
                    </p>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      emailNotifications ? 'bg-primary-500' : 'bg-neutral-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        emailNotifications ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-0.5 rtl:-translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Weekly Digest */}
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                  <div>
                    <p className="font-medium text-neutral-900">{t('notifications.weeklyDigest')}</p>
                    <p className="text-sm text-neutral-500">
                      {t('notifications.weeklyDigestDescription')}
                    </p>
                  </div>
                  <button
                    onClick={() => setWeeklyDigest(!weeklyDigest)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      weeklyDigest ? 'bg-primary-500' : 'bg-neutral-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        weeklyDigest ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-0.5 rtl:-translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-4">
                  <Button>
                    <Save className="w-4 h-4" />
                    {t('buttons.save', { ns: 'common' })}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-6">{t('security.title')}</h2>

              <div className="space-y-6">
                {/* Change Password */}
                <div>
                  <h3 className="font-medium text-neutral-900 mb-3">{t('security.changePassword')}</h3>
                  <div className="space-y-3">
                    <Input
                      type="password"
                      placeholder={t('security.currentPassword')}
                      leftIcon={<Lock className="w-5 h-5" />}
                    />
                    <Input
                      type="password"
                      placeholder={t('security.newPassword')}
                      leftIcon={<Lock className="w-5 h-5" />}
                    />
                    <Input
                      type="password"
                      placeholder={t('security.confirmPassword')}
                      leftIcon={<Lock className="w-5 h-5" />}
                    />
                    <Button variant="outline">
                      {t('security.updatePassword')}
                    </Button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="pt-6 border-t border-neutral-200">
                  <h3 className="font-medium text-red-600 mb-3">{t('security.dangerZone')}</h3>
                  <p className="text-sm text-neutral-500 mb-3">
                    {t('security.deleteAccountDescription')}
                  </p>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    {t('security.deleteAccount')}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
