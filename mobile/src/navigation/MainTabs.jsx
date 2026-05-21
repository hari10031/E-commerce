import React, { useState, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import TypeSelectorModal from '../components/products/TypeSelectorModal';
import { navigationRef } from './navigationRef';

import useAuthStore from '../store/authStore';

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
import CustomersScreen from '../screens/customers/CustomersScreen';
import CustomerDetailScreen from '../screens/customers/CustomerDetailScreen';
import TeamScreen from '../screens/team/TeamScreen';
import EmployeeDetailScreen from '../screens/team/EmployeeDetailScreen';
import CreateUserScreen from '../screens/users/CreateUserScreen';
import MySalesScreen from '../screens/sales/MySalesScreen';

const Tab = createBottomTabNavigator();
const DashStack = createNativeStackNavigator();
const CollStack = createNativeStackNavigator();
const OrdStack = createNativeStackNavigator();
const MoreStk = createNativeStackNavigator();
const CustStack = createNativeStackNavigator();
const ProfStack = createNativeStackNavigator();

const AMBER = '#f59e0b';
const GRAY = '#9ca3af';

const STACK_OPTS = { headerShown: false };

function DashboardStack() {
  return (
    <DashStack.Navigator screenOptions={STACK_OPTS}>
      <DashStack.Screen name="Dashboard" component={DashboardScreen} />
      <DashStack.Screen name="MySales" component={MySalesScreen} />
    </DashStack.Navigator>
  );
}

function CollectionsStack() {
  return (
    <CollStack.Navigator screenOptions={STACK_OPTS}>
      <CollStack.Screen name="Products" component={ProductsScreen} />
      <CollStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <CollStack.Screen name="ProductWizard" component={ProductWizardScreen} />
    </CollStack.Navigator>
  );
}

function OrdersStack() {
  return (
    <OrdStack.Navigator screenOptions={STACK_OPTS}>
      <OrdStack.Screen name="Orders" component={OrdersScreen} />
      <OrdStack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </OrdStack.Navigator>
  );
}

function MoreStack() {
  return (
    <MoreStk.Navigator screenOptions={STACK_OPTS}>
      <MoreStk.Screen name="More" component={MoreScreen} />
      <MoreStk.Screen name="Analytics" component={AnalyticsScreen} />
      <MoreStk.Screen name="Categories" component={CategoriesScreen} />
      <MoreStk.Screen name="Employees" component={EmployeesScreen} />
      <MoreStk.Screen name="Coupons" component={CouponsScreen} />
      <MoreStk.Screen name="Profile" component={ProfileScreen} />
      <MoreStk.Screen name="Team" component={TeamScreen} />
      <MoreStk.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />
      <MoreStk.Screen name="CreateUser" component={CreateUserScreen} />
    </MoreStk.Navigator>
  );
}

function CustomersStack() {
  return (
    <CustStack.Navigator screenOptions={STACK_OPTS}>
      <CustStack.Screen name="Customers" component={CustomersScreen} />
      <CustStack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
      <CustStack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <CustStack.Screen name="CreateUser" component={CreateUserScreen} />
    </CustStack.Navigator>
  );
}

function ProfileStack() {
  return (
    <ProfStack.Navigator screenOptions={STACK_OPTS}>
      <ProfStack.Screen name="Profile" component={ProfileScreen} />
    </ProfStack.Navigator>
  );
}

function CreatePlaceholder() {
  return null;
}

function CreateTabButton({ onPress }) {
  const insets = useSafeAreaInsets();
  const lift = 16 + insets.bottom;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Pressable
        onPress={onPress}
        style={{
          top: -lift,
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
      </Pressable>
    </View>
  );
}

const TAB_STYLE = {
  backgroundColor: '#ffffff',
  borderTopColor: '#f3f4f6',
  borderTopWidth: 1,
  paddingBottom: 4,
  paddingTop: 4,
  height: 60,
};

const TAB_LABEL_STYLE = { fontSize: 11, fontWeight: '600' };

// Grow the tab bar by the device's bottom inset so it never sits under the
// Android system nav bar / iOS home indicator.
function useTabBarStyle() {
  const insets = useSafeAreaInsets();
  return {
    ...TAB_STYLE,
    height: 60 + insets.bottom,
    paddingBottom: insets.bottom + 4,
  };
}

function AdminTabs({ onCreatePress }) {
  const tabBarStyle = useTabBarStyle();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: AMBER,
        tabBarInactiveTintColor: GRAY,
        tabBarStyle,
        tabBarLabelStyle: TAB_LABEL_STYLE,
        tabBarIcon: ({ color, size }) => {
          const icons = {
            DashboardTab: 'home',
            CollectionsTab: 'diamond',
            CustomersTab: 'people',
            MoreTab: 'ellipsis-horizontal',
          };
          const name = icons[route.name];
          if (!name) return null;
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardStack} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="CollectionsTab" component={CollectionsStack} options={{ title: 'Collections' }} />
      <Tab.Screen
        name="CreateTab"
        component={CreatePlaceholder}
        options={{
          title: '',
          tabBarButton: (props) => <CreateTabButton onPress={props.onPress} />,
        }}
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            onCreatePress();
          },
        })}
      />
      <Tab.Screen name="CustomersTab" component={CustomersStack} options={{ title: 'Customers' }} />
      <Tab.Screen name="MoreTab" component={MoreStack} options={{ title: 'More' }} />
    </Tab.Navigator>
  );
}

