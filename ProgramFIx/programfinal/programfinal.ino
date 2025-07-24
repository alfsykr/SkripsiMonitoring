#include <IRremote.h>
#include <ModbusMaster.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <time.h>
#include <ESPmDNS.h>
#include <ArduinoJson.h>  // TAMBAHAN: Library untuk parsing JSON yang lebih baik

// Function declarations
void toggleAC(String source = "MANUAL");
void temperatureUp(String source = "MANUAL");
void temperatureDown(String source = "MANUAL");
void readTemperatureData();
void updateDisplay();
void handleSerialCommands();
void printSystemStatus();
void findPRTGServer();
bool testPRTGConnection(String url);
void sendToPRTG(float temp, float hum);
void sendToFirebase(float temp, float hum);
void checkFirebaseCommands();
void clearFirebaseCommand();
void updateACStatusToFirebase();
String getTemperatureStatus(float temp);
void drawTemperatureIcon(float temp);
void showCommandOnOLED(String command, String source);
void drawACStatusIcon();

// ===== OLED Setup =====
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ===== IR Transmitter Setup =====
const int IR_LED_PIN = 14; // Pin GPIO 14 untuk transmitter IR
const int LED_FEEDBACK_PIN = 2; // Pin LED onboard ESP32

// ===== WiFi Setup =====
const char* ssid = "Redmi 10C";
const char* password = "123456789";

// ===== PRTG Setup =====
const char* prtgHostname = "DESKTOP-AO8QQ35.local";
String prtgHost = "";
const char* prtgPort = "5051";
const char* token = "151946EC-E3D2-4D9F-8762-C4F86CE3FA90";

// ===== Smart IP Range =====
int commonIPs[] = {60, 50, 100, 1, 2, 10, 20, 30, 40, 70, 80, 90, 110, 120};
int numCommonIPs = sizeof(commonIPs) / sizeof(commonIPs[0]);

// ===== Firebase Setup =====
const char* firebaseHost = "https://monitoring-suhu-c2b68-default-rtdb.asia-southeast1.firebasedatabase.app";
const char* firebasePath = "/sensor.json";
const char* firebaseCommandPath = "/ac_command.json";
const char* firebaseStatusPath = "/ac_status.json";

// ===== AC Command Variables - IMPROVED =====
unsigned long lastCommandCheck = 0;
const unsigned long commandCheckInterval = 1000; // UBAH: Check setiap 1 detik untuk stabilitas
unsigned long long lastCommandTimestamp = 0; // UBAH: Gunakan unsigned long long untuk timestamp besar
int consecutiveErrors = 0; // TAMBAHAN: Counter untuk error berturut-turut
const int maxConsecutiveErrors = 5; // TAMBAHAN: Max error sebelum reset

// ===== Modbus Setup =====
ModbusMaster node;

// ===== Network Discovery Variables =====
IPAddress gatewayIP;
String networkBase;

// ===== Temperature Monitoring Variables =====
float currentTemp = 0.0;
float currentHum = 0.0;
bool acOn = false;
unsigned long lastTempCheck = 0;
unsigned long lastDataSend = 0;
unsigned long lastStatusUpdate = 0;
const unsigned long tempCheckInterval = 5000; // Check every 5 seconds
const unsigned long dataSendInterval = 60000; // Send data every 60 seconds (1 minute)
const unsigned long statusUpdateInterval = 3000; // UBAH: Update status setiap 3 detik

// ===== Display Variables =====
float lastDisplayTemp = -999.0; // Track last displayed temperature
float lastDisplayHum = -999.0;  // Track last displayed humidity
String lastCommand = ""; // Track last command for display
String lastCommandSource = ""; // Track command source
unsigned long lastCommandTime = 0;
unsigned long commandDisplayDuration = 4000; // UBAH: Show command for 4 seconds

