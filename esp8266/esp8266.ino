#define FASTLED_ESP8266_RAW_PIN_ORDER
#include "FastLED.h"
FASTLED_USING_NAMESPACE

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <EEPROM.h>
extern "C" {
#include "user_interface.h"
}
#include <ESP8266HTTPClient.h>  // HTTPClient for web requests
#include <ArduinoJson.h>

ADC_MODE(ADC_VCC);



ESP8266WebServer server(80);


// Wi-Fi network to connect to (if not in AP mode)

// openweathermap.org
String OWM_API_KEY = "YourAPIKey";           // Open Weather Map API Key
String OWM_CITY_ID = "YourCityID";           // Open Weather Map CityID
String OWM_FIELD   = "temp";       // can be "temp","pressure","humidity","temp_min", or "temp_max"
String OWM_UNITS   = "metric";   // can be "imperial", "metric", or "kelvin"

// Temperature in degree to display
int degree;

int ip[8];

byte state_colors[9] = {
  0, // 0 Thunderstorm
  1,   // 1 Drizzle
  1,   // 2 Rain
  2, // 3 Snow
  3, // 4 Atmospheric
  4,   // 5 Clear
  3,  // 6 Clouds 
  0,     // 7 Extreme
  4   // 8 Calm  
};

byte state_icons[5] = {
  0, // undefined
  1, // Rain
  2, // Snow
  3, // Clouds
  4  // Sun
};

/**
 * 0 - 9
 */
String numbers[10] = {
  "GG888GG8G8GG8G8GG8G8GG888",
  "GGGG8GGG88GGGG8GGGG8GGGG8",
  "GG888GGGG8GG888GG8GGGG888",
  "GG888GGGG8GGG88GGGG8GG888",
  "GG8G8GG8G8GG888GGGG8GGGG8",
  "GG888GG8GGGG888GGGG8GG888",
  "GG888GG8GGGG888GG8G8GG888",
  "GG888GGGG8GGG8GGGG8GGGG8G",
  "GG888GG8G8GG888GG8G8GG888",
  "GG888GG8G8GG888GGGG8GG888",
};

/* 
 *  0:   -
 *  1-9: 1 - 9
 */
String frontNumbers[10] = {
  "GGGGGGGGGGCCGGGGGGGGGGGGG",
  "GAGGGAAGGGGAGGGGAGGGGAGGG",
  "AAGGGGAGGGAAGGGAGGGGAAGGG",
  "AAGGGGAGGGAAGGGGAGGGAAGGG",
  "AGGGGAGGGGAAGGGGAGGGGAGGG",
  "AAGGGAGGGGAAGGGGAGGGAAGGG",
  "AAGGGAGGGGAAGGGAAGGGAAGGG",
  "AAGGGGAGGGAGGGGAGGGGAGGGG",
  "AAGGGAAGGGAAGGGAAGGGAAGGG",
  "AAGGGAAGGGAAGGGGAGGGAAGGG"
};

/**
 * 2 Pixeldata per weather icon id: 0: 0-1, 1: 2-3...
 */
String weatherPixel[10] = {
  "GCCGGGGGCGGGCGGGGGGGGGCGG",
  "GCCGGGGGCGGGCGGGGGGGGGCGG",
  "GCCCGCCCCCGCCCGGGGGGCGCGG",
  "GCCCGCCCCCGCCCGGCGCGGGGGG",
  "G7G7G77777G777G77777G7G7G",
  "7G7G7G777G77777G777G7G7G7",
  "GGGGCGGCCCGGCCCGGGCCGGGGG",
  "GGCCGCCCCCCCCCCGCCCGGGGGG",
  "GGAGGGAAAGAAAAAGAAAGGGAGG",
  "GGGGGGAAAGGAAAGGAAAGGGGGG"
};

// o Weather; 1 Degree; 2 Pixel; 3 Battery empty
int state = 0;

int currPixelIndex = 0;
int maxPixelCount = 2;
int pixelRepeat = 0;
int maxPixelRepeat = 4;

DynamicJsonBuffer jsonBuffer;

JsonObject& pixelStr = jsonBuffer.createObject();
//String pixelStr[10][16];

int pixelNumIndex = 0;
int maxPixelNumIndex = 0;

// Data pin that led data will be written out over
// SI --> GPIO3 (RX)
#define DATA_PIN 4
#define LED_TYPE      WS2812B
#define COLOR_ORDER   BGR // RGB
#define NUM_LEDS      25


uint8_t brightness = 32; // 0 - 255

CRGB leds[NUM_LEDS];


