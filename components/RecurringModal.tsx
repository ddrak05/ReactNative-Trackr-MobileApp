import React, {useEffect} from 'react';
import { Modal, View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { Colors } from '@/constants/colors';
import { Expense } from '@/types';

interface RecurringModalProps {
    visible: boolean;
    onClose: () => void;
    dueTransactions: Expense[];
    onMarkAsPaid: (expense: Expense) => void;
    onStopRecurring: (expense: Expense) => void;
}

export default function RecurringModal({visible, onClose, dueTransactions, onMarkAsPaid, onStopRecurring}: RecurringModalProps) {
    // Auto-close if no more due transactions
    useEffect(() => {
        if (visible && dueTransactions.length === 0) {
            onClose();
        }
    }, [dueTransactions, visible, onClose]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <Text style={styles.title}>Upcoming Payments</Text>

                    <FlatList
                        data={dueTransactions}
                        keyExtractor={(item) => item.id}
                        renderItem={({item}) => {
                            const dueDate = new Date(item.date)
                            const day = dueDate.getDate()

                            return (
                                <View style={styles.item}>
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemName}>{item.note}</Text>
                                        <Text style={styles.itemDate}>Due on the {day}th</Text>
                                        <Text style={styles.itemAmount}>
                                            {item.amount.toLocaleString('en-GB', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}€
                                        </Text>
                                    </View>

                                    <View style={styles.buttonGroup}>
                                        <Pressable
                                            style={styles.paidBtn}
                                            onPress={() => onMarkAsPaid(item)}
                                        >
                                            <Text style={styles.paidBtnText}>Mark as Paid</Text>
                                        </Pressable>

                                        <Pressable
                                            style={styles.stopBtn}
                                            onPress={() => onStopRecurring(item)}
                                        >
                                            <Text style={styles.stopBtnText}>Stop Recurring</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            )
                        }}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>All caught up!</Text>
                        }
                    />

                    <Pressable style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeBtnText}>Close</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    content: {
        width: '100%',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        maxHeight: '80%',
        borderWidth: 1,
        borderColor: Colors.border
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 16,
        textAlign: 'center'
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border
    },
    itemInfo: {
        flex: 1,
        justifyContent: 'center',
        gap: 2,
        marginRight: 12
    },
    buttonGroup: {
        gap: 6,
        alignItems: 'flex-end',
        justifyContent: 'center'
    },
    itemName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.textPrimary
    },
    itemDate: {
        fontSize: 12,
        color: Colors.textSecondary
    },
    itemAmount: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.income
    },
    paidBtn: {
        backgroundColor: Colors.teal,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        width: 110,
        alignItems: 'center'
    },
    paidBtnText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold'
    },
    stopBtn: {
        backgroundColor: 'transparent',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.expense,
        width: 110,
        alignItems: 'center'
    },
    stopBtnText: {
        color: Colors.expense,
        fontSize: 10,
        fontWeight: 'bold'
    },
    closeBtn: {
        marginTop: 20,
        paddingVertical: 12,
        alignItems: 'center'
    },
    closeBtnText: {
        color: Colors.textSecondary,
        fontWeight: 'bold'
    },
    emptyText: {
        color: Colors.textMuted,
        textAlign: 'center',
        marginVertical: 20
    }
});