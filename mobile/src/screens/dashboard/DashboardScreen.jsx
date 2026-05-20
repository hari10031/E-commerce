import React from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthStore from '../../store/authStore';
import { getDashboard, getOfflineSales } from '../../lib/api';
import { formatPrice } from '../../lib/utils';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getFormattedDate() {
  const d = new Date();
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function QuickActionCard({ icon, label, bgColor, iconColor, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 min-w-[45%] rounded-2xl p-4 m-1.5 active:opacity-80"
      style={{ backgroundColor: bgColor }}
    >
      <View className="w-10 h-10 rounded-full items-center justify-center mb-3" style={{ backgroundColor: `${iconColor}20` }}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text className="text-sm font-semibold text-white">{label}</Text>
    </Pressable>
  );
}

function MetricCard({ label, value }) {
  return (
    <View className="flex-1 bg-white rounded-xl p-3 mx-1 items-center shadow-sm">
      <Text className="text-lg font-bold text-gray-900">{value ?? '—'}</Text>
      <Text className="text-[10px] text-gray-500 mt-1 text-center">{label}</Text>
    </View>
  );
}

function SaleRow({ customerName, productName, price }) {
  return (
    <View className="flex-row items-center py-3 border-b border-gray-50 px-4">
      <View className="w-9 h-9 rounded-full bg-amber-100 items-center justify-center mr-3">
        <Ionicons name="person" size={16} color="#f59e0b" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>{customerName}</Text>
        <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>{productName}</Text>
      </View>
      <Text className="text-sm font-bold text-gray-900">{formatPrice(price)}</Text>
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const viewMode = useAuthStore((s) => s.viewMode);

  const role = viewMode === 'user' ? 'customer' : (user?.role || 'customer');
  const isAdmin = role === 'admin';
  const isEmployee = role === 'employee';
  const isCustomer = role === 'customer';

  const { data: stats, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    staleTime: 60_000,
    enabled: isAdmin || isEmployee,
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['offline-sales'],
    queryFn: () => getOfflineSales({ limit: 5 }),
    staleTime: 60_000,
    enabled: isAdmin || isEmployee,
  });

  const recentSales = salesData?.data ?? salesData ?? [];
  const isLoading = (isAdmin || isEmployee) && dashLoading;

  const navigateToTab = (tabName, screen, params) => {
    if (screen) {
      navigation.navigate(tabName, { screen, params });
    } else {
      navigation.navigate(tabName);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-amber-50/30"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Gradient Header */}
      <LinearGradient
        colors={['#f59e0b', '#d97706']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
      >
        <Text className="text-amber-100 text-sm font-medium">{getFormattedDate()}</Text>
        <Text className="text-white text-2xl font-bold mt-1">
          Welcome back ✨
        </Text>
        <Text className="text-amber-100 text-base mt-0.5">
          {user?.name?.split(' ')[0] || 'there'}
        </Text>
      </LinearGradient>

      <View className="px-4 -mt-5">
        {/* Revenue Card (Admin) */}
        {isAdmin && (
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            {dashLoading ? (
              <ActivityIndicator color="#f59e0b" />
            ) : (
              <>
                <Text className="text-xs font-semibold text-gray-400 tracking-widest">TOTAL REVENUE</Text>
                <View className="flex-row items-end mt-2">
                  <Text className="text-3xl font-bold text-gray-900">
                    {formatPrice(stats?.totalRevenue ?? 0)}
                  </Text>
                  <View className="ml-3 bg-green-100 px-2 py-0.5 rounded-full mb-1">
                    <Text className="text-xs font-bold text-green-700">+12.4%</Text>
                  </View>
                </View>
                <Text className="text-xs text-gray-500 mt-2">
                  {stats?.totalOrders ?? 0} completed • {stats?.pendingOrders ?? 0} pending
                </Text>
              </>
            )}
          </View>
        )}

        {/* Employee KPI Card */}
        {isEmployee && (
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            {dashLoading ? (
              <ActivityIndicator color="#f59e0b" />
            ) : (
              <>
                <Text className="text-xs font-semibold text-gray-400 tracking-widest">MY SALES</Text>
                <View className="flex-row items-end mt-2">
                  <Text className="text-3xl font-bold text-gray-900">
                    {formatPrice(stats?.revenueThisMonth ?? stats?.totalRevenue ?? 0)}
                  </Text>
                </View>
                <Text className="text-xs text-gray-500 mt-2">
                  {stats?.totalOrders ?? 0} orders this month
                </Text>
              </>
            )}
          </View>
        )}

        {/* Customer Welcome Card */}
        {isCustomer && (
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <Text className="text-lg font-bold text-gray-900">Namaste! 🙏</Text>
            <Text className="text-sm text-gray-500 mt-1">
              Explore our curated collection of Indian ethnic wear and jewellery.
            </Text>
          </View>
        )}

        {/* Notification Banner (Admin only) */}
        {isAdmin && (stats?.pendingOrders ?? 0) > 0 && (
          <Pressable
            onPress={() => navigateToTab('CustomersTab')}
            className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex-row items-center active:bg-amber-100"
          >
            <View className="w-8 h-8 rounded-full bg-amber-200 items-center justify-center mr-3">
              <Ionicons name="notifications" size={16} color="#d97706" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-amber-900">
                {stats?.pendingOrders ?? 2} sales need approval
              </Text>
            </View>
            <Text className="text-sm font-semibold text-amber-600">Review ›</Text>
          </Pressable>
        )}

        {/* Quick Actions */}
        <View className="mb-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Quick Actions</Text>
          <View className="flex-row flex-wrap">
            {isAdmin && (
              <>
                <QuickActionCard
                  icon="diamond"
                  label="Collections"
                  bgColor="#9f1239"
                  iconColor="#fecdd3"
                  onPress={() => navigateToTab('CollectionsTab')}
                />
                <QuickActionCard
                  icon="checkmark-circle"
                  label="Approvals"
                  bgColor="#0d9488"
                  iconColor="#ccfbf1"
                  onPress={() => navigateToTab('CustomersTab')}
                />
                <QuickActionCard
                  icon="bar-chart"
                  label="Analytics"
                  bgColor="#7c3aed"
                  iconColor="#ede9fe"
                  onPress={() => navigateToTab('MoreTab', 'Analytics')}
                />
                <QuickActionCard
                  icon="people"
                  label="Team"
                  bgColor="#b45309"
                  iconColor="#fef3c7"
                  onPress={() => navigateToTab('MoreTab', 'Team')}
                />
              </>
            )}
            {isEmployee && (
              <>
                <QuickActionCard
                  icon="diamond"
                  label="Collections"
                  bgColor="#9f1239"
                  iconColor="#fecdd3"
                  onPress={() => navigateToTab('CollectionsTab')}
                />
                <QuickActionCard
                  icon="add-circle"
                  label="Add Product"
                  bgColor="#0d9488"
                  iconColor="#ccfbf1"
                  onPress={() => navigateToTab('CollectionsTab', 'ProductWizard', { mode: 'create' })}
                />
              </>
            )}
            {isCustomer && (
              <QuickActionCard
                icon="diamond"
                label="Collections"
                bgColor="#9f1239"
                iconColor="#fecdd3"
                onPress={() => navigateToTab('CollectionsTab')}
              />
            )}
          </View>
        </View>

        {/* Inventory Summary (Admin) */}
        {isAdmin && !dashLoading && stats && (
          <View className="mb-4">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Inventory</Text>
            <View className="flex-row">
              <MetricCard label="Total" value={stats.totalProducts ?? 0} />
              <MetricCard label="Available" value={(stats.totalProducts ?? 0) - (stats.lowStockVariants ?? 0)} />
              <MetricCard label="Low Stock" value={stats.lowStockVariants ?? 0} />
              <MetricCard label="Team" value={stats.totalEmployees ?? '—'} />
            </View>
          </View>
        )}

        {/* Recent Sales (Admin/Employee) */}
        {(isAdmin || isEmployee) && !salesLoading && Array.isArray(recentSales) && recentSales.length > 0 && (
          <View className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
            <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
              <Text className="text-sm font-semibold text-gray-900">Recent Sales</Text>
              <Pressable onPress={() => navigateToTab('MoreTab')}>
                <Text className="text-xs font-medium text-amber-600">View all</Text>
              </Pressable>
            </View>
            {recentSales.slice(0, 5).map((sale, idx) => (
              <SaleRow
                key={sale.id ?? idx}
                customerName={sale.customer_name ?? sale.customerName ?? 'Walk-in'}
                productName={sale.product_name ?? sale.productName ?? sale.items?.[0]?.name ?? 'Product'}
                price={sale.total_amount ?? sale.totalAmount ?? sale.amount ?? 0}
              />
            ))}
          </View>
        )}

        {/* Loading state for sales */}
        {(isAdmin || isEmployee) && salesLoading && (
          <View className="bg-white rounded-2xl p-6 items-center shadow-sm mb-4">
            <ActivityIndicator color="#f59e0b" />
            <Text className="text-xs text-gray-400 mt-2">Loading sales…</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
