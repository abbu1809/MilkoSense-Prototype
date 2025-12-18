// Dynamic Data Loader for MilkoSense
// Makes all pages pull from real-time Firebase data and localStorage

class DynamicDataLoader {
    constructor() {
        this.firebaseURL = 'https://minorproject-a64cd-default-rtdb.firebaseio.com/sensors.json';
        this.refreshInterval = null;
        this.trendAnalyzer = null;
    }

    // Initialize trend analyzer
    initializeTrendAnalyzer() {
        if (window.TrendAnalyzer && !this.trendAnalyzer) {
            this.trendAnalyzer = window.TrendAnalyzer;
        }
    }

    // Load latest data for any page
    async loadLatestData() {
        try {
            // Try to get from localStorage first
            let sensorData = JSON.parse(localStorage.getItem('latestSensorData'));
            let analysis = JSON.parse(localStorage.getItem('latestAnalysis'));
            
            // If no local data, fetch from Firebase
            if (!sensorData) {
                const response = await fetch(this.firebaseURL);
                if (response.ok) {
                    const data = await response.json();
                    sensorData = this.processFirebaseData(data);
                    localStorage.setItem('latestSensorData', JSON.stringify(sensorData));
                }
            }
            
            // Get trend data
            this.initializeTrendAnalyzer();
            const trendData = this.trendAnalyzer ? {
                metrics: this.trendAnalyzer.getDashboardMetrics(),
                qualityTrend: this.trendAnalyzer.getQualityTrend('24hours')
            } : null;
            
            return { sensorData, analysis, trendData };
        } catch (error) {
            console.error('Error loading data:', error);
            return { sensorData: null, analysis: null, trendData: null };
        }
    }

    // Process Firebase data
    processFirebaseData(rawData) {
        return {
            gas: this.normalizeGasValue(rawData.gas),
            ph: parseFloat(rawData.ph) || 0,
            quality: rawData.quality || 'UNKNOWN',
            tds: parseFloat(rawData.tds) || 0,
            temperature: parseFloat(rawData.temperature) || 0,
            turbidity: parseFloat(rawData.turbidity) || 0,
            timestamp: new Date().toISOString()
        };
    }

    normalizeGasValue(gasValue) {
        if (typeof gasValue === 'string') {
            const gasMap = {
                'NORMAL': 125,
                'LOW': 80,
                'MEDIUM': 150,
                'HIGH': 200,
                'CRITICAL': 250
            };
            return gasMap[gasValue.toUpperCase()] || 125;
        }
        return parseFloat(gasValue) || 125;
    }

    // Update analysis page with real data
    async updateAnalysisPage() {
        const { sensorData, analysis, trendData } = await this.loadLatestData();
        
        if (!sensorData && !analysis) {
            console.warn('No data available for analysis page');
            return;
        }

        // Update grade display
        if (analysis && analysis.qualityGrade) {
            const gradeEl = document.getElementById('grade-badge');
            const gradeTextEl = document.getElementById('grade-text');
            if (gradeEl) {
                gradeEl.className = `grade-badge grade-${analysis.qualityGrade.grade.toLowerCase()}`;
                gradeEl.textContent = analysis.qualityGrade.grade;
            }
            if (gradeTextEl) {
                gradeTextEl.textContent = analysis.qualityGrade.label;
            }
        }

        // Update sensor readings display
        if (sensorData) {
            const updates = [
                { id: 'ph-reading', value: sensorData.ph?.toFixed(2) },
                { id: 'temp-reading', value: sensorData.temperature?.toFixed(1) + '°C' },
                { id: 'turbidity-reading', value: sensorData.turbidity?.toFixed(1) + ' NTU' },
                { id: 'tds-reading', value: sensorData.tds?.toFixed(0) + ' ppm' },
                { id: 'gas-reading', value: sensorData.gas?.toFixed(0) }
            ];

            updates.forEach(update => {
                const el = document.getElementById(update.id);
                if (el) el.textContent = update.value;
            });
        }

        // Update score counters
        if (analysis) {
            this.updateCounters({
                'overall-score': analysis.score || 0,
                'confidence-level': (analysis.qualityGrade?.confidence || 0.85) * 100,
                'microbial-contamination': Math.max(0, 100 - (analysis.score || 0))
            });
        }
        
        // Add trend insights if available
        if (trendData && trendData.qualityTrend) {
            this.displayTrendInsights(trendData);
        }
    }
    
