
// --- Mock Data Simulation ---
const mockDevices = [
    { id: 'dev001', name: 'Kathmandu-Koteshwor', lat: 27.6713, lon: 85.3563, status: 'Online', battery: 85, imageUrl: 'Koteshwar_(towards_airport).jpg' },
    { id: 'dev002', name: 'Kathmandu-Thamel', lat: 27.7161, lon: 85.3138, status: 'Online', battery: 92, imageUrl: 'thamel-kathmandu.jpg' },
    { id: 'dev003', name: 'Lalitpur-Ringroad', lat: 27.6543, lon: 85.3153, status: 'Offline', battery: 20, imageUrl: 'Ringroad.jpg' },
    { id: 'dev004', name: 'Kathmandu-Maitighar', lat: 27.6970, lon: 85.3182, status: 'Online', battery: 80, imageUrl: 'Maitighar.jpg' }
];

let activeDeviceId = null;
let historicalChartInstance = null;
let dailyAvgChartInstance = null;
let mapInstance = null;
let deviceMarkers = {};

function getMockRealtimeCO2(deviceId) {
    let baseCO2 = 400;
    if (deviceId === 'dev001') baseCO2 = 800;
    else if (deviceId === 'dev002') baseCO2 = 550;
    else if (deviceId === 'dev004') baseCO2 = 750;
    else if (deviceId === 'dev003') baseCO2 = 450;
    
    let co2 = Math.round(baseCO2 + (Math.random() * 200 - 100));
    return Math.max(300, Math.min(2000, co2));
}

function getMockHistoricalCO2(days = 7) {
    const labels = [];
    const data = [];
    let currentCO2 = 500;

    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

        currentCO2 = Math.round(currentCO2 + (Math.random() * 100 - 50));
        currentCO2 = Math.max(350, Math.min(1500, currentCO2));

        data.push(currentCO2);
    }
    return { labels, data };
}

function getMockDailyAverageCO2() {
    const labels = [];
    const data = [];
    mockDevices.forEach(device => {
        labels.push(device.name);
        let avgCO2 = 500;
        if (device.id === 'dev001') avgCO2 = 900;
        else if (device.id === 'dev002') avgCO2 = 600;
        else if (device.id === 'dev003') avgCO2 = device.status === 'Offline' ? 380 : 400;
        else if (device.id === 'dev004') avgCO2 = 850;
        data.push(Math.round(avgCO2 + (Math.random() * 100 - 50)));
    });
    return { labels, data };
}

function renderDeviceList() {
    const deviceListDiv = document.getElementById('device-list');
    if (!deviceListDiv) {
        console.error('Error: Element with ID "device-list" not found. Cannot render device list.');
        return;
    }
    deviceListDiv.innerHTML = '';

    mockDevices.forEach(device => {
        const deviceCard = document.createElement('div');
        deviceCard.classList.add('device-card');
        if (device.id === activeDeviceId) {
            deviceCard.classList.add('active');
        }
        deviceCard.dataset.deviceId = device.id;

        deviceCard.innerHTML = `
            <div class="device-card-image" style="background-image: url('${device.imageUrl}');"></div>
            <div class="device-card-content">
                <h3>${device.name}</h3>
                <p>ID: ${device.id}</p>
                <p>Status: <span class="device-status ${device.status === 'Offline' ? 'offline' : ''}">${device.status}</span></p>
                <p>Battery: ${device.battery}%</p>
            </div>
        `;
        deviceCard.addEventListener('click', () => selectDevice(device.id));
        deviceListDiv.appendChild(deviceCard);
    });
}