// Raw data untuk tombol remote AC
uint16_t rawDataOnOff[131] = {
  3450, 1750, 450, 450, 400, 1300, 450, 450, 450, 400, 
  450, 450, 400, 450, 400, 500, 400, 450, 400, 450, 
  450, 450, 400, 450, 400, 450, 450, 450, 400, 1300, 
  450, 450, 450, 400, 450, 450, 400, 500, 400, 450, 
  400, 450, 400, 450, 450, 1300, 450, 1300, 450, 1300, 
  450, 400, 400, 450, 450, 1300, 450, 450, 400, 450, 
  400, 450, 450, 450, 400, 500, 400, 450, 400, 450, 
  400, 500, 400, 450, 400, 450, 400, 500, 400, 450, 
  400, 450, 450, 450, 400, 450, 450, 450, 400, 450, 
  400, 500, 400, 450, 450, 400, 400, 500, 400, 450, 
  400, 450, 450, 450, 350, 500, 400, 450, 450, 450, 
  400, 450, 450, 450, 400, 450, 400, 1350, 450, 1250, 
  450, 450, 450, 400, 450, 450, 400, 450, 400, 500, 
  400
};

uint16_t rawDataTempUp[131] = {
  3450, 1750, 600, 250, 500, 1300, 450, 400, 450, 400, 
  450, 450, 450, 400, 450, 450, 400, 450, 450, 400, 
  450, 450, 400, 450, 450, 450, 400, 450, 400, 1350, 
  500, 300, 550, 400, 450, 400, 450, 400, 450, 450, 
  400, 450, 450, 450, 400, 1300, 500, 1250, 500, 1250, 
  450, 400, 450, 450, 450, 1250, 500, 400, 450, 400, 
  450, 450, 450, 400, 400, 450, 450, 450, 400, 450, 
  450, 450, 400, 450, 400, 450, 450, 450, 400, 450, 
  400, 500, 350, 500, 400, 450, 450, 450, 400, 450, 
  400, 500, 350, 500, 400, 450, 400, 500, 400, 500, 
  350, 450, 400, 500, 400, 450, 400, 500, 400, 450, 
  400, 450, 400, 500, 400, 450, 400, 1350, 450, 1300, 
  450, 400, 450, 400, 500, 400, 400, 450, 450, 450, 
  400
};

uint16_t rawDataTempDown[131] = {
  3450, 1750, 450, 400, 400, 1350, 450, 450, 400, 450, 
  450, 400, 400, 500, 400, 450, 400, 500, 400, 450, 
  400, 450, 400, 500, 400, 450, 400, 500, 400, 1300, 
  400, 500, 400, 450, 400, 500, 350, 500, 400, 450, 
  400, 500, 400, 450, 400, 1350, 400, 1350, 400, 1300, 
  450, 450, 400, 450, 400, 1350, 400, 450, 400, 500, 
  400, 450, 400, 500, 350, 500, 400, 450, 400, 500, 
  400, 450, 400, 500, 350, 500, 400, 450, 400, 500, 
  400, 450, 400, 500, 350, 500, 400, 450, 400, 500, 
  400, 450, 400, 450, 400, 500, 400, 450, 400, 500, 
  400, 450, 400, 450, 400, 500, 400, 450, 400, 500, 
  350, 500, 400, 450, 400, 500, 400, 1300, 500, 1250, 
  450, 450, 400, 450, 400, 500, 350, 500, 400, 450, 
  400
};

