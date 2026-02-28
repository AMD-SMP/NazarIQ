from transformers import pipeline
import spacy
import re

classifier = pipeline(
    "zero-shot-classification",
    model="valhalla/distilbart-mnli-12-1"
)

nlp = spacy.load("en_core_web_sm")

INDIAN_STATES = [
    "kerala", "rajasthan", "gujarat", "maharashtra",
    "karnataka", "tamil nadu", "delhi", "bihar",
    "uttar pradesh", "west bengal", "odisha"
]

INVALID_WORDS = [
    "republic", "times", "ndtv", "news",
    "metro", "world", "telegraph"
]

CRITICAL_WORDS = ["death", "killed", "fatal", "collapsed"]
HIGH_WORDS = ["huge", "severe", "major"]
MEDIUM_WORDS = ["pothole", "crack", "construction"]


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
            loc = ent.text.strip()
            loc = re.sub(r"[^a-zA-Z\s]", "", loc).strip()

            if len(loc) < 3:
                continue

            if any(bad in loc.lower() for bad in INVALID_WORDS):
                continue

            candidates.append(loc)

    if not candidates:
        return None

    candidates = list(set(candidates))

    # Remove generic "India" if more specific exists
    if "India" in candidates and len(candidates) > 1:
        candidates.remove("India")

    # If only India exists → reject
    if candidates == ["India"]:
        return None

    # Prefer non-state names (city > state)
    non_state = [
        loc for loc in candidates
        if loc.lower() not in INDIAN_STATES
    ]

    if non_state:
        return non_state[0]

    return candidates[0]


def analyze_hazard(text):

    text = clean_text(text)

    labels = [
        "road pothole",
        "damaged road",
        "construction failure",
        "bridge structural damage",
        "building collapse",
        "safe content"
    ]

    result = classifier(text, labels)

    top_label = result["labels"][0]
    score = result["scores"][0]

    if score < 0.6:
        return {"is_hazard": False}

    if top_label == "safe content":
        return {"is_hazard": False}

    best_location = extract_best_location(text)

    if not best_location:
        return {"is_hazard": False}

    severity = detect_severity(text)

    summary = ". ".join(text.split(".")[:2])

    return {
        "is_hazard": True,
        "hazard_type": top_label,
        "confidence": round(score, 3),
        "severity": severity,
        "locations": [best_location],
        "summary": summary
    }