function updateRealtimeDisplay(deviceId) {
    const realtimeDisplayDiv = document.getElementById('realtime-display');
    if (!realtimeDisplayDiv) {
        console.error('Error: Element with ID "realtime-display" not found. Cannot update real-time display.');
        return;
    }

    if (!deviceId) {
        realtimeDisplayDiv.innerHTML = '<p>Select a device from the overview to see its real-time data.</p>';
        return;
    }

    const device = mockDevices.find(d => d.id === deviceId);
    if (!device) {
        realtimeDisplayDiv.innerHTML = `<p>Error: Device with ID "${deviceId}" not found.</p>`;
        return;
    }

    if (device.status === 'Offline') {
        realtimeDisplayDiv.innerHTML = `
            <p>Current CO2 for <strong>${device.name}</strong>:</p>
            <p style="color: var(--danger-color); font-weight: bold;">Device is offline. No real-time data available.</p>
            <button class="view-details-button" onclick="window.location.href='device-details.html?id=${device.id}'">View More Details</button>
        `;
        return;
    }

    const co2Value = getMockRealtimeCO2(deviceId);
    let alertMessage = '';
    let co2ValueColor = co2Value > 800 ? 'var(--danger-color)' : 'var(--primary-color)';

    if (co2Value > 1200) {
        alertMessage = '<p style="color: var(--danger-color); font-weight: bold; font-size: 0.9em; margin-top: 5px;">(High Level - Needs Attention!)</p>';
    } else if (co2Value > 800) {
        alertMessage = '<p style="color: var(--danger-color); font-weight: bold; font-size: 0.9em; margin-top: 5px;">(Elevated Level)</p>';
    }

    realtimeDisplayDiv.innerHTML = `
        <p>Current CO2 for <strong>${device.name}</strong>:</p>
        <p><strong style="color: ${co2ValueColor};">${co2Value} PPM</strong></p>
        ${alertMessage}
        <button class="view-details-button" onclick="window.location.href='device-details.html?id=${device.id}'">View More Details</button>
    `;
}

function renderHistoricalChart() {
    if (typeof Chart === 'undefined') {
        console.error('Error: Chart.js not loaded');
        const canvas = document.getElementById('co2Chart');
        if (canvas) {
            canvas.parentElement.innerHTML = '<p class="error-msg">Error: Unable to load chart</p>';
        }
        return;
    }

    const canvas = document.getElementById('co2Chart');
    if (!canvas) {
        console.error('Error: Canvas element with ID "co2Chart" not found. Cannot render historical chart.');
        return;
    }
    const ctx = canvas.getContext('2d');
    const historicalData = getMockHistoricalCO2();

    if (historicalChartInstance) {
        historicalChartInstance.destroy();
    }

    historicalChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: historicalData.labels,
            datasets: [{
                label: 'Overall Average Daily CO2 (PPM)',
                data: historicalData.data,
                borderColor: 'var(--primary-color)',
                backgroundColor: 'rgba(0, 123, 255, 0.2)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'CO2 Concentration (PPM)',
                        color: 'var(--text-color-dark)',
                        font: { size: 14, weight: '600', family: 'Inter' }
                    },
                    ticks: {
                        color: 'var(--secondary-color)',
                        font: { family: 'Inter' }
                    },
                    grid: {
                        color: 'var(--border-color)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date',
                        color: 'var(--text-color-dark)',
                        font: { size: 14, weight: '600', family: 'Inter' }
                    },
                    ticks: {
                        color: 'var(--secondary-color)',
                        font: { family: 'Inter' }
                    },
                    grid: {
                        color: 'var(--border-color)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: 'var(--text-color-dark)',
                        font: { family: 'Inter' }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(40, 40, 40, 0.85)',
                    titleColor: '#FFFFFF',
                    bodyColor: '#E0E0E0',
                    borderColor: 'var(--primary-color)',
                    borderWidth: 1,
                    cornerRadius: 6,
                    displayColors: false,
                    titleFont: {
                        size: 14,
                        weight: 'bold',
                        family: 'Inter'
                    },
                    bodyFont: {
                        size: 12,
                        family: 'Inter'
                    },
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw} PPM`;
                        }
                    }
                }
            }
        }
    });
}

function renderDailyAverageChart() {
    if (typeof Chart === 'undefined') {
        console.error('Error: Chart.js not loaded');
        const canvas = document.getElementById('dailyAvgChart');
        if (canvas) {
            canvas.parentElement.innerHTML = '<p class="error-msg">Error: Unable to load chart</p>';
        }
        return;
    }

    const canvas = document.getElementById('dailyAvgChart');
    if (!canvas) {
        console.error('Error: Canvas element with ID "dailyAvgChart" not found. Cannot render daily average chart.');
        return;
    }
    const ctx = canvas.getContext('2d');
    const dailyAvgData = getMockDailyAverageCO2();

    if (dailyAvgChartInstance) {
        dailyAvgChartInstance.destroy();
    }

    dailyAvgChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dailyAvgData.labels,
            datasets: [{
                label: 'Current Average CO2 (PPM)',
                data: dailyAvgData.data,
                backgroundColor: [
                    'rgba(0, 123, 255, 0.7)',
                    'rgba(40, 167, 69, 0.7)',
                    'rgba(220, 53, 69, 0.7)',
                    'rgba(255, 193, 7, 0.7)'
                ],
                borderColor: [
                    'var(--primary-color)',
                    'var(--accent-color)',
                    'var(--danger-color)',
                    '#ffc107'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'CO2 Concentration (PPM)',
                        color: 'var(--text-color-dark)',
                        font: { size: 14, weight: '600', family: 'Inter' }
                    },
                    ticks: {
                        color: 'var(--secondary-color)',
                        font: { family: 'Inter' }
                    },
                    grid: {
                        color: 'var(--border-color)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Device Location',
                        color: 'var(--text-color-dark)',
                        font: { size: 14, weight: '600', family: 'Inter' }
                    },
                    ticks: {
                        color: 'var(--secondary-color)',
                        font: { family: 'Inter' }
                    },
                    grid: {
                        color: 'var(--border-color)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: 'var(--text-color-dark)',
                        font: { family: 'Inter' }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(40, 40, 40, 0.85)',
                    titleColor: '#FFFFFF',
                    bodyColor: '#E0E0E0',
                    borderColor: 'var(--primary-color)',
                    borderWidth: 1,
                    cornerRadius: 6,
                    displayColors: false,
                    titleFont: {
                        size: 14,
                        weight: 'bold',
                        family: 'Inter'
                    },
                    bodyFont: {
                        size: 12,
                        family: 'Inter'
                    },
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw} PPM`;
                        }
                    }
                }
            }
        }
    });
}