void setup() {
  Serial.begin(115200);
  Serial1.begin(9600, SERIAL_8N1, 17, 16);

  // OLED initialization
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("OLED tidak ditemukan"));
    while (1);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Smart AC System v2.0");
  display.setCursor(0, 10);
  display.println("Inisialisasi...");
  display.display();

  // IR transmitter initialization
  IrSender.begin(IR_LED_PIN, true, LED_FEEDBACK_PIN);

  // Modbus slave ID
  node.begin(1, Serial1);

  // WiFi connection
  WiFi.begin(ssid, password);
  Serial.print("Menghubungkan ke WiFi");
  display.setCursor(0, 20);
  display.print("WiFi...");
  display.display();

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Terhubung!");
  Serial.print("IP ESP32: ");
  Serial.println(WiFi.localIP());
  
  display.setCursor(0, 30);
  display.print("WiFi Terhubung!");
  display.display();
  delay(1000);

  // Network discovery
  gatewayIP = WiFi.gatewayIP();
  IPAddress localIP = WiFi.localIP();
  networkBase = String(localIP[0]) + "." + String(localIP[1]) + "." + String(localIP[2]) + ".";
  
  Serial.println("Gateway IP: " + gatewayIP.toString());
  Serial.println("Network Base: " + networkBase);

  // mDNS initialization
  if (!MDNS.begin("esp32-smart-ac")) {
    Serial.println("Error setting up MDNS responder!");
  }

  // Find PRTG server
  findPRTGServer();

  // NTP time initialization
  configTime(7 * 3600, 0, "pool.ntp.org");
  struct tm timeinfo;
  while (!getLocalTime(&timeinfo)) {
    Serial.println("Menunggu sinkronisasi waktu...");
    delay(500);
  }

  Serial.println("\n========================================");
  Serial.println("Smart AC Control & Temperature Monitor v2.0");
  Serial.println("IR Transmitter Pin: GPIO 14");
  Serial.println("Enhanced Firebase Communication");
  Serial.println("========================================");
  Serial.println("Perintah Serial Monitor:");
  Serial.println("1: Toggle AC ON/OFF");
  Serial.println("2: Temperature UP");
  Serial.println("3: Temperature DOWN");
  Serial.println("6: System Status");
  Serial.println("========================================");
  Serial.println("System Ready - Checking Firebase every 1 second!");

  lastTempCheck = millis();
  lastDataSend = millis();
  
  // Initial display
  updateDisplay();
  
  // Initial status update to Firebase
  updateACStatusToFirebase();
}

void loop() {
  unsigned long currentMillis = millis();
  
  // Handle serial commands
  handleSerialCommands();
  
  // Check for commands from Firebase - PRIORITAS UTAMA
  if (currentMillis - lastCommandCheck >= commandCheckInterval) {
    checkFirebaseCommands();
    lastCommandCheck = currentMillis;
  }
  
  // Check temperature regularly and update display if changed
  if (currentMillis - lastTempCheck >= tempCheckInterval) {
    readTemperatureData();
    
    // Update display only if temperature or humidity changed
    if (currentTemp != lastDisplayTemp || currentHum != lastDisplayHum) {
      updateDisplay();
      lastDisplayTemp = currentTemp;
      lastDisplayHum = currentHum;
    }
    
    lastTempCheck = currentMillis;
  }
  
  // Send data to cloud services regularly
  if (currentMillis - lastDataSend >= dataSendInterval) {
    if (currentTemp != 0.0) { // Only send if we have valid data
      Serial.println("=== Sending data to cloud services ===");
      if (prtgHost != "") {
        sendToPRTG(currentTemp, currentHum);
      } else {
        Serial.println("PRTG server belum ditemukan, mencoba lagi...");
        findPRTGServer();
      }
      sendToFirebase(currentTemp, currentHum);
      Serial.println("=== Data sent ===");
    }
    lastDataSend = currentMillis;
  }
  
  // Update AC status to Firebase
  if (currentMillis - lastStatusUpdate >= statusUpdateInterval) {
    updateACStatusToFirebase();
    lastStatusUpdate = currentMillis;
  }
  
  delay(100);
}

void handleSerialCommands() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    
    if (cmd == "1") {
      toggleAC("MANUAL");
    } else if (cmd == "2") {
      temperatureUp("MANUAL");
    } else if (cmd == "3") {
      temperatureDown("MANUAL");
    } else if (cmd == "6") {
      printSystemStatus();
    } else if (cmd != "") {
      Serial.println("Perintah tidak valid! Gunakan:");
      Serial.println("1: Toggle AC, 2: Temp UP, 3: Temp DOWN, 6: Status");
    }
  }
}

void toggleAC(String source) {
  Serial.println(">>> Mengirim sinyal ON/OFF ke AC... (Source: " + source + ")");
  IrSender.sendRaw(rawDataOnOff, 131, 38);
  acOn = !acOn;
  Serial.println(">>> AC " + String(acOn ? "ON" : "OFF"));
  
  // Update command info for display
  lastCommand = "AC " + String(acOn ? "ON" : "OFF"); 
  lastCommandSource = source;
  lastCommandTime = millis();
  
  // Show command immediately on OLED
  showCommandOnOLED(lastCommand, source);
  
  delay(500);
}

