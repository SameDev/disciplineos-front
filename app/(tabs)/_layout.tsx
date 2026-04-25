import { Tabs } from 'expo-router';
import { colors, fontSize, radius } from '@/constants/theme';
import { Platform, View, StyleSheet } from 'react-native';
import { ListTodo, Target, PlusCircle, BookOpen, User } from 'lucide-react-native';

function TabIcon({ icon, focused, color }: { icon: React.ReactNode; focused: boolean; color: string }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      {icon}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, focused }) => {
          const icons: Record<string, React.ReactNode> = {
            index: <ListTodo size={22} color={color} />,
            focus: <Target size={22} color={color} />,
            create: <PlusCircle size={22} color={color} />,
            notes: <BookOpen size={22} color={color} />,
            profile: <User size={22} color={color} />,
          };
          return (
            <TabIcon icon={icons[route.name]} focused={focused} color={color} />
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Missões' }} />
      <Tabs.Screen name="focus" options={{ title: 'Foco' }} />
      <Tabs.Screen name="create" options={{ title: 'Nova' }} />
      <Tabs.Screen name="notes" options={{ title: 'Notas' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  iconWrapActive: {
    backgroundColor: colors.accent + '20',
  },
});
