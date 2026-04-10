import { useEffect, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useInitStore } from '../../hooks/useInitStore';
import * as transactionRepo from '../../lib/transactionRepository';
import {
  PieChart,
  TrendingUp,
  BarChart,
  Calendar,
  Trophy,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export function StatsPage() {
  const { isInitialized } = useInitStore();
  const { currentStats, availableMonths, selectedMonth, setSelectedMonth, transactions } =
    useTransactionStore();
  const [viewMode, setViewMode] = useState<'category' | 'trend' | 'monthly' | 'ranking' | 'year'>(
    'category'
  );
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [expandedYears, setExpandedYears] = useState<number[]>(() => {
    const years = [...new Set(availableMonths.map(m => m.year))];
    return years.length > 0 ? [Math.max(...years)] : [];
  });

  const formatAmount = (amount: number) => {
    const absAmount = Math.abs(amount);
    if (absAmount >= 10000) {
      return (amount >= 0 ? '' : '-') + (absAmount / 10000).toFixed(1) + '万';
    }
    if (Number.isInteger(absAmount)) {
      return amount.toLocaleString('zh-CN');
    }
    return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatAmountForChart = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 10000) {
      return (value >= 0 ? '' : '-') + (absValue / 10000).toFixed(1) + '万';
    }
    if (Number.isInteger(absValue)) {
      return value.toLocaleString('zh-CN');
    }
    return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    let { year, month } = selectedMonth;
    if (direction === 'prev') {
      month--;
      if (month < 1) {
        month = 12;
        year--;
      }
    } else {
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }
    setSelectedMonth(year, month);
  };

  const getCategoryChartOption = () => {
    if (
      !currentStats?.categoryBreakdown ||
      Object.keys(currentStats.categoryBreakdown).length === 0
    ) {
      return null;
    }

    const data = Object.entries(currentStats.categoryBreakdown).map(([name, value]) => ({
      name,
      value,
    }));

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const value = params.value;
          return `${params.name}: ¥${formatAmountForChart(value)} (${params.percent}%)`;
        },
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'center',
      },
      series: [
        {
          name: '支出分类',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          labelLine: {
            show: false,
          },
          data,
        },
      ],
    };
  };

  const getTrendChartOption = () => {
    if (!availableMonths.length) return null;

    const months = availableMonths.slice(0, 6).reverse();

    const incomeData = months.map(({ year, month }) => {
      const stats = transactionRepo.getMonthlyStats(year, month);
      return stats?.totalIncome || 0;
    });

    const expenseData = months.map(({ year, month }) => {
      const stats = transactionRepo.getMonthlyStats(year, month);
      return stats?.totalExpense || 0;
    });

    const labels = months.map(({ year, month }) => `${month}月`);

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => {
          let result = params[0].name + '<br/>';
          params.forEach((p: any) => {
            result +=
              p.marker + ' ' + p.seriesName + ': ¥' + formatAmountForChart(p.value) + '<br/>';
          });
          return result;
        },
      },
      legend: {
        data: ['收入', '支出'],
        top: 0,
        textStyle: { fontSize: 12 },
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => formatAmountForChart(value),
          fontSize: 11,
        },
      },
      series: [
        {
          name: '收入',
          type: 'line',
          data: incomeData,
          smooth: true,
          itemStyle: { color: '#22c55e' },
          lineStyle: { width: 2 },
          symbol: 'circle',
          symbolSize: 6,
        },
        {
          name: '支出',
          type: 'line',
          data: expenseData,
          smooth: true,
          itemStyle: { color: '#ef4444' },
          lineStyle: { width: 2 },
          symbol: 'circle',
          symbolSize: 6,
        },
      ],
    };
  };

  const getMonthlyCompareOption = () => {
    if (!availableMonths.length) return null;

    const months = availableMonths.slice(0, 6).reverse();

    const incomeData = months.map(({ year, month }) => {
      const stats = transactionRepo.getMonthlyStats(year, month);
      return stats?.totalIncome || 0;
    });

    const expenseData = months.map(({ year, month }) => {
      const stats = transactionRepo.getMonthlyStats(year, month);
      return stats?.totalExpense || 0;
    });

    const labels = months.map(({ year, month }) => `${month}月`);

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => {
          let result = params[0].name + '<br/>';
          params.forEach((p: any) => {
            result +=
              p.marker + ' ' + p.seriesName + ': ¥' + formatAmountForChart(p.value) + '<br/>';
          });
          return result;
        },
      },
      legend: {
        data: ['收入', '支出'],
        top: 0,
      },
      xAxis: {
        type: 'category',
        data: labels,
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => formatAmountForChart(value),
        },
      },
      series: [
        {
          name: '收入',
          type: 'bar',
          data: incomeData,
          itemStyle: { color: '#22c55e' },
        },
        {
          name: '支出',
          type: 'bar',
          data: expenseData,
          itemStyle: { color: '#ef4444' },
        },
      ],
    };
  };

  const getChartOption = () => {
    switch (viewMode) {
      case 'category':
        return getCategoryChartOption();
      case 'trend':
        return getTrendChartOption();
      case 'monthly':
        return getMonthlyCompareOption();
      case 'ranking':
        return null;
      case 'year':
        return getYearChartOption();
      default:
        return null;
    }
  };

  const getYearChartOption = () => {
    const yearMonths = availableMonths
      .filter(m => m.year === selectedYear)
      .sort((a, b) => a.month - b.month);
    if (yearMonths.length === 0) return null;

    const incomeData = yearMonths.map(({ year, month }) => {
      const stats = transactionRepo.getMonthlyStats(year, month);
      return stats?.totalIncome || 0;
    });

    const expenseData = yearMonths.map(({ year, month }) => {
      const stats = transactionRepo.getMonthlyStats(year, month);
      return stats?.totalExpense || 0;
    });

    const labels = yearMonths.map(({ month }) => `${month}月`);

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => {
          let result = params[0].name + '<br/>';
          params.forEach((p: any) => {
            result +=
              p.marker + ' ' + p.seriesName + ': ¥' + formatAmountForChart(p.value) + '<br/>';
          });
          return result;
        },
      },
      legend: {
        data: ['收入', '支出'],
        top: 0,
      },
      xAxis: {
        type: 'category',
        data: labels,
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => formatAmountForChart(value),
        },
      },
      series: [
        {
          name: '收入',
          type: 'bar',
          data: incomeData,
          itemStyle: { color: '#22c55e' },
        },
        {
          name: '支出',
          type: 'bar',
          data: expenseData,
          itemStyle: { color: '#ef4444' },
        },
      ],
    };
  };

  const getYearStats = () => {
    const yearMonths = availableMonths.filter(m => m.year === selectedYear);
    let totalIncome = 0;
    let totalExpense = 0;
    yearMonths.forEach(({ year, month }) => {
      const stats = transactionRepo.getMonthlyStats(year, month);
      totalIncome += stats?.totalIncome || 0;
      totalExpense += stats?.totalExpense || 0;
    });
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  };

  const getTopExpenses = () => {
    const expenseTx = transactions.filter(t => t.direction === 'expense');
    const summary: Record<string, { amount: number; count: number; description: string }> = {};

    expenseTx.forEach(tx => {
      const key = tx.description || '未知';
      if (!summary[key]) {
        summary[key] = { amount: 0, count: 0, description: tx.description || '未知' };
      }
      summary[key].amount += tx.amount;
      summary[key].count += 1;
    });

    return Object.entries(summary)
      .map(([key, val]) => ({ description: key, ...val }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  };

  const getTopMerchants = () => {
    const expenseTx = transactions.filter(t => t.direction === 'expense' && t.source);
    const summary: Record<string, { amount: number; count: number }> = {};

    expenseTx.forEach(tx => {
      const key = tx.source;
      if (!summary[key]) {
        summary[key] = { amount: 0, count: 0 };
      }
      summary[key].amount += tx.amount;
      summary[key].count += 1;
    });

    return Object.entries(summary)
      .map(([source, val]) => ({ source, ...val }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="text-2xl font-bold mb-4">统计分析</h1>
        <p className="text-gray-500">了解你的消费结构</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            &lt;
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">
              {selectedMonth.year}年{selectedMonth.month}月
            </span>
          </div>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            &gt;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900 rounded-lg">
            <div className="text-sm text-green-600 dark:text-green-400">收入</div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              ¥{formatAmount(currentStats?.totalIncome || 0)}
            </div>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900 rounded-lg">
            <div className="text-sm text-red-600 dark:text-red-400">支出</div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              ¥{formatAmount(currentStats?.totalExpense || 0)}
            </div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400">结余</div>
            <div
              className={`text-lg font-bold ${(currentStats?.balance || 0) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}
            >
              ¥{formatAmount(currentStats?.balance || 0)}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setViewMode('category')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              viewMode === 'category' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            <PieChart className="w-4 h-4" />
            分类占比
          </button>
          <button
            onClick={() => setViewMode('trend')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              viewMode === 'trend' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            收支趋势
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              viewMode === 'monthly' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            <BarChart className="w-4 h-4" />
            月度对比
          </button>
          <button
            onClick={() => setViewMode('ranking')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              viewMode === 'ranking' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            <Trophy className="w-4 h-4" />
            消费排行
          </button>
          <button
            onClick={() => setViewMode('year')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              viewMode === 'year' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            年度总结
          </button>
        </div>

        {viewMode === 'year' && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {(() => {
                const years = [...new Set(availableMonths.map(m => m.year))].sort((a, b) => b - a);
                return years.map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      selectedYear === year
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {year}年
                  </button>
                ));
              })()}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900 rounded-lg">
                <div className="text-sm text-green-600 dark:text-green-400">年度收入</div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  ¥{formatAmount(getYearStats().totalIncome)}
                </div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900 rounded-lg">
                <div className="text-sm text-red-600 dark:text-red-400">年度支出</div>
                <div className="text-lg font-bold text-red-600 dark:text-red-400">
                  ¥{formatAmount(getYearStats().totalExpense)}
                </div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <div className="text-sm text-blue-600 dark:text-blue-400">年度结余</div>
                <div
                  className={`text-lg font-bold ${getYearStats().balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  ¥{formatAmount(getYearStats().balance)}
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'ranking' ? (
          <div className="space-y-6">
            {/* Top Expenses by Description */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                消费Top 10（按商品）
              </h3>
              <div className="space-y-2">
                {getTopExpenses().map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                          idx === 0
                            ? 'bg-yellow-500 text-white'
                            : idx === 1
                              ? 'bg-gray-400 text-white'
                              : idx === 2
                                ? 'bg-amber-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="truncate max-w-[150px] sm:max-w-[200px]">
                        {item.description}
                      </span>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <div className="font-semibold text-red-600 dark:text-red-400">
                        ¥{formatAmount(item.amount)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.count}笔</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Merchants by Source */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-blue-500" />
                消费Top 10（按来源）
              </h3>
              <div className="space-y-2">
                {getTopMerchants().map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                          idx === 0
                            ? 'bg-blue-500 text-white'
                            : idx === 1
                              ? 'bg-blue-400 text-white'
                              : idx === 2
                                ? 'bg-blue-300 text-white'
                                : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="truncate max-w-[150px]">{item.source}</span>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <div className="font-semibold text-red-600 dark:text-red-400">
                        ¥{formatAmount(item.amount)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.count}笔</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : getChartOption() ? (
          <ReactECharts
            key={viewMode}
            option={getChartOption()!}
            style={{ height: '350px' }}
            opts={{ renderer: 'canvas' }}
          />
        ) : (
          <div className="text-center text-gray-400 py-12">暂无统计数据，请先导入账单</div>
        )}
      </div>
    </div>
  );
}
