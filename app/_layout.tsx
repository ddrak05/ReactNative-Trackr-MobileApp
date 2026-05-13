import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Tabs} from 'expo-router';
import {Colors} from "@/constants/colors";
import {Ionicons} from "@expo/vector-icons";

export default function Layout() {
    return (
        <GestureHandlerRootView style={{flex: 1}}>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: Colors.textPrimary,
                    tabBarInactiveTintColor: Colors.textPrimary,

                    tabBarStyle: {
                        backgroundColor: Colors.surface,
                        borderTopWidth: 0.5,
                        borderBottomColor: Colors.borderLight,
                        borderTopColor: Colors.surface,
                        shadowOpacity: 0,
                        height: 95
                    },

                    tabBarLabelStyle: {
                        fontSize: 13,
                        fontWeight: 'bold'
                    },

                    tabBarPosition: 'top',
                    headerShown: false
                }}
            >
                <Tabs.Screen name="expenses" options={{
                    title: 'Expenses',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="wallet-outline" size={size} color={color} />
                    )
                }} />
            </Tabs>
        </GestureHandlerRootView>
    )
}