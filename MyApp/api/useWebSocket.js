import {useEffect, useRef, useCallback} from 'react';
import {useEnergyStore} from '../store/store';

const WS_URL = 'ws://10.0.2.2:8081/ws/energy';

export const useEnergyWebSocket = (deviceId) => {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    if (!deviceId) return;

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log(`WebSocket 연결됨. Device [${deviceId}] 구독 요청 발송.`);
        ws.send(JSON.stringify({ action: 'SUBSCRIBE', deviceId: String(deviceId) }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ENERGY_UPDATE') {
            useEnergyStore.setState({
              currentPower: data.currentPower,
              // 누적량은 2초마다 도는 REST API(fetchDashboard)가 DB의 진짜 SUM 값을 가져오도록 격리
            });
          }
        } catch (err) {
          console.log('WebSocket 파싱 에러:', err);
        }
      };

      ws.onerror = (error) => {
        console.log('WebSocket 에러:', error.message);
      };

      ws.onclose = () => {
        console.log('WebSocket 연결 해제, 5초 후 재연결...');
        reconnectTimer.current = setTimeout(() => connect(), 5000);
      };

      wsRef.current = ws;
    } catch (err) {
      reconnectTimer.current = setTimeout(() => connect(), 5000);
    }
  }, [deviceId]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);
};