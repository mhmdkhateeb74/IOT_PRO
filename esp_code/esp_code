#include <Arduino.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <ESP8266WiFi.h> 

const char* ssid = "IOT_PRO";
const char* password = "123456";

WebSocketsClient webSocket;
const char* server = "192.168.1.100"; 
const int port = 4020;

#define BUTTON_PIN D1
#define LED_PIN D2
#define BUZZER_PIN D3

volatile bool emergency = false;
bool activeEmergency = false;
unsigned long lastBlink = 0;

void IRAM_ATTR handleInterrupt() {
  emergency = true;
}

void sendStatus(const char* status) {
  StaticJsonDocument<200> doc;
  doc["id"] = "esp1";
  doc["status"] = status;
  String jsonStr;
  serializeJson(doc, jsonStr);
  webSocket.sendTXT(jsonStr);
}


void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), handleInterrupt, FALLING);

  Serial.begin(115200);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  webSocket.begin(server, port, "/");
  webSocket.onEvent(webSocketEvent);
  sendStatus("שגרה");
}


void loop() {
  webSocket.loop();

  if (emergency && !activeEmergency) {
    emergency = false;
    activeEmergency = true;
    sendStatus("מצוקה");
  }

  if (activeEmergency) {
    digitalWrite(LED_PIN, millis() % 500 < 250);
    analogWrite(BUZZER_PIN, (millis() / 300) % 2 == 0 ? 500 : 1000);
  } else {
    unsigned long now = millis();
    if (now - lastBlink > 600000) {
      digitalWrite(LED_PIN, HIGH);
      delay(100);
      digitalWrite(LED_PIN, LOW);
      lastBlink = now;
    }
    analogWrite(BUZZER_PIN, 0);
  }
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_TEXT) {
    StaticJsonDocument<200> doc;
    DeserializationError err = deserializeJson(doc, payload);
    if (!err) {
      const char* status = doc["status"];
      if (String(status) == "ניטרול") {
        activeEmergency = false;
        sendStatus("שגרה");
      }
    }
  }
}