CRGB solidColor = CRGB::Blue;


CRGB palette[16] = {
CRGB(0, 0, 0),
CRGB(149, 2, 61),
CRGB(128, 83, 19),
CRGB(0, 0, 153),
CRGB(48, 161, 72),
CRGB(85, 85, 85),
CRGB(192, 186, 187),
CRGB(255, 255, 255),
CRGB(0, 238, 0),
CRGB(39, 253, 152),
CRGB(54, 254, 237),
CRGB(78, 36, 228),
CRGB(252, 38, 164),
CRGB(0, 0, 0), // Transparent
CRGB(158, 253, 107),
CRGB(161, 254, 197)

};


uint8_t mapping[25] = {
  0, 1, 2, 3, 4,
  9, 8, 7, 6, 5,
  10, 11, 12, 13, 14,
  19, 18, 17, 16, 15,
  20, 21, 22, 23, 24
};

int counter;

uint8_t charToPixelIndex(char c) {
  
  if (c == 'A') {
    return 10;
  } else if (c == 'B') {
    return 11;
  } else if (c == 'C') {
    return 12;
  } else if (c == 'D') {
    return 13;
  } else if (c == 'E') {
    return 14;
  } else if (c == 'F') {
    return 15;
  } else if (c == 'G') {
    return 13;
  } else {
    return c - '0';
  }
  return 0;
}

void setup() {
  Serial.begin(115200);
  delay(100);
  counter = 0;

  FastLED.addLeds<LED_TYPE, DATA_PIN, COLOR_ORDER>(leds, NUM_LEDS);         // for WS2812 (Neopixel)
  
  FastLED.setBrightness(brightness);

  //fill_solid(leds, NUM_LEDS, solidColor);
  //FastLED.show();


  if (ESP.getVcc() < 2700) {
    // Battery empty
    state = 3;
    pixelStr.remove("pixels");
    JsonArray& pixelArr = pixelStr.createNestedArray("pixels");
    JsonObject& nestedArr = pixelArr.createNestedObject();
    JsonArray& pixelStr = nestedArr.createNestedArray("pixels");
    pixelStr.add("GGGGGG555555885G5555GGGGG");
    pixelStr.add("GGGGGG555555665G5555GGGGG");
    pixelArr.add(pixelStr);
  } else {
    delay(100);
    
    EEPROM.begin(512);
    
    brightness = int(EEPROM.read(97));
    FastLED.setBrightness(brightness);
  
    String wifiSsid = "";
    for (int i = 0; i < 32; ++i)
      {
        wifiSsid += char(EEPROM.read(i));
      }
    Serial.print("SSID: ");
    Serial.println(wifiSsid);
    Serial.println("Reading EEPROM pass");
    String wifiPassword = "";
    for (int i = 32; i < 96; ++i)
      {
        wifiPassword += char(EEPROM.read(i));
      }

    char wifiSsid2[wifiSsid.length() + 1];
    wifiSsid.toCharArray(wifiSsid2, wifiSsid.length() + 1);
    
    char wifiPassword2[wifiPassword.length() + 1];

    wifiPassword.toCharArray(wifiPassword2, wifiPassword.length() + 1);
    WiFi.mode(WIFI_STA);
    WiFi.begin(wifiSsid2, wifiPassword2);
  
  
    pixelStr.remove("pixels");
    JsonArray& pixelArr = pixelStr.createNestedArray("pixels");
    JsonObject& nestedArr = pixelArr.createNestedObject();
    JsonArray& pixelStr = nestedArr.createNestedArray("pixels");
    pixelStr.add("GAAAGA5A5AAAAAAA555AGAAAG");
    pixelStr.add("GAAAGA5A5AAAAAAA555AGAAAG");
    pixelArr.add(pixelStr);
  
    maxPixelCount = 2;
    pixelNumIndex = 0;
    maxPixelNumIndex = 1;
    
    if (WiFi.waitForConnectResult() != WL_CONNECTED) {
      Serial.println("Connection Failed creating AccessPoint\n");
      state = 4;
      
      WiFi.mode(WIFI_AP);
      delay(100);
      WiFi.softAP("PixelFrame", "esp8266Pixel");
      
      server.on("/", handleRoot);
      
      server.begin();
    
      IPAddress myIP = WiFi.softAPIP(); //Get IP address
      Serial.print("HotSpt IP:");
      Serial.println(myIP);

      ip[0] = myIP[0] / 100;
      ip[1] = myIP[0] % 100;
      ip[2] = myIP[1] / 100;
      ip[3] = myIP[1] % 100;
      ip[4] = myIP[2] / 100;
      ip[5] = myIP[2] % 100;
      ip[6] = myIP[3] / 100;
      ip[7] = myIP[3] % 100;
      maxPixelRepeat = 8;
    
      Serial.print("Open http://");
      Serial.println("/ in your browser to see it working");
  
    } else {
      // Display Weather data
      checkOWM();
    }
  
    
  

  }
  
}


