import pandas as pd
from pymongo import MongoClient, errors

# ---------------------------------
# CONFIG
# ---------------------------------

MONGO_URI = "mongodb+srv://himanp:1775909@cluster0.rfgnj7e.mongodb.net/?appName=Cluster0"

DATABASE_NAME = "civic_hazard_db"
COLLECTION_NAME = "india_incidents"

EXCEL_FILE_PATH = "civic_hazard_pan_india_2000.xlsx"

# ---------------------------------
# CONNECT TO MONGODB
# ---------------------------------

client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]
collection = db[COLLECTION_NAME]

collection.create_index("permalink", unique=True)

print("✅ Connected to MongoDB")

# ---------------------------------
# READ EXCEL
# ---------------------------------

df = pd.read_excel(EXCEL_FILE_PATH)

print(f"📄 Loaded {len(df)} rows from Excel")

# ---------------------------------
# PREPARE DOCUMENTS
# ---------------------------------

documents = []

for _, row in df.iterrows():

    doc = {
        "title": row["title"],
        "summary": row["summary"],
        "hazard_type": row["hazard_type"],
        "severity": row["severity"],
        "confidence": float(row["confidence"]),
        "location_name": row["location_name"],
        "coordinates": {
            "latitude": float(row["latitude"]),
            "longitude": float(row["longitude"])
        },
        "image_url": row["image_url"],
        "permalink": row["permalink"],
        "datetime": row["datetime"],
        "status": row["status"],
        "source": row["source"]
    }

    documents.append(doc)

# ---------------------------------
# BULK INSERT
# ---------------------------------

try:
    result = collection.insert_many(documents, ordered=False)
    print(f"🚀 Inserted {len(result.inserted_ids)} documents successfully!")

except errors.BulkWriteError:
    print("⚠ Some duplicates skipped (permalink already exists).")

print("✅ Upload complete.")