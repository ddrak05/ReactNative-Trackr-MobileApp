import {useState, useEffect, useRef} from 'react';
import {
    View, Text, StyleSheet, Pressable,
    Modal, ScrollView, TextInput, Switch, Animated
} from 'react-native'
import {Colors} from '@/constants/colors'
import {Category, Expense} from '@/types'
import DateTimePicker from '@react-native-community/datetimepicker'

// List of categories
const EXPENSE_CATEGORIES: { value: Category; label: string }[] = [
    { value: 'food',          label: '🍔 Food' },
    { value: 'transport',     label: '🚗 Transport' },
    { value: 'health',        label: '💊 Health' },
    { value: 'shopping',      label: '🛍️ Shopping' },
    { value: 'entertainment', label: '🎬 Entertainment' },
    { value: 'rent',          label: '🏠 Rent' },
    { value: 'subscription', label: '🔄 Subscription' },
    { value: 'other',         label: '📦 Other' }
];

const INCOME_CATEGORIES: { value: Category; label: string }[] = [
    { value: 'salary',      label: '💼 Salary' },
    { value: 'freelance',   label: '💻 Freelance' },
    { value: 'investment',  label: '📈 Investment' },
    { value: 'gift',        label: '🎁 Gift' },
    { value: 'other',       label: '📦 Other' },
];

interface AddExpenseProps {
    visible: boolean; // Whether its open
    onClose: () => void; // Called when user cancels
    onSave: (expense: Omit<Expense, 'id' | 'updatedAt'>) => void; // Called when user saves
    editing? : Expense | null;
}

