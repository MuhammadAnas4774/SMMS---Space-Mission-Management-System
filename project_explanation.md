# Database Project Explanation

Welcome to your database project! This guide will explain everything about your project in simple, beginner-friendly words.

## 📁 What Each Folder and File Does

Your project is divided into a few main parts:

1. **`backend/` folder:** This is the "brain" of your project. It connects to the database, gets the data, and sends it to the frontend.
   - **`backend/src/`**: Contains the JavaScript code for your server.
   - **`backend/sql/`**: Contains all the SQL files used to build your database.
     - **`schema.sql`**: This file contains the instructions to build the skeleton of your database. It creates all the tables (like PERSON, MISSION, SPACECRAFT).
     - **`04_auth_views_triggers.sql`**: This file adds user accounts, roles (like admin or staff), and creates "Views" and "Triggers" (we'll explain these below).
     - **`create_database.sql` / `01_complete_setup.sql`**: These are helper files to easily run the setup commands.
     - **`seed.sql`**: This file fills your empty database with some dummy/starting data so you can test it.

2. **`frontend/` folder:** This is the "face" of your project. It contains all the screens and buttons the user sees and clicks on (built with React/Vite).
   - **`frontend/src/`**: Contains the code for your web pages (like login page, missions page).

3. **`docs/` folder:** This folder is usually for saving project reports or documentation.

---

## 🛠️ How the Database was Created

The database was created using **SQL (Structured Query Language)**. Imagine the database as a giant, highly-organized Excel spreadsheet file, and SQL is the language we use to tell the computer how to organize the sheets.

1. First, we used the command `CREATE DATABASE IF NOT EXISTS smms;` to make an empty container named "smms".
2. Then, we used `CREATE TABLE` commands inside the `schema.sql` file. Each table is like a separate sheet. For example, `CREATE TABLE PERSON` creates a sheet specifically to hold information about people.
3. We defined the "columns" for each table, like `FirstName`, `LastName`, and `DateOfBirth`.

---

## 🖼️ Why Views are Used and Where

**What is a View?**
Imagine you frequently have to combine data from 5 different tables to see "Astronauts currently on a Mission." Writing that complex SQL query every time is exhausting.
A **View** is like a saved, virtual table. You write the complex query once, save it as a "View", and then you can just look at the view as if it were a simple table.

**Why use them?**
- **Simplicity:** It hides the complex math and joining of tables.
- **Security:** You can let someone look at a View without giving them access to the real, raw tables.
- **Speed:** It makes writing code much faster.

**Where are they used in this project?**
You can find them in the `backend/sql/04_auth_views_triggers.sql` file. Some examples:
- **`vw_active_users`**: Quickly shows which users have logged in recently.
- **`vw_mission_activity`**: Combines data from missions, spacecraft, and astronauts into one easy-to-read summary table.
- **`vw_critical_alerts`**: Quickly lists all high-priority system warnings.

---

## 🛡️ Where Constraints are Applied

**What is a Constraint?**
A constraint is a "rule" you force the database to follow so nobody accidentally saves bad data.

**Where are they applied?**
Constraints are applied right when the tables are created in the `schema.sql` and `04_auth_views_triggers.sql` files.

Here are the main types of rules (constraints) used in your project:

1. **Primary Key (`PRIMARY KEY`)**: Every item must have a unique ID number. For example, `PersonID INT PRIMARY KEY`. This ensures no two people have the exact same ID.
2. **Foreign Key (`FOREIGN KEY`)**: This links tables together. For example, an Astronaut is linked to a Person using `PersonID`. If you delete the Person, the database automatically deletes the Astronaut record so you don't have "ghost" astronauts.
3. **Not Null (`NOT NULL`)**: This means a field cannot be left blank. For example, a person *must* have a `FirstName`.
4. **Check Constraints (`CHECK`)**: This limits the choices. For example, `Gender VARCHAR(10) CHECK (Gender IN ('M', 'F', 'Other'))` means you can only enter M, F, or Other for gender. Another example is checking if an email is formatted correctly.
5. **Triggers (`TRIGGER`)**: These are advanced, automated rules. For example, in `04_auth_views_triggers.sql`, there is a trigger that automatically checks to make sure an experiment's "Success Rating" is between 0 and 100. If someone tries to enter 150, the Trigger blocks it and shows an error.

## 🎯 Summary

In short:
- The **SQL files** build the foundation, the rules (constraints), and the shortcuts (views).
- The **Backend** talks to this database.
- The **Frontend** gives you a beautiful screen to click buttons instead of typing SQL code.
