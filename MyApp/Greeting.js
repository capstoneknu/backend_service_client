import React from 'react';
import { Text } from 'react-native';

const Greeting = ({ name }) => {
  return <Text style={{ fontSize: 20 }}>안녕하세요, {name}님!</Text>;
};

export default Greeting;