import {Animated, BackHandler, Dimensions, FlatList, Pressable, ScrollView, StyleSheet, Text, View} from "react-native";
import {Colors} from "@/constants/colors";
import {useExpenses} from '@/hooks/useExpenses'
import {useFocusEffect, useNavigation} from 'expo-router'
import {useCallback, useEffect, useRef, useState} from 'react'
import {Ionicons} from '@expo/vector-icons'
import {PieChart} from 'react-native-gifted-charts'
import TransactionRow from "@/components/TransactionRow";

const SCREEN_WIDTH = Dimensions.get('window').width

export default function Summary () {
    const {expenses, loadExpenses} = useExpenses()

    // Reload when tab comes into focus
    useFocusEffect(
        useCallback(() => {
            loadExpenses()
        }, [])
    )

    // Month State
    const now = new Date()
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
    const [selectedYear, setSelectedYear] = useState(now.getFullYear())

    // Month Slide Animation
    const monthSlideAnim = useRef(new Animated.Value(0)).current
    const animateMonthChange = (newMonth: number, newYear: number, direction: 'left' | 'right') => {
        const toValue = direction === 'left' ? -SCREEN_WIDTH : SCREEN_WIDTH

        Animated.timing(monthSlideAnim, {
            toValue,
            duration: 200,
            useNativeDriver: true
        }).start(() => {
            setSelectedMonth(newMonth)
            setSelectedYear(newYear)
            monthSlideAnim.setValue(-toValue)
            Animated.timing(monthSlideAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }).start()
        })
    }

    const goToPrevMonth = () => {
        if (selectedMonth === 0) {
            animateMonthChange(11, selectedYear - 1, 'right')
        } else {
            animateMonthChange(selectedMonth - 1, selectedYear, 'right')
        }
    }

    const goToNextMonth = () => {
        if (selectedMonth === now.getMonth() && selectedYear === now.getFullYear()) return;
        if (selectedMonth === 11) {
            animateMonthChange(0, selectedYear + 1, 'left')
        } else {
            animateMonthChange(selectedMonth + 1, selectedYear, 'left')
        }
    }

    const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear()
    const monthLabel = new Date(selectedYear, selectedMonth).toLocaleDateString('en-GB', {
        month: 'long', year: 'numeric'
    })

    // Filter expenses for selected month
    const monthlyExpenses = expenses.filter((e) => {
        const date = new Date(e.date)
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
    })

    // Calculate Totals
    const totalIncome = monthlyExpenses
        .filter((e) => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0)

    const totalExpenses = monthlyExpenses
        .filter((e) => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0)

    const netBalance = totalIncome - totalExpenses

    // Toggle Between Income and Expense Chart
    const [activeType, setActiveType] = useState<'income' | 'expense'>('expense')

    const [focusedSlice, setFocusedSlice] = useState<{
        label: string;
        value: number;
        percentage: number;
        color: string
    } | null>(null)

    const [selectedCategory, setSelectedCategory] = useState<{
        label: string;
        color: string;
    } | null>(null)

    // Group By Category
    const categoryTotals: Record<string, number> = {}
    monthlyExpenses
        .filter((e) => e.type === activeType)
        .forEach((e) => {
            if(!categoryTotals[e.category]) categoryTotals[e.category] = 0
            categoryTotals[e.category] += e.amount
        })

    const activeTotal = activeType === 'income' ? totalIncome : totalExpenses

    // Chart color per category
    const CATEGORY_COLORS: Record<string, string> = {
        food:           '#EF9F27',
        transport:      '#7F77DD',
        health:         '#5DCAA5',
        shopping:       '#D85A30',
        entertainment:  '#D4537E',
        rent:           '#378ADD',
        subscription:   '#639922',
        other:          '#888780',
        salary:         '#1D9E75',
        freelance:      '#5DCAA5',
        investment:     '#378ADD',
        gift:           '#D4537E',
    }

    const CATEGORY_LABELS: Record<string, string> = {
        food:           'Food',
        transport:      'Transport',
        health:         'Health',
        shopping:       'Shopping',
        entertainment:  'Entertainment',
        rent:           'Rent',
        subscription:   'Subscriptions',
        other:          'Other',
        salary:         'Salary',
        freelance:      'Freelance',
        investment:     'Investment',
        gift:           'Gift',
    }

    // Pie chart data
    const pieData = Object.entries(categoryTotals).map(([category, amount]) => ({
        value: amount,
        color: CATEGORY_COLORS[category] ?? '#888780',
        label: CATEGORY_LABELS[category] ?? category,
        percentage: activeTotal > 0 ? Math.round((amount / activeTotal) * 100) : 0
    }))

    // Sort
    pieData.sort((a, b) => b.value - a.value)

    // Find category key from the label (eg "Food" --> "food")
    const selectedCategoryKey = selectedCategory
        ? Object.entries(CATEGORY_LABELS).find(([_, label]) => label === selectedCategory.label)?.[0]
        : null

    // Filter Transactions for the drill-down
    const categoryTransactions = monthlyExpenses.filter((e) => (
        e.type === activeType && e.category === selectedCategoryKey
    ))

    // Drill Down Animation
    const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current

    useEffect(() => {
        if (selectedCategory) {
            slideAnim.setValue(300)
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }).start()
        }
    }, [selectedCategory, slideAnim])

    const handleBack = () => {
        Animated.timing(slideAnim, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setSelectedCategory(null)
        })
    }

    const toggleAnim = useRef(new Animated.Value(0)).current
    const [toggleWidth, setToggleWidth] = useState(0)
    const handleTypeChange = (newType: 'income' | 'expense') => {
        setActiveType(newType)
        setFocusedSlice(null)
        Animated.timing(toggleAnim, {
            toValue: newType === 'income' ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start()
    }

    // Back Button Pressed while Category Panel is open
    useEffect(() => {
        const handler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (selectedCategory) {
                handleBack()
                return true
            }
            return false
        })

        // Cleanup when component unmounts
        return () => handler.remove()
    }, [selectedCategory]);

    // Scroll to the top or close drill-down if tab button is pressed
    const navigation = useNavigation()
    const scrollRef = useRef<any>(null)
    useEffect(() => {
        return navigation.addListener('tabPress' as any, () => {
            if (selectedCategory) {
                handleBack()
            } else {
                scrollRef.current?.scrollTo({y: 0, animated: true})  // scroll to top
            }
        })
    }, [selectedCategory])

    return (
        <View style={styles.wrapper}>
            <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={styles.content}>
                {/* Month Navigator */}
                <View style={styles.month}>
                    <Pressable onPress={goToPrevMonth} style={styles.navBtn}>
                        <Ionicons name='chevron-back' size={20} color={Colors.textSecondary} />
                    </Pressable>

                    <Text style={styles.monthLabel}>{monthLabel}</Text>
                    <Pressable onPress={goToNextMonth} style={styles.navBtn} disabled={isCurrentMonth}>
                        <Ionicons name="chevron-forward" size={20} color={isCurrentMonth ? Colors.textMuted : Colors.textSecondary} />
                    </Pressable>
                </View>

                {/* Slide When Month Changes */}
                <Animated.View style={{
                    transform: [{translateX: monthSlideAnim}]
                }} >

                    {/* Net Balance Card */}
                    <View style={styles.summaryCard}>
                        <Pressable style={({pressed}) => [
                            styles.summaryItem,
                            {backgroundColor: pressed ? Colors.cardPress : Colors.surface}
                        ]}>
                            <Text style={styles.summaryLabel}>Income</Text>
                            <Text style={[styles.summaryAmount, {color: Colors.income}]}>
                                {totalIncome.toLocaleString('en-GB', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}€
                            </Text>
                        </Pressable>

                        <View style={styles.divider} />

                        <Pressable style={({pressed}) => [
                            styles.summaryItem,
                            {backgroundColor: pressed ? Colors.cardPress : Colors.surface}
                        ]}>
                            <Text style={styles.summaryLabel}>Expenses</Text>
                            <Text style={[styles.summaryAmount, {color: Colors.expense}]}>
                                {totalExpenses.toLocaleString('en-GB', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}€
                            </Text>
                        </Pressable>

                        <View style={styles.divider} />

                        <Pressable style={({pressed}) => [
                            styles.summaryItem,
                            {backgroundColor: pressed ? Colors.cardPress : Colors.surface}
                        ]}>
                            <Text style={styles.summaryLabel}>Net</Text>
                            <Text style={[styles.summaryAmount, {color: netBalance >= 0 ? Colors.income : Colors.expense}]}>
                                {netBalance > 0 ? '+' : ''}{netBalance.toLocaleString('en-GB', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}€
                            </Text>
                        </Pressable>
                    </View>

                    {/* Income / Expense Toggle */}
                    <View style={styles.toggle}
                        onLayout={(e) => {setToggleWidth(e.nativeEvent.layout.width)}}
                    >
                        {/* sliding background */}
                        <Animated.View style={[
                            styles.toggleSlider,
                            {
                                backgroundColor: activeType === 'income' ? Colors.teal : Colors.expense,
                                transform: [{
                                    translateX: toggleAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, toggleWidth / 2]
                                    })
                                }]
                            }
                        ]} />

                        <Pressable onPress={() => handleTypeChange('expense')}
                            style={styles.toggleBtn}
                        >
                            <Text style={[styles.toggleText, activeType === 'expense' && styles.toggleTextActive]}>Expenses</Text>
                        </Pressable>

                        <Pressable onPress={() => handleTypeChange('income')}
                            style={styles.toggleBtn}
                        >
                            <Text style={[styles.toggleText, activeType === 'income' && styles.toggleTextActive]}>Income</Text>
                        </Pressable>
                    </View>

                    {/* Chart */}
                    {pieData.length > 0 ? (
                        <View style={styles.chartContainer}>
                            <PieChart
                                donut
                                data={pieData}
                                radius={110}
                                innerRadius={70}
                                showText
                                textColor="#fff"
                                backgroundColor={Colors.background}
                                textSize={13}
                                fontWeight="bold"
                                showTextBackground={false}
                                centerLabelComponent={() => {
                                    if(focusedSlice) {
                                        return (
                                            <View style={styles.chartCenter}>
                                                <Text style={styles.chartCenterLabel}>{focusedSlice.label}</Text>
                                                <Text style={styles.chartCenterAmount}>
                                                    {focusedSlice.value.toLocaleString('en-GB', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    })}€
                                                </Text>
                                                <Text style={styles.chartCenterPercent}>({focusedSlice.percentage}%)</Text>
                                            </View>
                                        )
                                    }
                                    return (
                                        <View style={styles.chartCenter}>
                                            <Text style={styles.chartCenterLabel}>
                                                {activeType === 'income' ? 'Income' : 'Expenses'}
                                            </Text>
                                            <Text style={styles.chartCenterAmount}>
                                                {activeTotal.toLocaleString('en-GB', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}€
                                            </Text>
                                        </View>
                                    )
                                }}
                                onPress={(item: any) => {
                                    setFocusedSlice((prev) => prev?.label === item.label ? null : item)
                                }}
                            />
                        </View>
                    ) : (
                        <View style={styles.chartEmpty}>
                            <Text style={styles.chartEmptyText}>
                                No {activeType} data for this month
                            </Text>
                        </View>
                    )}

                    {/* Category Breakdown */}
                    {pieData.length > 0 && (
                        <View style={styles.breakdown}>
                            <Text style={styles.breakdownTitle}>
                                {activeType === 'income' ? 'Income' : 'Expense'} Breakdown
                            </Text>

                            {pieData.map((item) => (
                                <Pressable key={item.label}
                                      style={({ pressed }) => [
                                          styles.breakdownRow,
                                          {backgroundColor: pressed
                                              ? Colors.cardPress
                                                  : focusedSlice?.label === item.label
                                                      ? Colors.cardPress
                                                      : Colors.surface
                                          }
                                      ]}
                                      onPress={() => setSelectedCategory({label: item.label, color: item.color})}
                                >
                                    {/* Left Side - Dot + Label */}
                                    <View style={styles.left}>
                                        <View style={[styles.breakdownDot, {backgroundColor: item.color}]} />
                                        <Text style={styles.breakdownLabel}>{item.label}</Text>
                                    </View>

                                    {/* Center - Percentage Bar */}
                                    <View style={styles.barTrack}>
                                        <View style={[
                                            styles.barFill,
                                            {
                                                width: `${item.percentage}%`,
                                                backgroundColor: item.color
                                            }
                                        ]} />
                                    </View>

                                    {/* Right: Amount + Percentage */}
                                    <View style={styles.breakdownRight}>
                                        <Text style={styles.breakdownAmount}>
                                            {item.value.toLocaleString('en-GB', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}€
                                        </Text>
                                        <Text style={styles.breakdownPercent}>
                                            {item.percentage}%
                                        </Text>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    )}
                </Animated.View>
            </ScrollView>

            {/* Category Panel */}
            <Animated.View style={[
                    styles.drillDown,
                    {transform: [{translateX: slideAnim}]}
                ]}>
                {/* Header */}
                <View style={styles.drillDownHeader}>
                    <Pressable onPress={handleBack} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
                        <Text style={styles.backBtnText}>Back</Text>
                    </Pressable>

                    <View style={styles.drillDownTitle}>
                        {selectedCategory && (
                            <>
                                <View style={[styles.drillDownDot, { backgroundColor: selectedCategory.color }]} />
                                <Text style={styles.drillDownTitleText}>{selectedCategory.label}</Text>
                            </>
                        )}
                    </View>

                    {/* To balance the header */}
                    <View style={{width: 60}} />
                </View>

                {/* Transactions */}
                <FlatList
                    data={categoryTransactions}
                    keyExtractor={(item) => item.id}
                    renderItem={({item}) => (
                                <TransactionRow expense={item} />
                            )}
                    ListHeaderComponent={
                    <View style={styles.drillDownMeta}>
                        <Text style={styles.drillDownMetaText}>
                            {categoryTransactions.length} transaction{categoryTransactions.length !== 1 ? 's' : ''} · {monthLabel}
                        </Text>
                    </View>
                }
                    ListEmptyComponent={
                    <View style={styles.drillDownEmpty}>
                        <Text style={styles.drillDownEmptyText}>No Transactions Found!</Text>
                    </View>
                }
                />
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: Colors.background
    },
    container: {
        flex: 1,
        backgroundColor: Colors.background
    },
    content: {
        paddingBottom: 40
    },

    // Month Navigator
    month: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 12,
        backgroundColor: Colors.surface,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border
    },
    navBtn: {
        padding: 4
    },
    monthLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textSecondary
    },

    // Summary Grid
    summaryCard: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: Colors.border
    },
    summaryItem: {
        flex: 1,
        padding: 14,
        alignItems: 'center',
        gap: 4
    },
    summaryLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    summaryAmount: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    divider: {
        width: 0.5,
        backgroundColor: Colors.divider,
        marginVertical: 10
    },

    // Toggle
    toggle: {
        flexDirection: 'row',
        marginHorizontal: 12,
        marginTop: 12,
        backgroundColor: Colors.card,
        borderRadius: 10,
        padding: 4,
        gap: 0,
        position: 'relative',
        overflow: 'hidden'
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
        zIndex: 1
    },
    toggleSlider: {
        position: 'absolute',
        top: 4,
        left: 4,
        bottom: 4,
        width: '50%',
        borderRadius: 8,
        zIndex: 0
    },
    toggleBtnExpense: {
        backgroundColor: Colors.expense
    },
    toggleBtnIncome: {
        backgroundColor: Colors.teal
    },
    toggleText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.textSecondary
    },
    toggleTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },

    // Chart
    chartContainer: {
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 8,
        backgroundColor: Colors.background
    },
    chartCenter: {
        alignItems: 'center',
        gap: 4
    },
    chartCenterLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    chartCenterPercent: {
        fontSize: 16,
        color: Colors.teal,
        fontWeight: 'bold',
    },
    chartCenterAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    chartEmpty: {
        alignItems: 'center',
        marginTop: 60
    },
    chartEmptyText: {
        fontSize: 14,
        color: Colors.textMuted
    },

    // Breakdown
    breakdown: {
        marginHorizontal: 16,
        marginTop: 24,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: Colors.border,
        overflow: 'hidden'
    },
    breakdownTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        padding: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border
    },
    breakdownRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border,
        gap: 10
    },
    breakdownRowActive: {
        backgroundColor: Colors.cardPress,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: 100
    },
    breakdownDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        flexShrink: 0
    },
    breakdownLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        flexShrink: 1
    },
    barTrack: {
        flex: 1,
        height: 6,
        backgroundColor: Colors.card,
        borderRadius: 3,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 3
    },
    breakdownRight: {
        alignItems: 'flex-end',
        gap: 2,
        width: 70
    },
    breakdownAmount: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.textPrimary
    },
    breakdownPercent: {
        fontSize: 11,
        color: Colors.textSecondary
    },

    // Drill Down
    drillDown: {
        position:'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: Colors.background
    },
    drillDownHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: Colors.surface,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        width: 60
    },
    backBtnText: {
        fontSize: 14,
        color: Colors.textSecondary
    },
    drillDownTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    drillDownDot: {
        width: 10,
        height: 10,
        borderRadius: 5
    },
    drillDownTitleText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.textPrimary
    },
    drillDownMeta: {
        paddingHorizontal: 20,
        paddingVertical: 10
    },
    drillDownMetaText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    drillDownEmpty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    drillDownEmptyText: {
        fontSize: 14,
        color: Colors.textMuted,
    },
})