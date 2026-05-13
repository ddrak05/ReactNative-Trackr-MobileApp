import {
    View, Text, StyleSheet, Pressable, FlatList, BackHandler
} from "react-native";
import {Colors} from "@/constants/colors";
import {useExpenses} from "@/hooks/useExpenses";
import {Expense} from '@/types'
import TransactionRow from "@/components/TransactionRow";
import AddExpense from "@/components/AddExpense"
import RecurringModal from '@/components/RecurringModal';
import {useState, useRef, useEffect} from "react";
import {useNavigation} from "expo-router";

function getCurrentMonth(): string {
    return new Date().toLocaleString('en-GB', {month: 'long', day: 'numeric'})
}

export default function OverviewScreen () {
    const {expenses, addExpense, editExpense, deleteExpense} = useExpenses()
    const [modalVisible, setModalVisible] = useState(false)
    const now = new Date()

    const totalIncome = expenses
        .filter((e) => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0)

    const totalExpenses = expenses
        .filter((e) => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0)

    const netBalance = totalIncome - totalExpenses

    const sorted = [...expenses]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 100)

    // For Recurring Expenses
    const getRecurring = () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Get all unique recurring transactions
        const recurringMap: Record<string, Expense> = {}
        expenses
            .filter((e) => e.recurring)
            .forEach((e) => {
                const key=`${e.type}-${e.note}`
                if (!recurringMap[key] || e.updatedAt >= recurringMap[key].updatedAt) {
                    recurringMap[key] = e
                }
            })

        return Object.values(recurringMap).filter((e) => {
            const originalDate = new Date(e.date)

            // Calculate next due date
            const dueDate = new Date(today.getFullYear(), today.getMonth(), originalDate.getDate())

            // If due date already passed, move to next
            if (dueDate < today) {
                dueDate.setMonth(dueDate.getMonth() + 1)
            }

            // Check if already paid
            const alreadyPaid = expenses.some((exp) => {
                const expDate = new Date(exp.date)
                return (
                    exp.category === e.category &&
                    exp.type === e.type &&
                    exp.amount === e.amount &&
                    expDate.getMonth() === today.getMonth() &&
                    expDate.getFullYear() === today.getFullYear()
                )
            })

            if (alreadyPaid) return false

            // Payment due if within 3 days from today (or overdue)
            const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            return diffDays <= 3
        })
    }

    const dueRecurring = getRecurring()
    const hasDue = dueRecurring.length > 0
    const [showRecurringModal, setShowRecurringModal] = useState(false)

    // For Delete
    const openSwipeRef = useRef<(() => void) | null>(null)
    const handleSwipeOpen = (closeFn: () => void) => {
        if(openSwipeRef.current) {
            openSwipeRef.current()
        }
        openSwipeRef.current = closeFn
        setExpandedId(null) // Collapse any expanded row
    }

    // For Edit
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

    // Toggle expand
    const handleRowPress = (expense: Expense) => {
        setExpandedId((prev) => prev === expense.id ? null : expense.id)
    }

    // Back Button Pressed while Modal is Visible
    useEffect(() => {
        const handler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (modalVisible) {
                setModalVisible(false)
                setEditingExpense(null)
                return true
            }
            return false
        })

        // Cleanup when component unmounts
        return () => handler.remove()
    }, [modalVisible]);

    // Scroll to the top or close modal when tab button is pressed
    const navigation = useNavigation()
    const scrollRef = useRef<FlatList>(null)
    useEffect(() => {
        return navigation.addListener('tabPress' as any, () => {
            if (modalVisible) {
                setModalVisible(false)
                setEditingExpense(null)
            } else {
                scrollRef.current?.scrollToOffset({ offset: 0, animated: true })
            }
        })
    }, [modalVisible])

    return (
        <View style={styles.container}>
            {/* FlatList renders the transaction list efficiently */}
            {/* ListHeaderComponent renders the header above the list */}
            <FlatList
                ref={scrollRef}
                data={sorted}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({item}) => (
                    <TransactionRow
                        expense={item}
                        onPress={handleRowPress}
                        onDelete={deleteExpense}
                        onSwipeOpen={handleSwipeOpen}
                        isExpanded={expandedId === item.id}
                        onEdit={(expense) => {
                            setEditingExpense(expense)
                            setModalVisible(true)
                        }}
                    />
                )}

                ListHeaderComponent={
                    <View style={styles.header}>
                        {/* Current Month */}
                        <Text style={styles.month}>{getCurrentMonth()}</Text>
                        <Text style={styles.sectionSmall}>This Month</Text>

                        {/* Net Balance */}
                        <Text style={[
                            styles.balance,
                            {color: netBalance >= 0 ? Colors.income : Colors.expense}
                        ]}>
                            {netBalance.toLocaleString('en-GB', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}€
                        </Text>

                        {/* Income / Expense Summary Cards */}
                        <View style={styles.summaryRow}>
                            <Pressable style={({pressed}) => [
                                styles.summaryCard,
                                {backgroundColor: pressed ? Colors.cardPress : Colors.card}
                            ]}>
                                <Text style={styles.label}>Income</Text>
                                <Text style={[
                                    styles.amount,
                                    {color: Colors.income}
                                ]}>
                                    {totalIncome.toLocaleString('en-GB', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}€
                                </Text>
                            </Pressable>

                            <View style={styles.divider} />

                            <Pressable style={({pressed}) => [
                                styles.summaryCard,
                                {backgroundColor: pressed ? Colors.cardPress : Colors.card}
                            ]}>
                                <Text style={styles.label}>Expenses</Text>
                                <Text style={[
                                    styles.amount,
                                    {color: Colors.expense}
                                ]}>
                                    {totalExpenses.toLocaleString('en-GB', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}€
                                </Text>
                            </Pressable>
                        </View>

                        {/* Transactions Label */}
                        <View style={styles.sectionRow}>
                            <Text style={styles.section}>Last Transactions</Text>
                            {hasDue && (
                                <Pressable
                                    onPress={() => setShowRecurringModal(true)}
                                    style={styles.dueDot}
                                >
                                    <View style={styles.dueDotInner} />
                                </Pressable>
                            )}
                        </View>
                    </View>
                }

                // No Transactions Yet
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No Transactions this Month!</Text>
                        <Text style={styles.emptyHelp}>Tap + to add one</Text>
                    </View>
                }
            />

            {/* Floating Button */}
            <Pressable
                style={({pressed}) => [
                    styles.add,
                    {backgroundColor: pressed ? Colors.tealLight : Colors.teal}
                ]}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.addIcon}>+</Text>
            </Pressable>

            <AddExpense
                visible={modalVisible}
                editing={editingExpense}
                onClose={() => {
                    setModalVisible(false)
                    setEditingExpense(null)
                }}
                onSave={(entry) => {
                    if (editingExpense) {
                        editExpense(editingExpense.id, entry)
                    } else {
                        addExpense(entry)
                    }
                    setModalVisible(false)
                    setEditingExpense(null)
            }} />

            {/* Due Recurring Modal*/}
            <RecurringModal
                visible={showRecurringModal}
                onClose={() => setShowRecurringModal(false)}
                dueTransactions={dueRecurring}
                onMarkAsPaid={(transaction) => {
                    // Add transaction
                    const today = new Date();
                    const recurringDate = new Date(transaction.date)

                    const paymentDate = new Date(
                        today.getFullYear(), today.getMonth(), recurringDate.getDate()
                    )

                    addExpense({
                        type: transaction.type,
                        amount: transaction.amount,
                        category: transaction.category,
                        note: transaction.note,
                        date: paymentDate.toISOString(),
                        recurring: true
                    })
                }}
                onStopRecurring={(transaction: Expense) => {
                    editExpense(transaction.id, {recurring: false})
                }}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    // Header
    header: {
        backgroundColor: Colors.surface,
        padding: 24,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border,
        alignItems: "center",
        gap: 4
    },
    month: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    balance: {
        fontSize: 42,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 16,
    },

    summaryRow: {
        flexDirection: 'row',
        backgroundColor: Colors.card,
        borderRadius: 12,
        width: '100%',
        overflow: 'hidden'
    },
    summaryCard: {
        flex: 1,
        padding: 14,
        alignItems: "center",
        gap: 4
    },
    label: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    divider: {
        width: 0.5,
        backgroundColor: Colors.divider,
        marginVertical: 8,
    },

    // Section Label above the list
    sectionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignSelf: 'center',
        width: '100%',
        gap: 6,
        marginTop: 16,
    },
    section: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionSmall: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        alignSelf: 'flex-start',
        marginBottom: 2,
    },
    dueDot: {
        padding: 4
    },
    dueDotInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.expense,
    },

    // Empty List
    empty: {
        alignItems: "center",
        marginTop: 60,
        gap: 8
    },
    emptyText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textSecondary
    },
    emptyHelp: {
        fontSize: 13,
        color: Colors.textPrimary
    },

    // Add Icon
    add: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        width: 52,
        height: 52,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        elevation: 8
    },
    addIcon: {
        fontSize: 28,
        color: '#fff'
    }
})