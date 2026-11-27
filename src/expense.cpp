#include "expense.h"
#include "auth.h"

ExpenseNode* head = nullptr;
int expenseCount = 0;

void swapExpense(Expense* a, Expense* b) {
    Expense temp = *a;
    *a = *b;
    *b = temp;
}

void saveToFile() {
    if (!isLoggedIn) {
        std::cout << "Silakan login terlebih dahulu." << std::endl;
        return;
    }
    std::ofstream outFile(EXPENSE_FILENAME);
    if (!outFile) {
        std::cout << "Error: Tidak bisa membuka file untuk menyimpan!" << std::endl;
        return;
    }
    ExpenseNode* cur = head;
    while (cur != nullptr) {
        outFile << cur->data.date << "|"
                << cur->data.name << "|"
                << cur->data.category << "|"
                << cur->data.amount << std::endl;
        cur = cur->next;
    }
    outFile.close();
    std::cout << "Data berhasil disimpan ke " << EXPENSE_FILENAME << std::endl;
}

void loadFromFile() {
    if (!isLoggedIn) {
        expenseCount = 0;
        return;
    }
    std::ifstream inFile(EXPENSE_FILENAME);
    if (!inFile) {
        return;
    }
    char line[200];
    expenseCount = 0;
    ExpenseNode* cur = head;
    while (cur) { ExpenseNode* tmp = cur->next; delete cur; cur = tmp; }
    head = nullptr;
    while (inFile.getline(line, 200)) {
        char* token = std::strtok(line, "|");
        if (token != NULL) {
            ExpenseNode* node = new ExpenseNode();
            node->next = nullptr;
            std::strcpy(node->data.date, token);
            token = std::strtok(NULL, "|");
            if (token != NULL) std::strcpy(node->data.name, token);
            token = std::strtok(NULL, "|");
            if (token != NULL) std::strcpy(node->data.category, token);
            token = std::strtok(NULL, "|");
            if (token != NULL) node->data.amount = std::atoll(token);
            if (head == nullptr) {
                head = node;
            } else {
                ExpenseNode* tail = head;
                while (tail->next) tail = tail->next;
                tail->next = node;
            }
            expenseCount++;
        }
    }
    inFile.close();
}

void addExpense() {
    if (!isLoggedIn) {
        std::cout << "Silakan login terlebih dahulu." << std::endl;
        return;
    }
    Expense newExpense;
    std::cout << "Masukkan Tanggal (YYYY-MM-DD): ";
    std::cin.ignore();
    std::cin.getline(newExpense.date, 11);
    std::cout << "Masukkan Nama Pengeluaran: ";
    std::cin.getline(newExpense.name, 50);
    std::cout << "Masukkan Kategori: ";
    std::cin.getline(newExpense.category, 30);
    std::cout << "Masukkan Nominal: ";
    std::cin >> newExpense.amount;
    std::cin.ignore();
    ExpenseNode* node = new ExpenseNode();
    node->data = newExpense;
    node->next = nullptr;
    if (head == nullptr) {
        head = node;
    } else {
        ExpenseNode* tail = head;
        while (tail->next) tail = tail->next;
        tail->next = node;
    }
    expenseCount++;
    std::cout << "Pengeluaran berhasil ditambahkan!" << std::endl;
}

void displayExpenses() {
    if (expenseCount == 0) {
        std::cout << "Belum ada data pengeluaran." << std::endl;
        return;
    }
    std::cout << "--------------------------------------------------------------------------------" << std::endl;
    std::cout << std::left << std::setw(5) << "No"
              << std::setw(15) << "Tanggal"
              << std::setw(25) << "Nama"
              << std::setw(20) << "Kategori"
              << std::setw(15) << "Nominal" << std::endl;
    std::cout << "--------------------------------------------------------------------------------" << std::endl;
    ExpenseNode* cur = head;
    int idx = 1;
    while (cur) {
        std::cout << std::left << std::setw(5) << idx
                  << std::setw(15) << cur->data.date
                  << std::setw(25) << cur->data.name
                  << std::setw(20) << cur->data.category
                  << "Rp " << cur->data.amount << std::endl;
        cur = cur->next;
        idx++;
    }
    std::cout << "--------------------------------------------------------------------------------" << std::endl;
}

void deleteExpense() {
    if (!isLoggedIn) {
        std::cout << "Silakan login terlebih dahulu." << std::endl;
        return;
    }
    displayExpenses();
    if (expenseCount == 0) return;
    int index;
    std::cout << "Masukkan nomor pengeluaran yang ingin dihapus: ";
    std::cin >> index;
    std::cin.ignore();
    if (index < 1 || index > expenseCount) {
        std::cout << "Nomor tidak valid!" << std::endl;
        return;
    }
    int target = index - 1;
    ExpenseNode* prev = nullptr;
    ExpenseNode* cur = head;
    int pos = 0;
    while (cur && pos < target) { prev = cur; cur = cur->next; pos++; }
    if (!cur) { std::cout << "Nomor tidak valid!" << std::endl; return; }
    if (prev == nullptr) head = cur->next; else prev->next = cur->next;
    delete cur;
    expenseCount--;
    std::cout << "Pengeluaran berhasil dihapus." << std::endl;
}