function initializeMap() {
    if (typeof L === 'undefined') {
        console.error('Error: Leaflet not loaded');
        const mapElement = document.getElementById('map');
        if (mapElement) {
            mapElement.innerHTML = '<p class="error-msg">Error: Unable to load map</p>';
        }
        return;
    }

    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Error: Map element with ID "map" not found. Cannot initialize map.');
        return;
    }

    if (!mapInstance) {
        mapInstance = L.map('map').setView([27.700769, 85.300140], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstance);
    }

    updateMapMarkers();
}

function updateMapMarkers() {
    const currentDeviceIds = new Set(mockDevices.map(d => d.id));
    const markersToRemove = [];

    for (const id in deviceMarkers) {
        if (!currentDeviceIds.has(id)) {
            mapInstance.removeLayer(deviceMarkers[id]);
            markersToRemove.push(id);
        }
    }
    markersToRemove.forEach(id => delete deviceMarkers[id]);

    mockDevices.forEach(device => {
        if (!device.lat || !device.lon || isNaN(device.lat) || isNaN(device.lon)) {
            console.warn(`Invalid coordinates for device ${device.id}`);
            return;
        }

        let marker = deviceMarkers[device.id];
        const popupContent = `<b>${device.name}</b><br>ID: ${device.id}<br>Status: ${device.status}<br>Battery: ${device.battery}%`;

        const onlineIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });

        const offlineIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });

        const icon = device.status === 'Offline' ? offlineIcon : onlineIcon;

        if (marker) {
            marker.setLatLng([device.lat, device.lon]);
            marker.setPopupContent(popupContent);
            marker.setIcon(icon);
        } else {
            marker = L.marker([device.lat, device.lon], { icon: icon })
                .addTo(mapInstance)
                .bindPopup(popupContent);
            deviceMarkers[device.id] = marker;
        }

        marker.off('click').on('click', () => selectDevice(device.id));
    });
}

function selectDevice(deviceId) {
    if (activeDeviceId !== deviceId) {
        activeDeviceId = deviceId;
        renderDeviceList();
        updateRealtimeDisplay(deviceId);
        
        const selectedDevice = mockDevices.find(d => d.id === deviceId);
        if (mapInstance && selectedDevice) {
            mapInstance.flyTo([selectedDevice.lat, selectedDevice.lon], 14);
            if (deviceMarkers[deviceId]) {
                deviceMarkers[deviceId].openPopup();
            }
        }
    }
}

function initializeDashboard() {
    renderDeviceList();
    updateRealtimeDisplay(null);
    renderHistoricalChart();
    renderDailyAverageChart();
    initializeMap();

    const intervalId = setInterval(() => {
        if (activeDeviceId) {
            updateRealtimeDisplay(activeDeviceId);
        }
        renderDailyAverageChart();
    }, 5000);

    window.addEventListener('unload', () => {
        clearInterval(intervalId);
    });
}

document.addEventListener('DOMContentLoaded', initializeDashboard);
