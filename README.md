Vehicle Booking System (Django REST API)
📌 Overview

A complete backend system for managing vehicles, bookings, pricing validation, availability checks, and REST APIs built using Django REST Framework.

🔧 Tech Stack

Python

Django

Django REST Framework

MySQL

Postman / Swagger

Setup & Installation

1️--- Clone the repository
git clone https://github.com/Jittojose/vehicle_booking_project.git

cd vehicle_booking_project/backend

2️--- Create Virtual Environment
python -m venv venv
source venv/Scripts/activate  # Windows

3️--- Install dependencies
pip install -r requirements.txt

4️--- Create your .env file

Copy .env.example → .env
Update with your real DB values.

5️--- Run migrations
python manage.py makemigrations
python manage.py migrate

6️--- Start the server
python manage.py runserver

* Testing APIs (Postman / Swagger)

After running server, open:

http://127.0.0.1:8000/swagger/


Or use Postman.

📌 API Endpoints
Vehicles
Method	Endpoint	Description
GET	/api/vehicles/	List all vehicles
POST	/api/vehicles/	Create vehicle
GET	/api/vehicles/<id>/	Get single vehicle
PUT	/api/vehicles/<id>/	Update vehicle
DELETE	/api/vehicles/<id>/	Delete vehicle
Bookings
Method	Endpoint	Description
POST	/api/bookings/	Create booking
GET	/api/bookings/	List bookings
GET	/api/bookings/<id>/	Booking detail

📝 Sample Booking JSON
{
  "vehicle": 1,
  "start_date": "2025-01-15",
  "end_date": "2025-01-20",
  "customer_name": "John Doe"
}
