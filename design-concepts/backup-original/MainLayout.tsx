import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './Sidebar';
import { Search } from 'lucide-react';
import { Input, LanguageSwitcher } from '../ui';
import { NotificationDropdown } from '../notifications';

export function MainLayout() {
  const { t } = useTranslation('navigation');
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/recipes?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Sidebar />

      {/* Main Content - RTL: use logical properties */}
      <div className="ps-64 print:ps-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-neutral-50/80 backdrop-blur-lg border-b border-neutral-100 print:hidden">
          <div className="flex items-center justify-between h-16 px-8">
            {/* Search */}
            <form onSubmit={handleSearch} className="w-96">
              <Input
                placeholder={t('header.searchPlaceholder')}
                leftIcon={<Search className="w-5 h-5" />}
                className="bg-white/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <NotificationDropdown />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
