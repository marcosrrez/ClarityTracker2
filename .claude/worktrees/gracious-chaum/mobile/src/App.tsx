import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {StatusBar, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Provider as PaperProvider} from 'react-native-paper';

import DashboardScreen from './screens/DashboardScreen';
import AddEntryScreen from './screens/AddEntryScreen';
import InsightsScreen from './screens/InsightsScreen';
import SettingsScreen from './screens/SettingsScreen';
import {AuthProvider} from './contexts/AuthContext';
import {theme} from './theme/theme';

const Tab = createBottomTabNavigator();

const App: React.FC = () => {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar backgroundColor={theme.colors.primary} />
          <Tab.Navigator
            screenOptions={({route}) => ({
              tabBarIcon: ({focused, color, size}) => {
                let iconName: string;

                if (route.name === 'Dashboard') {
                  iconName = 'dashboard';
                } else if (route.name === 'Add Entry') {
                  iconName = 'add-circle';
                } else if (route.name === 'Insights') {
                  iconName = 'insights';
                } else if (route.name === 'Settings') {
                  iconName = 'settings';
                } else {
                  iconName = 'help';
                }

                return <Icon name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: theme.colors.primary,
              tabBarInactiveTintColor: 'gray',
              headerStyle: {
                backgroundColor: theme.colors.primary,
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            })}>
            <Tab.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{title: 'ClarityLog'}}
            />
            <Tab.Screen 
              name="Add Entry" 
              component={AddEntryScreen}
              options={{title: 'Log Hours'}}
            />
            <Tab.Screen 
              name="Insights" 
              component={InsightsScreen}
              options={{title: 'AI Insights'}}
            />
            <Tab.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{title: 'Settings'}}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </PaperProvider>
  );
};

export default App;