void temperatureUp(String source) {
  Serial.println(">>> Mengirim sinyal SUHU NAIK ke AC... (Source: " + source + ")");
  IrSender.sendRaw(rawDataTempUp, 131, 38);
  Serial.println(">>> Sinyal SUHU NAIK terkirim!");
  
  // Update command info for display
  lastCommand = "TEMP UP";
  lastCommandSource = source;
  lastCommandTime = millis();
  
  // Show command immediately on OLED
  showCommandOnOLED(lastCommand, source);
  
  delay(500);
}

void temperatureDown(String source) {
  Serial.println(">>> Mengirim sinyal SUHU TURUN ke AC... (Source: " + source + ")");
  IrSender.sendRaw(rawDataTempDown, 131, 38);
  Serial.println(">>> Sinyal SUHU TURUN terkirim!");
  
  // Update command info for display
  lastCommand = "TEMP DOWN";
  lastCommandSource = source;
  lastCommandTime = millis();
  
  // Show command immediately on OLED
  showCommandOnOLED(lastCommand, source);
  
  delay(500);
}

void showCommandOnOLED(String command, String source) {
  display.clearDisplay();
  
  // Header
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("COMMAND EXECUTED");
  
  // Draw line separator
  display.drawLine(0, 10, 128, 10, SSD1306_WHITE);
  
  // Command
  display.setTextSize(2);
  display.setCursor(0, 15);
  display.println(command);
  
  // Source
  display.setTextSize(1);
  display.setCursor(0, 35);
  display.println("Source: " + source);
  
  // AC Status dengan icon
  display.setCursor(0, 45);
  display.println("AC Status: " + String(acOn ? "ON" : "OFF"));
  
  // Draw AC status icon
  drawACStatusIcon();
  
  // Current temp & humidity (jika tersedia)
  if (currentTemp != 0.0) {
    display.setTextSize(1);
    display.setCursor(0, 55);
    display.printf("%.1fC %.1f%%", currentTemp, currentHum);
  }
  
  display.display();
}

void drawACStatusIcon() {
  // AC status icon at top right corner
  int x = 110, y = 2;
  if (acOn) {
    // AC ON - filled rectangle with animation dots
    display.fillRect(x, y, 16, 8, SSD1306_WHITE);
    display.setTextColor(SSD1306_BLACK);
    display.setCursor(x + 2, y + 1);
    display.print("ON");
    display.setTextColor(SSD1306_WHITE);
    
    // Animation dots for running AC
    for (int i = 0; i < 3; i++) {
      display.fillCircle(x + 2 + (i * 4), y + 12, 1, SSD1306_WHITE);
    }
  } else {
    // AC OFF - empty rectangle
    display.drawRect(x, y, 16, 8, SSD1306_WHITE);
    display.setCursor(x + 1, y + 1);
    display.print("OFF");
  }
}

void readTemperatureData() {
  Serial.print("Reading sensor data... ");
  uint8_t result = node.readInputRegisters(0x0001, 2);
  
  if (result == node.ku8MBSuccess) {
    currentTemp = node.getResponseBuffer(0) / 10.0;
    currentHum = node.getResponseBuffer(1) / 10.0;
    
    Serial.printf("Temperature: %.1f°C | Humidity: %.1f%%RH\n", currentTemp, currentHum);
  } else {
    Serial.print("Modbus Error. Code: 0x");
    Serial.println(result, HEX);
    currentTemp = 0.0;
    currentHum = 0.0;
  }
}

String getTemperatureStatus(float temp) {
  if (temp >= 20.0 && temp < 23.0) {
    return "DINGIN";
  } else if (temp >= 23.0 && temp < 28.0) {
    return "NORMAL";
  } else if (temp >= 28.0 && temp <= 35.0) {
    return "PANAS";
  } else if (temp < 20.0) {
    return "SANGAT DINGIN";
  } else {
    return "SANGAT PANAS";
  }
}

