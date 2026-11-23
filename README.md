Restaurant Booking System - Staff Portal

Course: COMP3810SEF (2026 Autumn)  

Group: Group91 

1. Project Introduction 

This project is a restaurant reservation management system. Customers can make reservations without registration or login and can check their reservations via phone number; employees must log in securely to view, modify, and delete all customer reservations. The system also provides a RESTful API for easy integration with external systems.

2. Group Members & Roles 

Members 1 (Li Tin Nok s13175440):
Database & Backend Logic (MongoDB Driver, CRUD functions)

Members 2 (Chen Hiu Chung - s1431291):
UI design of the webpage

Members 3 (Wu Yu Han s1457322): 
The theme design direction of the webpage

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


7. Operation Guide

1.npm start

2.Open http://localhost:8099. The port can be overridden with the PORT environment variable.

3.curl examples

//List all reservations

curl http://localhost:8099/api/reservations

//Create one

curl -X POST http://localhost:8099/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Chan Tai Man","mobile":"91234567","reserveDateTime":"2026-12-20 19:00","peopleCount":4,"tableNo":"Table 7"}'
  
curl -X POST http://localhost:8099/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"customerName":"LI Xiao Mei","mobile":"98765432","reserveDateTime":"2026-11-26 20:00","peopleCount":2,"tableNo":"T02","note":""}'
  
 //Update the status
 
curl -X PUT http://localhost:8099/api/reservations/<id> \
  -H "Content-Type: application/json" \
  -d '{"status":"Completed"}'
  
curl -X PUT http://localhost:8099/api/reservations/<id> \
  -H "Content-Type: application/json" \
  -d '{"peopleCount":3}'

  curl -X PUT http://localhost:8099/api/reservations/<id> \
  -H "Content-Type: application/json" \
  -d '{"peopleCount":6,"note":"need child seat"}'
  
//Delete

curl -X DELETE http://localhost:8099/api/reservations/<id>

// invalid Id format

curl -i -X PUT http://localhost:8099/api/reservations/12345 \
  -H "Content-Type: application/json" \
  -d '{"peopleCount":2}'

  // test invalid reservation status values
  
  curl -i -X PUT http://localhost:8099/api/reservations/你的ID/status \
  -H "Content-Type: application/json" \
  -d '{"status":"unknown_status"}'


