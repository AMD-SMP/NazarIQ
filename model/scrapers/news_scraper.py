import feedparser
from datetime import datetime
import urllib.parse
import re

# ---------------------------------
# Hazard-Based Query Expansion
# ---------------------------------

NEWS_QUERIES = [
    "pothole city",
    "waterlogging city",
    "fallen tree road",
    "road collapse city",
    "construction accident site",
    "building structural failure city",
    "bridge collapse city",
    "sewage overflow road",
    "debris on road city"
]


def clean_html(raw_html):
    clean_text = re.sub("<.*?>", "", raw_html)
    clean_text = re.sub(r"\s+", " ", clean_text)
    return clean_text.strip()


def fetch_news_posts(limit_per_query=5):

    all_posts = []

    for query in NEWS_QUERIES:

        encoded_query = urllib.parse.quote(query)

        rss_url = (
            f"https://news.google.com/rss/search?"
            f"q={encoded_query}&hl=en-IN&gl=IN&ceid=IN:en"
        )

        feed = feedparser.parse(rss_url)

        for entry in feed.entries[:limit_per_query]:

            title = entry.title
            summary_raw = entry.summary if hasattr(entry, "summary") else ""
            summary = clean_html(summary_raw)

            image_url = None
            if "media_content" in entry:
                image_url = entry.media_content[0].get("url")

            full_text = f"{title} {summary}"

            all_posts.append({
                "source": "news",
                "title": title,
                "content": summary,
                "full_text": full_text,
                "image_url": image_url,
                "datetime": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "permalink": entry.link,
                "status": "DETECTED"
            })

    return all_posts