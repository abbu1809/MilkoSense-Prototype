/**
 * MilkoSense Advanced Trend Analysis & Predictive Analytics
 * Version: 2.0
 * Provides historical trend analysis, anomaly detection, and predictive insights
 */

class TrendAnalyzer {
    constructor() {
        this.storageKey = 'milkosense_history';
        this.maxHistoryPoints = 500; // Store up to 500 data points
        this.trendWindow = 20; // Look at last 20 readings for trend
        this.anomalyThreshold = 2.5; // Standard deviations for anomaly
    }

    // Store new reading
    storeReading(data) {
        let history = this.getHistory();
        
        const reading = {
            ...data,
            timestamp: Date.now(),
            date: new Date().toISOString()
        };
        
        history.push(reading);
        
        // Limit history size
        if (history.length > this.maxHistoryPoints) {
            history = history.slice(-this.maxHistoryPoints);
        }
        
        localStorage.setItem(this.storageKey, JSON.stringify(history));
        return reading;
    }

    // Get historical data
    getHistory() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading history:', e);
            return [];
        }
    }

    // Clear history
    clearHistory() {
        localStorage.removeItem(this.storageKey);
    }

    // Get statistics for a parameter
    getParameterStats(parameter, timeRange = 'all') {
        const history = this.getFilteredHistory(timeRange);
        
        if (history.length === 0) {
            return null;
        }
        
        const values = history.map(r => r[parameter]).filter(v => v !== undefined && !isNaN(v));
        
        if (values.length === 0) {
            return null;
        }
        
        const sorted = [...values].sort((a, b) => a - b);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        return {
            current: values[values.length - 1],
            mean: mean,
            median: sorted[Math.floor(sorted.length / 2)],
            min: Math.min(...values),
            max: Math.max(...values),
            stdDev: stdDev,
            variance: variance,
            count: values.length,
            trend: this.calculateTrend(values),
            stability: this.calculateStability(stdDev, mean)
        };
    }

    // Filter history by time range
    getFilteredHistory(timeRange) {
        const history = this.getHistory();
        const now = Date.now();
        
        const ranges = {
            '1hour': 60 * 60 * 1000,
            '6hours': 6 * 60 * 60 * 1000,
            '12hours': 12 * 60 * 60 * 1000,
            '24hours': 24 * 60 * 60 * 1000,
            '7days': 7 * 24 * 60 * 60 * 1000,
            '30days': 30 * 24 * 60 * 60 * 1000
        };
        
        if (timeRange === 'all' || !ranges[timeRange]) {
            return history;
        }
        
        const cutoff = now - ranges[timeRange];
        return history.filter(r => r.timestamp >= cutoff);
    }

    // Calculate trend direction and strength
    calculateTrend(values) {
        if (values.length < 3) {
            return { direction: 'insufficient_data', strength: 0, slope: 0 };
        }
        
        // Use last N values for trend
        const recentValues = values.slice(-this.trendWindow);
        const n = recentValues.length;
        
        // Calculate linear regression slope
        const xMean = (n - 1) / 2;
        const yMean = recentValues.reduce((a, b) => a + b, 0) / n;
        
        let numerator = 0;
        let denominator = 0;
        
        for (let i = 0; i < n; i++) {
            numerator += (i - xMean) * (recentValues[i] - yMean);
            denominator += Math.pow(i - xMean, 2);
        }
        
        const slope = numerator / denominator;
        
        // Calculate R-squared for trend strength
        const predictions = recentValues.map((_, i) => yMean + slope * (i - xMean));
        const ssRes = recentValues.reduce((sum, y, i) => sum + Math.pow(y - predictions[i], 2), 0);
        const ssTot = recentValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
        const rSquared = 1 - (ssRes / ssTot);
        
        let direction = 'stable';
        if (Math.abs(slope) > 0.01) {
            direction = slope > 0 ? 'increasing' : 'decreasing';
        }
        
        return {
            direction: direction,
            strength: Math.abs(rSquared),
            slope: slope,
            rSquared: rSquared,
            changeRate: slope * 100 // Percentage change per reading
        };
    }

    // Calculate parameter stability
    calculateStability(stdDev, mean) {
        if (mean === 0) return 'unknown';
        
        const cv = (stdDev / Math.abs(mean)) * 100; // Coefficient of variation
        
        if (cv < 5) return 'very_stable';
        if (cv < 10) return 'stable';
        if (cv < 20) return 'moderate';
        if (cv < 30) return 'unstable';
        return 'very_unstable';
    }

    // Detect anomalies in recent readings
    detectAnomalies(parameter, threshold = null) {
        const history = this.getHistory();
        
        if (history.length < 10) {
            return { hasAnomaly: false, message: 'Insufficient data for anomaly detection' };
        }
        
        const values = history.map(r => r[parameter]).filter(v => v !== undefined && !isNaN(v));
        const recent = values.slice(-20);
        
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        const currentValue = values[values.length - 1];
        const zScore = Math.abs((currentValue - mean) / stdDev);
        
        const anomalyThreshold = threshold || this.anomalyThreshold;
        
        if (zScore > anomalyThreshold) {
            const deviation = currentValue - mean;
            return {
                hasAnomaly: true,
                parameter: parameter,
                currentValue: currentValue,
                expectedMean: mean,
                deviation: deviation,
                zScore: zScore,
                severity: zScore > 3 ? 'critical' : zScore > 2.5 ? 'high' : 'medium',
                message: `${parameter} is ${Math.abs(deviation).toFixed(2)} units ${deviation > 0 ? 'above' : 'below'} normal (${zScore.toFixed(2)} std deviations)`
            };
        }
        
        return { hasAnomaly: false };
    }

    // Predict next value using exponential smoothing
    predictNextValue(parameter, alpha = 0.3) {
        const history = this.getHistory();
        const values = history.map(r => r[parameter]).filter(v => v !== undefined && !isNaN(v));
        
        if (values.length < 5) {
            return null;
        }
        
        // Triple exponential smoothing (Holt-Winters)
        let level = values[0];
        let trend = values[1] - values[0];
        
        for (let i = 1; i < values.length; i++) {
            const prevLevel = level;
            level = alpha * values[i] + (1 - alpha) * (level + trend);
            trend = alpha * (level - prevLevel) + (1 - alpha) * trend;
        }
        
        const prediction = level + trend;
        const confidence = this.calculatePredictionConfidence(values);
        
        return {
            parameter: parameter,
            predicted: prediction,
            confidence: confidence,
            range: {
                lower: prediction * (1 - confidence / 200),
                upper: prediction * (1 + confidence / 200)
            }
        };
    }

    // Calculate prediction confidence
    calculatePredictionConfidence(values) {
        if (values.length < 10) return 0.5;
        
        const recent = values.slice(-10);
        const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
        const variance = recent.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recent.length;
        const cv = Math.sqrt(variance) / mean;
        
        // Lower coefficient of variation = higher confidence
        return Math.max(0.5, Math.min(0.95, 1 - cv));
    }

    // Get comprehensive quality trend
    getQualityTrend(timeRange = '24hours') {
        const history = this.getFilteredHistory(timeRange);
        
        if (history.length < 5) {
            return {
                trend: 'insufficient_data',
                message: 'Need at least 5 readings for trend analysis'
            };
        }
        
        // Calculate quality scores for each reading
        const scores = history.map(reading => {
            const ai = window.MilkoSenseAI || new MilkoSenseAI();
            const analysis = ai.predictQualityGrade(reading);
            return analysis.score;
        });
        
        const trend = this.calculateTrend(scores);
        const current = scores[scores.length - 1];
        const previous = scores[scores.length - 2];
        const change = current - previous;
        
        let message = '';
        if (trend.direction === 'increasing') {
            message = `Quality improving! +${Math.abs(trend.changeRate).toFixed(1)}% per reading`;
        } else if (trend.direction === 'decreasing') {
            message = `Quality declining. -${Math.abs(trend.changeRate).toFixed(1)}% per reading. Take action!`;
        } else {
            message = 'Quality stable. Maintain current practices.';
        }
        
        return {
            trend: trend.direction,
            changeRate: trend.changeRate,
            currentScore: current,
            previousScore: previous,
            recentChange: change,
            strength: trend.strength,
            message: message,
            recommendation: this.getTrendRecommendation(trend.direction, trend.changeRate)
        };
    }

    // Get recommendation based on trend
    getTrendRecommendation(direction, changeRate) {
        if (direction === 'decreasing' && Math.abs(changeRate) > 1) {
            return {
                priority: 'critical',
                action: 'Quality declining rapidly. Review recent changes in feeding, storage, or hygiene practices immediately.'
            };
        }
        
        if (direction === 'decreasing') {
            return {
                priority: 'high',
                action: 'Monitor closely. Identify and address factors causing quality decline.'
            };
        }
        
        if (direction === 'increasing') {
            return {
                priority: 'low',
                action: 'Continue current practices. Quality is improving.'
            };
        }
        
        return {
            priority: 'low',
            action: 'Maintain current standards.'
        };
    }

    // Get all parameter correlations
    getParameterCorrelations() {
        const history = this.getHistory();
        
        if (history.length < 20) {
            return null;
        }
        
        const parameters = ['ph', 'temperature', 'turbidity', 'tds', 'gas'];
        const correlations = {};
        
        for (let i = 0; i < parameters.length; i++) {
            for (let j = i + 1; j < parameters.length; j++) {
                const param1 = parameters[i];
                const param2 = parameters[j];
                
                const correlation = this.calculateCorrelation(param1, param2, history);
                correlations[`${param1}_${param2}`] = correlation;
            }
        }
        
        return correlations;
    }

    // Calculate correlation between two parameters
    calculateCorrelation(param1, param2, history) {
        const values1 = history.map(r => r[param1]).filter(v => v !== undefined && !isNaN(v));
        const values2 = history.map(r => r[param2]).filter(v => v !== undefined && !isNaN(v));
        
        const n = Math.min(values1.length, values2.length);
        
        if (n < 10) {
            return { coefficient: 0, strength: 'insufficient_data' };
        }
        
        const mean1 = values1.reduce((a, b) => a + b, 0) / n;
        const mean2 = values2.reduce((a, b) => a + b, 0) / n;
        
        let numerator = 0;
        let denominator1 = 0;
        let denominator2 = 0;
        
        for (let i = 0; i < n; i++) {
            const diff1 = values1[i] - mean1;
            const diff2 = values2[i] - mean2;
            numerator += diff1 * diff2;
            denominator1 += diff1 * diff1;
            denominator2 += diff2 * diff2;
        }
        
        const correlation = numerator / Math.sqrt(denominator1 * denominator2);
        
        let strength = 'none';
        const absCorr = Math.abs(correlation);
        if (absCorr > 0.7) strength = 'strong';
        else if (absCorr > 0.4) strength = 'moderate';
        else if (absCorr > 0.2) strength = 'weak';
        
        return {
            coefficient: correlation,
            strength: strength,
            direction: correlation > 0 ? 'positive' : 'negative'
        };
    }

    // Generate comprehensive trend report
    generateTrendReport(timeRange = '24hours') {
        const report = {
            timeRange: timeRange,
            timestamp: new Date().toISOString(),
            dataPoints: this.getFilteredHistory(timeRange).length,
            parameters: {},
            anomalies: [],
            predictions: {},
            qualityTrend: this.getQualityTrend(timeRange),
            correlations: this.getParameterCorrelations()
        };
        
        const parameters = ['ph', 'temperature', 'turbidity', 'tds', 'gas'];
        
        parameters.forEach(param => {
            report.parameters[param] = this.getParameterStats(param, timeRange);
            
            const anomaly = this.detectAnomalies(param);
            if (anomaly.hasAnomaly) {
                report.anomalies.push(anomaly);
            }
            
            const prediction = this.predictNextValue(param);
            if (prediction) {
                report.predictions[param] = prediction;
            }
        });
        
        return report;
    }

    // Get dashboard metrics
    getDashboardMetrics() {
        const history = this.getHistory();
        
        if (history.length === 0) {
            return {
                totalReadings: 0,
                avgQuality: 0,
                alerts: 0,
                uptime: 0
            };
        }
        
        const ai = window.MilkoSenseAI || new MilkoSenseAI();
        
        const qualities = history.map(r => {
            const analysis = ai.predictQualityGrade(r);
            return analysis.score;
        });
        
        const avgQuality = qualities.reduce((a, b) => a + b, 0) / qualities.length;
        
        const alerts = history.filter(r => {
            const analysis = ai.predictQualityGrade(r);
            return analysis.score < 60;
        }).length;
        
        const firstReading = history[0].timestamp;
        const lastReading = history[history.length - 1].timestamp;
        const uptimeHours = (lastReading - firstReading) / (1000 * 60 * 60);
        
        return {
            totalReadings: history.length,
            avgQuality: avgQuality.toFixed(1),
            alerts: alerts,
            uptime: uptimeHours.toFixed(1),
            dataQuality: history.length > 50 ? 'excellent' : history.length > 20 ? 'good' : 'limited'
        };
    }
}

// Export for global use
window.TrendAnalyzer = new TrendAnalyzer();
