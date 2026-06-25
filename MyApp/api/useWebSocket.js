import {useEffect, useRef, useCallback} from 'react';
import {useEnergyStore} from '../store/store';
import { getToken } from '../api/apiClient'; // getToken 추가

//[수정 전] const WS_URL = 'ws://10.0.2.2:8085/ws/energy';
// [수정 후] AWS EC2 퍼블릭 IP 매핑 
const WS_URL = 'ws://3.37.149.164:8085/ws/energy';
const UPDATE_INTERVAL_MS = 60 * 1000; // 1분

export const useEnergyWebSocket = () => {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const dashboardTimer = useRef(null);

  const bufferRef = useRef({
    powerSum: 0,
    powerCount: 0,
    accumulatedMin: 0,
    lastUpdate: 0,
    isFirstMessage: true,
  });

  const connect = useCallback(() => {
    try {
      //[기존] const ws = new WebSocket(WS_URL);

      //[변경]
      const currentToken = getToken();
      const finalWsUrl = currentToken ? `${WS_URL}?token=${currentToken}` : WS_URL;
      
      const ws = new WebSocket(finalWsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket 연결됨');
        bufferRef.current.lastUpdate = Date.now();
        bufferRef.current.isFirstMessage = true;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type !== 'ENERGY_UPDATE') return;

          const buf = bufferRef.current;
          const power = data.currentPower || 0;
          const kwh = data.kwhUsage || 0;

          buf.powerSum += power;
          buf.powerCount += 1;
          buf.accumulatedMin += kwh;

          // 첫 메시지 즉시 반영
          if (buf.isFirstMessage) {
            useEnergyStore.setState({
              currentPower: Number(power.toFixed(2)),
            });
            useEnergyStore.getState().markRealtimeStarted();
            buf.isFirstMessage = false;
          }

          // 1분 평균 갱신
          const now = Date.now();
          if (now - buf.lastUpdate >= UPDATE_INTERVAL_MS) {
            const avgPower = buf.powerCount > 0 ? buf.powerSum / buf.powerCount : 0;

            useEnergyStore.setState({
              currentPower: Number(avgPower.toFixed(2)),
            });

            buf.powerSum = 0;
            buf.powerCount = 0;
            buf.accumulatedMin = 0;
            buf.lastUpdate = now;
          }
        } catch (err) {
          console.log('WebSocket 파싱 에러:', err.message);
        }
      };

      ws.onerror = (error) => {
        console.log('WebSocket 에러:', error.message);
      };

      ws.onclose = () => {
        console.log('WebSocket 연결 해제, 5초 후 재연결...');
        reconnectTimer.current = setTimeout(connect, 5000);
      };

      wsRef.current = ws;
    } catch (err) {
      console.log('WebSocket 연결 실패:', err.message);
      reconnectTimer.current = setTimeout(connect, 5000);
    }
  }, []);

  useEffect(() => {
    connect();

    // ⭐ 1분마다 대시보드 데이터 자동 새로고침 (월 사용량, 차트 등)
    dashboardTimer.current = setInterval(() => {
      useEnergyStore.getState().fetchDashboard(true);
    }, UPDATE_INTERVAL_MS);

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (dashboardTimer.current) clearInterval(dashboardTimer.current);
    };
  }, [connect]);
};
