#include "auth.h"

UserNode* userHead = nullptr;
int userCount = 0;
User currentUser;
bool isLoggedIn = false;

const char* USERS_FILENAME = "data/users.txt";
char EXPENSE_FILENAME[64] = "exports/expenses.txt";

void saveUsersToFile() {
    std::ofstream outFile(USERS_FILENAME);
    if (!outFile) {
        std::cout << "Error: Tidak bisa membuka file users.txt untuk menyimpan!" << std::endl;
        return;
    }
    UserNode* cur = userHead;
    while (cur) {
        outFile << cur->data.username << "|" << cur->data.password << std::endl;
        cur = cur->next;
    }
    outFile.close();
}

void clearUsersInMemory() {
    UserNode* cur = userHead;
    while (cur) { UserNode* tmp = cur->next; delete cur; cur = tmp; }
    userHead = nullptr;
    userCount = 0;
}

void loadUsersFromFile() {
    std::ifstream inFile(USERS_FILENAME);
    if (!inFile) {
        return;
    }
    char line[100];
    clearUsersInMemory();
    while (inFile.getline(line, 100)) {
        char* token = std::strtok(line, "|");
        if (token != NULL) {
            UserNode* node = new UserNode();
            node->next = nullptr;
            std::strcpy(node->data.username, token);
            token = std::strtok(NULL, "|");
            if (token != NULL) {
                std::strcpy(node->data.password, token);
            } else {
                node->data.password[0] = '\0';
            }
            if (!userHead) userHead = node; else { UserNode* t = userHead; while (t->next) t = t->next; t->next = node; }
            userCount++;
        }
    }
    inFile.close();
}

bool usernameExists(const char* uname) {
    UserNode* cur = userHead;
    while (cur) {
        if (std::strcmp(cur->data.username, uname) == 0) return true;
        cur = cur->next;
    }
    return false;
}

void registerUser() {
    char uname[30];
    char pass[30];
    std::cout << "\n=== REGISTER ===" << std::endl;
    std::cout << "Username: ";
    std::cin.ignore();
    std::cin.getline(uname, 30);
    if (usernameExists(uname)) {
        std::cout << "Username sudah digunakan." << std::endl;
        return;
    }
    std::cout << "Password: ";
    std::cin.getline(pass, 30);

    UserNode* node = new UserNode();
    std::strcpy(node->data.username, uname);
    std::strcpy(node->data.password, pass);
    node->next = nullptr;
    if (!userHead) userHead = node; else { UserNode* t = userHead; while (t->next) t = t->next; t->next = node; }
    userCount++;
    saveUsersToFile();
    std::cout << "Registrasi berhasil! Silakan login." << std::endl;
}

bool loginUser() {
    char uname[30];
    char pass[30];
    std::cout << "\n=== LOGIN ===" << std::endl;
    std::cout << "Username: ";
    std::cin.ignore();
    std::cin.getline(uname, 30);
    std::cout << "Password: ";
    std::cin.getline(pass, 30);

    UserNode* cur = userHead;
    while (cur) {
        if (std::strcmp(cur->data.username, uname) == 0 && std::strcmp(cur->data.password, pass) == 0) {
            currentUser = cur->data;
            isLoggedIn = true;
            std::snprintf(EXPENSE_FILENAME, sizeof(EXPENSE_FILENAME), "exports/%s.txt", currentUser.username);
            std::cout << "Login berhasil! Selamat datang, " << currentUser.username << std::endl;
            return true;
        }
        cur = cur->next;
    }
    std::cout << "Login gagal. Username atau password salah." << std::endl;
    return false;
}