import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Settings,
  Loader2,
  Calendar,
  Filter,
  X,
} from 'lucide-react';
import { Card, Button } from '../../components/ui';
import {
  GoalProgressCard,
  MacroChart,
  TrendCard,
  RollingTrendCard,
  GapAlert,
  PeriodComparison,
} from '../../components/nutrition';
import { useNutritionGoalsWithDefaults } from '../../hooks/useNutritionGoals';
import {
  useWeeklyAnalytics,
  useRollingAverage,
  useTopRecipes,
  useNutrientGaps,
  usePeriodComparison,
  getWeekStart,
  getPreviousWeekStart,
  getNextWeekStart,
  formatDateRange,
} from '../../hooks/useNutritionAnalytics';
import { NutritionMetric } from '../../services/nutrition-analytics.service';

type ViewTab = 'week' | 'month';
type ChartMetric = 'calories' | 'macros';

const CUISINE_OPTIONS = [
  'Italian',
  'Mexican',
  'Asian',
  'American',
  'Mediterranean',
  'Indian',
  'French',
  'Japanese',
  'Chinese',
  'Thai',
];

export function NutritionDashboardPage() {
  const [viewTab, setViewTab] = useState<ViewTab>('week');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('calories');
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [rollingDays, setRollingDays] = useState(7);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);

  // Get user goals
  const { goals } = useNutritionGoalsWithDefaults();

  // Fetch analytics data
  const { data: weeklyData, isLoading: loadingWeekly } = useWeeklyAnalytics(weekStart);
  const { data: rollingData, isLoading: loadingRolling } = useRollingAverage(rollingDays);
  const { data: topProtein } = useTopRecipes(NutritionMetric.PROTEIN, 5);
  const { data: gaps } = useNutrientGaps(7);

  // Period comparison (this week vs last week)
  const prevWeekStart = getPreviousWeekStart(weekStart);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const prevWeekEnd = new Date(prevWeekStart);
  prevWeekEnd.setDate(prevWeekEnd.getDate() + 6);

  const { data: comparison } = usePeriodComparison(
    prevWeekStart,
    prevWeekEnd.toISOString().split('T')[0],
    weekStart,
    weekEnd.toISOString().split('T')[0],
  );

  const handlePrevWeek = () => setWeekStart(getPreviousWeekStart(weekStart));
  const handleNextWeek = () => setWeekStart(getNextWeekStart(weekStart));
  const handleCurrentWeek = () => setWeekStart(getWeekStart());

  const isCurrentWeek = weekStart === getWeekStart();

  const hasActiveFilters = selectedCuisine !== null;

  const clearFilters = () => {
    setSelectedCuisine(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-primary-900">Nutrition Dashboard</h1>
          <p className="text-neutral-500">Track your nutrition goals and trends</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 w-2 h-2 bg-primary-500 rounded-full" />
            )}
          </Button>
          <Link to="/settings">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
              Edit Goals
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-neutral-800">Filter Analytics</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear filters
              </button>
            )}
          </div>
          <div className="space-y-4">
            {/* Cuisine Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Cuisine
              </label>
              <div className="flex flex-wrap gap-2">
                {CUISINE_OPTIONS.map((cuisine) => (
                  <button
                    key={cuisine}
                    onClick={() =>
                      setSelectedCuisine(selectedCuisine === cuisine ? null : cuisine)
                    }
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedCuisine === cuisine
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>
            {hasActiveFilters && (
              <p className="text-xs text-neutral-500">
                Note: Filters will apply to future filtered analytics queries. Current view shows all data.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Rolling Averages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[7, 14, 30].map((days) => (
          <button
            key={days}
            onClick={() => setRollingDays(days)}
            className="text-left"
          >
            {loadingRolling && rollingDays === days ? (
              <Card className="p-4">
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                </div>
              </Card>
            ) : rollingData && rollingDays === days ? (
              <RollingTrendCard
                data={rollingData}
                label={`${days}-Day Average`}
              />
            ) : (
              <Card className={`p-4 ${rollingDays === days ? 'ring-2 ring-primary-500' : ''}`}>
                <div className="text-sm text-neutral-600">{days}-Day Average</div>
                <div className="text-neutral-400 text-xs">Click to view</div>
              </Card>
            )}
          </button>
        ))}
      </div>

      {/* Week Navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewTab('week')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewTab === 'week'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setViewTab('month')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewTab === 'month'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Monthly
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handlePrevWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <button
              onClick={handleCurrentWeek}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg"
            >
              <Calendar className="w-4 h-4" />
              {weeklyData ? formatDateRange(weeklyData.weekStart, weeklyData.weekEnd) : 'Loading...'}
            </button>
            <Button variant="ghost" size="sm" onClick={handleNextWeek} disabled={isCurrentWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {loadingWeekly ? (
        <Card className="p-8">
          <div className="flex items-center justify-center gap-2 text-neutral-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading analytics...</span>
          </div>
        </Card>
      ) : weeklyData ? (
        <>
          {/* Goal Progress Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <GoalProgressCard
              label="Calories"
              value={weeklyData.averages.caloriesPerDay}
              goal={goals.dailyCalories}
              unit=" cal"
              icon={<Flame className="w-4 h-4" />}
              color="text-orange-500"
              bgColor="bg-orange-50"
            />
            <GoalProgressCard
              label="Protein"
              value={weeklyData.averages.proteinPerDay}
              goal={goals.dailyProteinG}
              unit="g"
              icon={<Beef className="w-4 h-4" />}
              color="text-blue-500"
              bgColor="bg-blue-50"
            />
            <GoalProgressCard
              label="Carbs"
              value={weeklyData.averages.carbsPerDay}
              goal={goals.dailyCarbsG}
              unit="g"
              icon={<Wheat className="w-4 h-4" />}
              color="text-amber-500"
              bgColor="bg-amber-50"
            />
            <GoalProgressCard
              label="Fat"
              value={weeklyData.averages.fatPerDay}
              goal={goals.dailyFatG}
              unit="g"
              icon={<Droplets className="w-4 h-4" />}
              color="text-pink-500"
              bgColor="bg-pink-50"
            />
          </div>

          {/* Chart */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-800">Daily Breakdown</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartMetric('calories')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    chartMetric === 'calories'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  Calories
                </button>
                <button
                  onClick={() => setChartMetric('macros')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    chartMetric === 'macros'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  Macros
                </button>
              </div>
            </div>
            <MacroChart
              data={weeklyData.dailyData}
              goals={goals}
              metric={chartMetric}
            />
          </Card>

          {/* Two column layout */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-6">
              {/* Nutrient Gaps */}
              <Card className="p-4">
                <h3 className="font-semibold text-neutral-800 mb-4">Nutrition Gaps</h3>
                {gaps && <GapAlert gaps={gaps} />}
              </Card>

              {/* Top Protein Recipes */}
              {topProtein && topProtein.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold text-neutral-800 mb-4">
                    Top High-Protein Recipes
                  </h3>
                  <TrendCard
                    title=""
                    items={topProtein}
                    metricLabel="avg"
                    metricUnit="g"
                  />
                </Card>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Period Comparison */}
              {comparison && (
                <Card className="p-4">
                  <h3 className="font-semibold text-neutral-800 mb-4">
                    Week-over-Week Comparison
                  </h3>
                  <PeriodComparison
                    comparison={comparison}
                    period1Label="Last Week"
                    period2Label="This Week"
                  />
                </Card>
              )}

              {/* Coverage */}
              <Card className="p-4">
                <h3 className="font-semibold text-neutral-800 mb-3">Data Coverage</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-600">Meals with nutrition</span>
                      <span className="font-medium">
                        {weeklyData.coverage.mealsWithNutrition} / {weeklyData.coverage.totalMeals}
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${weeklyData.coverage.coveragePercentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-neutral-800">
                    {weeklyData.coverage.coveragePercentage}%
                  </div>
                </div>
                {weeklyData.coverage.coveragePercentage < 100 && (
                  <p className="mt-3 text-sm text-amber-600">
                    {weeklyData.coverage.totalMeals - weeklyData.coverage.mealsWithNutrition} meals
                    are missing nutrition data. Consider adding nutrition info to improve accuracy.
                  </p>
                )}
              </Card>
            </div>
          </div>
        </>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-neutral-500">No meal plan data for this week</p>
          <Link to="/meal-planner">
            <Button className="mt-4">Create Meal Plan</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

export default NutritionDashboardPage;