void drawTemperatureIcon(float temp) {
  // Temperature icon position: x=100, y=15, size 16x16
  if (temp >= 28.0) {
    // Hot temperature - sun icon
    display.drawCircle(108, 23, 6, SSD1306_WHITE);
    display.fillCircle(108, 23, 3, SSD1306_WHITE);
    // Sun rays
    display.drawLine(108, 10, 108, 14, SSD1306_WHITE);
    display.drawLine(108, 32, 108, 36, SSD1306_WHITE);
    display.drawLine(95, 23, 99, 23, SSD1306_WHITE);
    display.drawLine(117, 23, 121, 23, SSD1306_WHITE);
  } else if (temp >= 23.0 && temp < 28.0) {
    // Normal temperature - cloud icon
    display.drawCircle(102, 25, 4, SSD1306_WHITE);
    display.drawCircle(108, 23, 5, SSD1306_WHITE);
    display.drawCircle(114, 25, 4, SSD1306_WHITE);
    display.drawLine(98, 25, 118, 25, SSD1306_WHITE);
  } else {
    // Cold temperature - snowflake icon
    display.drawLine(108, 15, 108, 31, SSD1306_WHITE);
    display.drawLine(101, 23, 115, 23, SSD1306_WHITE);
    display.drawLine(103, 17, 113, 29, SSD1306_WHITE);
    display.drawLine(103, 29, 113, 17, SSD1306_WHITE);
    // Center dot
    display.fillCircle(108, 23, 1, SSD1306_WHITE);
  }
}

void updateDisplay() {
  // Show command for specified duration, otherwise show normal display
  if (lastCommand != "" && (millis() - lastCommandTime) < commandDisplayDuration) {
    // Command is still being displayed, don't overwrite
    return;
  }
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  // Title with AC status
  display.setCursor(0, 0);
  display.println("TEMP MONITOR v2");
  
  // Draw AC status icon
  drawACStatusIcon();
  
  // Temperature - Large display with icon
  display.setTextSize(2);
  display.setCursor(0, 15);
  if (currentTemp != 0.0) {
    display.printf("%.1f", currentTemp);
    display.setTextSize(1);
    display.print(" C");
    
    // Draw temperature icon
    drawTemperatureIcon(currentTemp);
  } else {
    display.setTextSize(1);
    display.println("-- C");
  }
  
  // Temperature status
  display.setTextSize(1);
  display.setCursor(0, 32);
  if (currentTemp != 0.0) {
    display.println(getTemperatureStatus(currentTemp));
  }
  
  // Humidity - Large display
  display.setTextSize(2);
  display.setCursor(0, 42);
  if (currentHum != 0.0) {
    display.printf("%.1f", currentHum);
    display.setTextSize(1);
    display.print(" %RH");
  } else {
    display.setTextSize(1);
    display.println("-- %");
  }
  
  // Connection status indicator
  display.setTextSize(1);
  display.setCursor(85, 55);
  if (WiFi.status() == WL_CONNECTED) {
    display.print("WiFi OK");
  } else {
    display.print("No WiFi");
  }
  
  display.display();
}