void handleRoot(){
  String msg;
  if (server.hasArg("WIFISSID") && server.hasArg("PASSWORD")){

      String wifiSsid = server.arg("WIFISSID");
      String wifiPassword = server.arg("PASSWORD");
      Serial.println("clearing eeprom");
      for (int i = 0; i < 96; ++i) { EEPROM.write(i, 0); }
      Serial.println(wifiSsid);
      Serial.println("");
      Serial.println(wifiPassword);
      Serial.println("");
        
      Serial.println("writing eeprom ssid:");
      for (int i = 0; i < wifiSsid.length(); ++i)
        {
          EEPROM.write(i, wifiSsid[i]);
          Serial.print("Wrote: ");
          Serial.println(wifiSsid[i]); 
        }
      Serial.println("writing eeprom pass:"); 
      for (int i = 0; i < wifiPassword.length(); ++i)
        {
          EEPROM.write(32+i, wifiPassword[i]);
          Serial.print("Wrote: ");
          Serial.println(wifiPassword[i]); 
        }

      if (server.hasArg("BRIGHTNESS")) {
        int newBrightness = server.arg("BRIGHTNESS").toInt();
        EEPROM.write(97, newBrightness);
      } else {
        EEPROM.write(97, 32);
      }
      EEPROM.commit();

      msg = "Saved data please reboot";
      Serial.println("Set Data");
    } else {
  msg = "Enter Wifi/Password";
  }
  String content = "<html><body><form action='/' method='POST'>";
  content += "Wifi SSID:<input type='text' name='WIFISSID' placeholder='wifi'><br>";
  content += "Password:<input type='password' name='PASSWORD' placeholder='password'><br>";
  content += "Brightness (default: 32):<input type='text' name='BRIGHTNESS' placeholder='brightness (0 - 255)'><br>";
  content += "<input type='submit' name='SUBMIT' value='Submit'></form>" + msg + "<br>";
  content += "</body></html>";
  server.send(200, "text/html", content);
}


void checkOWM() {
  DynamicJsonBuffer jsonBuffer;
  HTTPClient http;
  http.begin("http://api.openweathermap.org/data/2.5/weather?id="+OWM_CITY_ID+"&appid="+OWM_API_KEY+"&units="+OWM_UNITS);
  int httpCode = http.GET();
  if (httpCode > 0) {
    if (httpCode == HTTP_CODE_OK) {
      String payload = http.getString();
      Serial.println(payload);
      JsonObject& owm_data = jsonBuffer.parseObject(payload);
      if (!owm_data.success()) {
        Serial.println("Parsing failed");
        return;
      }
      int field = owm_data["main"][OWM_FIELD];
      int code = owm_data["weather"][0]["id"];
      int weather_state = codeToState(code);
      
      int weatherIcon = state_icons[state_colors[weather_state]];

      Serial.println("\nWeatherData\n");
      
      Serial.println("Temp: ");
      Serial.println(field);
      degree = field;
      
      Serial.println("WeatherIcon: ");
      Serial.println(weatherIcon);
      drawWeatherIcon(weatherIcon);
    }
  }
  http.end();
}


byte codeToState(uint16_t code){
  byte state = 0;
  if(code >= 200 && code < 300){
    state = 0;
  }
  else if(code >= 300 && code < 400){
    state = 1;
  }
  else if(code >= 500 && code < 600){
    state = 2;
  }
  else if(code >= 600 && code < 700){
    state = 3;
  }
  else if(code >= 700 && code < 800){
    state = 4;
  }
  else if(code == 800){
    state = 5;  
  }
  else if(code > 800 && code < 900){
    state = 6;
  }
  else if(code >= 900 && code < 907){
    state = 7;
  }
  else if(code >= 907 && code < 956){
    state = 8;
  }
  else if(code >= 956){
    state = 7;
  }
  return state;
}

void drawWeatherIcon(int icon) {
  pixelStr.remove("pixels");
  JsonArray& pixelArr = pixelStr.createNestedArray("pixels");
  JsonObject& nestedArr = pixelArr.createNestedObject();
  JsonArray& pixelStr = nestedArr.createNestedArray("pixels");
  pixelStr.add(weatherPixel[icon * 2]);
  pixelStr.add(weatherPixel[icon * 2 + 1]);
  pixelArr.add(pixelStr);
}

