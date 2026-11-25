Restaurant Booking System - Staff Portal

Course: COMP3810SEF (2026 Autumn)  

Group: Group91 

1. Project Introduction 

This project is a restaurant reservation management system. Customers can make reservations without registration or login and can check their reservations via phone number; employees must log in securely to view, modify, and delete all customer reservations. The system also provides a RESTful API for easy integration with external systems.

2. Group Members & Roles 

Members 1 (Li Tin Nok s13175440):
Database & Backend Logic 

Members 2 (Chen Hiu Chung - s1431291):
Frontend UI & Booking/Payment page design

Members 3 (Wu Yu Han s1457322): 
global styling and homepage design

Members 4 (Wong Hong Ching s1448094): 
UI design of the webpage

Members 5 (Chau Hung Hin s1320715): Backend testing

Members 6 (Law Tin Chau s1428357): testing the system, some of restful api


3. Technologies Used 
Web Framework:
Express.js

Database:
MongoDB (Node.js Driver)

Template Engine:
EJS

Authentication:
Cookie-Session

Frontend:
HTML, CSS

4. Project File Structure

gp91-restaurant-booking-system/

├── server.js

├── views/

│   └── index.ejs

│

├── package.json

├── package-lock.json

├── README.md

└── .gitignore

5.staff login guide

1. npm start
   
2. login url http://localhost:8099/staff/login  (or click the "Staff Login" button on the homepage).
   
3. Test Account:
   
     Username: ‘staff01’
     Password: ‘123456’
   
4.how to log out

   Once logged in, you will be redirected to the dashboard. Click the "Logout" button (or visit ‘http://localhost:8099/staff/logout’) to clear the session.


6. Operation Guide

1.npm start

2.Open http://localhost:8099. The port can be overridden with the PORT environment variable.

3.curl examples

//List all reservations

curl http://localhost:8099/api/reservations

//Create one

curl -X POST http://localhost:8099/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Mr. Alex Chan",
    "mobile": "+852 91234567",
    "reserveDateTime": "2026-11-28 19:30",
    "peopleCount": 2,
    "tableNo": "Table 1",
    "note": "Window seat please"
  }'
  
 //Update the status
 
curl -X PUT http://localhost:8099/api/reservations/ "id" \
  -H "Content-Type: application/json" \
  -d '{
    "peopleCount": 4,
    "tableNo": "Table 5",
    "note": "Updated to 4 guests"
  }'
  
//Delete

curl -X DELETE http://localhost:8099/api/reservations/ "id"




