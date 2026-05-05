import {useEffect, useRef, useCallback} from 'react';
import {useEnergyStore} from '../store/store';

// 에뮬레이터: 10.0.2.2 / 실제 기기: PC IP
const WS_URL = 'ws://10.0.2.2:8081/ws/energy';

/**
 * WebSocket 훅 - 실시간 에너지 데이터를 수신하여 스토어에 반영
 *
 * 사용법:
 *   import {useEnergyWebSocket} from '../api/useWebSocket';
 *
 *   const HomeScreen = () => {
 *     useEnergyWebSocket();  // 이 한 줄만 추가
 *     ...
 *   };
 */
export const useEnergyWebSocket = () => {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const {fetchDashboard} = useEnergyStore();

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('✅ WebSocket 연결됨');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'ENERGY_UPDATE') {
            // 실시간 전력 데이터 → 스토어 업데이트
            useEnergyStore.setState({
              currentPower: data.currentPower,
              todayAccumulated: data.accumulatedKwh,
            });
          }
        } catch (err) {
          console.log('WebSocket 파싱 에러:', err);
        }
      };

      ws.onerror = (error) => {
        console.log('WebSocket 에러:', error.message);
      };

      ws.onclose = (event) => {
        console.log('WebSocket 연결 해제, 5초 후 재연결...');
        // 자동 재연결
        reconnectTimer.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      wsRef.current = ws;
    } catch (err) {
      console.log('WebSocket 연결 실패:', err);
      reconnectTimer.current = setTimeout(() => connect(), 5000);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, [connect]);
};
