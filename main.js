// MilkoSense Main JavaScript File
// Handles all interactive functionality across the prototype

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeTypedText();
    initializeAnimations();
    initializeNavigation();
    initializeForms();
    initializeCharts();
    initializeSensorSimulation();
    initializeColorimetricDetection();
    
    console.log('MilkoSense prototype initialized successfully');
});

// Typed.js initialization for hero text
function initializeTypedText() {
    const typedElement = document.getElementById('typed-text');
    if (typedElement) {
        new Typed('#typed-text', {
            strings: [
                'AI-Assisted Testing',
                'Real-Time Monitoring', 
                'Quality Assurance',
                'Food Safety Innovation'
            ],
            typeSpeed: 80,
            backSpeed: 60,
            backDelay: 2000,
            loop: true,
            showCursor: true,
            cursorChar: '|'
        });
    }
}

// Anime.js animations
function initializeAnimations() {
    // Animate feature cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                anime({
                    targets: entry.target,
                    translateY: [50, 0],
                    opacity: [0, 1],
                    duration: 800,
                    easing: 'easeOutQuart',
                    delay: anime.stagger(200)
                });
            }
        });
    }, observerOptions);

    // Observe feature cards
    document.querySelectorAll('.card-hover').forEach(card => {
        observer.observe(card);
    });

    // Animate statistics on scroll
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('[data-counter]').forEach(stat => {
        statsObserver.observe(stat);
    });
}

// Counter animation function
function animateCounter(element) {
    const target = parseInt(element.dataset.counter);
    const duration = 2000;
    
    anime({
        targets: { count: 0 },
        count: target,
        duration: duration,
        easing: 'easeOutQuart',
        update: function(anim) {
            element.textContent = Math.round(anim.animatables[0].target.count);
        }
    });
}

// Navigation functionality
function initializeNavigation() {
    // Mobile menu toggle
    const mobileMenuButton = document.querySelector('button[class*="md:hidden"]');
    const mobileMenu = document.createElement('div');
    mobileMenu.className = 'md:hidden bg-white border-t border-gray-200 px-4 py-2 space-y-2';
    mobileMenu.innerHTML = `
        <a href="index.html" class="block py-2 text-gray-900 font-medium">Home</a>
        <a href="about.html" class="block py-2 text-gray-600 font-medium">About</a>
        <a href="sensors.html" class="block py-2 text-gray-600 font-medium">Sensors</a>
        <a href="analysis.html" class="block py-2 text-gray-600 font-medium">Analysis</a>
        <a href="colorimetric.html" class="block py-2 text-gray-600 font-medium">Colorimetric</a>
        <a href="dashboard.html" class="block py-2 text-gray-600 font-medium">Dashboard</a>
        <a href="team.html" class="block py-2 text-gray-600 font-medium">Team</a>
        <a href="contact.html" class="block py-2 text-gray-600 font-medium">Contact</a>
    `;
    
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', () => {
            const nav = document.querySelector('nav');
            const existingMenu = nav.querySelector('.mobile-menu');
            if (existingMenu) {
                existingMenu.remove();
            } else {
                mobileMenu.className = 'mobile-menu md:hidden bg-white border-t border-gray-200 px-4 py-2 space-y-2';
                nav.appendChild(mobileMenu);
            }
        });
    }

    // Active navigation highlighting
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
    });
}

// Form handling and validation
function initializeForms() {
    // Sensor input form
    const sensorForm = document.getElementById('sensor-form');
    if (sensorForm) {
        sensorForm.addEventListener('submit', handleSensorSubmit);
        
        // Real-time validation
        const inputs = sensorForm.querySelectorAll('input[type="range"]');
        inputs.forEach(input => {
            input.addEventListener('input', updateSliderValue);
        });
    }

    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    // Image upload
    const imageUpload = document.getElementById('image-upload');
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
        
        // Drag and drop functionality
        const dropZone = document.getElementById('drop-zone');
        if (dropZone) {
            dropZone.addEventListener('dragover', handleDragOver);
            dropZone.addEventListener('drop', handleDrop);
            dropZone.addEventListener('click', () => imageUpload.click());
        }
    }
}

// Sensor form submission
async function handleSensorSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const sensorData = {
        ph: parseFloat(formData.get('ph')),
        temperature: parseFloat(formData.get('temperature')),
        turbidity: parseFloat(formData.get('turbidity')),
        tds: parseFloat(formData.get('tds')),
        gas: parseFloat(formData.get('gas')),
        cattleType: formData.get('cattleType'),
        season: formData.get('season')
    };

    // Show loading animation
    showLoadingAnimation();
    
    // Use AI analysis if available
    if (window.MilkoSenseAI) {
        try {
            const aiAnalysis = await window.MilkoSenseAI.analyzeSensorData(sensorData);
            localStorage.setItem('aiAnalysis', JSON.stringify(aiAnalysis));
            console.log('AI Analysis Complete:', aiAnalysis);
        } catch (error) {
            console.error('AI Analysis Error:', error);
        }
    }
    
    // Simulate API processing
    setTimeout(() => {
        // Store data in localStorage for analysis page
        localStorage.setItem('sensorData', JSON.stringify(sensorData));
        
        // Redirect to analysis page
        window.location.href = 'analysis.html';
    }, 2000);
}

