import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import type { DailyNutritionData } from '../../services/nutrition-analytics.service';

interface MacroChartProps {
  data: DailyNutritionData[];
  goals?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  metric?: 'calories' | 'macros';
}

const COLORS = {
  calories: '#f97316', // orange
  protein: '#3b82f6', // blue
  carbs: '#f59e0b', // amber
  fat: '#ec4899', // pink
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

export function MacroChart({ data, goals, metric = 'calories' }: MacroChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    name: formatDate(d.date),
  }));

  if (metric === 'calories') {
    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value} cal`, 'Calories']}
              labelFormatter={(label) => `Day: ${label}`}
            />
            <Bar
              dataKey="calories"
              fill={COLORS.calories}
              radius={[4, 4, 0, 0]}
              name="Calories"
            />
            {goals && (
              <ReferenceLine
                y={goals.calories}
                stroke="#10b981"
                strokeDasharray="5 5"
                label={{
                  value: 'Goal',
                  position: 'right',
                  fill: '#10b981',
                  fontSize: 11,
                }}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Macros view - stacked bar chart
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} label={{ value: 'grams', angle: -90, position: 'insideLeft', fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number, name: string) => [`${value}g`, name]}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="protein" stackId="a" fill={COLORS.protein} name="Protein" />
          <Bar dataKey="carbs" stackId="a" fill={COLORS.carbs} name="Carbs" />
          <Bar dataKey="fat" stackId="a" fill={COLORS.fat} name="Fat" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Mini sparkline chart for trend cards
export function MiniTrendChart({ data }: { data: DailyNutritionData[] }) {
  const chartData = data.map((d) => ({
    calories: d.calories,
  }));

  return (
    <div className="h-12 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Bar dataKey="calories" fill="#f97316" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
