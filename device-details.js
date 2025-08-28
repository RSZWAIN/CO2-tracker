console.log('device-details.js loaded successfully');

const mockDevices = [
    { id: 'dev001', name: 'Kathmandu-Koteshwor', lat: 27.6713, lon: 85.3563, status: 'Online', battery: 85, imageUrl: 'Koteshwar_(towards_airport).jpg', vehicles: [
        { type: 'Truck', regNumber: 'BAG 1234', co2Contribution: 150 },
        { type: 'Bus', regNumber: 'BAG 5678', co2Contribution: 120 }
    ] },
    { id: 'dev002', name: 'Kathmandu-Thamel', lat: 27.7161, lon: 85.3138, status: 'Online', battery: 92, imageUrl: 'thamel-kathmandu.jpg', vehicles: [
        { type: 'Car', regNumber: 'BAG 9012', co2Contribution: 80 }
    ] },
    { id: 'dev003', name: 'Lalitpur-Ringroad', lat: 27.6543, lon: 85.3153, status: 'Offline', battery: 20, imageUrl: 'Ringroad.jpg', vehicles: [] },
    { id: 'dev004', name: 'Kathmandu-Maitighar', lat: 27.6970, lon: 85.3182, status: 'Online', battery: 80, imageUrl: 'Maitighar.jpg', vehicles: [
        { type: 'Motorcycle', regNumber: 'BAG 3456', co2Contribution: 50 },
        { type: 'Van', regNumber: 'BAG 7890', co2Contribution: 100 }
    ] }
];

function getDeviceIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const deviceId = params.get('id');
    console.log('URL Device ID:', deviceId || 'None provided');
    return deviceId;
}

function getMockRealtimeCO2(deviceId) {
    console.log('Generating CO2 for device:', deviceId);
    let baseCO2 = 400;
    if (deviceId === 'dev001') baseCO2 = 800;
    else if (deviceId === 'dev002') baseCO2 = 550;
    else if (deviceId === 'dev004') baseCO2 = 750;
    else if (deviceId === 'dev003') baseCO2 = 450;
    
    let co2 = Math.round(baseCO2 + (Math.random() * 200 - 100));
    return Math.max(300, Math.min(2000, co2));
}

function getMockHistoricalCO2(deviceId, days = 7) {
    console.log('Generating historical CO2 for device:', deviceId);
    const labels = [];
    const data = [];
    let baseCO2 = deviceId === 'dev001' ? 800 : deviceId === 'dev002' ? 550 : deviceId === 'dev004' ? 750 : 450;

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        let co2 = Math.round(baseCO2 + (Math.random() * 100 - 50));
        data.push(Math.max(300, Math.min(1500, co2)));
    }
    return { labels, data };
}

function renderDeviceDetails(device) {
    console.log('renderDeviceDetails called with device:', device);
    const elements = {
        name: document.getElementById('device-name'),
        id: document.getElementById('device-id'),
        status: document.getElementById('device-status'),
        battery: document.getElementById('device-battery'),
        location: document.getElementById('device-location'),
        image: document.getElementById('device-image'),
        error: document.getElementById('error-message')
    };

    Object.entries(elements).forEach(([key, element]) => {
        if (!element) {
            console.error(`Error: Element with ID "device-${key}" not found`);
        } else {
            console.log(`Found element: device-${key}`);
        }
    });

    if (!device || !elements.name || !elements.id) {
        console.error('Error: Invalid device data or missing critical elements');
        if (elements.error) {
            elements.error.textContent = 'Error: Unable to load device data';
            elements.error.style.display = 'block';
        }
        if (elements.name) elements.name.textContent = 'N/A';
        if (elements.id) elements.id.textContent = 'N/A';
        if (elements.status) {
            elements.status.textContent = 'N/A';
            elements.status.className = 'device-status';
        }
        if (elements.battery) elements.battery.textContent = 'N/A';
        if (elements.location) elements.location.textContent = 'N/A';
        if (elements.image) elements.image.src = './images/placeholder.jpg';
        return;
    }

    elements.name.textContent = device.name || 'N/A';
    elements.id.textContent = device.id || 'N/A';
    elements.status.textContent = device.status || 'N/A';
    elements.status.className = `device-status ${device.status === 'Offline' ? 'offline' : ''}`;
    elements.battery.textContent = device.battery !== undefined ? device.battery : 'N/A';
    elements.location.textContent = device.lat && device.lon ? `Lat: ${device.lat}, Lon: ${device.lon}` : 'N/A';
    elements.image.src = device.imageUrl || './images/placeholder.jpg';
    console.log('Set image src:', elements.image.src);
    if (elements.error) elements.error.style.display = 'none';
}

