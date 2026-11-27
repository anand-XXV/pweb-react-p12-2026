#include "src/auth.h"
#include "src/expense.h"

int main() {
    loadUsersFromFile();
    int authChoice = 0;
    do {
        std::cout << "\n=== AUTH ===" << std::endl;
        std::cout << "1. Register" << std::endl;
        std::cout << "2. Login" << std::endl;
        std::cout << "3. Keluar" << std::endl;
        std::cout << "Pilihan Anda: ";
        std::cin >> authChoice;
        if (authChoice == 1) {
            registerUser();
        } else if (authChoice == 2) {
            if (loginUser()) {
                loadFromFile();
                break;
            }
        } else if (authChoice == 3) {
            std::cout << "Keluar aplikasi." << std::endl;
            return 0;
        } else {
            std::cout << "Pilihan tidak valid." << std::endl;
        }
    } while (!isLoggedIn);

    int choice;
    do {
        calculateTotal();
        std::cout << "\n=== APLIKASI EXPENSE TRACKER ===" << std::endl;
        std::cout << "1. Tambah Pengeluaran" << std::endl;
        std::cout << "2. Hapus Pengeluaran" << std::endl;
        std::cout << "3. Tampilkan Semua Pengeluaran" << std::endl;
        std::cout << "4. Urutkan Pengeluaran" << std::endl;
        std::cout << "5. Cari Berdasarkan Kategori" << std::endl;
        std::cout << "7. Edit Pengeluaran" << std::endl;
        std::cout << "8. Simpan & Keluar" << std::endl;
        std::cout << "Pilihan Anda: ";
        std::cin >> choice;
        switch (choice) {
            case 1: addExpense(); break;
            case 2: deleteExpense(); break;
            case 3: displayExpenses(); break;
            case 4: sortExpenses(); break;
            case 5: searchByCategory(); break;
            case 7: editExpense(); break;
            case 8: saveToFile(); break;
            default: std::cout << "Pilihan tidak valid!" << std::endl;
        }
        if (choice != 8) {
            std::cout << "\nTotal seluruh pengeluaran: Rp ";
            calculateTotal();
        }
    } while (choice != 8);
    return 0;
}