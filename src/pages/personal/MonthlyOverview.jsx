import React, { useState, useEffect, useMemo } from "react";
import { Pie, Bar, Doughnut, Line } from "react-chartjs-2";
import "./MonthlyOverview.css";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
} from "chart.js";

import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config.js";
import { useAuth } from "../../context/AuthContext.jsx";

// Register chart components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
);

// Shared constants
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const YEARS = ["2024", "2025", "2026", "2027"];

// Safe month filter
function matchesPeriod(dateStr, month, year) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d)) return false;
  return MONTHS[d.getMonth()] === month && d.getFullYear().toString() === year;
}

// Normalize expense type so charts don't break - UPDATED to include investment
function normalizeType(t) {
  const x = (t || "").toLowerCase();
  if (x === "save" || x === "saving" || x === "savings" || x === "investment" || x === "invest") return "Savings";
  if (x === "want") return "Want";
  return "Need";
}

// Simplify category names - combine multi-word categories into single words
function simplifyCategoryName(category) {
  if (!category) return "Other";
  
  const lowerCat = category.toLowerCase().trim();
  
  // Map multi-word categories to simplified names
  const categoryMap = {
    // Utilities
    "water bill": "Utilities",
    "electricity bill": "Utilities",
    "utility bills": "Utilities",
    "utilities": "Utilities",
    "gas bill": "Utilities",
    "internet bill": "Utilities",
    "phone bill": "Utilities",
    
    // Entertainment
    "entertainment and leisure": "Entertainment",
    "leisure and entertainment": "Entertainment",
    "movies & entertainment": "Entertainment",
    "movies and entertainment": "Entertainment",
    "entertainment": "Entertainment",
    
    // Food
    "food and groceries": "Food",
    "groceries and food": "Food",
    "dining out": "Food",
    "restaurants": "Food",
    "food": "Food",
    
    // Transportation
    "transportation costs": "Transportation",
    "car maintenance": "Transportation",
    "public transport": "Transportation",
    "fuel costs": "Transportation",
    "transportation": "Transportation",
    
    // Housing
    "rent payment": "Housing",
    "mortgage payment": "Housing",
    "housing costs": "Housing",
    "home maintenance": "Housing",
    "housing": "Housing",
    
    // Shopping
    "shopping spree": "Shopping",
    "clothing shopping": "Shopping",
    "online shopping": "Shopping",
    "shopping": "Shopping",
    
    // Health
    "health and fitness": "Health",
    "medical expenses": "Health",
    "fitness and health": "Health",
    "health": "Health",
    
    // Education
    "education fees": "Education",
    "books and courses": "Education",
    "education": "Education",
    
    // Travel
    "travel expenses": "Travel",
    "vacation costs": "Travel",
    "travel": "Travel",
    
    // Personal
    "personal care": "Personal",
    "personal expenses": "Personal",
    "personal": "Personal",
  };
  
  // Check for exact matches
  if (categoryMap[lowerCat]) {
    return categoryMap[lowerCat];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(categoryMap)) {
    if (lowerCat.includes(key) && key.length > 3) {
      return value;
    }
  }
  
  // Capitalize first letter and keep single words as-is
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

// Top Spending Categories Chart Component
function TopSpendingByCategory({ filteredExpenses }) {
  // Calculate top 5 categories
  const topCategories = useMemo(() => {
    const categoryTotals = {};
    
    // Sum expenses by category
    filteredExpenses.forEach((exp) => {
      const cat = simplifyCategoryName(exp.category || "Other");
      const amount = Number(exp.amount) || 0;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
    });
    
    // Convert to array and sort by amount (descending)
    const sorted = Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Take top 5
    
    return sorted;
  }, [filteredExpenses]);

  // Prepare chart data
  const chartData = {
    labels: topCategories.map(item => item.category),
    datasets: [
      {
        label: "Amount Spent (R)",
        data: topCategories.map(item => item.amount),
        backgroundColor: "rgba(239, 68, 68, 0.7)", // Soft red
        borderColor: "rgba(239, 68, 68, 0.9)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    indexAxis: 'y', // Horizontal bars
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend for cleaner look
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `R ${context.parsed.x.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Amount (R)",
          color: "#4b5563",
          font: {
            size: 12,
            weight: '500'
          }
        },
        ticks: {
          callback: function(value) {
            return 'R ' + value.toLocaleString();
          }
        }
      },
      y: {
        ticks: {
          autoSkip: false,
          font: {
            size: 12
          }
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="top-categories-chart">
      <div className="chart-container">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}

export default function MonthlyOverview() {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid || currentUser?.id || null;

  const currentMonth = MONTHS[new Date().getMonth()];
  const currentYear = new Date().getFullYear().toString();

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const [incomeList, setIncomeList] = useState([]);
  const [expenseList, setExpenseList] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Load REAL data from Firestore (same structure as Dashboard)
  useEffect(() => {
    if (!userId) {
      setIncomeList([]);
      setExpenseList([]);
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        setLoading(true);

        const incomeRef = collection(db, "users", userId, "income");
        const expenseRef = collection(db, "users", userId, "expenses");

        const [incomeSnap, expenseSnap] = await Promise.all([
          getDocs(incomeRef),
          getDocs(expenseRef),
        ]);

        const incomes = [];
        incomeSnap.forEach((doc) => incomes.push({ id: doc.id, ...doc.data() }));

        const expenses = [];
        expenseSnap.forEach((doc) => expenses.push({ id: doc.id, ...doc.data() }));

        setIncomeList(incomes);
        setExpenseList(expenses);
      } catch (err) {
        console.error("Error loading analytics data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [userId]);

  // Filtered lists
  const filteredIncome = useMemo(
    () => incomeList.filter((i) => matchesPeriod(i.date, month, year)),
    [incomeList, month, year]
  );

  const filteredExpenses = useMemo(
    () => expenseList.filter((e) => matchesPeriod(e.date, month, year)),
    [expenseList, month, year]
  );

  // Totals
  const totalIncome = filteredIncome.reduce(
    (sum, inc) => sum + (Number(inc.amount) || 0),
    0
  );

  const totalExpenses = filteredExpenses.reduce(
    (sum, exp) => sum + (Number(exp.amount) || 0),
    0
  );

  const savings = totalIncome - totalExpenses;

  // Daily spending data for line chart
  const dailySpendingData = useMemo(() => {
    const dailyTotals = {};
    
    filteredExpenses.forEach((exp) => {
      if (!exp.date) return;
      const date = new Date(exp.date);
      if (isNaN(date)) return;
      
      const day = date.getDate();
      const amount = Number(exp.amount) || 0;
      
      dailyTotals[day] = (dailyTotals[day] || 0) + amount;
    });
    
    // Create array for all days in month
    const daysInMonth = new Date(parseInt(year), MONTHS.indexOf(month) + 1, 0).getDate();
    const labels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
    const data = labels.map(day => dailyTotals[parseInt(day)] || 0);
    
    return { labels, data };
  }, [filteredExpenses, month, year]);

  // Spending by type - Updated colors as requested
  const spendingByType = filteredExpenses.reduce(
    (acc, exp) => {
      const t = normalizeType(exp.type);
      acc[t] += Number(exp.amount) || 0;
      return acc;
    },
    { Need: 0, Want: 0, Savings: 0 }
  );

  // Spending by category - using simplified names
  const spendingByCategory = filteredExpenses.reduce((acc, exp) => {
    const cat = simplifyCategoryName(exp.category || "Other");
    acc[cat] = (acc[cat] || 0) + (Number(exp.amount) || 0);
    return acc;
  }, {});

  // Health score
  const healthScore = useMemo(() => {
    if (totalIncome <= 0) return 0;

    const savingsRate =
      ((totalIncome - totalExpenses) / Math.max(totalIncome, 1)) * 100;
    const needsRatio =
      totalExpenses > 0
        ? (spendingByType.Need / Math.max(totalExpenses, 1)) * 100
        : 0;

    let score = 50;

    if (savingsRate > 20) score += 30;
    else if (savingsRate > 10) score += 20;
    else if (savingsRate > 0) score += 10;
    else score -= 20;

    if (needsRatio > 70) score -= 15;
    else if (needsRatio >= 50 && needsRatio <= 70) score += 10;

    return Math.min(Math.max(Math.round(score), 0), 100);
  }, [totalIncome, totalExpenses, spendingByType]);

  // Chart data
  const categoryChartData = {
    labels: Object.keys(spendingByCategory),
    datasets: [
      {
        label: "Amount Spent (R)",
        data: Object.values(spendingByCategory),
        backgroundColor: "rgba(37, 99, 235, 0.7)",
        borderWidth: 2,
      },
    ],
  };

  // Updated type chart colors as requested: Needs=green, Savings=blue, Wants=light red
  const typeChartData = {
    labels: ["Needs", "Wants", "Savings"],
    datasets: [
      {
        data: [spendingByType.Need, spendingByType.Want, spendingByType.Savings],
        backgroundColor: ["#16a34a", "#fca5a5", "#2563eb"], // Green, Light Red, Blue
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  const dailyTrendChartData = {
    labels: dailySpendingData.labels,
    datasets: [
      {
        label: "Daily Spending",
        data: dailySpendingData.data,
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderWidth: 3,
        tension: 0.2,
        fill: true,
        pointBackgroundColor: "#dc2626",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const incomeExpenseData = {
    labels: ["Income", "Expenses", "Savings"],
    datasets: [
      {
        data: [totalIncome, totalExpenses, Math.max(0, savings)],
        backgroundColor: ["#16a34a", "#ef4444", "#2563eb"],
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: "bottom",
        labels: {
          padding: 20,
          usePointStyle: false, // CHANGED: Use rectangles instead of points
          boxWidth: 20, // Width of the color box
          boxHeight: 12, // Height of the color box
          font: {
            size: 12,
            weight: '500',
          }
        }
      },
    },
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: "bottom",
        labels: {
          padding: 20,
          usePointStyle: false, // CHANGED: Use rectangles instead of points
          boxWidth: 20,
          boxHeight: 12,
          font: {
            size: 12,
            weight: '500',
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Amount (R)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Day of Month",
        },
      },
    },
  };

  const hasAnyData = filteredIncome.length > 0 || filteredExpenses.length > 0;

  return (
    <div className="monthly-overview-wrapper">
      {/* Top Spacing */}
      <div className="page-top-spacing"></div>
      
      <div className="page-header-container">
        <div className="page-header-content">
          <div className="header-text-container">
            <div className="page-subtitle">
              BudgetPro Insights
            </div>
            <h1 className="page-title">
              Monthly Overview
            </h1>
            <p className="page-description">
              Analyze your spending patterns and financial health
            </p>
          </div>

          {/* Compact Month/Year Selector - Close together */}
          <div className="compact-selector-container">
            <div className="selector-label">Select Period</div>
            <div className="compact-selector-group">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="compact-selector month-selector"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="compact-selector year-selector"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* LOADING / NO DATA */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-icon">⏳</div>
          Loading analytics…
        </div>
      ) : !hasAnyData ? (
        <div className="no-data-container">
          <div className="no-data-icon">👀</div>
          <h2 className="no-data-title">
            No data for {month} {year}
          </h2>
          <p className="no-data-description">
            Add income and expenses on your Dashboard to see insights here.
          </p>
        </div>
      ) : (
        <>
          {/* KEY METRICS - Mobile First */}
          <div className="metrics-section">
            {/* Mobile Combined Metric Card */}
            <div className="mobile-metrics-card">
              <div className="mobile-metrics-row">
                <span className="mobile-metric-label">Total Income</span>
                <span className="mobile-metric-value income-value">
                  R {totalIncome.toLocaleString()}
                </span>
              </div>
              <div className="mobile-metrics-row">
                <span className="mobile-metric-label">Total Expenses</span>
                <span className="mobile-metric-value expense-value">
                  R {totalExpenses.toLocaleString()}
                </span>
              </div>
              <div className="mobile-metrics-row">
                <span className="mobile-metric-label">Net Balance</span>
                <span className="mobile-metric-value balance-value">
                  R {savings.toLocaleString()}
                </span>
              </div>
              <div className="mobile-metrics-row">
                <span className="mobile-metric-label">Savings Rate</span>
                <span className="mobile-metric-value savings-rate-value">
                  {totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>

            {/* Desktop Metrics */}
            <div className="desktop-metrics-grid">
              <MetricCard
                title="Total Income"
                icon="💰"
                value={`R ${totalIncome.toLocaleString()}`}
                accent="#2563eb" // CHANGED: Blue color for income
                iconColor="#2563eb" // Added: Blue background for money bag
              />
              <MetricCard
                title="Total Expenses"
                icon="💸"
                value={`R ${totalExpenses.toLocaleString()}`}
                accent="#ef4444"
              />
              <MetricCard
                title="Net Balance"
                icon="🏦"
                value={`R ${savings.toLocaleString()}`}
                accent="#2563eb"
              />
              <MetricCard
                title="Savings Rate"
                icon="📈"
                value={`${totalIncome > 0
                  ? ((savings / totalIncome) * 100).toFixed(1)
                  : 0
                  }%`}
                accent="#10b981"
              />
            </div>
          </div>

          {/* CHARTS Grid - Updated for 3 charts in first row */}
          <div className="charts-section">
            {/* Row 1: 3 Charts */}
            <div className="chart-card-row-1">
              <ChartCard
                title="Spending by Category"
                subtitle="Where your money goes"
              >
                <div className="chart-container">
                  <Bar data={categoryChartData} options={chartOptions} />
                </div>
              </ChartCard>
            </div>

            <div className="chart-card-row-1">
              <ChartCard
                title="Spending by Type"
                subtitle="Needs vs Wants vs Savings"
              >
                <div className="chart-container">
                  <Pie data={typeChartData} options={chartOptions} />
                </div>
              </ChartCard>
            </div>

            <div className="chart-card-row-1">
              <ChartCard
                title="Income vs Expenses"
                subtitle="Are you living below your means?"
              >
                <div className="chart-container">
                  <Doughnut data={incomeExpenseData} options={chartOptions} />
                </div>
              </ChartCard>
            </div>

            {/* Row 2: 3 Charts (updated from 2 to 3) */}
            <div className="chart-card-row-2">
              <ChartCard
                title="Daily Spending Trend"
                subtitle="Spending patterns throughout the month"
              >
                <div className="chart-container">
                  <Line data={dailyTrendChartData} options={lineChartOptions} />
                </div>
              </ChartCard>
            </div>

            {/* NEW CHART - Inserted as 5th chart */}
            <div className="chart-card-row-2">
              <ChartCard
                title="Top Spending Categories"
                subtitle="Your top 5 expense categories"
              >
                <TopSpendingByCategory filteredExpenses={filteredExpenses} />
              </ChartCard>
            </div>

            <div className="chart-card-row-2">
              <ChartCard
                title="Financial Health Score"
                subtitle="Overall monthly money wellness"
              >
                <div className="health-score-container">
                  <div className="health-score-circle" style={{
                    background: `conic-gradient(#16a34a 0% ${healthScore}%, #f59e0b ${healthScore}% 85%, #ef4444 85% 100%)`,
                  }}>
                    <div className="health-score-inner" />
                    <span className="health-score-value">
                      {healthScore}%
                    </span>
                  </div>
                  <div className="health-score-description">
                    This score looks at your savings rate and how much of your
                    spending goes to{" "}
                    <strong>needs vs wants vs savings</strong>. Higher is
                    better.
                  </div>
                </div>
              </ChartCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* Reusable components */

function MetricCard({ title, icon, value, accent, iconColor = "#2563eb" }) {
  return (
    <div className="metric-card">
      <div 
        className="metric-icon-container"
        style={{ backgroundColor: iconColor === "#2563eb" ? "rgba(37, 99, 235, 0.1)" : "var(--primary-light)" }}
      >
        {icon}
      </div>
      <div className="metric-content">
        <div className="metric-title">
          {title}
        </div>
        <div className="metric-value" style={{ color: accent }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">
          {title}
        </h3>
        <p className="chart-subtitle">
          {subtitle}
        </p>
      </div>
      <div className="chart-body">
        {children}
      </div>
    </div>
  );
}