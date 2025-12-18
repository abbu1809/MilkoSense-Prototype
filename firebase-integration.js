// Firebase Real-Time Database Integration
// Fetches sensor data from Firebase every 3 seconds

class FirebaseDataFetcher {
    constructor(databaseUrl) {
        this.databaseUrl = databaseUrl;
        this.isRunning = false;
        this.intervalId = null;
        this.updateInterval = 3000; // 3 seconds
        this.listeners = [];
        this.lastData = null;
        this.errorCount = 0;
        this.maxErrors = 5;
    }

    // Start real-time data fetching
    start() {
        if (this.isRunning) {
            console.warn('Firebase fetcher is already running');
            return;
        }

        console.log('Starting real-time Firebase data fetching...');
        this.isRunning = true;
        this.errorCount = 0;

        // Fetch immediately on start
        this.fetchData();

        // Set up interval for periodic fetching
        this.intervalId = setInterval(() => {
            this.fetchData();
        }, this.updateInterval);
    }

    // Stop real-time data fetching
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('Stopped real-time Firebase data fetching');
    }

    // Fetch data from Firebase
    async fetchData() {
        try {
            const response = await fetch(this.databaseUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Reset error count on successful fetch
            this.errorCount = 0;

            // Process and normalize the data
            const processedData = this.processData(data);
            
            // Store last data
            this.lastData = processedData;

            // Notify all listeners
            this.notifyListeners(processedData);

            console.log('Firebase data fetched:', processedData);

        } catch (error) {
            console.error('Error fetching Firebase data:', error);
            this.errorCount++;

            // Notify listeners about error
            this.notifyListeners(null, error);

            // Stop fetching if too many errors
            if (this.errorCount >= this.maxErrors) {
                console.error(`Maximum error count (${this.maxErrors}) reached. Stopping fetcher.`);
                this.stop();
                this.notifyListeners(null, new Error('Max errors reached. Please check your connection.'));
            }
        }
    }

    // Process and normalize Firebase data
    processData(rawData) {
        // Normalize the data structure
        const processed = {
            gas: this.normalizeGasValue(rawData.gas),
            ph: parseFloat(rawData.ph) || 0,
            quality: rawData.quality || 'UNKNOWN',
            tds: parseFloat(rawData.tds) || 0,
            temperature: parseFloat(rawData.temperature) || 0,
            turbidity: parseFloat(rawData.turbidity) || 0,
            timestamp: new Date().toISOString(),
            raw: rawData
        };

        return processed;
    }

    // Normalize gas value (handle string/number values)
    normalizeGasValue(gasValue) {
        if (typeof gasValue === 'string') {
            // Handle string values like "NORMAL"
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

    // Add a listener for data updates
    addListener(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }

    // Remove a listener
    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    // Notify all listeners
    notifyListeners(data, error = null) {
        this.listeners.forEach(callback => {
            try {
                callback(data, error);
            } catch (err) {
                console.error('Error in listener callback:', err);
            }
        });
    }

    // Get the last fetched data
    getLastData() {
        return this.lastData;
    }

    // Change update interval
    setUpdateInterval(milliseconds) {
        if (milliseconds < 1000) {
            console.warn('Update interval should be at least 1000ms (1 second)');
            return;
        }

        this.updateInterval = milliseconds;

        // Restart if currently running
        if (this.isRunning) {
            this.stop();
            this.start();
        }
    }

    // Get current status
    getStatus() {
        return {
            isRunning: this.isRunning,
            updateInterval: this.updateInterval,
            errorCount: this.errorCount,
            lastUpdate: this.lastData ? this.lastData.timestamp : null,
            listeners: this.listeners.length
        };
    }
}

// Milk Quality Analyzer with Real-Time Updates
class RealTimeMilkAnalyzer {
    constructor(firebaseFetcher) {
        this.fetcher = firebaseFetcher;
        this.analysisHistory = [];
        this.maxHistorySize = 100;
        this.aiAnalyzer = window.MilkoSenseAI || null;
    }

    // Start real-time analysis
    start() {
        // Add listener to fetcher
        this.fetcher.addListener((data, error) => {
            if (error) {
                this.handleError(error);
            } else if (data) {
                this.analyzeData(data);
            }
        });

        // Start the fetcher
        this.fetcher.start();
    }

    // Stop real-time analysis
    stop() {
        this.fetcher.stop();
    }

    // Analyze incoming data
    async analyzeData(sensorData) {
        try {
            // Get cattle type and season from UI
            const cattleTypeEl = document.getElementById('cattle-type');
            const seasonEl = document.getElementById('season');
            
            if (cattleTypeEl && seasonEl) {
                sensorData.cattleType = cattleTypeEl.value;
                sensorData.season = seasonEl.value;
            }
            
            let analysis = null;

            // Use AI analyzer if available
            if (this.aiAnalyzer) {
                analysis = await this.aiAnalyzer.analyzeSensorData(sensorData);
            } else {
                // Fallback to basic analysis
                analysis = this.basicAnalysis(sensorData);
            }

            // Add to history
            this.addToHistory({
                timestamp: sensorData.timestamp,
                sensorData: sensorData,
                analysis: analysis
            });

            // Trigger custom event for UI updates
            this.dispatchAnalysisEvent(sensorData, analysis);

            // Store in localStorage for persistence
            this.storeData(sensorData, analysis);

            console.log('Analysis complete:', analysis);

        } catch (error) {
            console.error('Error during analysis:', error);
        }
    }

    // Basic analysis without AI
    basicAnalysis(data) {
        const score = this.calculateQualityScore(data);
        
        return {
            qualityGrade: this.getGradeFromScore(score),
            score: score,
            timestamp: new Date().toISOString(),
            parameters: {
                ph: { value: data.ph, status: this.getPhStatus(data.ph) },
                temperature: { value: data.temperature, status: this.getTempStatus(data.temperature) },
                turbidity: { value: data.turbidity, status: this.getTurbidityStatus(data.turbidity) },
                tds: { value: data.tds, status: this.getTdsStatus(data.tds) },
                gas: { value: data.gas, status: this.getGasStatus(data.gas) }
            }
        };
    }

    // Calculate quality score
    calculateQualityScore(data) {
        let score = 0;
        
        // pH scoring (0-25)
        if (data.ph >= 6.5 && data.ph <= 6.7) score += 25;
        else if (data.ph >= 6.4 && data.ph <= 6.8) score += 20;
        else if (data.ph >= 6.2 && data.ph <= 6.9) score += 15;
        else score += 10;
        
        // Temperature scoring (0-20)
        if (data.temperature >= 15 && data.temperature <= 20) score += 20;
        else if (data.temperature >= 10 && data.temperature <= 25) score += 15;
        else score += 10;
        
        // Turbidity scoring (0-20)
        if (data.turbidity >= 10 && data.turbidity <= 20) score += 20;
        else if (data.turbidity >= 5 && data.turbidity <= 25) score += 15;
        else score += 10;
        
        // TDS scoring (0-20)
        if (data.tds >= 800 && data.tds <= 1200) score += 20;
        else if (data.tds >= 700 && data.tds <= 1400) score += 15;
        else score += 10;
        
        // Gas scoring (0-15)
        if (data.gas >= 100 && data.gas <= 150) score += 15;
        else if (data.gas >= 80 && data.gas <= 200) score += 12;
        else score += 8;
        
        return score;
    }

    // Get grade from score
    getGradeFromScore(score) {
        if (score >= 90) return { grade: 'A', label: 'Excellent', color: '#10b981' };
        if (score >= 75) return { grade: 'B', label: 'Good', color: '#3b82f6' };
        if (score >= 60) return { grade: 'C', label: 'Fair', color: '#f59e0b' };
        return { grade: 'D', label: 'Poor', color: '#ef4444' };
    }

    // Parameter status helpers
    getPhStatus(ph) {
        if (ph >= 6.4 && ph <= 6.7) return 'optimal';
        if (ph >= 6.3 && ph <= 6.8) return 'good';
        if (ph >= 6.2 && ph <= 6.9) return 'fair';
        return 'poor';
    }

    getTempStatus(temp) {
        if (temp >= 15 && temp <= 30) return 'optimal';
        if (temp >= 10 && temp <= 35) return 'good';
        return 'poor';
    }

    getTurbidityStatus(turbidity) {
        if (turbidity >= 10 && turbidity <= 20) return 'optimal';
        if (turbidity >= 5 && turbidity <= 25) return 'good';
        return 'poor';
    }

    getTdsStatus(tds) {
        if (tds >= 300 && tds <= 600) return 'optimal';
        if (tds >= 250 && tds <= 700) return 'good';
        return 'poor';
    }

    getGasStatus(gas) {
        if (gas >= 100 && gas <= 150) return 'optimal';
        if (gas >= 80 && gas <= 200) return 'good';
        return 'poor';
    }

    // Add to analysis history
    addToHistory(entry) {
        this.analysisHistory.unshift(entry);
        
        // Keep only recent entries
        if (this.analysisHistory.length > this.maxHistorySize) {
            this.analysisHistory = this.analysisHistory.slice(0, this.maxHistorySize);
        }
    }

    // Get analysis history
    getHistory(count = 10) {
        return this.analysisHistory.slice(0, count);
    }

    // Dispatch custom event
    dispatchAnalysisEvent(sensorData, analysis) {
        const event = new CustomEvent('milkAnalysisUpdate', {
            detail: {
                sensorData: sensorData,
                analysis: analysis,
                timestamp: new Date().toISOString()
            }
        });
        window.dispatchEvent(event);
    }

    // Store data in localStorage
    storeData(sensorData, analysis) {
        try {
            localStorage.setItem('latestSensorData', JSON.stringify(sensorData));
            localStorage.setItem('latestAnalysis', JSON.stringify(analysis));
            
            // Store history
            const history = this.getHistory(20);
            localStorage.setItem('analysisHistory', JSON.stringify(history));
        } catch (error) {
            console.error('Error storing data in localStorage:', error);
        }
    }

    // Handle errors
    handleError(error) {
        console.error('Analysis error:', error);
        
        const event = new CustomEvent('milkAnalysisError', {
            detail: {
                error: error.message,
                timestamp: new Date().toISOString()
            }
        });
        window.dispatchEvent(event);
    }

    // Get statistics
    getStatistics() {
        if (this.analysisHistory.length === 0) {
            return null;
        }

        const recent = this.getHistory(10);
        const scores = recent.map(entry => entry.analysis.score || 0);
        
        return {
            averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
            minScore: Math.min(...scores),
            maxScore: Math.max(...scores),
            totalSamples: this.analysisHistory.length,
            recentSamples: recent.length
        };
    }
}

// Initialize global instances
window.firebaseFetcher = null;
window.milkAnalyzer = null;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Firebase database URL
    const FIREBASE_URL = 'https://minorproject-a64cd-default-rtdb.firebaseio.com/sensors.json';
    
    // Create fetcher instance
    window.firebaseFetcher = new FirebaseDataFetcher(FIREBASE_URL);
    
    // Create analyzer instance
    window.milkAnalyzer = new RealTimeMilkAnalyzer(window.firebaseFetcher);
    
    console.log('Firebase integration initialized. Ready to start real-time monitoring.');
});
