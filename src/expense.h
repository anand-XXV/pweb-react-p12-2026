#ifndef EXPENSE_H
#define EXPENSE_H

#include <iostream>
#include <fstream>
#include <iomanip>
#include <cstring>

struct Expense {
    char date[11];
    char name[50];
    char category[30];
    long long amount;
};

struct ExpenseNode {
    Expense data;
    ExpenseNode* next;
};

extern ExpenseNode* head;
extern int expenseCount;

void swapExpense(Expense* a, Expense* b);

void saveToFile();
void loadFromFile();
void addExpense();
void displayExpenses();
void deleteExpense();
void editExpense();
void sortExpenses();
void searchByCategory();
void calculateTotal();

#endif