void printSystemStatus() {
  Serial.println("\n========== SYSTEM STATUS v2.0 ==========");
  Serial.println("Current Temperature: " + String(currentTemp) + "°C");
  Serial.println("Current Humidity: " + String(currentHum) + "%");
  Serial.println("AC Status: " + String(acOn ? "ON" : "OFF"));
  Serial.println("Control Mode: REMOTE & MANUAL");
  Serial.println("WiFi Status: " + String(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected"));
  Serial.println("PRTG Server: " + String(prtgHost != "" ? prtgHost : "Not Found"));
  Serial.println("Firebase: " + String(firebaseHost));
  Serial.println("Command Check Interval: " + String(commandCheckInterval) + " ms");
  Serial.println("Data Send Interval: " + String(dataSendInterval/1000) + " seconds");
  Serial.println("System Uptime: " + String(millis() / 60000) + " minutes");
  Serial.println("Last Command: " + lastCommand + " from " + lastCommandSource);
  Serial.println("Last Command Timestamp: " + String((unsigned long)lastCommandTimestamp));
  Serial.println("Consecutive Errors: " + String(consecutiveErrors));
  Serial.println("Firebase Command Path: " + String(firebaseCommandPath));
  Serial.println("Firebase Status Path: " + String(firebaseStatusPath));
  Serial.println("==========================================\n");
}

void findPRTGServer() {
  Serial.println("Mencari PRTG server...");
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Mencari PRTG...");
  display.display();

  // Method 1: mDNS
  if (strlen(prtgHostname) > 0) {
    Serial.println("Mencoba mDNS untuk: " + String(prtgHostname));
    display.setCursor(0, 10);
    display.println("mDNS test...");
    display.display();
    
    IPAddress serverIP = MDNS.queryHost(prtgHostname);
    if (serverIP != INADDR_NONE) {
      prtgHost = "https://" + serverIP.toString() + ":" + prtgPort;
      Serial.println("PRTG ditemukan via mDNS: " + prtgHost);
      display.setCursor(0, 20);
      display.println("mDNS: " + serverIP.toString());
      display.display();
      delay(2000);
      return;
    }
  }

  // Method 2: Gateway test
  String gatewayTest = "https://" + gatewayIP.toString() + ":" + prtgPort;
  Serial.println("Testing gateway: " + gatewayIP.toString());
  display.setCursor(0, 20);
  display.println("Test GW: " + gatewayIP.toString());
  display.display();
  
  if (testPRTGConnection(gatewayTest)) {
    prtgHost = gatewayTest;
    Serial.println("PRTG ditemukan di gateway: " + prtgHost);
    display.setCursor(0, 30);
    display.println("Found at Gateway!");
    display.display();
    delay(2000);
    return;
  }

  // Method 3: Smart scan
  Serial.println("Smart scan untuk IP umum...");
  for (int i = 0; i < numCommonIPs; i++) {
    String testIP = networkBase + String(commonIPs[i]);
    String testURL = "https://" + testIP + ":" + prtgPort;
    
    Serial.print("Testing priority IP: " + testIP + " ... ");
    display.setCursor(0, 30);
    display.printf("Test: %s", testIP.c_str());
    display.display();
    
    if (testPRTGConnection(testURL)) {
      prtgHost = testURL;
      Serial.println("PRTG server ditemukan: " + prtgHost);
      display.setCursor(0, 40);
      display.println("Found: " + testIP);
      display.display();
      delay(2000);
      return;
    }
    Serial.println("No");
  }
  
  Serial.println("PRTG server tidak ditemukan!");
  display.setCursor(0, 50);
  display.println("PRTG not found!");
  display.display();
  delay(2000);
}

bool testPRTGConnection(String url) {
  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(1000);
  
  HTTPClient https;
  if (https.begin(client, url + "/" + token)) {
    https.setTimeout(1000);
    int httpCode = https.GET();
    https.end();
    
    if (httpCode > 0 && httpCode != -1 && httpCode != -11) {
      return true;
    }
  }
  return false;
}

void sendToPRTG(float temp, float hum) {
  if (WiFi.status() == WL_CONNECTED && prtgHost != "") {
    WiFiClientSecure client;
    client.setInsecure();

    HTTPClient https;
    String url = prtgHost + "/" + token;
    
    Serial.println("Sending to PRTG: " + url);

    if (https.begin(client, url)) {
      https.addHeader("Content-Type", "application/json");
      
      // Kirim nilai bulat (tanpa desimal) untuk PRTG
      int tempValue = (int)temp;
      int humValue = (int)hum;
      
      String jsonPayload = "{\"prtg\":{\"result\":[";
      jsonPayload += "{\"channel\":\"Temperature\",\"value\":" + String(tempValue) + "},";
      jsonPayload += "{\"channel\":\"Humidity\",\"value\":" + String(humValue) + "}";
      jsonPayload += "]}}";

      Serial.println("PRTG JSON Payload (Rounded Values):");
      Serial.println(jsonPayload);

      int httpCode = https.POST(jsonPayload);
      
      if (httpCode > 0) {
        Serial.printf("✓ PRTG Response code: %d\n", httpCode);
        String response = https.getString();
        if (response.length() > 0) {
          Serial.println("PRTG Response: " + response);
        }
      } else {
        Serial.printf("✗ Failed to send to PRTG: %s\n", https.errorToString(httpCode).c_str());
        prtgHost = ""; // Reset to trigger re-discovery
      }
      https.end();
    } else {
      Serial.println("✗ HTTPS connection failed to PRTG");
    }
  } else {
    Serial.println("✗ WiFi not connected or PRTG server not found");
  }
}

void sendToFirebase(float temp, float hum) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure();

    HTTPClient https;
    String url = String(firebaseHost) + String(firebasePath);
    
    Serial.println("Sending to Firebase: " + url);

    struct tm timeinfo;
    char timeString[6] = "00:00";
    if (getLocalTime(&timeinfo)) {
      strftime(timeString, sizeof(timeString), "%H:%M", &timeinfo);
    }

    // Kirim dengan format yang diminta: humidity, temperature, time (dengan desimal untuk Firebase)
    String jsonPayload = "{";
    jsonPayload += "\"humidity\":" + String(hum, 1) + ",";
    jsonPayload += "\"temperature\":" + String(temp, 1) + ",";
    jsonPayload += "\"time\":\"" + String(timeString) + "\"";
    jsonPayload += "}";

    Serial.println("Firebase JSON Payload:");
    Serial.println(jsonPayload);

    if (https.begin(client, url)) {
      https.addHeader("Content-Type", "application/json");
      int httpCode = https.POST(jsonPayload);
      if (httpCode > 0) {
        Serial.printf("✓ Firebase Response code: %d\n", httpCode);
        String response = https.getString();
        if (response.length() > 0) {
          Serial.println("Firebase Response: " + response);
        }
      } else {
        Serial.printf("✗ Failed to send to Firebase: %s\n", https.errorToString(httpCode).c_str());
      }
      https.end();
    } else {
      Serial.println("✗ HTTPS connection failed to Firebase");
    }
  } else {
    Serial.println("✗ WiFi not connected for Firebase");
  }
}

