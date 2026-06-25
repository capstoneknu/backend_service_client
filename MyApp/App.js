import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {View, Text} from 'react-native';

// Auth Screens
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import SignUpCompleteScreen from './screens/SignUpCompleteScreen';

// Main Screens
import HomeScreen from './screens/HomeScreen';
import DREventScreen from './screens/DREventScreen';
import MissionScreen from './screens/MissionScreen';
import PointScreen from './screens/PointScreen';
import MyPageScreen from './screens/MyPageScreen';
import UsageAnalysisScreen from './screens/UsageAnalysisScreen';

// Store
import {useAuthStore} from './store/authStore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ---- Tab Icon ----
const TabIcon = ({name, focused}) => {
  const icons = {
    홈: '🏠',
    'DR 이벤트': '⚡',
    미션: '◎',
    포인트: '🎁',
    마이페이지: '👤',
  };
  return (
    <View style={{alignItems: 'center'}}>
      <Text style={{fontSize: 20, opacity: focused ? 1 : 0.5}}>
        {icons[name] || '•'}
      </Text>
    </View>
  );
};

// ---- Main Tab Navigator ----
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarIcon: ({focused}) => (
          <TabIcon name={route.name} focused={focused} />
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
  );
};

// ---- Main Stack (탭 + 하위 상세 화면) ----
const MainStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{headerShown: false, animation: 'slide_from_right'}}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="UsageAnalysis" component={UsageAnalysisScreen} />
    </Stack.Navigator>
  );
};

// ---- Auth Stack Navigator ----
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen
        name="SignUpComplete"
        component={SignUpCompleteScreen}
        options={{gestureEnabled: false}}
      />
    </Stack.Navigator>
  );
};

// ---- Root App ----
const App = () => {
  const {isLoggedIn} = useAuthStore();

  return (
    <NavigationContainer>
      {isLoggedIn ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default App;