function updateRealtimeCO2(deviceId) {
    console.log('updateRealtimeCO2 called for device:', deviceId);
    const realtimeDisplayDiv = document.getElementById('realtime-display');
    if (!realtimeDisplayDiv) {
        console.error('Error: Element with ID "realtime-display" not found');
        return;
    }

    if (!deviceId) {
        realtimeDisplayDiv.innerHTML = '<p class="no-data-msg">No device selected</p>';
        console.warn('No device ID provided');
        return;
    }

    const device = mockDevices.find(d => d.id === deviceId);
    if (!device) {
        realtimeDisplayDiv.innerHTML = `<p class="error-msg">Error: Device with ID "${deviceId}" not found</p>`;
        console.error('Device not found for ID:', deviceId);
        return;
    }

    if (device.status === 'Offline') {
        realtimeDisplayDiv.innerHTML = `
            <p>Current CO2 for <strong>${device.name}</strong>:</p>
            <p style="color: var(--danger-color); font-weight: bold;">Device is offline. No real-time data available.</p>
            <button class="view-details-button" onclick="window.location.href='index.html'">Back to Dashboard</button>
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
        <button class="view-details-button" onclick="window.location.href='index.html'">Back to Dashboard</button>
    `;
}

function renderVehicleList(deviceId) {
    console.log('renderVehicleList called for device:', deviceId);
    const vehicleList = document.getElementById('vehicle-list');
    if (!vehicleList) {
        console.error('Error: Element with ID "vehicle-list" not found');
        return;
    }

    const device = mockDevices.find(d => d.id === deviceId);
    if (!device) {
        vehicleList.innerHTML = '<li class="no-vehicles error-msg">Error: Device not found</li>';
        return;
    }

    if (device.status === 'Offline') {
        vehicleList.innerHTML = '<li class="no-vehicles">Device is offline. No vehicle data available</li>';
        return;
    }

    if (!device.vehicles || device.vehicles.length === 0) {
        vehicleList.innerHTML = '<li class="no-vehicles">No high emission vehicles detected</li>';
        return;
    }

    vehicleList.innerHTML = device.vehicles.map(vehicle => `
        <li class="vehicle-item">
            <strong>${vehicle.type}</strong> (Reg: ${vehicle.regNumber}) - ${vehicle.co2Contribution} PPM
        </li>
    `).join('');
}

function renderHistoricalChart(deviceId) {
    console.log('renderHistoricalChart called for device:', deviceId);
    const canvas = document.getElementById('historicalCo2Chart');
    if (!canvas) {
        console.error('Error: Canvas element with ID "historicalCo2Chart" not found');
        return;
    }
    const ctx = canvas.getContext('2d');
    const historicalData = getMockHistoricalCO2(deviceId);
    const device = mockDevices.find(d => d.id === deviceId);

    if (window.co2ChartInstance) {
        window.co2ChartInstance.destroy();
    }

    window.co2ChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: historicalData.labels,
            datasets: [{
                label: `CO2 (PPM) - ${device ? device.name : 'Device'}`,
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
                    title: { display: true, text: 'CO2 Concentration (PPM)', color: 'var(--text-color-dark)', font: { size: 14, weight: '600', family: 'Inter' } },
                    ticks: { color: 'var(--secondary-color)', font: { family: 'Inter' } },
                    grid: { color: 'var(--border-color)' }
                },
                x: {
                    title: { display: true, text: 'Date', color: 'var(--text-color-dark)', font: { size: 14, weight: '600', family: 'Inter' } },
                    ticks: { color: 'var(--secondary-color)', font: { family: 'Inter' } },
                    grid: { color: 'var(--border-color)' }
                }
            },
            plugins: {
                legend: { display: true, position: 'top', labels: { color: 'var(--text-color-dark)', font: { family: 'Inter' } } },
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
                    titleFont: { size: 14, weight: 'bold', family: 'Inter' },
                    bodyFont: { size: 12, family: 'Inter' },
                    padding: 10,
                    callbacks: { label: context => `${context.dataset.label}: ${context.raw} PPM` }
                }
            }
        }
    });
}

function initializeDetailMap(deviceId) {
    console.log('initializeDetailMap called for device:', deviceId);
    const mapElement = document.getElementById('detail-map');
    if (!mapElement) {
        console.error('Error: Map element with ID "detail-map" not found');
        return;
    }

    const device = mockDevices.find(d => d.id === deviceId);
    if (!device) {
        mapElement.innerHTML = '<p class="error-msg">Device not found</p>';
        return;
    }

    const map = L.map('detail-map').setView([device.lat, device.lon], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const icon = device.status === 'Offline' ? L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    }) : L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    });

    L.marker([device.lat, device.lon], { icon: icon })
        .addTo(map)
        .bindPopup(`<b>${device.name}</b><br>ID: ${device.id}<br>Status: ${device.status}<br>Battery: ${device.battery}%`)
        .openPopup();
}

function initializeDeviceDetails() {
    console.log('initializeDeviceDetails started');
    const deviceId = getDeviceIdFromUrl();
    const device = mockDevices.find(d => d.id === deviceId) || mockDevices[0];
    console.log('Selected device:', device);

    if (!device) {
        console.error('Error: No valid device found');
        const deviceInfo = document.getElementById('device-info');
        if (deviceInfo) {
            deviceInfo.innerHTML = '<p class="error-msg">Error: No device data available</p>';
        }
        renderDeviceDetails({});
        return;
    }

    renderDeviceDetails(device);
    updateRealtimeCO2(deviceId);
    renderVehicleList(deviceId);
    renderHistoricalChart(deviceId);
    initializeDetailMap(deviceId);

    setInterval(() => updateRealtimeCO2(deviceId), 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, calling initializeDeviceDetails');
    initializeDeviceDetails();
});