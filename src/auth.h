#ifndef AUTH_H
#define AUTH_H

#include <iostream>
#include <fstream>
#include <cstring>

struct User {
    char username[30];
    char password[30];
};

struct UserNode {
    User data;
    UserNode* next;
};

extern int userCount;
extern UserNode* userHead;
extern User currentUser;
extern bool isLoggedIn;

extern const char* USERS_FILENAME;
extern char EXPENSE_FILENAME[];

void loadUsersFromFile();
void saveUsersToFile();
void clearUsersInMemory();
bool usernameExists(const char* uname);
void registerUser();
bool loginUser();

#endif