// ===== FUNGSI FIREBASE YANG DIPERBAIKI - MENGGUNAKAN ArduinoJson =====
void checkFirebaseCommands() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(5000); // UBAH: Timeout 5 detik untuk stabilitas

  HTTPClient https;
  String url = String(firebaseHost) + String(firebaseCommandPath);
  
  if (!https.begin(client, url)) {
    Serial.println("✗ Failed to begin HTTPS connection to Firebase");
    consecutiveErrors++;
    return;
  }

  https.setTimeout(5000);
  https.addHeader("Accept", "application/json");

  int httpCode = https.GET();
  
  if (httpCode > 0) {
    String payload = https.getString();
    
    Serial.println("=== FIREBASE COMMAND CHECK ===");
    Serial.println("HTTP Code: " + String(httpCode));
    Serial.println("Payload: " + payload);
    
    // Reset error counter on successful connection
    consecutiveErrors = 0;
    
    // PARSING JSON MENGGUNAKAN ArduinoJson - LEBIH ROBUST
    if (payload.length() > 0 && payload != "null") {
      DynamicJsonDocument doc(1024);
      DeserializationError error = deserializeJson(doc, payload);
      
      if (error) {
        Serial.println("✗ JSON parsing failed: " + String(error.c_str()));
      } else {
        // Extract data dari JSON
        if (doc.containsKey("command") && doc.containsKey("timestamp")) {
          int command = doc["command"];
          unsigned long long timestamp = doc["timestamp"];
          String source = doc.containsKey("source") ? doc["source"].as<String>() : "WEB";
          
          Serial.println("Parsed Command: " + String(command));
          Serial.println("Parsed Timestamp: " + String((unsigned long)timestamp));
          Serial.println("Parsed Source: " + source);
          Serial.println("Last Timestamp: " + String((unsigned long)lastCommandTimestamp));
          
          // Only process if this is a new command
          if (timestamp > lastCommandTimestamp && command > 0) {
            lastCommandTimestamp = timestamp;
            
            Serial.println(">>> EXECUTING NEW FIREBASE COMMAND: " + String(command) + " <<<");
            
            // Execute command with immediate feedback
            switch (command) {
              case 1: // Toggle AC power
                Serial.println("Firebase Command: Toggle AC ON/OFF");
                toggleAC(source);
                break;
              case 2: // Temperature up
                Serial.println("Firebase Command: Temperature UP");
                temperatureUp(source);
                break;
              case 3: // Temperature down
                Serial.println("Firebase Command: Temperature DOWN");
                temperatureDown(source);
                break;
              default:
                Serial.println("Unknown Firebase command: " + String(command));
                break;
            }
            
            // Immediately update status after command execution
            delay(1000); // Wait 1 second before updating status
            updateACStatusToFirebase();
            
            // Clear the command after processing
            clearFirebaseCommand();
          } else {
            Serial.println("Command already processed or invalid");
          }
        } else {
          Serial.println("JSON does not contain required fields");
        }
      }
    } else {
      Serial.println("Empty or null payload from Firebase");
    }
    
    Serial.println("=== END FIREBASE CHECK ===\n");
  } else {
    Serial.printf("✗ Firebase command check failed: %s (Code: %d)\n", https.errorToString(httpCode).c_str(), httpCode);
    consecutiveErrors++;
    
    // Reset connection if too many consecutive errors
    if (consecutiveErrors >= maxConsecutiveErrors) {
      Serial.println("Too many consecutive errors, resetting WiFi...");
      WiFi.disconnect();
      delay(1000);
      WiFi.begin(ssid, password);
      consecutiveErrors = 0;
    }
  }
  
  https.end();
}

