import spacy
import re

nlp = spacy.load("en_core_web_sm")

HAZARD_KEYWORDS = [
    "pothole", "road collapse", "bridge collapse",
    "construction failure", "building collapse",
    "sewage overflow", "waterlogging", "debris"
]

CRITICAL_WORDS = ["death", "killed", "fatal", "collapsed"]
HIGH_WORDS = ["huge", "severe", "major"]
MEDIUM_WORDS = ["pothole", "crack", "construction"]

INVALID_WORDS = [
    "republic", "times", "ndtv", "news",
    "metro", "world", "telegraph"
]

INDIAN_STATES = [
    "kerala", "rajasthan", "gujarat", "maharashtra",
    "karnataka", "tamil nadu", "delhi", "bihar",
    "uttar pradesh", "west bengal", "odisha"
]


def clean_text(text):
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def detect_severity(text):
    text = text.lower()

    if any(word in text for word in CRITICAL_WORDS):
        return "CRITICAL"
    if any(word in text for word in HIGH_WORDS):
        return "HIGH"
    if any(word in text for word in MEDIUM_WORDS):
        return "MEDIUM"

    return "LOW"


def extract_best_location(text):
    doc = nlp(text)
    candidates = []

    for ent in doc.ents:
        if ent.label_ in ["GPE", "LOC", "FAC"]:
            loc = re.sub(r"[^a-zA-Z\s]", "", ent.text).strip()

            if len(loc) < 3:
                continue
            if any(bad in loc.lower() for bad in INVALID_WORDS):
                continue

            candidates.append(loc)

    if not candidates:
        return None

    candidates = list(set(candidates))

    if "India" in candidates and len(candidates) > 1:
        candidates.remove("India")

    non_state = [loc for loc in candidates if loc.lower() not in INDIAN_STATES]

    return non_state[0] if non_state else candidates[0]


def analyze_hazard(text):
    text = clean_text(text.lower())

    if not any(keyword in text for keyword in HAZARD_KEYWORDS):
        return {"is_hazard": False}

    location = extract_best_location(text)
    if not location:
        return {"is_hazard": False}

    severity = detect_severity(text)
    summary = ". ".join(text.split(".")[:2])

    return {
        "is_hazard": True,
        "hazard_type": "civic_issue",
        "confidence": 0.8,
        "severity": severity,
        "locations": [location],
        "summary": summary
    }