void drawNumber(int number) {
  String pixelString = "GGGGGGGGGGGGGGGGGGGGGGGGG";
  String firstDigit;
  String lastDigit;
  if (number < 0) {
    firstDigit = frontNumbers[0];
    lastDigit = numbers[abs(number) % 10];
  } else if (number > 9) {
    firstDigit = frontNumbers[(number / 10) % 10];
    lastDigit = numbers[number % 10];
  } else {
    firstDigit = "";
    lastDigit = numbers[number % 10];
  }
  
  for (int i = 0; i < firstDigit.length(); i++) {
    if (firstDigit.charAt(i) != 'G') {
      pixelString.setCharAt(i, firstDigit.charAt(i));
    }
  }
  for (int i = 0; i < lastDigit.length(); i++) {
    if (lastDigit.charAt(i) != 'G') {
      pixelString.setCharAt(i, lastDigit.charAt(i));
    }
  }
  Serial.println("pixelString");
  Serial.println(pixelString);
  pixelStr.remove("pixels");
  JsonArray& pixelArr = pixelStr.createNestedArray("pixels");
  JsonObject& nestedArr = pixelArr.createNestedObject();
  JsonArray& pixelStr = nestedArr.createNestedArray("pixels");
  pixelStr.add(pixelString);
  pixelStr.add(pixelString);
  pixelArr.add(pixelStr);
}


void updatePixelData() {
  
  DynamicJsonBuffer jsonBuffer;
  HTTPClient http;
  http.begin("https://pixelframe.herokuapp.com/pixelframe");
  int httpCode = http.GET();
  Serial.println("httpCode");
  Serial.println(httpCode);
  if (httpCode > 0) {
    if (httpCode == HTTP_CODE_OK) {
      String payload = http.getString();
      Serial.println(payload);
      JsonObject& pixel_data = jsonBuffer.parseObject(payload);
      if (!pixel_data.success()) {
        Serial.println("Parsing failed");
        return;
      }
      pixelStr.set("pixels", pixel_data["pixels"]);
      int pixelSize = pixel_data["pixels"].size();

      
        Serial.println("pixelSize");
        Serial.println(pixelSize);
      pixelNumIndex = 0;
      maxPixelNumIndex = pixelSize;
      
  Serial.println("maxPixelCount");
      maxPixelCount = pixelStr["pixels"][pixelNumIndex]["pixels"].size();
      
  Serial.println(maxPixelCount);
    }
  }
  
  //  Enable light sleep
  /*WiFi.disconnect();
  WiFi.mode(WIFI_OFF);
  WiFi.forceSleepBegin();
  WiFi.forceSleepWake();
  wifi_set_sleep_type(LIGHT_SLEEP_T);*/
}


void loop() {

  counter++;
  if (counter == 4) {
    
    //digitalWrite(5, LOW);
  
  }

  /*for (uint8_t i = 0; i < NUM_LEDS; i++) {
    leds[mapping[i]] = palette[charToPixelIndex(degree.charAt(i))];
  }
  //fill_solid(leds, NUM_LEDS, solidColor);
  FastLED.show();*/


  if (state == 4) {
    server.handleClient();
  }
  // periodic updates
  EVERY_N_MILLISECONDS( 500 ) { drawNextPixels(); }
}

void drawNextPixels() {
  currPixelIndex++;
  if (currPixelIndex >= maxPixelCount) {
    currPixelIndex = 0;
    
    pixelRepeat++;
    if (pixelRepeat == maxPixelRepeat) {
      pixelRepeat = 0;

      if (state == 0) {
        state = 1;
        drawNumber(degree);
      } else if (state == 1) {
        degree++;
        state = 2;
        updatePixelData();
      } else if (state == 3) {
        
      } else if (state == 4) {
        
      } else {
        if (pixelNumIndex < maxPixelNumIndex) {
          pixelNumIndex++;
        } else {
          pixelNumIndex = 0;
        }
        maxPixelCount = pixelStr["pixels"][pixelNumIndex]["pixels"].size();
      }
    }
  } else if (state == 4) {
      drawNumber(ip[pixelRepeat]);
  }
  const char* pixel = pixelStr["pixels"][pixelNumIndex]["pixels"][currPixelIndex];

  for (uint8_t i = 0; i < NUM_LEDS; i++) {
    leds[mapping[i]] = palette[charToPixelIndex(((String)pixel).charAt(i))];
  }
  FastLED.show();
}

