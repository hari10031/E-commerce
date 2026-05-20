import React from 'react';
import { View, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ProductsScreen from '../screens/products/ProductsScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import ProductWizardScreen from '../screens/products/wizard/ProductWizardScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import MoreScreen from '../screens/MoreScreen';
import CategoriesScreen from '../screens/categories/CategoriesScreen';
import EmployeesScreen from '../screens/employees/EmployeesScreen';
import CouponsScreen from '../screens/coupons/CouponsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const AMBER = '#f59e0b';
const GRAY = '#9ca3af';

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
    </Stack.Navigator>
  );
}

function ProductsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Products" component={ProductsScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="ProductWizard" component={ProductWizardScreen} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="More" component={MoreScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="Employees" component={EmployeesScreen} />
      <Stack.Screen name="Coupons" component={CouponsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

// Placeholder — the Create tab never renders a screen; tabPress is intercepted.
function CreatePlaceholder() {
  return null;
}

// Raised central "+" button used as the Create tab's button.
function CreateTabButton({ onPress }) {
  return (
    <Pressable onPress={onPress} className="flex-1 items-center justify-center">
      <View
        style={{
          top: -16,
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: AMBER,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: AMBER,
          shadowOpacity: 0.45,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <Ionicons name="add" size={32} color="#ffffff" />
      </View>
    </Pressable>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: AMBER,
        tabBarInactiveTintColor: GRAY,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f3f4f6',
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            DashboardTab: 'home',
            ProductsTab: 'cube',
            OrdersTab: 'receipt',
            MoreTab: 'ellipsis-horizontal',
          };
          const name = icons[route.name];
          if (!name) return null;
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardStack} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="ProductsTab" component={ProductsStack} options={{ title: 'Products' }} />
      <Tab.Screen
        name="CreateTab"
        component={CreatePlaceholder}
        options={{
          title: '',
          tabBarButton: (props) => <CreateTabButton onPress={props.onPress} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('ProductsTab', {
              screen: 'ProductWizard',
              params: { mode: 'create' },
            });
          },
        })}
      />
      <Tab.Screen name="OrdersTab" component={OrdersStack} options={{ title: 'Orders' }} />
      <Tab.Screen name="MoreTab" component={MoreStack} options={{ title: 'More' }} />
    </Tab.Navigator>
  );
}
