// Report Generation Module for MilkoSense
// Generates comprehensive PDF-style HTML reports and downloadable data

class MilkoReportGenerator {
    constructor() {
        this.reportData = null;
    }

    // Generate comprehensive HTML report
    async generateReport() {
        const latestData = JSON.parse(localStorage.getItem('latestSensorData') || '{}');
        const latestAnalysis = JSON.parse(localStorage.getItem('latestAnalysis') || '{}');
        const historyData = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
        
        const cattleType = document.getElementById('cattle-type')?.value || 'cow';
        const season = document.getElementById('season')?.value || 'summer';
        
        this.reportData = {
            generatedAt: new Date().toISOString(),
            timestamp: new Date().toLocaleString(),
            cattleType: cattleType,
            season: season,
            sensorData: latestData,
            analysis: latestAnalysis,
            history: historyData.slice(0, 10)
        };
        
        return this.reportData;
    }

    // Generate printable HTML report
    generatePrintableReport(reportData) {
        const grade = reportData.analysis?.qualityGrade?.grade || 'N/A';
        const score = reportData.analysis?.score || 0;
        const label = reportData.analysis?.qualityGrade?.label || 'Unknown';
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>MilkoSense Analysis Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.6; 
            color: #333;
            padding: 40px;
            background: #fff;
        }
        .header {
            border-bottom: 4px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
        }
        .report-info {
            text-align: right;
            color: #666;
        }
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 15px;
            border-left: 4px solid #2563eb;
            padding-left: 10px;
        }
        .grade-display {
            text-align: center;
            padding: 30px;
            background: linear-gradient(135deg, #2563eb, #3b82f6);
            color: white;
            border-radius: 12px;
            margin-bottom: 20px;
        }
        .grade-letter {
            font-size: 72px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .grade-label {
            font-size: 24px;
            margin-bottom: 5px;
        }
        .grade-score {
            font-size: 18px;
            opacity: 0.9;
        }
        .data-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        .data-item {
            padding: 15px;
            background: #f8fafc;
            border-left: 3px solid #2563eb;
            border-radius: 4px;
        }
        .data-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        .data-value {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
        }
        .status-optimal { color: #10b981; }
        .status-good { color: #3b82f6; }
        .status-fair { color: #f59e0b; }
        .status-poor { color: #ef4444; }
        .recommendation-item {
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .priority-high {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
        }
        .priority-medium {
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
        }
        .priority-low {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
        }
        .rec-header {
            font-weight: bold;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .priority-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            color: white;
        }
        .badge-high { background: #ef4444; }
        .badge-medium { background: #f59e0b; }
        .badge-low { background: #3b82f6; }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        th {
            background: #f8fafc;
            font-weight: bold;
            color: #1f2937;
        }
        @media print {
            body { padding: 20px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🥛 MilkoSense</div>
        <div class="report-info">
            <div><strong>Analysis Report</strong></div>
            <div>Generated: ${reportData.timestamp}</div>
            <div>Cattle: ${reportData.cattleType.toUpperCase()}</div>
            <div>Season: ${reportData.season.toUpperCase()}</div>
        </div>
    </div>

    <div class="grade-display">
        <div class="grade-letter">${grade}</div>
        <div class="grade-label">${label}</div>
        <div class="grade-score">Quality Score: ${Math.round(score)}/100</div>
    </div>

    <div class="section">
        <h2 class="section-title">Sensor Readings</h2>
        <div class="data-grid">
            <div class="data-item">
                <div class="data-label">pH Level</div>
                <div class="data-value">${reportData.sensorData.ph?.toFixed(2) || 'N/A'}</div>
                <div class="${this.getStatusClass(reportData.analysis?.parameters?.ph?.status)}">${reportData.analysis?.parameters?.ph?.status || ''}</div>
            </div>
            <div class="data-item">
                <div class="data-label">Temperature</div>
                <div class="data-value">${reportData.sensorData.temperature?.toFixed(1) || 'N/A'}°C</div>
                <div class="${this.getStatusClass(reportData.analysis?.parameters?.temperature?.status)}">${reportData.analysis?.parameters?.temperature?.status || ''}</div>
            </div>
            <div class="data-item">
                <div class="data-label">Turbidity</div>
                <div class="data-value">${reportData.sensorData.turbidity?.toFixed(1) || 'N/A'} NTU</div>
                <div class="${this.getStatusClass(reportData.analysis?.parameters?.turbidity?.status)}">${reportData.analysis?.parameters?.turbidity?.status || ''}</div>
            </div>
            <div class="data-item">
                <div class="data-label">TDS</div>
                <div class="data-value">${reportData.sensorData.tds?.toFixed(0) || 'N/A'} ppm</div>
                <div class="${this.getStatusClass(reportData.analysis?.parameters?.tds?.status)}">${reportData.analysis?.parameters?.tds?.status || ''}</div>
            </div>
            <div class="data-item">
                <div class="data-label">Gas Level</div>
                <div class="data-value">${reportData.sensorData.gas?.toFixed(0) || 'N/A'}</div>
                <div class="${this.getStatusClass(reportData.analysis?.parameters?.gas?.status)}">${reportData.analysis?.parameters?.gas?.status || ''}</div>
            </div>
            <div class="data-item">
                <div class="data-label">Overall Quality</div>
                <div class="data-value">${reportData.sensorData.quality || 'N/A'}</div>
            </div>
        </div>
    </div>

    ${reportData.analysis?.recommendations?.length > 0 ? `
    <div class="section">
        <h2 class="section-title">AI Recommendations</h2>
        ${reportData.analysis.recommendations.map(rec => `
            <div class="recommendation-item priority-${rec.priority}">
                <div class="rec-header">
                    <span>${rec.category}</span>
                    <span class="priority-badge badge-${rec.priority}">${rec.priority}</span>
                </div>
                <div style="margin-bottom: 8px;">${rec.action}</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; color: #666;">
                    <div><strong>Impact:</strong> ${rec.expectedImpact}</div>
                    <div><strong>Timeframe:</strong> ${rec.timeframe}</div>
                </div>
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${reportData.analysis?.insights?.length > 0 ? `
    <div class="section">
        <h2 class="section-title">AI Insights</h2>
        <ul style="list-style: none; padding: 0;">
            ${reportData.analysis.insights.map(insight => `
                <li style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    ✓ ${insight.message}
                </li>
            `).join('')}
        </ul>
    </div>
    ` : ''}

    ${reportData.history?.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Recent History (Last 10 Readings)</h2>
        <table>
            <thead>
                <tr>
                    <th>Time</th>
                    <th>pH</th>
                    <th>Temp (°C)</th>
                    <th>Turbidity</th>
                    <th>TDS</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>
                ${reportData.history.map(entry => `
                    <tr>
                        <td>${new Date(entry.timestamp).toLocaleTimeString()}</td>
                        <td>${entry.sensorData?.ph?.toFixed(2) || 'N/A'}</td>
                        <td>${entry.sensorData?.temperature?.toFixed(1) || 'N/A'}</td>
                        <td>${entry.sensorData?.turbidity?.toFixed(1) || 'N/A'}</td>
                        <td>${entry.sensorData?.tds?.toFixed(0) || 'N/A'}</td>
                        <td>${entry.analysis?.score ? Math.round(entry.analysis.score) : 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="footer">
        <p><strong>MilkoSense - AI-Assisted Milk Quality Testing System</strong></p>
        <p>This report is generated by automated analysis and should be verified by qualified personnel.</p>
        <p>© 2025 MilkoSense Project. For educational and research purposes.</p>
    </div>

    <div class="no-print" style="text-align: center; margin-top: 30px;">
        <button onclick="window.print()" style="padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin-right: 10px;">
            Print Report
        </button>
        <button onclick="window.close()" style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
            Close
        </button>
    </div>
</body>
</html>`;
        
        return html;
    }

    getStatusClass(status) {
        const statusMap = {
            'optimal': 'status-optimal',
            'good': 'status-good',
            'fair': 'status-fair',
            'poor': 'status-poor'
        };
        return statusMap[status] || '';
    }

    // Open report in new window
    async openPrintableReport() {
        const reportData = await this.generateReport();
        const html = this.generatePrintableReport(reportData);
        
        const printWindow = window.open('', '_blank', 'width=900,height=800');
        printWindow.document.write(html);
        printWindow.document.close();
    }

    // Export data as CSV
    exportToCSV() {
        const historyData = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
        
        if (historyData.length === 0) {
            alert('No data available to export');
            return;
        }

        let csv = 'Timestamp,pH,Temperature(°C),Turbidity(NTU),TDS(ppm),Gas,Quality Score,Grade,Status\n';
        
        historyData.forEach(entry => {
            const sd = entry.sensorData || {};
            const an = entry.analysis || {};
            csv += `${new Date(entry.timestamp).toLocaleString()},`;
            csv += `${sd.ph || ''},${sd.temperature || ''},${sd.turbidity || ''},`;
            csv += `${sd.tds || ''},${sd.gas || ''},`;
            csv += `${an.score ? Math.round(an.score) : ''},`;
            csv += `${an.qualityGrade?.grade || ''},${sd.quality || ''}\n`;
        });

        this.downloadFile(csv, 'milkosense_data.csv', 'text/csv');
    }

    // Export data as JSON
    exportToJSON() {
        const reportData = localStorage.getItem('analysisHistory');
        
        if (!reportData) {
            alert('No data available to export');
            return;
        }

        this.downloadFile(reportData, 'milkosense_data.json', 'application/json');
    }

    // Helper function to download file
    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize global instance
window.reportGenerator = new MilkoReportGenerator();

// Auto-generate report data when available
document.addEventListener('DOMContentLoaded', function() {
    console.log('Report generator initialized');
});
