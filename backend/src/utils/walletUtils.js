// utils/walletUtils.js
import User from '../models/User.js';
import IncomeExpense from '../models/IncomeExpense.js';

export async function addIncomeExpenseEntry(userId, type, category, amount, description = '') {
    if (!userId || !type || !category || !amount) throw new Error('Invalid parameters');

    const entry = new IncomeExpense({
        userId,
        type,
        category,
        amount: Math.abs(amount),
        description: description || `${category} transaction`
    });
    await entry.save();

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Update wallet balance: +income, -expense
    user.walletBalance += (type === 'income' ? amount : -amount);
    user.incomeExpenseHistory = user.incomeExpenseHistory || [];
    user.incomeExpenseHistory.push(entry._id);
    await user.save();

    return entry;
}
