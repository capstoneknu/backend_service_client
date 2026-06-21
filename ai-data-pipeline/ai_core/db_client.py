from influxdb_client import InfluxDBClient
import logging
from contextlib import contextmanager

logging.basicConfig(level=logging.INFO, format='%(asctime)s - [TSDB-CLIENT] - %(levelname)s - %(message)s')

class PowerDBClient:
    """
    [A파트 전용 InfluxDB 클라이언트]
    오직 AI 코어(LSTM)의 추론을 위한 시계열 원본 데이터(최근 96개 시퀀스) 조회만을 담당.
    """
    def __init__(self, url="http://localhost:8086", token="super-secret-capstone-token", org="khnp-dr", bucket="power-data"):
        self.url = url
        self.token = token
        self.org = org
        self.bucket = bucket
        
    @contextmanager
    def _get_query_api(self):
        """안전한 자원 해제(Connection Pool 반환)를 위한 Context Manager"""
        client = InfluxDBClient(url=self.url, token=self.token, org=self.org, timeout=5000)
        try:
            yield client.query_api()
        finally:
            client.close()

    def get_recent_history(self, user_id: str, limit: int = 96) -> list:
        """AI 추론(LSTM 96-In)을 위한 과거 24시간 전력 데이터 추출"""
        try:
            # 불완전한 윈도우 Truncate 및 이중 결측치 보정(Chained Fill) - 수학적 정합성 유지
            query = f"""
            import "timezone"
            import "date"
            option location = timezone.location(name: "Asia/Seoul")
            
            currentTime = date.truncate(t: now(), unit: 15m)
            startTime = date.sub(d: 24h, from: currentTime)
            
            from(bucket: "{self.bucket}")
              |> range(start: startTime, stop: currentTime)
              |> filter(fn: (r) => r["_measurement"] == "power_usage")
              |> filter(fn: (r) => r["_field"] == "kwh_usage")
              |> filter(fn: (r) => r["device_id"] == "{user_id}")
              |> aggregateWindow(every: 15m, fn: sum, createEmpty: true)
              |> fill(usePrevious: true)
              |> fill(value: 0.0)
              |> tail(n: {limit})
              |> sort(columns: ["_time"], desc: false)
            """
            with self._get_query_api() as query_api:
                result = query_api.query(query)
                
                if not result or len(result) == 0 or len(result[0].records) == 0:
                    return [0.0] * limit

                history = [float(round(record.get_value(), 2)) for record in result[0].records]
            
            # 패딩 보장 (텐서 사이즈 크래시 방어)
            if len(history) < limit:
                history = [0.0] * (limit - len(history)) + history
                
            return history[:limit]
            
        except Exception as e:
            logging.error(f"DB Query Error (recent_history) for {user_id}: {e}")
            return [0.0] * limit

    def get_aggregated_series(self, device_id: str, window: str = "1d", limit: int = 90) -> list:
        """
        [시계열 분석 화면용] 특정 가구의 전력 사용량을 window 단위로 집계한 추이 반환.
        예: window="1d" → 일별 사용량(kWh), window="1h" → 시간별 사용량.
        반환: [{"time": ISO8601, "value": float}, ...]
        """
        try:
            query = f"""
            from(bucket: "{self.bucket}")
              |> range(start: 0)
              |> filter(fn: (r) => r["_measurement"] == "power_usage")
              |> filter(fn: (r) => r["_field"] == "kwh_usage")
              |> filter(fn: (r) => r["device_id"] == "{device_id}")
              |> aggregateWindow(every: {window}, fn: sum, createEmpty: false)
              |> sort(columns: ["_time"], desc: false)
              |> tail(n: {limit})
            """
            with self._get_query_api() as query_api:
                result = query_api.query(query)
                series = []
                for table in result:
                    for record in table.records:
                        series.append({
                            "time": record.get_time().isoformat(),
                            "value": round(float(record.get_value() or 0.0), 2),
                        })
                return series
        except Exception as e:
            logging.error(f"DB Query Error (aggregated_series) for {device_id}: {e}")
            return []