// Update slider values in real-time
function updateSliderValue(e) {
    const slider = e.target;
    const valueDisplay = document.getElementById(slider.name + '-value');
    if (valueDisplay) {
        valueDisplay.textContent = slider.value;
        
        // Update color based on value ranges
        const value = parseFloat(slider.value);
        let colorClass = 'text-green-600';
        
        switch(slider.name) {
            case 'ph':
                colorClass = value >= 6.4 && value <= 6.8 ? 'text-green-600' : 'text-red-600';
                break;
            case 'temperature':
                colorClass = value >= 15 && value <= 25 ? 'text-green-600' : 'text-orange-600';
                break;
            case 'turbidity':
                colorClass = value >= 10 && value <= 20 ? 'text-green-600' : 'text-red-600';
                break;
            case 'tds':
                colorClass = value >= 800 && value <= 1200 ? 'text-green-600' : 'text-orange-600';
                break;
        }
        
        valueDisplay.className = `text-2xl font-bold ${colorClass}`;
    }
}

// Loading animation
function showLoadingAnimation() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    loadingDiv.innerHTML = `
        <div class="bg-white p-8 rounded-2xl shadow-2xl text-center">
            <div class="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Analyzing Milk Quality</h3>
            <p class="text-gray-600">Processing sensor data with AI algorithms...</p>
        </div>
    `;
    document.body.appendChild(loadingDiv);
}

// Image upload handling
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('image-preview');
            if (preview) {
                preview.src = e.target.result;
                preview.classList.remove('hidden');
            }
        };
        reader.readAsDataURL(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('image-preview');
                if (preview) {
                    preview.src = e.target.result;
                    preview.classList.remove('hidden');
                }
            };
            reader.readAsDataURL(file);
        }
    }
}

// Contact form handling
function handleContactSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const contactData = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message')
    };
    
    // Show success message
    showNotification('Thank you for your message! We\'ll get back to you soon.', 'success');
    e.target.reset();
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 
        'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Chart initialization
function initializeCharts() {
    // Analysis page charts
    if (document.getElementById('quality-chart')) {
        createQualityChart();
    }
    
    if (document.getElementById('parameter-chart')) {
        createParameterChart();
    }
    
    // Dashboard charts
    if (document.getElementById('dashboard-chart')) {
        createDashboardChart();
    }
}

// Quality analysis chart
function createQualityChart() {
    const chartDom = document.getElementById('quality-chart');
    const myChart = echarts.init(chartDom);
    
    const option = {
        title: {
            text: 'Milk Quality Parameters',
            textStyle: { color: '#374151', fontSize: 18, fontWeight: 'bold' }
        },
        tooltip: { trigger: 'axis' },
        legend: {
            data: ['pH', 'Temperature', 'Turbidity', 'TDS'],
            bottom: 0
        },
        xAxis: {
            type: 'category',
            data: ['Sample 1', 'Sample 2', 'Sample 3', 'Sample 4', 'Sample 5']
        },
        yAxis: { type: 'value' },
        series: [
            {
                name: 'pH',
                type: 'line',
                data: [6.5, 6.7, 6.6, 6.8, 6.7],
                itemStyle: { color: '#2563eb' }
            },
            {
                name: 'Temperature',
                type: 'line',
                data: [18, 19, 17, 20, 18],
                itemStyle: { color: '#10b981' }
            },
            {
                name: 'Turbidity',
                type: 'line',
                data: [15, 16, 14, 17, 15],
                itemStyle: { color: '#f59e0b' }
            },
            {
                name: 'TDS',
                type: 'line',
                data: [850, 900, 800, 950, 850],
                itemStyle: { color: '#8b5cf6' }
            }
        ]
    };
    
    myChart.setOption(option);
}

// Parameter radar chart
function createParameterChart() {
    const chartDom = document.getElementById('parameter-chart');
    const myChart = echarts.init(chartDom);
    
    const option = {
        title: {
            text: 'Quality Assessment Radar',
            textStyle: { color: '#374151', fontSize: 18, fontWeight: 'bold' }
        },
        tooltip: {},
        radar: {
            indicator: [
                { name: 'pH', max: 7 },
                { name: 'Temperature', max: 25 },
                { name: 'Turbidity', max: 25 },
                { name: 'TDS', max: 1200 },
                { name: 'Purity', max: 100 }
            ],
            radius: '60%'
        },
        series: [{
            name: 'Quality Metrics',
            type: 'radar',
            data: [{
                value: [6.7, 18, 15, 850, 92],
                name: 'Current Sample',
                itemStyle: { color: '#2563eb' },
                areaStyle: { opacity: 0.3 }
            }]
        }]
    };
    
    myChart.setOption(option);
}