// Fungsi untuk menghapus perintah setelah diproses - DIPERBAIKI
void clearFirebaseCommand() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(5000);

  HTTPClient https;
  String url = String(firebaseHost) + String(firebaseCommandPath);
  
  if (https.begin(client, url)) {
    https.addHeader("Content-Type", "application/json");
    
    // Set command to 0 to indicate processed - GUNAKAN ArduinoJson
    DynamicJsonDocument doc(512);
    doc["command"] = 0;
    doc["timestamp"] = millis();
    doc["processed"] = true;
    doc["processed_at"] = String(millis());
    
    String jsonPayload;
    serializeJson(doc, jsonPayload);
    
    Serial.println("Clearing Firebase command with payload: " + jsonPayload);
    
    int httpCode = https.PUT(jsonPayload);
    if (httpCode > 0) {
      Serial.println("✓ Firebase command cleared (Code: " + String(httpCode) + ")");
    } else {
      Serial.println("✗ Failed to clear Firebase command: " + https.errorToString(httpCode));
    }
    https.end();
  } else {
    Serial.println("✗ Failed to connect for clearing Firebase command");
  }
}

// Fungsi untuk memperbarui status AC ke Firebase - DIPERBAIKI
void updateACStatusToFirebase() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(5000);

  HTTPClient https;
  String url = String(firebaseHost) + String(firebaseStatusPath);
  
  if (https.begin(client, url)) {
    https.addHeader("Content-Type", "application/json");
    
    struct tm timeinfo;
    char timeString[20] = "00:00:00";
    if (getLocalTime(&timeinfo)) {
      strftime(timeString, sizeof(timeString), "%H:%M:%S", &timeinfo);
    }

    // GUNAKAN ArduinoJson untuk membuat JSON yang konsisten
    DynamicJsonDocument doc(1024);
    doc["command_source"] = lastCommandSource.length() > 0 ? lastCommandSource : "MANUAL";
    doc["connection_status"] = "online";
    doc["device_id"] = "ESP32-AC-001";
    doc["humidity"] = currentHum;
    doc["last_command"] = lastCommand.length() > 0 ? lastCommand : (acOn ? "AC ON" : "AC OFF");
    doc["power"] = acOn;
    doc["room_temperature"] = currentTemp;
    doc["time"] = String(timeString);
    doc["timestamp"] = millis();

    String jsonPayload;
    serializeJson(doc, jsonPayload);

    Serial.println("Updating AC status to Firebase:");
    Serial.println(jsonPayload);

    int httpCode = https.PUT(jsonPayload);
    if (httpCode > 0) {
      Serial.printf("✓ AC Status updated to Firebase (Code: %d)\n", httpCode);
    } else {
      Serial.printf("✗ Failed to update AC status: %s\n", https.errorToString(httpCode).c_str());
    }
    https.end();
  } else {
    Serial.println("✗ Failed to connect for AC status update");
  }
} 