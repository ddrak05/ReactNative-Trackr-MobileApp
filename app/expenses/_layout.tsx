import { Colors } from "@/constants/colors";
import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import {Ionicons} from "@expo/vector-icons";

const { Navigator } = createMaterialTopTabNavigator();
const MaterialTabs = withLayoutContext(Navigator);

export default function ExpensesLayout() {
    return (
        <MaterialTabs
            tabBarPosition="bottom"
            screenOptions={{
                tabBarActiveTintColor: Colors.teal,
                tabBarInactiveTintColor: Colors.textSecondary,

                tabBarPressColor: Colors.purple,
                tabBarPressOpacity: 1,

                tabBarStyle: {
                    backgroundColor: Colors.surface,
                    borderTopWidth: 0.5,
                    borderTopColor: Colors.border,
                    elevation: 0,
                    shadowOpacity: 0,
                    height: 100,
                    paddingBottom: 30
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                },
                tabBarIndicatorStyle: {
                    height: 0
                },
                tabBarContentContainerStyle: {
                    height: '100%'
                },

                tabBarShowIcon: true,
                swipeEnabled: true,
            }}
        >
            <MaterialTabs.Screen name="index"
                options={{title: 'Overview',
                    tabBarIcon: ({ color }: {color: string}) => (
                        <Ionicons name="home-outline" size={20} color={color} />
                    )
                }}
            />
            <MaterialTabs.Screen name="summary"
                options={{title: 'Summary',
                    tabBarIcon: ({ color }: {color: string}) => (
                        <Ionicons name="pie-chart-outline" size={20} color={color} />
                    )
                }}
            />
            <MaterialTabs.Screen name="history"
                options={{title: 'History',
                    tabBarIcon: ({ color }: {color: string}) => (
                        <Ionicons name="time-outline" size={20} color={color} />
                    )
                }}
            />
        </MaterialTabs>
    )
}