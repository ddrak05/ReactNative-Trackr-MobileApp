import {useRef} from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native'
import ReanimatedSwipeable, {SwipeableMethods} from 'react-native-gesture-handler/ReanimatedSwipeable'
import {Colors} from '@/constants/colors'
import {Expense} from '@/types'

// a map of category names to their dot colors
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
};

// a map of category names to display labels
const CATEGORY_LABELS: Record<string, string> = {
    food:           'Food',
    transport:      'Transport',
    health:         'Health',
    shopping:       'Shopping',
    entertainment:  'Entertainment',
    rent:           'Rent',
    subscription:  'Subscriptions',
    other:          'Other',
    salary:         'Salary',
    freelance:      'Freelance',
    investment:     'Investment',
    gift:           'Gift',
};

// Format ISO date strings
function formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
}

interface TransactionRowProps {
    expense: Expense;
    onPress?: (expense: Expense) => void;
    onEdit?: (expense: Expense) => void;
    onDelete?: (id: string) => void;
    onSwipeOpen?: (close: () => void) => void;
    isExpanded?: boolean;
}

export default function TransactionRow({expense, onPress, onEdit, onDelete, onSwipeOpen, isExpanded}: TransactionRowProps) {
    const dotColor = CATEGORY_COLORS[expense.category] ?? '#888780';
    const categoryLabel = CATEGORY_LABELS[expense.category] ?? expense.category;
    const amountColor = expense.type === 'income' ? Colors.income : Colors.expense
    const amountPrefix = expense.type === 'income' ? '+' : '-';

    // Red Delete Action that appears on swipe
    const swipeRef = useRef<SwipeableMethods>(null);
    const renderSwipe = () => {
        return(
            <Pressable
                style={styles.delete}
                onPress={() => onDelete?.(expense.id)}
            >
                <Text style={styles.deleteIcon}>🗑️</Text>
            </Pressable>
        )
    }

    const row = (
        <Pressable
            style={({pressed}) => [
                styles.row,
                isExpanded && styles.rowExpanded,
                {backgroundColor: pressed ? Colors.backgroundPress : Colors.background}
            ]}
            onPress={() => onPress?.(expense)}
        >
            {/* Left Side - Dot + Text */}
            <View style={styles.left}>
                {/* Category color dot */}
                <View style={[styles.dot, {backgroundColor: dotColor}]} />

                {/* Category Label + Date */}
                <View style={styles.label}>
                    <Text style={styles.note} numberOfLines={1}>
                        {expense.note}
                    </Text>

                    {/* Collapsed Info */}
                    {!isExpanded && (
                        <Text style={styles.info} numberOfLines={1}>
                            {expense.recurring ? 'recurring · ' : ''}
                            {categoryLabel} · {formatDate(expense.date)}
                        </Text>
                    )}

                    {/* Expanded Info */}
                    {isExpanded && (
                        <View style={styles.expandedInfo}>
                            <Text style={styles.expandedText}>
                                {expense.type === 'income' ? 'Income' : 'Expense'} - {categoryLabel}
                            </Text>
                            <Text style={styles.expandedText}>
                                On {formatDate(expense.date)}
                            </Text>
                            <Text style={styles.expandedText}>
                                Recurring: {expense.recurring ? 'Yes' : 'No'}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Right Side */}
            <View style={styles.right}>
                {/* Amount */}
                <Text style={[styles.amount, {color: amountColor}]} numberOfLines={1} >
                    {amountPrefix}{expense.amount.toLocaleString('en-GB', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}€
                </Text>

                {/* Edit Button - only when expanded */}
                {isExpanded && (
                    <Pressable
                        style={({pressed}) => [
                            styles.editBtn,
                            {backgroundColor: pressed ? Colors.cardPress : Colors.surface}
                        ]}
                        onPress={() => onEdit?.(expense)}
                    >
                        <Text style={styles.editBtnText}>Edit</Text>
                    </Pressable>
                )}
            </View>
        </Pressable>
    )

    if(onDelete) {
        return (
            <ReanimatedSwipeable
                ref={swipeRef}
                renderRightActions={renderSwipe}
                rightThreshold={40}
                overshootRight={false}
                onSwipeableWillOpen={() => {
                    onSwipeOpen?.(() => swipeRef.current?.close())
                }}
            >
                {row}
            </ReanimatedSwipeable>
        )
    }
    return row
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomColor: Colors.border,
        borderBottomWidth: 1,
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    rowExpanded: {
        paddingVertical: 18
    },
    left: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        flex: 1,
        marginRight: 12
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        flexShrink: 0,
        marginTop: 4
    },
    label: {
        flex: 1,
        gap: 3
    },
    note: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.textPrimary
    },
    info: {
        fontSize: 12,
        color: Colors. textSecondary
    },

    right: {
        width: 90,
        alignItems: 'flex-end',
        gap: 10
    },
    amount: {
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'right',
    },

    // Delete
    delete: {
        backgroundColor: Colors.red,
        justifyContent: 'center',
        alignItems: 'center',
        width: 75,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        gap: 4
    },
    deleteIcon: {
        fontSize: 20
    },

    // Edit
    editBtn: {
        backgroundColor: Colors.surface,
        borderWidth: 0.5,
        borderColor: Colors.teal,
        borderRadius: 6,
        paddingHorizontal: 16,
        paddingVertical: 8
    },
    editBtnText: {
        fontSize: 12,
        color: Colors.teal,
        fontWeight: 'bold',
    },

    // Expanded Info
    expandedInfo: {
        gap: 4,
        marginTop: 4
    },
    expandedText: {
        fontSize: 12,
        color: Colors.textSecondary
    }
})