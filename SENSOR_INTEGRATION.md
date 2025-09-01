# Sensor Integration Guide

This document provides guidance for integrating real sensors with the Ka-Eco Urban Wetlands Monitoring System.

## Overview

The system now supports sensor device management and real-time data ingestion. Sensors can send data via HTTP API endpoints.

## Sensor Management

### Registering Sensors

Before sensors can send data, they must be registered in the system:

```http
POST /sensors/
Content-Type: application/json

{
  "wetland_id": 1,
  "sensor_id": "UNIQUE_SENSOR_ID",
  "name": "Sensor Name",
  "type": "multi-parameter",
  "status": "active",
  "battery_level": 100.0,
  "firmware_version": "1.0.0"
}
```

### Sensor Types

- `temperature`: Temperature sensor
- `ph`: pH level sensor
- `dissolved_oxygen`: Dissolved oxygen sensor
- `turbidity`: Turbidity sensor
- `multi-parameter`: Combined sensor measuring multiple parameters

## Data Ingestion

### Sending Sensor Data

Sensors can send data using the following endpoint:

```http
POST /sensors/data
Content-Type: application/json

{
  "sensor_id": 1,
  "wetland_id": 1,
  "timestamp": "2024-01-01T12:00:00Z",
  "temperature": 22.5,
  "ph": 7.2,
  "dissolved_oxygen": 8.5,
  "turbidity": 5.0
}
```

### Heartbeat Monitoring

Sensors should send periodic heartbeat signals:

```http
POST /sensors/{sensor_id}/heartbeat
```

This updates the `last_seen` timestamp for the sensor.

## API Endpoints

### Sensor Management
- `GET /sensors/` - List all sensors
- `POST /sensors/` - Register new sensor
- `GET /sensors/{sensor_id}` - Get sensor details
- `PUT /sensors/{sensor_id}` - Update sensor
- `DELETE /sensors/{sensor_id}` - Remove sensor
- `GET /sensors/wetland/{wetland_id}` - Get sensors for wetland

### Data Ingestion
- `POST /sensors/data` - Ingest sensor data
- `POST /sensors/{sensor_id}/heartbeat` - Sensor heartbeat

## Example Sensor Implementation

### Python Example

```python
import requests
import time
from datetime import datetime

API_BASE_URL = "http://localhost:8000"

def register_sensor(sensor_data):
    response = requests.post(f"{API_BASE_URL}/sensors/", json=sensor_data)
    return response.json()

def send_sensor_data(sensor_id, data):
    payload = {
        "sensor_id": sensor_id,
        "wetland_id": 1,  # Replace with actual wetland ID
        "timestamp": datetime.utcnow().isoformat(),
        **data
    }
    response = requests.post(f"{API_BASE_URL}/sensors/data", json=payload)
    return response.json()

def send_heartbeat(sensor_id):
    response = requests.post(f"{API_BASE_URL}/sensors/{sensor_id}/heartbeat")
    return response.json()

# Example usage
if __name__ == "__main__":
    # Register sensor
    sensor_info = {
        "wetland_id": 1,
        "sensor_id": "RASPBERRY_PI_SENSOR_001",
        "name": "Raspberry Pi Multi-Sensor",
        "type": "multi-parameter",
        "battery_level": 95.0,
        "firmware_version": "1.0.0"
    }

    sensor = register_sensor(sensor_info)
    sensor_id = sensor["sensor_id"]

    # Send data periodically
    while True:
        # Read sensor data (replace with actual sensor reading code)
        data = {
            "temperature": 22.5,
            "ph": 7.2,
            "dissolved_oxygen": 8.5,
            "turbidity": 5.0
        }

        send_sensor_data(sensor_id, data)
        send_heartbeat(sensor_id)

        time.sleep(300)  # Send data every 5 minutes
```

### Arduino/ESP32 Example

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "your_wifi_ssid";
const char* password = "your_wifi_password";
const char* serverUrl = "http://your-server-ip:8000";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
  }
  Serial.println("Connected to WiFi");
}

void sendSensorData() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl + String("/sensors/data"));
    http.addHeader("Content-Type", "application/json");

    // Create JSON payload
    DynamicJsonDocument doc(1024);
    doc["sensor_id"] = "ESP32_SENSOR_001";
    doc["wetland_id"] = 1;
    doc["timestamp"] = "2024-01-01T12:00:00Z"; // Use NTP for real timestamp
    doc["temperature"] = 22.5;
    doc["ph"] = 7.2;
    doc["dissolved_oxygen"] = 8.5;
    doc["turbidity"] = 5.0;

    String jsonString;
    serializeJson(doc, jsonString);

    int httpResponseCode = http.POST(jsonString);

    if (httpResponseCode > 0) {
      Serial.println("Data sent successfully");
    } else {
      Serial.println("Error sending data");
    }

    http.end();
  }
}

void loop() {
  sendSensorData();
  delay(300000); // 5 minutes
}
```

## Security Considerations

1. **API Authentication**: For production, implement proper authentication for sensor endpoints
2. **Data Validation**: Validate sensor data ranges and formats
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **HTTPS**: Use HTTPS for secure data transmission
5. **Sensor Authentication**: Implement sensor-specific authentication tokens

## Monitoring and Maintenance

- Monitor sensor battery levels
- Track sensor status and last seen timestamps
- Implement alerts for offline sensors
- Regular firmware updates
- Calibration tracking and scheduling

## Troubleshooting

### Common Issues

1. **Sensor not appearing in system**: Ensure sensor is properly registered
2. **Data not being accepted**: Check data format and required fields
3. **Connection issues**: Verify network connectivity and API endpoint URLs
4. **Timestamp issues**: Ensure timestamps are in ISO format with timezone

### Debug Endpoints

- `GET /sensors/` - Check registered sensors
- `GET /sensors/{sensor_id}` - Check specific sensor details
- `GET /dashboard/sensor-data` - Check recent sensor data