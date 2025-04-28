safeCampus API Documentation 📚

# Panic Alert Routes

## 1. Trigger Panic Alert
**Endpoint**: `POST /api/sos/trigger`  
**Description**: Allows a user to trigger a panic alert.  
**Authentication**: Token required in the header.  

### Request Body:
```json
{
  "location": {
    "type": "Point",
    "coordinates": [38.80895765457167, 8.891288891174664]
  },
  "address": "Dorm 2, Room 303, AASTU Main Campus"
}
```




