import {useState, useEffect, useCallback} from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {Expense} from '@/types'

const STORAGE_KEY = 'trackr'

export function useExpenses() {
    // Empty array of type Expense
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)

    // Load all Expenses from storage
    const loadExpenses = useCallback(async () => {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY)
            if (data) setExpenses(JSON.parse(data))
        } catch (error) {
            console.error("Failed to load expenses: ", error)
        } finally {
            setLoading(false)
        }
    }, [])

    // Save Expenses - Private Helper, every add / edit / delete calls this at the end
    const saveExpenses = async (updated: Expense[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

            // Update the in-memory data state so the UI reflects the change instantly
            setExpenses(updated)
        } catch (error) {
            console.error('Failed to save expenses: ', error)
        }
    }

    // Add Expense - Omit<Expense, 'id'>: Accepts all Expense Fields except id
    const addExpense = async (entry: Omit<Expense, 'id' | 'updatedAt'>) => {
        const newExpense: Expense = {
            ...entry,
            id: `exp_${Date.now()}`,
            updatedAt: Date.now(),
        }

        // Add new entry to the front of the array
        const updated = [newExpense, ...expenses]
        await saveExpenses(updated)
    }

    // Edit Expense By Id - Partial<Expense>: Any subset of Expense Fields
    const editExpense = async(id: string, edit: Partial<Expense>) => {
        const updated = expenses.map((exp) =>
            exp.id === id
            ? {...exp, ...edit, updatedAt: Date.now()} // merge old fields with new changes
                : exp           // leave this one untouched
        )
        await saveExpenses(updated)
    }

    // Delete Expense By Id
    const deleteExpense = async (id: string) => {
        const updated = expenses.filter((e) => e.id !== id)
        await saveExpenses(updated)
    }

    // UseEffect - run this once when the hook first loads to trigger initial data from storage
    useEffect(() => {
        loadExpenses()
    }, [loadExpenses]);

    // Return everything the screens need (using useExpenses())
    return {
        expenses,
        loading,
        addExpense,
        editExpense,
        deleteExpense,
        loadExpenses
    }
}