void editExpense() {
    if (!isLoggedIn) {
        std::cout << "Silakan login terlebih dahulu." << std::endl;
        return;
    }
    displayExpenses();
    if (expenseCount == 0) return;
    int index;
    std::cout << "Masukkan nomor pengeluaran yang ingin diedit: ";
    std::cin >> index;
    std::cin.ignore();
    if (index < 1 || index > expenseCount) {
        std::cout << "Nomor tidak valid!" << std::endl;
        return;
    }
    int target = index - 1;
    ExpenseNode* cur = head;
    int pos = 0;
    while (cur && pos < target) { cur = cur->next; pos++; }
    if (!cur) { std::cout << "Nomor tidak valid!" << std::endl; return; }
    Expense &e = cur->data;
    char buf[64];
    std::cout << "Tanggal (YYYY-MM-DD) [" << e.date << "]: ";
    std::cin.getline(buf, 64);
    if (std::strlen(buf) > 0) {
        std::strncpy(e.date, buf, 10);
        e.date[10] = '\0';
    }
    std::cout << "Nama [" << e.name << "]: ";
    std::cin.getline(buf, 64);
    if (std::strlen(buf) > 0) {
        std::strncpy(e.name, buf, 49);
        e.name[49] = '\0';
    }
    std::cout << "Kategori [" << e.category << "]: ";
    std::cin.getline(buf, 64);
    if (std::strlen(buf) > 0) {
        std::strncpy(e.category, buf, 29);
        e.category[29] = '\0';
    }
    std::cout << "Nominal (kosong untuk skip) [" << e.amount << "]: ";
    char amountBuf[32];
    std::cin.getline(amountBuf, 32);
    if (std::strlen(amountBuf) > 0) {
        long long val = std::atoll(amountBuf);
        e.amount = val;
    }
    std::cout << "Pengeluaran berhasil diedit." << std::endl;
}

static Expense* toArray() {
    if (expenseCount == 0) return nullptr;
    Expense* arr = new Expense[expenseCount];
    ExpenseNode* cur = head;
    int i = 0;
    while (cur) { arr[i++] = cur->data; cur = cur->next; }
    return arr;
}

static void rebuildFromArray(Expense* arr) {
    ExpenseNode* cur = head;
    while (cur) { ExpenseNode* tmp = cur->next; delete cur; cur = tmp; }
    head = nullptr;
    for (int i = 0; i < expenseCount; i++) {
        ExpenseNode* node = new ExpenseNode();
        node->data = arr[i];
        node->next = nullptr;
        if (!head) head = node; else { ExpenseNode* t = head; while (t->next) t = t->next; t->next = node; }
    }
}

static void quickSortByAmountArr(Expense* arr, int low, int high) {
    if (low < high) {
        Expense pivot = arr[high];
        int i = low - 1;
        for (int j = low; j < high; j++) {
            if (arr[j].amount < pivot.amount) { i++; Expense tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; }
        }
        Expense tmp = arr[i + 1]; arr[i + 1] = arr[high]; arr[high] = tmp;
        int pi = i + 1;
        quickSortByAmountArr(arr, low, pi - 1);
        quickSortByAmountArr(arr, pi + 1, high);
    }
}

static void quickSortByDateArr(Expense* arr, int low, int high) {
    if (low < high) {
        Expense pivot = arr[high];
        int i = low - 1;
        for (int j = low; j < high; j++) {
            if (std::strcmp(arr[j].date, pivot.date) < 0) { i++; Expense tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; }
        }
        Expense tmp = arr[i + 1]; arr[i + 1] = arr[high]; arr[high] = tmp;
        int pi = i + 1;
        quickSortByDateArr(arr, low, pi - 1);
        quickSortByDateArr(arr, pi + 1, high);
    }
}

void sortExpenses() {
    if (expenseCount == 0) {
        std::cout << "Belum ada data untuk diurutkan." << std::endl;
        return;
    }
    if (!isLoggedIn) {
        std::cout << "Silakan login terlebih dahulu." << std::endl;
        return;
    }
    int type;
    std::cout << "Urutkan berdasarkan:\n1. Nominal\n2. Tanggal\nPilihan: ";
    std::cin >> type;
    std::cin.ignore();
    Expense* arr = toArray();
    if (type == 1) {
        quickSortByAmountArr(arr, 0, expenseCount - 1);
    } else if (type == 2) {
        quickSortByDateArr(arr, 0, expenseCount - 1);
    } else {
        delete[] arr;
        std::cout << "Pilihan tidak valid!" << std::endl;
        return;
    }
    rebuildFromArray(arr);
    delete[] arr;
    std::cout << "Data berhasil diurutkan!" << std::endl;
    displayExpenses();
}

void searchByCategory() {
    if (expenseCount == 0) {
        std::cout << "Belum ada data." << std::endl;
        return;
    }
    if (!isLoggedIn) {
        std::cout << "Silakan login terlebih dahulu." << std::endl;
        return;
    }
    char keyword[30];
    std::cout << "Masukkan kategori yang dicari: ";
    std::cin.ignore();
    std::cin.getline(keyword, 30);
    bool found = false;
    std::cout << "\nHasil Pencarian Kategori '" << keyword << "':" << std::endl;
    std::cout << "--------------------------------------------------------------------------------" << std::endl;
    ExpenseNode* cur2 = head;
    while (cur2) {
        if (std::strstr(cur2->data.category, keyword) != NULL) {
            std::cout << std::left << std::setw(15) << cur2->data.date
                      << std::setw(25) << cur2->data.name
                      << std::setw(20) << cur2->data.category
                      << "Rp " << cur2->data.amount << std::endl;
            found = true;
        }
        cur2 = cur2->next;
    }
    if (!found) {
        std::cout << "Tidak ditemukan pengeluaran dengan kategori tersebut." << std::endl;
    }
    std::cout << "--------------------------------------------------------------------------------" << std::endl;
}

void calculateTotal() {
    long long total = 0;
    ExpenseNode* cur3 = head;
    while (cur3) { total += cur3->data.amount; cur3 = cur3->next; }
    std::cout << "\nTotal seluruh pengeluaran: Rp " << total << std::endl;
}