    // Display trend insights on analysis page
    displayTrendInsights(trendData) {
        // Look for a trend insights container on the page
        let container = document.getElementById('trend-insights');
        
        // If it doesn't exist, try to create one (optional - only if the page has a suitable location)
        if (!container) {
            const analysisSection = document.querySelector('.analysis-container') || 
                                   document.querySelector('main');
            if (analysisSection) {
                container = document.createElement('div');
                container.id = 'trend-insights';
                container.className = 'bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg my-6';
                analysisSection.appendChild(container);
            }
        }
        
        if (!container) return;
        
        const trend = trendData.qualityTrend;
        const metrics = trendData.metrics;
        
        const trendEmoji = {
            increasing: '📈',
            decreasing: '📉',
            stable: '➡️',
            insufficient_data: '📊'
        };
        
        container.innerHTML = `
            <h4 class="text-lg font-bold text-blue-900 mb-3">
                ${trendEmoji[trend.trend]} Quality Trend Analysis
            </h4>
            <p class="text-blue-800 mb-4">${trend.message}</p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                    <span class="font-semibold text-blue-900">Total Readings:</span>
                    <p class="text-2xl font-bold text-blue-700">${metrics.totalReadings}</p>
                </div>
                <div>
                    <span class="font-semibold text-blue-900">Avg Quality:</span>
                    <p class="text-2xl font-bold text-blue-700">${metrics.avgQuality}%</p>
                </div>
                <div>
                    <span class="font-semibold text-blue-900">Alerts:</span>
                    <p class="text-2xl font-bold text-blue-700">${metrics.alerts}</p>
                </div>
                <div>
                    <span class="font-semibold text-blue-900">Data Quality:</span>
                    <p class="text-2xl font-bold text-blue-700 capitalize">${metrics.dataQuality}</p>
                </div>
            </div>
        `;
    }

    // Update dashboard page
    async updateDashboardPage() {
        const { sensorData, analysis } = await this.loadLatestData();
        
        if (!sensorData) return;

        // Update sensor cards
        const sensors = [
            { id: 'ph-display', value: sensorData.ph?.toFixed(2), label: 'pH' },
            { id: 'temp-display', value: sensorData.temperature?.toFixed(1), label: '°C' },
            { id: 'turbidity-display', value: sensorData.turbidity?.toFixed(1), label: 'NTU' },
            { id: 'tds-display', value: sensorData.tds?.toFixed(0), label: 'ppm' },
            { id: 'gas-display', value: sensorData.gas?.toFixed(0), label: 'Gas' }
        ];

        sensors.forEach(sensor => {
            const el = document.getElementById(sensor.id);
            if (el) el.textContent = sensor.value;
        });

        // Update status indicators
        if (analysis && analysis.parameters) {
            Object.keys(analysis.parameters).forEach(param => {
                const statusEl = document.getElementById(`${param}-status`);
                if (statusEl) {
                    const status = analysis.parameters[param].status;
                    statusEl.textContent = status.toUpperCase();
                    statusEl.className = `status-indicator status-${status}`;
                }
            });
        }
    }

