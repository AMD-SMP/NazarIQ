import time
from pymongo import MongoClient, errors
from scrapers.reddit_scraper import fetch_reddit_posts
from scrapers.news_scraper import fetch_news_posts
from nlp import analyze_hazard
from geocoder import get_coordinates

MONGO_URI = "mongodb+srv://himanp:1775909@cluster0.rfgnj7e.mongodb.net/?appName=Cluster0"

client = MongoClient(MONGO_URI)
db = client["civic_hazard_db"]
collection = db["india_incidents"]

collection.create_index("permalink", unique=True)

def run_pipeline():
    print("Running multi-source hazard scan...\n")

    reddit_posts = fetch_reddit_posts()
    news_posts = fetch_news_posts()

    all_posts = reddit_posts + news_posts

    print(f"Total posts collected: {len(all_posts)}")

    for index, post in enumerate(all_posts):
        print(f"\nProcessing {index + 1}/{len(all_posts)} | Source: {post['source']}")

        result = analyze_hazard(post["full_text"])
        print("NLP RESULT:", result)

        if not result.get("is_hazard"):
            continue

        coords = None
        if result.get("locations"):
            coords = get_coordinates(result["locations"][0])

        if not coords:
            continue

        document = {
            "source": post["source"],
            "title": post["title"],
            "summary": result.get("summary"),
            "hazard_type": result.get("hazard_type"),
            "severity": result.get("severity"),
            "confidence": result.get("confidence"),
            "location_name": result["locations"][0],
            "coordinates": coords,
            "image_url": post["image_url"],
            "permalink": post["permalink"],
            "datetime": post["datetime"]
        }

        try:
            collection.insert_one(document)
            print("Stored in DB")
        except errors.DuplicateKeyError:
            print("Duplicate skipped")


if __name__ == "__main__":
    while True:
        run_pipeline()
        print("\nSleeping for 12 hours...\n")
        time.sleep(60 * 60 * 12)  # 12 hours