// Dashboard real-time chart
function createDashboardChart() {
    const chartDom = document.getElementById('dashboard-chart');
    const myChart = echarts.init(chartDom);
    
    let timeData = [];
    let phData = [];
    let tempData = [];
    let turbidityData = [];
    
    // Generate initial data
    for (let i = 0; i < 20; i++) {
        timeData.push(new Date(Date.now() - (19 - i) * 60000).toLocaleTimeString());
        phData.push(6.5 + Math.random() * 0.4);
        tempData.push(17 + Math.random() * 4);
        turbidityData.push(14 + Math.random() * 4);
    }
    
    const option = {
        title: {
            text: 'Real-Time Sensor Data',
            textStyle: { color: '#374151', fontSize: 18, fontWeight: 'bold' }
        },
        tooltip: { trigger: 'axis' },
        legend: {
            data: ['pH', 'Temperature', 'Turbidity'],
            bottom: 0
        },
        xAxis: {
            type: 'category',
            data: timeData
        },
        yAxis: { type: 'value' },
        series: [
            {
                name: 'pH',
                type: 'line',
                data: phData,
                itemStyle: { color: '#2563eb' },
                smooth: true
            },
            {
                name: 'Temperature',
                type: 'line',
                data: tempData,
                itemStyle: { color: '#10b981' },
                smooth: true
            },
            {
                name: 'Turbidity',
                type: 'line',
                data: turbidityData,
                itemStyle: { color: '#f59e0b' },
                smooth: true
            }
        ]
    };
    
    myChart.setOption(option);
    
    // Update data every 5 seconds
    setInterval(() => {
        timeData.shift();
        phData.shift();
        tempData.shift();
        turbidityData.shift();
        
        timeData.push(new Date().toLocaleTimeString());
        phData.push(6.5 + Math.random() * 0.4);
        tempData.push(17 + Math.random() * 4);
        turbidityData.push(14 + Math.random() * 4);
        
        myChart.setOption({
            xAxis: { data: timeData },
            series: [
                { data: phData },
                { data: tempData },
                { data: turbidityData }
            ]
        });
    }, 5000);
}

// Sensor simulation for IoT dashboard
function initializeSensorSimulation() {
    const sensorValues = {
        ph: document.getElementById('ph-value'),
        temperature: document.getElementById('temperature-value'),
        turbidity: document.getElementById('turbidity-value'),
        tds: document.getElementById('tds-value'),
        gas: document.getElementById('gas-value')
    };
    
    // Update sensor values every 3 seconds
    setInterval(() => {
        Object.keys(sensorValues).forEach(sensor => {
            const element = sensorValues[sensor];
            if (element) {
                let newValue;
                switch(sensor) {
                    case 'ph':
                        newValue = (6.5 + Math.random() * 0.4).toFixed(1);
                        break;
                    case 'temperature':
                        newValue = (17 + Math.random() * 6).toFixed(1);
                        break;
                    case 'turbidity':
                        newValue = Math.round(14 + Math.random() * 6);
                        break;
                    case 'tds':
                        newValue = Math.round(800 + Math.random() * 200);
                        break;
                    case 'gas':
                        newValue = Math.round(100 + Math.random() * 50);
                        break;
                }
                
                // Animate value change
                anime({
                    targets: element,
                    innerHTML: [element.innerHTML, newValue],
                    duration: 1000,
                    easing: 'easeInOutQuad',
                    round: sensor === 'tds' || sensor === 'gas' || sensor === 'turbidity' ? 1 : 10
                });
            }
        });
    }, 3000);
}

// Colorimetric detection functionality
function initializeColorimetricDetection() {
    const adulterants = ['urea', 'detergent', 'starch', 'soda', 'formalin'];
    
    adulterants.forEach(adulterant => {
        const toggle = document.getElementById(`${adulterant}-toggle`);
        if (toggle) {
            toggle.addEventListener('change', function() {
                const statusElement = document.getElementById(`${adulterant}-status`);
                if (statusElement) {
                    statusElement.textContent = this.checked ? 'Detected' : 'Not Detected';
                    statusElement.className = this.checked ? 
                        'px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800' : 
                        'px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800';
                }
            });
        }
    });
}

// Utility functions
function formatValue(value, unit) {
    return `${value} ${unit}`;
}

function getQualityColor(grade) {
    const colors = {
        'A': 'text-green-600',
        'B': 'text-blue-600',
        'C': 'text-yellow-600',
        'D': 'text-red-600'
    };
    return colors[grade] || 'text-gray-600';
}

function getQualityBadge(grade) {
    const badges = {
        'A': 'bg-green-100 text-green-800',
        'B': 'bg-blue-100 text-blue-800',
        'C': 'bg-yellow-100 text-yellow-800',
        'D': 'bg-red-100 text-red-800'
    };
    return badges[grade] || 'bg-gray-100 text-gray-800';
}

// Export functions for global access
window.MilkoSense = {
    showNotification,
    formatValue,
    getQualityColor,
    getQualityBadge
};