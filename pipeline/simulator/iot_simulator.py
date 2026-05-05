"""
IoT 스마트 플러그 시뮬레이터
실제 IoT 기기 대신 MQTT로 전력 데이터를 발행합니다.

설치: pip install paho-mqtt
실행: python iot_simulator.py
"""

import json
import time
import random
import math
from datetime import datetime

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("paho-mqtt 패키지를 설치해주세요:")
    print("  pip install paho-mqtt")
    exit(1)

# ======== 설정 ========
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "energy/smartplug/data"
DEVICE_ID = "plug-001"
USER_ID = 1  # DB의 사용자 ID
INTERVAL = 3  # 데이터 발행 간격 (초)

def generate_power_data():
    """시간대별 현실적인 전력 데이터 생성"""
    now = datetime.now()
    hour = now.hour + now.minute / 60.0

    # 시간대별 기본 전력 패턴 (kW)
    # 새벽: 낮음, 오전: 상승, 점심: 피크, 오후: 중간, 저녁: 피크, 밤: 하강
    if 0 <= hour < 6:
        base = 0.5 + 0.3 * math.sin(hour * 0.5)
    elif 6 <= hour < 9:
        base = 0.8 + (hour - 6) * 0.6
    elif 9 <= hour < 12:
        base = 2.5 + (hour - 9) * 0.5
    elif 12 <= hour < 14:
        base = 4.0 + 0.5 * math.sin((hour - 12) * math.pi)
    elif 14 <= hour < 17:
        base = 3.5 + 0.3 * math.sin((hour - 14) * 0.8)
    elif 17 <= hour < 20:
        base = 3.0 + (hour - 17) * 0.3
    elif 20 <= hour < 22:
        base = 3.5 - (hour - 20) * 0.5
    else:
        base = 2.0 - (hour - 22) * 0.5

    # 랜덤 변동 추가 (±15%)
    fluctuation = base * random.uniform(-0.15, 0.15)
    power = max(0.1, base + fluctuation)

    # AI 예측값 (약간 다른 패턴)
    predicted = base * random.uniform(0.9, 1.1)

    return {
        "deviceId": DEVICE_ID,
        "userId": USER_ID,
        "powerKw": round(power, 2),
        "predictedKw": round(predicted, 2),
        "voltage": round(220 + random.uniform(-5, 5), 1),
        "current": round(power * 1000 / 220, 2),
        "timestamp": now.isoformat(),
        "standbyWatt": round(random.uniform(0.1, 0.5), 2),
    }

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"✅ MQTT 브로커 연결 성공 ({MQTT_BROKER}:{MQTT_PORT})")
    else:
        print(f"❌ MQTT 연결 실패 (코드: {rc})")

def main():
    print("=" * 50)
    print("🔌 IoT 스마트 플러그 시뮬레이터")
    print(f"   브로커: {MQTT_BROKER}:{MQTT_PORT}")
    print(f"   토픽: {MQTT_TOPIC}")
    print(f"   간격: {INTERVAL}초")
    print("=" * 50)

    client = mqtt.Client()
    client.on_connect = on_connect

    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
    except Exception as e:
        print(f"❌ 브로커 연결 실패: {e}")
        print("Docker Compose가 실행 중인지 확인하세요.")
        return

    accumulated_kwh = 0.0
    count = 0

    try:
        while True:
            data = generate_power_data()

            # 누적 사용량 계산 (kW * hours)
            accumulated_kwh += data["powerKw"] * (INTERVAL / 3600)
            data["accumulatedKwh"] = round(accumulated_kwh, 3)

            payload = json.dumps(data)
            client.publish(MQTT_TOPIC, payload)

            count += 1
            print(f"[{count}] 📡 {data['powerKw']} kW | "
                  f"누적: {data['accumulatedKwh']} kWh | "
                  f"시각: {data['timestamp'][:19]}")

            time.sleep(INTERVAL)

    except KeyboardInterrupt:
        print("\n⏹ 시뮬레이터 종료")
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    main()
