import requests
from datetime import datetime

# ---------------------------------
# Hazard-Based Query Expansion
# ---------------------------------

SEARCH_QUERIES = [
    "pothole near me",
    "waterlogging road",
    "road collapse",
    "bridge collapse",
    "fallen tree blocking road",
    "construction accident",
    "building collapse",
    "sewage overflow street",
    "debris on highway"
]


def fetch_reddit_posts(limit_per_query=5):

    headers = {"User-Agent": "civic-hazard-ai"}
    all_posts = []

    for query in SEARCH_QUERIES:

        url = f"https://www.reddit.com/search.json?q={query}&sort=new&limit={limit_per_query}"

        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            print("Reddit fetch error:", e)
            continue

        for post in data["data"]["children"]:
            post_data = post["data"]

            image_url = post_data.get("url_overridden_by_dest")

            if not image_url or not image_url.startswith("http"):
                continue

            full_text = f"{post_data.get('title','')} {post_data.get('selftext','')}"

            all_posts.append({
                "source": "reddit",
                "title": post_data.get("title"),
                "content": post_data.get("selftext"),
                "full_text": full_text,
                "image_url": image_url,
                "datetime": datetime.utcfromtimestamp(
                    post_data.get("created_utc")
                ).strftime("%Y-%m-%d %H:%M:%S"),
                "permalink": "https://reddit.com" + post_data.get("permalink",""),
                "status": "DETECTED"
            })

    return all_posts