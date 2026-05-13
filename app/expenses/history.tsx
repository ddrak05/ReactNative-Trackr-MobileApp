import {
    Pressable, StyleSheet, Text,
    View, FlatList, Animated, Dimensions
} from "react-native";
import {Colors} from "@/constants/colors";
import {Category, Expense} from "@/types";
import {useExpenses} from "@/hooks/useExpenses";
import {useCallback, useState, useRef, useEffect} from "react";
import {Ionicons} from "@expo/vector-icons";
import TransactionRow from "@/components/TransactionRow";
import {useFocusEffect, useNavigation} from "expo-router";

// ── category filter pills ──
const EXPENSE_CATEGORY_FILTERS: { value: Category; label: string }[] = [
    { value: 'food',          label: '🍔 Food' },
    { value: 'transport',     label: '🚗 Transport' },
    { value: 'health',        label: '💊 Health' },
    { value: 'shopping',      label: '🛍️ Shopping' },
    { value: 'entertainment', label: '🎬 Entertainment' },
    { value: 'rent',          label: '🏠 Rent' },
    { value: 'subscription', label: '🔄 Subscriptions' },
    { value: 'other',         label: '📦 Other' },
]

const INCOME_CATEGORY_FILTERS: { value: Category; label: string }[] = [
    { value: 'salary',      label: '💼 Salary' },
    { value: 'freelance',   label: '💻 Freelance' },
    { value: 'investment',  label: '📈 Investment' },
    { value: 'gift',        label: '🎁 Gift' },
    { value: 'other',       label: '📦 Other' },
]

// ── type filter options ──
const TYPE_FILTERS = [
    { value: 'all',     label: 'All' },
    { value: 'income',  label: 'Income' },
    { value: 'expense', label: 'Expense' },
]

const SCREEN_WIDTH = Dimensions.get('window').width

// ── format date header labels ──
function formatGroupHeader(isoString: string): string {
    const date = new Date(isoString)
    const now = new Date()

    const isToday = date.toDateString() === now.toDateString()
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()

    if (isToday) return 'Today'
    if (isYesterday) return 'Yesterday'
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
}

// Group by Date
function groupByDate(expenses: Expense[]): { date: string; data: Expense[] }[] {
    const groups: Record<string, Expense[]> = {} // group format {"date": "...expenses"}
    expenses.forEach(expense => {
        const key = expense.date.split('T')[0] // date part
        if(!groups[key]) groups[key] = [] // for new date groups
        groups[key].push(expense)
    })

    // Convert object to array
    const array = Object.entries(groups)

    // Sort by date
    array.sort(([dateA], [dateB]) => {
        return dateB.localeCompare(dateA)
    })

    // Reshape each item
    return array.map(([date, data]) => {
        return {date, data}
    })
}

