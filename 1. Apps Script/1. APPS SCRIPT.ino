#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "Nama Wi-Fi";         
const char* password = "*Password Wi-Fi*";  
const char* scriptURL = "*https://script.google.com/macros/s/......*";  

#define RST_PIN 21
#define SS_PIN  5
#define BUZZER_PIN 12

const int I2C_SDA = 4;
const int I2C_SCL = 16;

MFRC522 mfrc522(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2);

struct Student {
  String uid;
  String name;
  bool present;
};

Student students[] = {
  {"3A15F604", "Albert Verbruggen", false},
  {"FDE76F9E", "Hideko Asagawa", false},
  {"AB7BBBCA", "Ahmad Nizzam bin Abdulkadir", false},
  {"763FE500", "Kim Min-Jae", false}
  //Ganti nama dan UID nya sesuai kartu yang akan ditambahkan
};

int totalStudents = sizeof(students)/sizeof(students[0]);

String urlEncode(String str) {
  String encoded = "";
  char c;
  char code0;
  char code1;
  for (int i = 0; i < str.length(); i++) {
    c = str.charAt(i);
    if (isalnum(c)) {
      encoded += c;
    } else {
      encoded += '%';
      code0 = (c >> 4) & 0xF;
      code1 = c & 0xF;
      encoded += char(code0 + (code0 < 10 ? '0' : 'A'-10));
      encoded += char(code1 + (code1 < 10 ? '0' : 'A'-10));
    }
  }
  return encoded;
}

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  WiFi.begin(ssid, password);
  Serial.print("Bentar masih konek WiFi");
  while(WiFi.status() != WL_CONNECTED){
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi Tersambung!");

  Wire.begin(I2C_SDA, I2C_SCL);
  lcd.init();
  lcd.backlight();

  SPI.begin(18, 19, 23, SS_PIN);
  mfrc522.PCD_Init();

  lcd.setCursor(0,0);
  lcd.print("FIKRStudio");
  lcd.setCursor(0,1);
  lcd.print("CoreTap");
  delay(3000);
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("Tap kartumu...");
}

void loop() {
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) return;

  String uidString = "";
  for(byte i=0; i<mfrc522.uid.size; i++){
    char buf[4];
    sprintf(buf,"%02X", mfrc522.uid.uidByte[i]);
    uidString += buf;
  }

  Serial.print("Card UID: "); Serial.println(uidString);

  bool found = false;
  for(int i=0; i<totalStudents; i++){
    if(uidString == students[i].uid){
      found = true;

      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print(students[i].name.substring(0,16));

      if(!students[i].present){
        students[i].present = true;
        lcd.setCursor(0,1);
        lcd.print("Hadir!");
        Serial.println("✅ Marked: " + students[i].name);

        digitalWrite(BUZZER_PIN, HIGH);
        delay(300);
        digitalWrite(BUZZER_PIN, LOW);

        sendToGoogleSheet(students[i].name);
      } else {
        lcd.setCursor(0,1);
        lcd.print("Udh ditandain");
        Serial.println("ℹ️ Already marked: " + students[i].name);

        digitalWrite(BUZZER_PIN, HIGH);
        delay(100);
        digitalWrite(BUZZER_PIN, LOW);
      }

      delay(2000);
      lcd.clear();
      lcd.print("Tap kartumu...");
      break;
    }
  }

  if(!found){
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("KARTU ASING!!");
    Serial.println("Kartu tidak dikenali");

    for(int i=0;i<3;i++){
      digitalWrite(BUZZER_PIN, HIGH);
      delay(100);
      digitalWrite(BUZZER_PIN, LOW);
      delay(100);
    }

    delay(1500);
    lcd.clear();
    lcd.print("Tap kartumu...");
  }

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}

void sendToGoogleSheet(String name){
  if(WiFi.status()==WL_CONNECTED){
    HTTPClient http;
    String encodedName = urlEncode(name);
    String url = String(scriptURL) + "?name=" + encodedName;
    http.begin(url);

    int httpResponseCode = http.GET();
    if(httpResponseCode > 0){
      Serial.print("HTTP Response: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  } else {
    Serial.println("WiFi Terputus");
  }
}
