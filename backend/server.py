from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timedelta, timezone
from passlib.hash import bcrypt
import jwt
import os
import uuid
from dotenv import load_dotenv
from pathlib import Path
import shutil
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')
JWT_ALGORITHM = 'HS256'
security = HTTPBearer()

# Create the main app
app = FastAPI(title="Travel Agency API")
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    AGENT = "agent"
    CLIENT = "client"

class TripType(str, Enum):
    CRUISE = "cruise"
    RESORT = "resort"
    TOUR = "tour"
    CUSTOM = "custom"

class TripStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ItineraryType(str, Enum):
    PORT_DAY = "port_day"
    SEA_DAY = "sea_day"
    RESORT_DAY = "resort_day"
    TOUR_DAY = "tour_day"
    FREE_DAY = "free_day"

class POICategory(str, Enum):
    RESTAURANT = "restaurant"
    ATTRACTION = "attraction"
    HOTEL = "hotel"
    ACTIVITY = "activity"
    TRANSPORT = "transport"
    SHIP_FACILITY = "ship_facility"

class PhotoCategory(str, Enum):
    DESTINATION = "destination"
    SHIP_CABIN = "ship_cabin"
    SHIP_FACILITIES = "ship_facilities"
    DINING = "dining"
    ACTIVITIES = "activities"
    EXCURSION = "excursion"
    RESORT_ROOM = "resort_room"
    RESORT_BEACH = "resort_beach"
    RESORT_POOL = "resort_pool"
    TOUR_ATTRACTIONS = "tour_attractions"
    TOUR_HOTELS = "tour_hotels"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: UserRole = UserRole.CLIENT

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Trip(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    destination: str
    description: str
    start_date: datetime
    end_date: datetime
    client_id: str
    agent_id: str
    status: TripStatus = TripStatus.DRAFT
    trip_type: TripType
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TripCreate(BaseModel):
    title: str
    destination: str
    description: str
    start_date: datetime
    end_date: datetime
    client_id: str
    trip_type: TripType

class Itinerary(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trip_id: str
    day_number: int
    date: datetime
    title: str
    description: str
    itinerary_type: ItineraryType
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ItineraryCreate(BaseModel):
    trip_id: str
    day_number: int
    date: datetime
    title: str
    description: str
    itinerary_type: ItineraryType

class CruiseInfo(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trip_id: str
    ship_name: str
    cabin_number: str
    departure_time: datetime
    return_time: datetime
    ship_facilities: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CruiseInfoCreate(BaseModel):
    trip_id: str
    ship_name: str
    cabin_number: str
    departure_time: datetime
    return_time: datetime
    ship_facilities: List[str] = []

class PortSchedule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trip_id: str
    itinerary_id: str
    port_name: str
    arrival_time: datetime
    departure_time: datetime
    all_aboard_time: datetime
    transport_info: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PortScheduleCreate(BaseModel):
    trip_id: str
    itinerary_id: str
    port_name: str
    arrival_time: datetime
    departure_time: datetime
    all_aboard_time: datetime
    transport_info: str = ""

class POI(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: POICategory
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: str = ""
    phone: str = ""
    website: str = ""
    price_range: str = ""
    image_urls: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class POICreate(BaseModel):
    name: str
    category: POICategory
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: str = ""
    phone: str = ""
    website: str = ""
    price_range: str = ""
    image_urls: List[str] = []

class ItineraryPOI(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    itinerary_id: str
    poi_id: str
    order_number: int
    visit_time: datetime
    duration_minutes: int
    transport_type: str = ""
    transport_duration: int = 0
    notes: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ItineraryPOICreate(BaseModel):
    itinerary_id: str
    poi_id: str
    order_number: int
    visit_time: datetime
    duration_minutes: int
    transport_type: str = ""
    transport_duration: int = 0
    notes: str = ""

class ClientPhoto(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trip_id: str
    client_id: str
    url: str
    caption: str = ""
    photo_category: PhotoCategory
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ShipActivity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    cruise_info_id: str
    day_date: datetime
    activity_name: str
    activity_time: datetime
    location: str
    description: str = ""
    image_url: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ShipActivityCreate(BaseModel):
    cruise_info_id: str
    day_date: datetime
    activity_name: str
    activity_time: datetime
    location: str
    description: str = ""
    image_url: str = ""

class ClientNote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trip_id: str
    client_id: str
    day_number: int
    note_text: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClientNoteCreate(BaseModel):
    trip_id: str
    day_number: int
    note_text: str

# Utility functions
def create_token(user_data: dict) -> str:
    payload = {
        "user_id": user_data["id"],
        "email": user_data["email"],
        "role": user_data["role"],
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
            elif isinstance(value, dict):
                data[key] = prepare_for_mongo(value)
            elif isinstance(value, list):
                data[key] = [prepare_for_mongo(item) if isinstance(item, dict) else item for item in value]
    return data

def parse_from_mongo(item):
    """Parse datetime strings from MongoDB back to datetime objects"""
    if isinstance(item, dict):
        for key, value in item.items():
            if isinstance(value, str) and 'T' in value and (value.endswith('Z') or '+' in value):
                try:
                    item[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except:
                    pass
            elif isinstance(value, dict):
                item[key] = parse_from_mongo(value)
            elif isinstance(value, list):
                item[key] = [parse_from_mongo(subitem) if isinstance(subitem, dict) else subitem for subitem in value]
    return item

# Authentication endpoints
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = bcrypt.hash(user_data.password)
    
    # Create user
    user = User(**user_data.dict(exclude={"password"}))
    user_dict = prepare_for_mongo(user.dict())
    user_dict["hashed_password"] = hashed_password
    
    await db.users.insert_one(user_dict)
    
    # Create token
    token = create_token(user_dict)
    
    return {"user": user, "token": token}

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    if not user or not bcrypt.verify(login_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user)
    user_response = User(**parse_from_mongo(user))
    
    return {"user": user_response, "token": token}

@api_router.get("/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return User(**parse_from_mongo(current_user))

# Trip endpoints
@api_router.get("/trips", response_model=List[Trip])
async def get_trips(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        trips = await db.trips.find().to_list(1000)
    elif current_user["role"] == "agent":
        trips = await db.trips.find({"agent_id": current_user["id"]}).to_list(1000)
    else:  # client
        trips = await db.trips.find({"client_id": current_user["id"]}).to_list(1000)
    
    return [Trip(**parse_from_mongo(trip)) for trip in trips]

@api_router.post("/trips", response_model=Trip)
async def create_trip(trip_data: TripCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "agent"]:
        raise HTTPException(status_code=403, detail="Not authorized to create trips")
    
    trip = Trip(**trip_data.dict(), agent_id=current_user["id"])
    trip_dict = prepare_for_mongo(trip.dict())
    
    await db.trips.insert_one(trip_dict)
    return trip

@api_router.get("/trips/{trip_id}", response_model=Trip)
async def get_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    trip = await db.trips.find_one({"id": trip_id})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # Check permissions
    if (current_user["role"] == "client" and trip["client_id"] != current_user["id"]) or \
       (current_user["role"] == "agent" and trip["agent_id"] != current_user["id"]):
        raise HTTPException(status_code=403, detail="Not authorized to view this trip")
    
    return Trip(**parse_from_mongo(trip))

@api_router.put("/trips/{trip_id}", response_model=Trip)
async def update_trip(trip_id: str, trip_data: TripCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "agent"]:
        raise HTTPException(status_code=403, detail="Not authorized to update trips")
    
    trip = await db.trips.find_one({"id": trip_id})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    update_data = prepare_for_mongo(trip_data.dict())
    await db.trips.update_one({"id": trip_id}, {"$set": update_data})
    
    updated_trip = await db.trips.find_one({"id": trip_id})
    return Trip(**parse_from_mongo(updated_trip))

@api_router.delete("/trips/{trip_id}")
async def delete_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "agent"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete trips")
    
    result = await db.trips.delete_one({"id": trip_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    return {"message": "Trip deleted successfully"}

# Itinerary endpoints
@api_router.get("/trips/{trip_id}/itineraries", response_model=List[Itinerary])
async def get_itineraries(trip_id: str, current_user: dict = Depends(get_current_user)):
    itineraries = await db.itineraries.find({"trip_id": trip_id}).to_list(1000)
    return [Itinerary(**parse_from_mongo(itinerary)) for itinerary in itineraries]

@api_router.post("/itineraries", response_model=Itinerary)
async def create_itinerary(itinerary_data: ItineraryCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "agent"]:
        raise HTTPException(status_code=403, detail="Not authorized to create itineraries")
    
    itinerary = Itinerary(**itinerary_data.dict())
    itinerary_dict = prepare_for_mongo(itinerary.dict())
    
    await db.itineraries.insert_one(itinerary_dict)
    return itinerary

@api_router.put("/itineraries/{itinerary_id}", response_model=Itinerary)
async def update_itinerary(itinerary_id: str, itinerary_data: ItineraryCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "agent"]:
        raise HTTPException(status_code=403, detail="Not authorized to update itineraries")
    
    update_data = prepare_for_mongo(itinerary_data.dict())
    await db.itineraries.update_one({"id": itinerary_id}, {"$set": update_data})
    
    updated_itinerary = await db.itineraries.find_one({"id": itinerary_id})
    if not updated_itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    
    return Itinerary(**parse_from_mongo(updated_itinerary))

# Cruise specific endpoints
@api_router.post("/trips/{trip_id}/cruise-info", response_model=CruiseInfo)
async def create_cruise_info(trip_id: str, cruise_data: CruiseInfoCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "agent"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    cruise_info = CruiseInfo(**cruise_data.dict())
    cruise_dict = prepare_for_mongo(cruise_info.dict())
    
    await db.cruise_info.insert_one(cruise_dict)
    return cruise_info

@api_router.get("/trips/{trip_id}/cruise-info", response_model=Optional[CruiseInfo])
async def get_cruise_info(trip_id: str, current_user: dict = Depends(get_current_user)):
    cruise_info = await db.cruise_info.find_one({"trip_id": trip_id})
    if cruise_info:
        return CruiseInfo(**parse_from_mongo(cruise_info))
    return None

@api_router.get("/trips/{trip_id}/port-schedules", response_model=List[PortSchedule])
async def get_port_schedules(trip_id: str, current_user: dict = Depends(get_current_user)):
    schedules = await db.port_schedules.find({"trip_id": trip_id}).to_list(1000)
    return [PortSchedule(**parse_from_mongo(schedule)) for schedule in schedules]

@api_router.post("/port-schedules", response_model=PortSchedule)
async def create_port_schedule(schedule_data: PortScheduleCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "agent"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    schedule = PortSchedule(**schedule_data.dict())
    schedule_dict = prepare_for_mongo(schedule.dict())
    
    await db.port_schedules.insert_one(schedule_dict)
    return schedule

# POI endpoints
@api_router.get("/pois", response_model=List[POI])
async def get_pois(category: Optional[POICategory] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if category:
        query["category"] = category
    
    pois = await db.pois.find(query).to_list(1000)
    return [POI(**parse_from_mongo(poi)) for poi in pois]

@api_router.post("/pois", response_model=POI)
async def create_poi(poi_data: POICreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "agent"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    poi = POI(**poi_data.dict())
    poi_dict = prepare_for_mongo(poi.dict())
    
    await db.pois.insert_one(poi_dict)
    return poi

# Photo endpoints
@api_router.post("/trips/{trip_id}/photos")
async def upload_photo(
    trip_id: str,
    file: UploadFile = File(...),
    caption: str = Form(""),
    photo_category: PhotoCategory = Form(...),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "client":
        # Check if agent owns this trip
        trip = await db.trips.find_one({"id": trip_id})
        if not trip or (current_user["role"] == "agent" and trip["agent_id"] != current_user["id"]):
            raise HTTPException(status_code=403, detail="Not authorized")
    else:
        # Check if client owns this trip
        trip = await db.trips.find_one({"id": trip_id})
        if not trip or trip["client_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    # Create uploads directory if it doesn't exist
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)
    
    # Save file
    file_id = str(uuid.uuid4())
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{file_id}.{file_extension}"
    file_path = upload_dir / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Save photo info to database
    photo = ClientPhoto(
        trip_id=trip_id,
        client_id=current_user["id"],
        url=f"/uploads/{filename}",
        caption=caption,
        photo_category=photo_category
    )
    
    photo_dict = prepare_for_mongo(photo.dict())
    await db.client_photos.insert_one(photo_dict)
    
    return photo

@api_router.get("/trips/{trip_id}/photos", response_model=List[ClientPhoto])
async def get_trip_photos(
    trip_id: str,
    category: Optional[PhotoCategory] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"trip_id": trip_id}
    if category:
        query["photo_category"] = category
    
    photos = await db.client_photos.find(query).to_list(1000)
    return [ClientPhoto(**parse_from_mongo(photo)) for photo in photos]

# Client notes endpoints
@api_router.get("/trips/{trip_id}/notes", response_model=List[ClientNote])
async def get_client_notes(trip_id: str, current_user: dict = Depends(get_current_user)):
    notes = await db.client_notes.find({"trip_id": trip_id, "client_id": current_user["id"]}).to_list(1000)
    return [ClientNote(**parse_from_mongo(note)) for note in notes]

@api_router.post("/trips/{trip_id}/notes", response_model=ClientNote)
async def create_client_note(trip_id: str, note_data: ClientNoteCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Only clients can create notes")
    
    note = ClientNote(**note_data.dict(), client_id=current_user["id"])
    note_dict = prepare_for_mongo(note.dict())
    
    await db.client_notes.insert_one(note_dict)
    return note

@api_router.put("/notes/{note_id}", response_model=ClientNote)
async def update_client_note(note_id: str, note_text: str, current_user: dict = Depends(get_current_user)):
    note = await db.client_notes.find_one({"id": note_id, "client_id": current_user["id"]})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    update_data = {
        "note_text": note_text,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.client_notes.update_one({"id": note_id}, {"$set": update_data})
    
    updated_note = await db.client_notes.find_one({"id": note_id})
    return ClientNote(**parse_from_mongo(updated_note))

# Users management (admin only)
@api_router.get("/users", response_model=List[User])
async def get_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find().to_list(1000)
    return [User(**parse_from_mongo(user)) for user in users]

# Dashboard stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        total_trips = await db.trips.count_documents({})
        total_users = await db.users.count_documents({})
        active_trips = await db.trips.count_documents({"status": "active"})
        
        return {
            "total_trips": total_trips,
            "total_users": total_users,
            "active_trips": active_trips,
            "total_photos": await db.client_photos.count_documents({})
        }
    elif current_user["role"] == "agent":
        agent_trips = await db.trips.count_documents({"agent_id": current_user["id"]})
        active_trips = await db.trips.count_documents({"agent_id": current_user["id"], "status": "active"})
        
        return {
            "my_trips": agent_trips,
            "active_trips": active_trips,
            "completed_trips": await db.trips.count_documents({"agent_id": current_user["id"], "status": "completed"})
        }
    else:  # client
        my_trips = await db.trips.count_documents({"client_id": current_user["id"]})
        my_photos = await db.client_photos.count_documents({"client_id": current_user["id"]})
        
        return {
            "my_trips": my_trips,
            "my_photos": my_photos,
            "upcoming_trips": await db.trips.count_documents({
                "client_id": current_user["id"],
                "start_date": {"$gte": datetime.now(timezone.utc).isoformat()}
            })
        }

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()