export default function History () {
    const {expenses, loadExpenses} = useExpenses()

    // Filter State
    const now = new Date()
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
    const [selectedYear, setSelectedYear] = useState(now.getFullYear())
    const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
    const [categoryFilter, setCategoryFilter] = useState<Category | null>(null)

    // Month Slide Animation
    const monthSlideAnim = useRef(new Animated.Value(0)).current
    const animateMonthChange = (newMonth: number, newYear: number, direction: 'left' | 'right') => {
        const toValue = direction === 'left' ? -SCREEN_WIDTH : SCREEN_WIDTH

        Animated.timing(monthSlideAnim, {
            toValue,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setSelectedMonth(newMonth)
            setSelectedYear(newYear)
            monthSlideAnim.setValue(-toValue)
            Animated.timing(monthSlideAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start()
        })
    }

    // Month Navigation
    const goToPrevMonth = () => {
        if (selectedMonth === 0) {
            animateMonthChange(11, selectedYear - 1, 'right')
        } else {
            animateMonthChange(selectedMonth - 1, selectedYear, 'right')
        }
    }

    const goToNextMonth = () => {
        if (selectedMonth === now.getMonth() && selectedYear === now.getFullYear()) return
        if (selectedMonth === 11) {
            animateMonthChange(0, selectedYear + 1, 'left')
        } else {
            animateMonthChange(selectedMonth + 1, selectedYear, 'left')
        }
    }

    // can't go past current month
    const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear()
    const monthLabel = new Date(selectedYear, selectedMonth).toLocaleDateString('en-GB', {
        month: 'long', year: 'numeric'
    })

    // Apply all filters
    const filtered = expenses.filter(e => {
        const date = new Date(e.date)

        // Month Filter
        if(date.getMonth() !== selectedMonth || date.getFullYear() !== selectedYear) return false

        // Type Filter
        if (typeFilter !== 'all' && e.type !== typeFilter) return false

        // Category Filter
        return !(categoryFilter && e.category !== categoryFilter);
    })

    // Sort newest first then group by date
    const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date))
    const grouped = groupByDate(sorted)

    type ListItem =
        | {type: 'header'; date: string}
        | {type: 'row'; expense: Expense}

    const listData: ListItem[] = grouped.flatMap(({ date, data }) => [
        {type: 'header', date},
        ...data.map((expense) => ({ type: 'row' as const, expense }))
    ])

    // reload expenses every time this screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadExpenses()
        }, [])
    )

    // Type change
    const toggleAnim = useRef(new Animated.Value(0)).current  // 0 = all, 1 = income, 2 = expense
    const [toggleWidth, setToggleWidth] = useState(0)
    const handleTypeChange = (newType: 'all' | 'income' | 'expense') => {
        setTypeFilter(newType)
        setCategoryFilter(null)
        const toValue = newType === 'all' ? 0 : newType === 'income' ? 1 : 2
        Animated.timing(toggleAnim, {
            toValue,
            duration: 200,
            useNativeDriver: false,
        }).start()
    }

    // Scroll to the top when tab button is pressed
    const navigation = useNavigation()
    const scrollRef = useRef<FlatList>(null)
    useEffect(() => {
        return navigation.addListener('tabPress' as any, () => {
            scrollRef.current?.scrollToOffset({ offset: 0, animated: true })
        })
    }, [])

    return (
        <View style={styles.container}>
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
            <Animated.View style={[
                styles.animatedContent,
                {transform: [{translateX: monthSlideAnim}]}
            ]}>
                {/* Type Filter */}
                <View style={styles.filterSection}>
                    <View style={styles.typeRow}
                          onLayout={(e) => setToggleWidth(e.nativeEvent.layout.width)}
                    >
                        {/* sliding background */}
                        <Animated.View style={[
                            styles.toggleSlider,
                            {
                                backgroundColor: typeFilter === 'income'
                                    ? Colors.income
                                    : typeFilter === 'expense'
                                        ? Colors.expense
                                        : Colors.blue,
                                transform: [{
                                    translateX: toggleAnim.interpolate({
                                        inputRange: [0, 1, 2],
                                        outputRange: [0, toggleWidth / 3, (toggleWidth / 3) * 2]
                                    })
                                }]
                            }
                        ]} />

                        {TYPE_FILTERS.map((f) => (
                            <Pressable
                                key={f.value}
                                style={styles.type}
                                onPress={() => handleTypeChange(f.value as typeof typeFilter)}
                            >
                                <Text style={[
                                    styles.typeText,
                                    typeFilter === f.value && styles.typeTextActive
                                ]}>
                                    {f.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Category Filter */}
                <View style={styles.categoryWrapper}>
                    {typeFilter === 'expense' && (
                        <>
                            <Text style={styles.categoryGroupLabel}>Expenses</Text>
                            <View style={styles.categoryRow}>
                                {EXPENSE_CATEGORY_FILTERS.map((cat) => (
                                    <Pressable
                                        key={cat.value}
                                        style={[
                                            styles.category,
                                            categoryFilter === cat.value && styles.categoryActive
                                        ]}
                                        onPress={() => setCategoryFilter((prev) => prev === cat.value ? null : cat.value)}
                                    >
                                        <Text style={[
                                            styles.categoryText,
                                            categoryFilter === cat.value && styles.categoryTextActive
                                        ]}>
                                            {cat.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </>
                    )}

                    {typeFilter === 'income' && (
                        <>
                            <Text style={[styles.categoryGroupLabel,  {marginTop: 0}]}>
                                Income
                            </Text>
                            <View style={styles.categoryRow}>
                                {INCOME_CATEGORY_FILTERS.map((cat) => (
                                    <Pressable
                                        key={cat.value}
                                        style={[
                                            styles.category,
                                            categoryFilter === cat.value && styles.categoryActive
                                        ]}
                                        onPress={() => setCategoryFilter((prev) => prev === cat.value ? null : cat.value)}
                                    >
                                        <Text style={[
                                            styles.categoryText,
                                            categoryFilter === cat.value && styles.categoryTextActive
                                        ]}>
                                            {cat.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </>
                    )}
                </View>

                {/* Results Count */}
                <Text style={styles.results}>
                    {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
                </Text>

                {/* Grouped Transaction List */}
                <FlatList
                    ref={scrollRef}
                    data={listData}
                    style={{flex: 1}}
                    keyExtractor={(item) =>
                        item.type === 'header' ? `header-${item.date}` : `row-${item.expense.id}`
                    }
                    renderItem={({item}) => {
                        if(item.type === 'header') {
                            return (
                                <View style={styles.dateHeader}>
                                    <Text style={styles.dateHeaderText}>
                                        {formatGroupHeader(item.date + 'T00:00:00')}
                                    </Text>
                                </View>
                            )
                        }

                        if (item.type === 'row') {
                            return (
                                <TransactionRow
                                    expense={item.expense}
                                />
                            )
                        }

                        return null
                    }}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>No transactions found!</Text>
                            <Text style={styles.emptyHelp}>Try changing the filters</Text>
                        </View>
                    }
                />
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background
    },
    animatedContent: {
        flex: 1
    },

    // Month Navigator
    month: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 17,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.surface
    },
    navBtn: {
        padding: 4
    },
    monthLabel: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.textPrimary
    },

    // Type
    filterSection: {
        backgroundColor: Colors.surface,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    typeRow: {
        flexDirection: 'row',
        padding: 4,
        gap: 0,
        backgroundColor: Colors.card,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 10,
    },
    type: {
        flex: 1,
        paddingVertical: 7,
        alignItems: 'center',
        borderRadius: 8,
        zIndex: 1,
    },
    toggleSlider: {
        position: 'absolute',
        top: 4,
        left: 4,
        bottom: 4,
        width: '33.33%',
        borderRadius: 8,
        zIndex: 0,
    },
    typeText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.textSecondary
    },
    typeTextActive: {
        color: '#fff'
    },

    // Category
    categoryWrapper: {
        backgroundColor: Colors.surface,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border,
        paddingHorizontal: 12,
        paddingVertical: 10
    },
    categoryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryGroupLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6
    },
    category: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: Colors.card,
        borderWidth: 0.5,
        borderColor: Colors.border
    },
    categoryActive: {
        backgroundColor: Colors.teal,
        borderColor: Colors.teal
    },
    categoryText: {
        fontSize: 15,
        color: Colors.textSecondary
    },
    categoryTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },

    // Results Count
    results: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        paddingHorizontal: 20,
        paddingVertical: 10
    },

    // Data group header
    dateHeader: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: Colors.background,
    },
    dateHeaderText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    // Empty State
    empty: {
        alignItems: 'center',
        marginTop: 60,
        gap: 8
    },
    emptyText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.textSecondary
    },
    emptyHelp: {
        fontSize: 15,
        color: Colors.textSecondary
    }
})