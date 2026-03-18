import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Home, Shield } from 'lucide-react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { CustomTabBar } from '../../src/components/ui/CustomTabBar';

export default function AppLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
      sceneContainerStyle={{ backgroundColor: colors.background }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schools/index"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="schools/add"
        options={{
          title: 'Add School',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="schools/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="students/index"
        options={{
          title: 'Students',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="admins/index"
        options={{
          title: 'Admins',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Shield size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admins/add"
        options={{
          title: 'Add Admin',
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