export default function AddExpense({visible, onClose, onSave, editing}: AddExpenseProps) {
    // Form state
    const [type, setType] = useState<'expense' | 'income'>(editing?.type ?? 'expense')
    const [amount, setAmount] = useState(editing?.amount.toString() ?? '')
    const [category, setCategory] = useState<Category>(editing?.category ?? 'food')
    const [note, setNote] = useState(editing?.note ??'')
    const [date, setDate] = useState(editing ? new Date(editing.date) : new Date())
    const [recurring, setRecurring] = useState(editing?.recurring ?? false)

    // Amount Error
    const [amountError, setAmountError] = useState('')

    useEffect(() => {
        if (editing) {
            // pre-fill with existing data
            setType(editing.type)
            setAmount(editing.amount.toString())
            setCategory(editing.category)
            setNote(editing.note)
            setDate(new Date(editing.date))
            setRecurring(editing.recurring)
        } else {
            // reset to defaults for a new entry
            setType('expense')
            setAmount('')
            setCategory('food')
            setNote('')
            setDate(new Date())
            setRecurring(false)
        }
    }, [editing])

    // Reset form back to defaults when modal closes
    const handleClose = () => {
        setType('expense')
        setAmount('')
        setAmountError('')
        setCategory('food')
        setNote('')
        setDate(new Date())
        setNote('')
        setRecurring(false)
        setShowDatePicker(false)
        onClose()
    }

    // Validate and Save
    const handleSave = () => {
        const parsed = parseFloat(amount.replace(',', '.'))
        if (!amount || isNaN(parsed) || parsed <= 0) {
            setAmountError('Please enter a valid amount')
            return;
        }
        setAmountError('')

        onSave({
            type,
            amount: parsed,
            category,
            note: note.trim() || categoryLabel,
            date: date.toISOString(),
            recurring
        })
        handleClose();
    }

    // Reset to first option of the new list
    const toggleAnim = useRef(new Animated.Value(0)).current
    const handleTypeChange = (newType: 'expense' | 'income') => {
        setType(newType)
        setCategory(newType === 'expense' ? 'food' : 'salary')

        // Animation
        Animated.timing(toggleAnim, {
            toValue: newType === 'income' ? 1 : 0,
            duration: 200,
            useNativeDriver: false
        }).start()
    }

    const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
    const categoryLabel = categories.find((c) => c.value === category)?.label ?? 'Other';

    // Date Picker on Add / Edit
    const [showDatePicker, setShowDatePicker] = useState(false)

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* Top Bar */}
                <View style={styles.topBar}>
                    <Pressable onPress={handleClose}>
                        <Text style={styles.cancelBtn}>Cancel</Text>
                    </Pressable>

                    <Text style={styles.title}>
                        {editing ? 'Edit Entry' : 'New Entry'}
                    </Text>

                    <Pressable onPress={handleSave}>
                        <Text style={styles.saveBtn}>Save</Text>
                    </Pressable>
                </View>

                {/* Form - ScrollView */}
                <ScrollView contentContainerStyle={styles.form}>
                    {/* Type Toggle: Income / Expense */}
                    <View style={styles.typeRow}>
                        <Animated.View style={[
                            styles.slide,
                            {
                                backgroundColor: type === 'income' ? Colors.teal : Colors.expense,
                                transform: [{
                                    translateX: toggleAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 160],
                                    })
                                }]
                            }
                        ]} />

                        <Pressable
                            style={[styles.typeBtn,
                                type === 'expense' && styles.typeBtnExpense]}
                            onPress={() => handleTypeChange('expense')}
                        >
                            <Text style={[styles.typeBtnText,
                                type === 'expense' && styles.typeBtnTextActive]}
                            >
                                Expense
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[styles.typeBtn,
                                type === 'income' && styles.typeBtnIncome]}
                            onPress={() => handleTypeChange('income')}
                        >
                            <Text style={[styles.typeBtnText,
                                type === 'income' && styles.typeBtnTextActive]}
                            >
                                Income
                            </Text>
                        </Pressable>
                    </View>

                    {/* Amount */}
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Amount</Text>
                        <View style={styles.amountRow}>
                            <Text style={styles.currency}>€</Text>
                            <TextInput
                                style={[
                                    styles.amountInput,
                                    amountError ? {color: Colors.expense} : {}
                                ]}
                                value={amount}
                                onChangeText={(text) => {
                                    setAmount(text)
                                    if(amountError) setAmountError('')
                                }}
                                placeholder='0.00'
                                placeholderTextColor={Colors.textMuted}
                                keyboardType="decimal-pad"
                                autoFocus
                            />
                        </View>

                        {/* Error Message */}
                        {amountError ? (
                            <Text style={styles.errorText}>{amountError}</Text>
                        ) : null}
                    </View>

                    {/* Category */}
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Category</Text>
                        <View style={styles.categoryGrid}>
                            {categories.map((cat) => (
                                <Pressable
                                    key={cat.value}
                                    style={[
                                        styles.categoryBtn,
                                        category === cat.value && styles.categoryBtnActive
                                    ]}
                                    onPress={() => setCategory(cat.value)}
                                >
                                    <Text style={[
                                        styles.categoryBtnText,
                                        category === cat.value && styles.categoryBtnTextActive
                                    ]}>
                                        {cat.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Note */}
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Note</Text>
                        <TextInput
                            style={styles.input}
                            value={note}
                            onChangeText={setNote}
                            placeholder='What was this for?'
                            placeholderTextColor={Colors.textMuted}
                        />
                    </View>

                    {/* Date */}
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Date</Text>
                        <Pressable
                            style={({pressed}) => [
                                styles.input,
                                {backgroundColor: pressed ? Colors.cardPress : Colors.card}
                            ]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={styles.inputText}>
                                {date.toLocaleDateString('en-GB', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                })}
                            </Text>
                        </Pressable>

                        {showDatePicker && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display="default"
                                themeVariant="dark"
                                maximumDate={new Date()}
                                onChange={(_, selected) => {
                                    setShowDatePicker(false)
                                    if (selected) setDate(selected)
                                }}
                            />
                        )}
                    </View>

                    {/* Recurring */}
                    <View style={styles.toggleRow}>
                        <View>
                            <Text style={styles.toggleLabel}>Recurring</Text>
                            <Text style={styles.toggleSub}>Repeats every month</Text>
                        </View>
                        <Switch
                            value={recurring}
                            onValueChange={setRecurring}
                            trackColor={{false: Colors.border, true: Colors.teal}}
                            thumbColor='#fff'
                        />
                    </View>
                </ScrollView>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background
    },

    // Top Bar
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textPrimary
    },
    cancelBtn: {
        fontSize: 16,
        color:Colors.textSecondary
    },
    saveBtn: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.teal
    },

    // Form
    form: {
        padding: 20,
        gap: 24
    },

    // Type Toggle
    typeRow: {
        flexDirection: 'row',
        backgroundColor: Colors.card,
        borderRadius: 10,
        padding: 4,
        gap: 0,
        position: 'relative',
        overflow: 'hidden'
    },
    typeBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 10,
        zIndex: 1
    },
    slide: {
        position: 'absolute',
        top: 4,
        left: 4,
        bottom: 4,
        width: '50%',
        borderRadius: 8,
        zIndex: 0
    },
    typeBtnExpense: {
        backgroundColor: Colors.expense,
    },
    typeBtnIncome: {
        backgroundColor: Colors.income,
    },
    typeBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.textSecondary
    },
    typeBtnTextActive: {
        color: '#fff',
        fontWeight: 'bold'
    },

    // Fields
    field: {
        gap: 8
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    input: {
        backgroundColor: Colors.card,
        color: Colors.textPrimary,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 0.5,
        borderColor: Colors.border
    },
    inputText: {
        fontSize: 16,
        color: Colors.textPrimary
    },

    // Amount
    amountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderRadius: 10,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: Colors.border
    },
    currency: {
        fontSize: 20,
        color: Colors.textSecondary,
        marginRight: 8
    },
    amountInput: {
        flex: 1,
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        paddingVertical: 14
    },
    errorText: {
        fontSize: 12,
        color: Colors.expense,
        marginTop: 4,
        paddingHorizontal: 4
    },

    // Category
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    categoryBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.card,
        borderWidth: 0.5,
        borderColor: Colors.border
    },
    categoryBtnActive: {
        backgroundColor: Colors.teal,
        borderColor: Colors.teal
    },
    categoryBtnText: {
        fontSize: 13,
        color: Colors.textSecondary
    },
    categoryBtnTextActive: {
        color: '#fff',
        fontWeight: 'bold'
    },

    // Recurring toggle
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.card,
        borderRadius: 10,
        padding: 16,
        borderWidth: 0.5,
        borderColor: Colors.border
    },
    toggleLabel: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.textPrimary
    },
    toggleSub: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2
    }
})
