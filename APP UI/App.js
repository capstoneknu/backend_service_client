import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {View, Text, StyleSheet} from 'react-native';

import HomeScreen from './screens/HomeScreen';
import DREventScreen from './screens/DREventScreen';
import MissionScreen from './screens/MissionScreen';
import PointScreen from './screens/PointScreen';
import MyPageScreen from './screens/MyPageScreen';

const Tab = createBottomTabNavigator();

// 간단한 아이콘 컴포넌트 (react-native-vector-icons 대신)
const TabIcon = ({name, color, size}) => {
  const icons = {
    홈: '🏠',
    'DR 이벤트': '⚡',
    미션: '◎',
    포인트: '🎁',
    마이페이지: '👤',
  };
  return <Text style={{fontSize: size - 4}}>{icons[name] || '•'}</Text>;
};

const App = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({route}) => ({
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <TabIcon name={route.name} color={color} size={size} />
          ),
          tabBarActiveTintColor: '#22C55E',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            height: 70,
            paddingBottom: 10,
            paddingTop: 8,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#F3F4F6',
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        })}>
        <Tab.Screen name="홈" component={HomeScreen} />
        <Tab.Screen name="DR 이벤트" component={DREventScreen} />
        <Tab.Screen name="미션" component={MissionScreen} />
        <Tab.Screen name="포인트" component={PointScreen} />
        <Tab.Screen name="마이페이지" component={MyPageScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;
