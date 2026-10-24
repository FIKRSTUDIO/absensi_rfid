#include <SPI.h>
#include <MFRC522.h>

#define UBAH_PIN_SS 5
#define UBAH_PIN_SCK 18
#define UBAH_PIN_MISO 19
#define UBAH_PIN_MOSI 23
#define UBAH_PIN_RST 22
#define UBAH_PIN_LED 2

const unsigned long UBAH_JEDA_KARTU_SAMA_MS = 3000;

MFRC522 rfid(UBAH_PIN_SS, UBAH_PIN_RST);

String lastUid = "";
unsigned long lastTapMs = 0;

void setup() {
  Serial.begin(9600);
  pinMode(UBAH_PIN_LED, OUTPUT);
  SPI.begin(UBAH_PIN_SCK, UBAH_PIN_MISO, UBAH_PIN_MOSI, UBAH_PIN_SS);
  rfid.PCD_Init();
  Serial.println("READY");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;

  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();

  if (uid != lastUid || millis() - lastTapMs > UBAH_JEDA_KARTU_SAMA_MS) {
    Serial.print("UID:");
    Serial.println(uid);
    lastUid = uid;
    lastTapMs = millis();
    digitalWrite(UBAH_PIN_LED, HIGH);
    delay(80);
    digitalWrite(UBAH_PIN_LED, LOW);
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}
