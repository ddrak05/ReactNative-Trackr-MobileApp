// Expense Entries
export type Category =
    | 'food'
    | 'transport'
    | 'health'
    | 'shopping'
    | 'entertainment'
    | 'rent'
    | 'subscription'
    | 'other'
    | 'salary'
    | 'freelance'
    | 'investment'
    | 'gift'

export interface Expense {
    id: string;
    type: 'expense' | 'income';
    amount: number;
    category: Category;
    note: string;
    date: string;
    recurring: boolean;
    updatedAt: number;
}