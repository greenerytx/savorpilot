import { useState } from 'react';
import {
  Home,
  Compass,
  UtensilsCrossed,
  FolderOpen,
  Dna,
  Users,
  Bell,
  Plus,
  ChevronDown,
  Link2,
  Instagram,
  Youtube,
  Sparkles,
  FlaskConical,
  Calendar,
  BarChart3,
  ShoppingCart,
  PartyPopper,
  Search,
  Command,
  Settings,
  Menu,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../lib/utils';

// Mock data for all designs
const primaryPages = [
  { label: 'Home', icon: Home, active: true },
  { label: 'Explore', icon: Compass },
  { label: 'My Recipes', icon: UtensilsCrossed },
  { label: 'Collections', icon: FolderOpen },
  { label: 'Flavor DNA', icon: Dna },
  { label: 'Dinner Circles', icon: Users },
  { label: 'Activity', icon: Bell, badge: true },
];

const actionGroups = {
  import: {
    label: 'IMPORT',
    color: 'text-blue-600 bg-blue-50',
    items: [
      { label: 'From URL', icon: Link2 },
      { label: 'Saved Posts', icon: Instagram },
      { label: 'YouTube', icon: Youtube },
    ],
  },
  create: {
    label: 'CREATE',
    color: 'text-purple-600 bg-purple-50',
    items: [
      { label: 'AI Generate', icon: Sparkles },
      { label: 'Fusion Lab', icon: FlaskConical },
    ],
  },
  plan: {
    label: 'PLAN',
    color: 'text-teal-600 bg-teal-50',
    items: [
      { label: 'Meal Planner', icon: Calendar },
      { label: 'Nutrition', icon: BarChart3 },
      { label: 'Shopping List', icon: ShoppingCart },
      { label: 'Party Mode', icon: PartyPopper },
    ],
  },
};

// ============================================
// OPTION A: Compact Vertical Dropdown
// ============================================
function OptionA() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b">
        <h3 className="font-bold text-gray-800">Option A: Compact Vertical Menu</h3>
        <p className="text-xs text-gray-500">Single button → grouped vertical dropdown (like Notion's + menu)</p>
      </div>

      <div className="p-4">
        {/* Mock Nav Bar */}
        <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-2xl p-2 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-coral-500 rounded-xl" />
            <span className="font-bold text-gray-800">SavorPilot</span>
          </div>

          {/* Nav Pills */}
          <div className="flex items-center bg-gray-100 rounded-full p-1">
            {primaryPages.slice(0, 5).map((item, i) => (
              <button
                key={item.label}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-full transition-all',
                  i === 0 ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-200'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 px-4 py-2 bg-coral-500 text-white rounded-xl font-semibold text-sm hover:bg-coral-600 transition-all"
              >
                <Plus className="w-4 h-4" />
                New
                <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                  {Object.entries(actionGroups).map(([key, group]) => (
                    <div key={key} className="py-1">
                      <div className="px-3 py-1">
                        <span className={cn('text-xs font-bold uppercase tracking-wider', group.color.split(' ')[0])}>
                          {group.label}
                        </span>
                      </div>
                      {group.items.map((item) => (
                        <button
                          key={item.label}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <item.icon className="w-4 h-4 text-gray-500" />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-700 to-coral-500 flex items-center justify-center text-white text-sm font-semibold">
              MR
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex gap-2 flex-wrap">
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">✓ Clean single bar</span>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">✓ Familiar pattern</span>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">~ Actions hidden</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// OPTION B: Icon Toolbar + Tooltips
// ============================================
function OptionB() {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const allActions = [
    ...actionGroups.import.items.map(i => ({ ...i, group: 'import' })),
    ...actionGroups.create.items.map(i => ({ ...i, group: 'create' })),
    ...actionGroups.plan.items.map(i => ({ ...i, group: 'plan' })),
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b">
        <h3 className="font-bold text-gray-800">Option B: Icon Action Bar</h3>
        <p className="text-xs text-gray-500">Secondary bar with icon-only buttons + tooltips on hover</p>
      </div>

      <div className="p-4 space-y-2">
        {/* Primary Nav Bar */}
        <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-2xl p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-coral-500 rounded-xl" />
            <span className="font-bold text-gray-800">SavorPilot</span>
          </div>

          <div className="flex items-center bg-gray-100 rounded-full p-1">
            {primaryPages.slice(0, 5).map((item, i) => (
              <button
                key={item.label}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-full transition-all',
                  i === 0 ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-200'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-700 to-coral-500 flex items-center justify-center text-white text-sm font-semibold">
            MR
          </div>
        </div>

        {/* Secondary Icon Bar */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-2 flex items-center justify-center gap-1">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2">Quick Actions:</span>
          {allActions.map((action) => (
            <div key={action.label} className="relative">
              <button
                onMouseEnter={() => setHoveredAction(action.label)}
                onMouseLeave={() => setHoveredAction(null)}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  action.group === 'import' && 'hover:bg-blue-100 hover:text-blue-600',
                  action.group === 'create' && 'hover:bg-purple-100 hover:text-purple-600',
                  action.group === 'plan' && 'hover:bg-teal-100 hover:text-teal-600',
                  'text-gray-500'
                )}
              >
                <action.icon className="w-5 h-5" />
              </button>
              {hoveredAction === action.label && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
                  {action.label}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex gap-2 flex-wrap">
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">✓ All actions visible</span>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">✓ Compact</span>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">~ Requires hover to learn</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// OPTION C: Command Palette Style
// ============================================
function OptionC() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b">
        <h3 className="font-bold text-gray-800">Option C: Command Palette</h3>
        <p className="text-xs text-gray-500">Search bar doubles as action launcher (⌘K style)</p>
      </div>

      <div className="p-4">
        <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-2xl p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-coral-500 rounded-xl" />
            <span className="font-bold text-gray-800">SavorPilot</span>
          </div>

          {/* Search/Command Bar */}
          <div className="relative flex-1 max-w-md mx-4">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="w-full flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-500 text-sm transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Search recipes or type / for actions...</span>
              <kbd className="ml-auto px-2 py-0.5 bg-white rounded text-xs text-gray-400 border">⌘K</kbd>
            </button>

            {searchOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                <div className="p-2 border-b">
                  <input
                    type="text"
                    placeholder="Type to search or / for commands..."
                    className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">Actions</div>
                  {Object.entries(actionGroups).map(([key, group]) => (
                    group.items.slice(0, 2).map((item) => (
                      <button
                        key={item.label}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <item.icon className="w-4 h-4 text-gray-500" />
                        {item.label}
                        <span className="ml-auto text-xs text-gray-400">{group.label}</span>
                      </button>
                    ))
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-700 to-coral-500 flex items-center justify-center text-white text-sm font-semibold">
              MR
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex gap-2 flex-wrap">
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">✓ Modern & minimal</span>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">✓ Keyboard friendly</span>
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">✗ Less discoverable</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// OPTION D: Segmented Secondary Bar
// ============================================
function OptionD() {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b">
        <h3 className="font-bold text-gray-800">Option D: Expandable Segments</h3>
        <p className="text-xs text-gray-500">Click a category to expand its actions inline</p>
      </div>

      <div className="p-4 space-y-2">
        {/* Primary Nav */}
        <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-2xl p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-coral-500 rounded-xl" />
            <span className="font-bold text-gray-800">SavorPilot</span>
          </div>

          <div className="flex items-center bg-gray-100 rounded-full p-1">
            {primaryPages.slice(0, 5).map((item, i) => (
              <button
                key={item.label}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-full transition-all',
                  i === 0 ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-200'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-700 to-coral-500 flex items-center justify-center text-white text-sm font-semibold">
            MR
          </div>
        </div>

        {/* Segmented Action Bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-1 flex items-center gap-1">
          {Object.entries(actionGroups).map(([key, group]) => (
            <div key={key} className="flex-1">
              <button
                onClick={() => setActiveSegment(activeSegment === key ? null : key)}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all',
                  activeSegment === key
                    ? group.color
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {group.label}
                <ChevronDown className={cn('w-4 h-4 transition-transform', activeSegment === key && 'rotate-180')} />
              </button>
            </div>
          ))}
        </div>

        {/* Expanded Actions */}
        {activeSegment && (
          <div className={cn(
            'rounded-xl p-2 flex items-center justify-center gap-2 transition-all',
            actionGroups[activeSegment as keyof typeof actionGroups].color
          )}>
            {actionGroups[activeSegment as keyof typeof actionGroups].items.map((item) => (
              <button
                key={item.label}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/80 hover:bg-white rounded-lg text-sm font-medium transition-colors"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="flex gap-2 flex-wrap">
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">✓ Clear categorization</span>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">✓ Progressive disclosure</span>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">~ Extra click needed</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// OPTION E: Floating Action Button (FAB)
// ============================================
function OptionE() {
  const [fabOpen, setFabOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b">
        <h3 className="font-bold text-gray-800">Option E: Floating Action Button</h3>
        <p className="text-xs text-gray-500">Clean nav + FAB in corner for all actions (mobile-first pattern)</p>
      </div>

      <div className="p-4 relative min-h-[200px]">
        {/* Clean Primary Nav */}
        <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-2xl p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-coral-500 rounded-xl" />
            <span className="font-bold text-gray-800">SavorPilot</span>
          </div>

          <div className="flex items-center bg-gray-100 rounded-full p-1">
            {primaryPages.map((item, i) => (
              <button
                key={item.label}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-full transition-all',
                  i === 0 ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-200'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-700 to-coral-500 flex items-center justify-center text-white text-sm font-semibold">
            MR
          </div>
        </div>

        {/* Mock content area */}
        <div className="mt-4 h-24 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
          Page content here...
        </div>

        {/* FAB */}
        <div className="absolute bottom-4 right-4">
          {fabOpen && (
            <div className="absolute bottom-16 right-0 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 mb-2">
              {Object.entries(actionGroups).map(([key, group]) => (
                <div key={key}>
                  <div className="px-3 py-1 text-xs font-bold text-gray-400 uppercase">{group.label}</div>
                  {group.items.map((item) => (
                    <button
                      key={item.label}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      <item.icon className="w-4 h-4 text-gray-500" />
                      {item.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setFabOpen(!fabOpen)}
            className={cn(
              'w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all',
              fabOpen
                ? 'bg-gray-800 rotate-45'
                : 'bg-gradient-to-br from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700'
            )}
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex gap-2 flex-wrap">
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">✓ Maximum content space</span>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">✓ Mobile friendly</span>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">~ Actions not in nav</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// OPTION F: Two-Row with Visual Grouping
// ============================================
function OptionF() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b">
        <h3 className="font-bold text-gray-800">Option F: Visual Category Chips</h3>
        <p className="text-xs text-gray-500">Secondary bar with colored category chips (like your original, but polished)</p>
      </div>

      <div className="p-4 space-y-2">
        {/* Primary Nav */}
        <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-2xl p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-coral-500 rounded-xl" />
            <span className="font-bold text-gray-800">SavorPilot</span>
          </div>

          <div className="flex items-center bg-gray-100 rounded-full p-1">
            {primaryPages.slice(0, 5).map((item, i) => (
              <button
                key={item.label}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-full transition-all',
                  i === 0 ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-200'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-700 to-coral-500 flex items-center justify-center text-white text-sm font-semibold">
            MR
          </div>
        </div>

        {/* Category Action Bar */}
        <div className="flex items-center justify-center gap-6 py-2">
          {Object.entries(actionGroups).map(([key, group]) => (
            <div key={key} className="flex items-center gap-2">
              <span className={cn(
                'text-xs font-bold uppercase tracking-wider px-2 py-1 rounded',
                group.color
              )}>
                {group.label}
              </span>
              <div className="flex items-center gap-1">
                {group.items.map((item) => (
                  <button
                    key={item.label}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden xl:inline">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex gap-2 flex-wrap">
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">✓ All actions visible</span>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">✓ Clear categories</span>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">~ Needs wide screen</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Page
// ============================================
export default function NavDesignOptions() {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Navigation Design Options</h1>
          <p className="text-gray-600">Click/hover on each option to see interactions. Pick your favorite!</p>
        </div>

        <div className="grid gap-6">
          <OptionA />
          <OptionB />
          <OptionC />
          <OptionD />
          <OptionE />
          <OptionF />
        </div>

        <div className="mt-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Option</th>
                  <th className="text-left py-2 px-3">Best For</th>
                  <th className="text-left py-2 px-3">Trade-off</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">A: Compact Dropdown</td>
                  <td className="py-2 px-3">Clean look, familiar UX</td>
                  <td className="py-2 px-3">Actions hidden until clicked</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">B: Icon Bar</td>
                  <td className="py-2 px-3">Power users, compact</td>
                  <td className="py-2 px-3">Learning curve for icons</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">C: Command Palette</td>
                  <td className="py-2 px-3">Tech-savvy users, minimal UI</td>
                  <td className="py-2 px-3">Low discoverability</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">D: Expandable Segments</td>
                  <td className="py-2 px-3">Clear organization</td>
                  <td className="py-2 px-3">Extra click to see actions</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">E: FAB</td>
                  <td className="py-2 px-3">Mobile-first, max content</td>
                  <td className="py-2 px-3">Actions separate from nav</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">F: Visual Chips</td>
                  <td className="py-2 px-3">Discoverability, clarity</td>
                  <td className="py-2 px-3">Needs wider screens</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