function EmployeeTabs({ onCreatePress }) {
  const tabBarStyle = useTabBarStyle();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: AMBER,
        tabBarInactiveTintColor: GRAY,
        tabBarStyle,
        tabBarLabelStyle: TAB_LABEL_STYLE,
        tabBarIcon: ({ color, size }) => {
          const icons = {
            DashboardTab: 'home',
            CollectionsTab: 'diamond',
            ProfileTab: 'person',
          };
          const name = icons[route.name];
          if (!name) return null;
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardStack} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="CollectionsTab" component={CollectionsStack} options={{ title: 'Collections' }} />
      <Tab.Screen
        name="CreateTab"
        component={CreatePlaceholder}
        options={{
          title: '',
          tabBarButton: (props) => <CreateTabButton onPress={props.onPress} />,
        }}
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            onCreatePress();
          },
        })}
      />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

function CustomerTabs() {
  const tabBarStyle = useTabBarStyle();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: AMBER,
        tabBarInactiveTintColor: GRAY,
        tabBarStyle,
        tabBarLabelStyle: TAB_LABEL_STYLE,
        tabBarIcon: ({ color, size }) => {
          const icons = {
            DashboardTab: 'home',
            CollectionsTab: 'diamond',
            ProfileTab: 'person',
          };
          const name = icons[route.name];
          if (!name) return null;
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardStack} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="CollectionsTab" component={CollectionsStack} options={{ title: 'Collections' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function MainTabs() {
  const { user, viewMode } = useAuthStore();
  const [showTypeModal, setShowTypeModal] = useState(false);

  const handleCreatePress = useCallback(() => {
    setShowTypeModal(true);
  }, []);

  const handleTypeSelect = useCallback((type) => {
    setShowTypeModal(false);
    if (navigationRef.isReady()) {
      navigationRef.navigate('CollectionsTab', {
        screen: 'ProductWizard',
        params: { mode: 'create', type },
      });
    }
  }, []);

  if (viewMode === 'user') {
    return <CustomerTabs />;
  }

  const role = user?.role;
  const TabsComponent = role === 'employee' ? EmployeeTabs : AdminTabs;

  return (
    <>
      <TabsComponent onCreatePress={handleCreatePress} />
      <TypeSelectorModal
        visible={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        onSelect={handleTypeSelect}
      />
    </>
  );
}