    // Update recommendations page
    async updateRecommendationsPage() {
        const { sensorData, analysis, trendData } = await this.loadLatestData();
        
        if (!analysis || !analysis.recommendations) {
            console.warn('No recommendations available');
            return;
        }

        const container = document.getElementById('recommendations-container');
        if (!container) return;

        let html = '';
        
        // Add trend summary at the top
        if (trendData && trendData.qualityTrend) {
            const trend = trendData.qualityTrend;
            const trendColor = trend.trend === 'increasing' ? 'green' : 
                              trend.trend === 'decreasing' ? 'red' : 'blue';
            
            html += `
                <div class="bg-${trendColor}-50 border-l-4 border-${trendColor}-500 p-6 rounded-lg mb-6">
                    <h3 class="text-xl font-bold text-${trendColor}-900 mb-2">Quality Trend: ${trend.trend.toUpperCase()}</h3>
                    <p class="text-${trendColor}-800">${trend.message}</p>
                </div>
            `;
        }
        
        analysis.recommendations.forEach((rec, index) => {
            const priorityClass = `priority-${rec.priority}`;
            const priorityColors = {
                critical: { bg: 'red', icon: 'text-red-600' },
                high: { bg: 'orange', icon: 'text-orange-600' },
                medium: { bg: 'yellow', icon: 'text-yellow-600' },
                low: { bg: 'blue', icon: 'text-blue-600' }
            };
            const colors = priorityColors[rec.priority] || priorityColors.medium;
            
            html += `
                <div class="recommendation-card ${priorityClass} p-8 rounded-2xl mb-6 bg-gradient-to-br from-${colors.bg}-50 to-white border border-${colors.bg}-200">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <span class="inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-${colors.bg}-600 mb-2">
                                ${rec.priority.toUpperCase()} PRIORITY
                            </span>
                            <h3 class="text-2xl font-bold text-gray-900">${rec.category}</h3>
                        </div>
                        <svg class="w-12 h-12 ${colors.icon}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <p class="text-lg text-gray-700 mb-6 leading-relaxed">${rec.action}</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/70 p-4 rounded-lg mb-4">
                        <div>
                            <p class="text-sm font-semibold text-gray-600">Expected Impact</p>
                            <p class="text-base font-bold text-gray-900">${rec.expectedImpact}</p>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-gray-600">Timeframe</p>
                            <p class="text-base font-bold text-gray-900">${rec.timeframe}</p>
                        </div>
                    </div>`;
            
            // Add step-by-step instructions if available
            if (rec.steps && rec.steps.length > 0) {
                html += `
                    <details class="bg-white/50 p-4 rounded-lg">
                        <summary class="cursor-pointer font-semibold text-gray-900 hover:text-${colors.bg}-600">
                            📋 Step-by-Step Instructions (${rec.steps.length} steps)
                        </summary>
                        <ol class="mt-4 space-y-2 list-decimal list-inside text-gray-700">`;
                rec.steps.forEach(step => {
                    html += `<li class="pl-2">${step}</li>`;
                });
                html += `</ol>
                    </details>`;
            }
            
            html += `</div>`;
        });

        // Add insights
        if (analysis.insights && analysis.insights.length > 0) {
            html += `
                <div class="bg-gradient-to-r from-indigo-50 to-purple-50 p-8 rounded-2xl border border-indigo-200">
                    <h3 class="text-2xl font-bold text-gray-900 mb-4">🔍 AI Insights</h3>
                    <ul class="space-y-3">
            `;
            
            analysis.insights.forEach(insight => {
                html += `
                    <li class="flex items-start space-x-3">
                        <svg class="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        <span class="text-gray-700 text-base">${insight.message}</span>
                    </li>
                `;
            });
            
            html += `
                    </ul>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    // Update counter animations
    updateCounters(counters) {
        Object.keys(counters).forEach(id => {
            const el = document.getElementById(id);
            if (el && typeof anime !== 'undefined') {
                anime({
                    targets: { count: 0 },
                    count: counters[id],
                    duration: 2000,
                    easing: 'easeOutQuart',
                    update: function(anim) {
                        el.textContent = Math.round(anim.animatables[0].target.count);
                    }
                });
            } else if (el) {
                el.textContent = Math.round(counters[id]);
            }
        });
    }

    // Auto-refresh data
    startAutoRefresh(intervalMs = 10000) {
        this.stopAutoRefresh();
        this.refreshInterval = setInterval(() => {
            this.refreshCurrentPage();
        }, intervalMs);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    async refreshCurrentPage() {
        const page = window.location.pathname.split('/').pop();
        
        if (page.includes('analysis')) {
            await this.updateAnalysisPage();
        } else if (page.includes('dashboard')) {
            await this.updateDashboardPage();
        } else if (page.includes('recommendations')) {
            await this.updateRecommendationsPage();
        }
    }
}

// Initialize global instance
window.dataLoader = new DynamicDataLoader();

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    const page = window.location.pathname.split('/').pop();
    
    if (page.includes('analysis')) {
        await window.dataLoader.updateAnalysisPage();
        window.dataLoader.startAutoRefresh(15000); // Refresh every 15 seconds
    } else if (page.includes('dashboard') && !page.includes('realtime')) {
        await window.dataLoader.updateDashboardPage();
        window.dataLoader.startAutoRefresh(10000); // Refresh every 10 seconds
    } else if (page.includes('recommendations')) {
        await window.dataLoader.updateRecommendationsPage();
    }
    
    console.log('Dynamic data loader initialized for:', page);
});
