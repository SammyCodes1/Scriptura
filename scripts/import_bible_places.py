import os
import json
import urllib.request
import re
import time

CACHE_DIR = os.path.join(os.path.dirname(__file__), ".openbible_cache")
os.makedirs(CACHE_DIR, exist_ok=True)

GITHUB_BASE = "https://raw.githubusercontent.com/openbibleinfo/Bible-Geocoding-Data/main/data"

FEATURED_PLACES = {
    "Jerusalem": "The City of David, site of Solomon's Temple, and the holy center of Jesus' crucifixion and resurrection.",
    "Bethlehem": "The historic City of David and prophesied birthplace of Jesus Christ in Judea.",
    "Nazareth": "The Galilean village where Jesus spent His childhood, youth, and grew in wisdom and favor.",
    "Sea of Galilee": "Freshwater lake where Jesus walked on water, calmed the raging storm, and called the apostles.",
    "Mount Sinai": "The holy mountain of God where the covenant was established and the Ten Commandments revealed.",
    "Jericho": "Ancient oasis city whose formidable walls miraculously collapsed before Israel's faith.",
    "Bethel": "The sacred sanctuary where Jacob beheld the heavenly ladder and received God's blessing.",
    "Damascus": "Ancient Syrian crossroads where Saul was dramatically struck by light and converted to Christ.",
    "Mount Carmel": "The coastal mountain summit where Elijah called down fire from heaven against Baal's prophets.",
    "Antioch": "Vibrant missionary launchpad where the disciples were first called Christians.",
    "Corinth": "Major cosmopolitan Greek trade center where Paul established a church and taught on love and gifts.",
    "Ephesus": "Roman metropolis of Asia Minor where Paul ministered three years and John later penned Scripture.",
    "Rome": "Imperial capital where the apostles Paul and Peter fearlessly preached the kingdom of God.",
    "Goshen": "The fertile Nile delta region where Jacob's family prospered and multiplied into the nation of Israel.",
    "Babylon": "Imperial capital along the Euphrates where Daniel stood steadfast and Judah endured exile.",
    "Mount Ararat": "The majestic mountain crest in eastern Anatolia where Noah's Ark rested after the Great Deluge.",
    "Capernaum": "Headquarters of Jesus' Galilean ministry, site of many miracles, and home of Simon Peter.",
    "Caesarea": "Roman provincial capital where the gospel first reached Gentile Cornelius and Paul stood trial.",
    "Hebron": "Burial site of the patriarchs Abraham, Isaac, and Jacob, and David's royal capital for seven years.",
    "Shiloh": "The sacred resting place of the Tabernacle and Ark of the Covenant throughout the era of the Judges.",
    "Beersheba": "The southern covenant border of the Promised Land, marked by Abraham's well of peace.",
    "Joppa": "Ancient Mediterranean seaport from which Jonah fled, and where Peter received his rooftop vision.",
    "Mount of Olives": "The sacred ridge overlooking Jerusalem where Jesus taught, wept, and ascended to the Father.",
    "Jordan River": "The storied boundary where Israel crossed dryshod and Jesus was baptized by John.",
    "Samaria": "The hill capital of the northern kingdom of Israel, later revived through Philip's gospel preaching.",
    "Bethany": "Quiet village on the slope of Olivet where Jesus raised Lazarus and enjoyed fellowship with Mary and Martha.",
    "Athens": "The philosophical epicenter of Greece where Paul proclaimed the 'Unknown God' at Mars Hill.",
    "Philippi": "Leading city of Macedonia where the Roman jailer and Lydia came to faith in Christ.",
    "Thessalonica": "Prominent seaport of Macedonia whose believers were commended for their work of faith and labor of love.",
    "Tyre": "Wealthy Phoenician port famed for maritime trade and cedar, frequently addressed by the prophets.",
    "Sidon": "Historic Phoenician haven of merchants and artisans visited by Jesus and the early church.",
    "Nineveh": "Assyrian capital along the Tigris that repented in sackcloth and ashes at Jonah's proclamation.",
    "Ur": "Ancient Mesopotamian city from which Abraham journeyed out by faith into God's promised land.",
    "Haran": "North Mesopotamian commercial center where Terah settled and Jacob tended Laban's flocks.",
    "Shechem": "The valley between Mount Ebal and Gerizim where Abraham built his first altar in the land.",
    "Emmaus": "The destination village where two disciples' hearts burned as the risen Christ opened the Scriptures.",
    "Caesarea Philippi": "Rock sanctuary near Mount Hermon where Peter declared: 'You are the Christ, Son of the Living God.'",
    "Patmos": "Rugged Aegean isle of exile where the apostle John received the apocalyptic visions of Revelation.",
    "Mount Nebo": "Summit in Moab where God showed Moses the panoramic vista of the Promised Land before his passing.",
    "Tarshish": "Far-off western Mediterranean port destination sought by the fleeing prophet Jonah.",
    "Troas": "Aegean harbor where Paul received the nocturnal vision of the man of Macedonia pleading for help.",
    "Colossae": "Phrygian city in the Lycus Valley to whose assembly Paul directed his epistle on the supremacy of Christ.",
    "Berea": "Macedonian town celebrated for noble residents who daily searched the Scriptures to verify truth.",
    "Susa": "Persian royal fortress where Queen Esther risked her life for her people and Nehemiah served the king.",
    "Gethsemane": "Quiet olive grove at the foot of Mount of Olives where Jesus agonized in prayer before the cross."
}

def download_file(filename):
    local_path = os.path.join(CACHE_DIR, filename)
    if os.path.exists(local_path) and os.path.getsize(local_path) > 1000:
        print(f"Using cached {filename} ({os.path.getsize(local_path)/1024/1024:.2f} MB)")
        return local_path
    
    url = f"{GITHUB_BASE}/{filename}"
    print(f"Downloading {filename} from {url}...")
    t0 = time.time()
    urllib.request.urlretrieve(url, local_path)
    print(f"Downloaded {filename} ({os.path.getsize(local_path)/1024/1024:.2f} MB) in {time.time()-t0:.2f}s")
    return local_path

def run_import():
    print("=" * 60)
    print("  SCRIPTURA BIBLE PLACES IMPORT PIPELINE")
    print("=" * 60)

    # 1. Download data files
    images_file = download_file("image.jsonl")
    modern_file = download_file("modern.jsonl")
    ancient_file = download_file("ancient.jsonl")

    # 2. Index images
    print("Indexing image metadata...")
    image_dict = {}
    with open(images_file, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip(): continue
            try:
                data = json.loads(line)
                img_id = data.get("id")
                if img_id:
                    # Preferred thumbnail URL
                    thumb_pattern = data.get("thumbnail_url_pattern")
                    if thumb_pattern and "####" in thumb_pattern:
                        thumb_url = thumb_pattern.replace("####", "400")
                    else:
                        thumb_url = data.get("file_url") or data.get("url")

                    license_str = data.get("license") or "Public Domain / CC"
                    credit = data.get("author") or data.get("credit") or "Wikimedia Commons contributor"
                    credit_url = data.get("credit_url") or data.get("url") or ""
                    
                    image_dict[img_id] = {
                        "thumb_url": thumb_url,
                        "file_url": data.get("file_url") or thumb_url,
                        "license": license_str,
                        "credit": credit,
                        "credit_url": credit_url,
                        "attribution": f"Photo by {credit} ({license_str})"
                    }
            except Exception as e:
                continue
    print(f"Indexed {len(image_dict)} images.")

    # 3. Index modern locations
    print("Indexing modern coordinates...")
    modern_dict = {}
    with open(modern_file, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip(): continue
            try:
                data = json.loads(line)
                mod_id = data.get("id")
                lonlat = data.get("lonlat")
                if mod_id and lonlat and "," in lonlat:
                    parts = lonlat.split(",")
                    lng = float(parts[0].strip())
                    lat = float(parts[1].strip())
                    
                    media = data.get("media", {})
                    thumb_meta = media.get("thumbnail", {}) if media else {}
                    img_id = thumb_meta.get("image_id")
                    
                    modern_dict[mod_id] = {
                        "lat": lat,
                        "lng": lng,
                        "image_id": img_id,
                        "thumb_meta": thumb_meta,
                        "friendly_id": data.get("friendly_id")
                    }
            except Exception as e:
                continue
    print(f"Indexed {len(modern_dict)} modern locations with coordinates.")

    # 4. Process ancient places and join
    print("Processing ancient places and resolving associations...")
    places = []
    seen_names = set()

    with open(ancient_file, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip(): continue
            try:
                data = json.loads(line)
                name = data.get("friendly_id")
                if not name or name in seen_names:
                    continue

                ancient_id = data.get("id")
                verses_raw = data.get("verses", [])
                verse_refs = [v.get("readable") for v in verses_raw if v.get("readable")]
                verse_count = len(verse_refs)

                # Determine coordinates and image
                lat = None
                lng = None
                img_info = None
                confidence = 0

                # Option A: Check resolutions in identifications
                identifications = data.get("identifications", [])
                best_score = -1
                for ident in identifications:
                    # check score
                    score_obj = ident.get("score", {})
                    score_val = score_obj.get("time_total", 500) if isinstance(score_obj, dict) else 500
                    
                    # check thumbnail
                    ident_media = ident.get("media", {})
                    ident_thumb = ident_media.get("thumbnail", {}) if ident_media else {}
                    ident_img_id = ident_thumb.get("image_id")

                    resolutions = ident.get("resolutions", [])
                    for res in resolutions:
                        lonlat = res.get("lonlat")
                        if lonlat and "," in lonlat and score_val > best_score:
                            p_lng, p_lat = [float(x.strip()) for x in lonlat.split(",")]
                            lng = p_lng
                            lat = p_lat
                            confidence = score_val
                            best_score = score_val
                            if ident_img_id and ident_img_id in image_dict:
                                img_info = image_dict[ident_img_id]

                # Option B: Fallback to modern_associations
                if (lat is None or lng is None) and data.get("modern_associations"):
                    mod_assocs = data.get("modern_associations")
                    for mod_id, assoc_info in mod_assocs.items():
                        if mod_id in modern_dict:
                            mod = modern_dict[mod_id]
                            score_val = assoc_info.get("score", 500)
                            if score_val > best_score or lat is None:
                                lat = mod["lat"]
                                lng = mod["lng"]
                                confidence = score_val
                                best_score = score_val
                                if not img_info and mod.get("image_id") and mod["image_id"] in image_dict:
                                    img_info = image_dict[mod["image_id"]]

                # If still no coordinates, skip (we only want identifiable, mappable places)
                if lat is None or lng is None:
                    continue

                # Filter valid coordinates bounds (roughly biblical world: lat -10 to 60, lng -25 to 70)
                if not (-35 <= lat <= 65 and -30 <= lng <= 80):
                    continue

                # Check featured status
                is_featured = False
                featured_note = None

                # Normalize name (e.g. "Goshen 1" -> "Goshen", "Ur 1" -> "Ur")
                base_name = re.sub(r'\s+\d+$', '', name).strip()

                # Exact or normalized match in curated featured list
                for feat_name, note in FEATURED_PLACES.items():
                    feat_lower = feat_name.lower()
                    if base_name.lower() == feat_lower or name.lower() == feat_lower:
                        is_featured = True
                        featured_note = note
                        break
                    elif feat_lower in [f"mount {base_name.lower()}", f"river {base_name.lower()}", f"sea of {base_name.lower()}"]:
                        is_featured = True
                        featured_note = note
                        break
                    elif base_name.lower() in [f"mount {feat_lower}", f"river {feat_lower}", f"sea of {feat_lower}"]:
                        is_featured = True
                        featured_note = note
                        break

                # Prepare image fields
                image_url = img_info["thumb_url"] if img_info else None
                image_attribution = img_info["attribution"] if img_info else "OpenBible.info / Wikimedia Commons (Open License)"
                image_credit_url = img_info["credit_url"] if img_info else "https://commons.wikimedia.org"

                # Place ID slug
                clean_id = "place_" + re.sub(r'[^a-zA-Z0-9_]', '_', name.lower()).strip('_')

                place_record = {
                    "id": clean_id,
                    "ancient_id": ancient_id,
                    "name": name,
                    "lat": round(lat, 6),
                    "lng": round(lng, 6),
                    "confidence": confidence if confidence > 0 else 500,
                    "verse_refs": verse_refs[:80], # store up to 80 primary references
                    "verse_count": verse_count,
                    "image_url": image_url,
                    "image_attribution": image_attribution,
                    "image_credit_url": image_credit_url,
                    "is_featured": is_featured,
                    "featured_note": featured_note
                }

                places.append(place_record)
                seen_names.add(name)

            except Exception as e:
                continue

    # Ensure strategic places that might have alternate names are definitely featured
    # Sort places: featured first, then by verse_count descending
    places.sort(key=lambda p: (not p["is_featured"], -p["verse_count"], p["name"]))

    featured_count = sum(1 for p in places if p["is_featured"])
    print(f"Resolved {len(places)} identifiable Biblical places ({featured_count} curated featured).")

    # 5. Output JSON for app bundling
    out_json_path = os.path.join(os.path.dirname(__file__), "..", "assets", "data", "bible_places.json")
    with open(out_json_path, "w", encoding="utf-8") as f:
        json.dump(places, f, ensure_ascii=False, indent=2)
    print(f"Generated bundled JSON: {out_json_path} ({os.path.getsize(out_json_path)/1024:.1f} KB)")

    # 6. Output Postgres Migration SQL
    migrations_dir = os.path.join(os.path.dirname(__file__), "..", "supabase", "migrations")
    os.makedirs(migrations_dir, exist_ok=True)
    out_sql_path = os.path.join(migrations_dir, "20260924_bible_places.sql")

    with open(out_sql_path, "w", encoding="utf-8") as f:
        f.write("-- Migration: BiblePlace Geocoding Table and Data\n")
        f.write("-- Sourced from OpenBible.info Bible Geocoding Data (CC-BY 4.0)\n\n")
        f.write("CREATE TABLE IF NOT EXISTS public.\"BiblePlace\" (\n")
        f.write("    id TEXT PRIMARY KEY,\n")
        f.write("    name TEXT NOT NULL,\n")
        f.write("    lat DOUBLE PRECISION NOT NULL,\n")
        f.write("    lng DOUBLE PRECISION NOT NULL,\n")
        f.write("    confidence INTEGER DEFAULT 500,\n")
        f.write("    verse_refs TEXT[] DEFAULT '{}',\n")
        f.write("    verse_count INTEGER NOT NULL DEFAULT 0,\n")
        f.write("    image_url TEXT,\n")
        f.write("    image_attribution TEXT,\n")
        f.write("    image_credit_url TEXT,\n")
        f.write("    is_featured BOOLEAN NOT NULL DEFAULT FALSE,\n")
        f.write("    featured_note TEXT,\n")
        f.write("    created_at TIMESTAMPTZ DEFAULT NOW()\n")
        f.write(");\n\n")
        f.write("-- Indexes for fast geo & name search\n")
        f.write("CREATE INDEX IF NOT EXISTS idx_bible_places_name ON public.\"BiblePlace\" (name);\n")
        f.write("CREATE INDEX IF NOT EXISTS idx_bible_places_featured ON public.\"BiblePlace\" (is_featured);\n\n")
        f.write("-- RLS: Public read-only access\n")
        f.write("ALTER TABLE public.\"BiblePlace\" ENABLE ROW LEVEL SECURITY;\n")
        f.write("CREATE POLICY \"Allow public read of BiblePlace\" ON public.\"BiblePlace\" FOR SELECT USING (true);\n\n")
        
        f.write("-- Seed Data\n")
        f.write("INSERT INTO public.\"BiblePlace\" (id, name, lat, lng, confidence, verse_refs, verse_count, image_url, image_attribution, image_credit_url, is_featured, featured_note)\nVALUES\n")

        rows = []
        for p in places:
            id_esc = p["id"].replace("'", "''")
            name_esc = p["name"].replace("'", "''")
            lat_val = p["lat"]
            lng_val = p["lng"]
            conf_val = p["confidence"]
            vcount_val = p["verse_count"]
            
            # format Postgres array: ARRAY['v1', 'v2']
            vrefs_escaped = ["'" + v.replace("'", "''") + "'" for v in p["verse_refs"][:30]]
            vrefs_sql = f"ARRAY[{','.join(vrefs_escaped)}]" if vrefs_escaped else "'{}'::text[]"

            img_url_val = p["image_url"].replace("'", "''") if p["image_url"] else ""
            img_url_sql = f"'{img_url_val}'" if p["image_url"] else "NULL"

            img_attr_val = p["image_attribution"].replace("'", "''") if p["image_attribution"] else ""
            img_attr_sql = f"'{img_attr_val}'" if p["image_attribution"] else "NULL"

            img_credit_val = p["image_credit_url"].replace("'", "''") if p["image_credit_url"] else ""
            img_credit_url_sql = f"'{img_credit_val}'" if p["image_credit_url"] else "NULL"

            is_feat_sql = "TRUE" if p["is_featured"] else "FALSE"
            note_val = p["featured_note"].replace("'", "''") if p["featured_note"] else ""
            note_sql = f"'{note_val}'" if p["featured_note"] else "NULL"

            rows.append(f"('{id_esc}', '{name_esc}', {lat_val}, {lng_val}, {conf_val}, {vrefs_sql}, {vcount_val}, {img_url_sql}, {img_attr_sql}, {img_credit_url_sql}, {is_feat_sql}, {note_sql})")

        f.write(",\n".join(rows))
        f.write("\nON CONFLICT (id) DO UPDATE SET\n")
        f.write("  name = EXCLUDED.name,\n  lat = EXCLUDED.lat,\n  lng = EXCLUDED.lng,\n")
        f.write("  confidence = EXCLUDED.confidence,\n  verse_refs = EXCLUDED.verse_refs,\n")
        f.write("  verse_count = EXCLUDED.verse_count,\n  image_url = EXCLUDED.image_url,\n")
        f.write("  image_attribution = EXCLUDED.image_attribution,\n  is_featured = EXCLUDED.is_featured,\n")
        f.write("  featured_note = EXCLUDED.featured_note;\n")

    print(f"Generated Postgres Migration: {out_sql_path} ({os.path.getsize(out_sql_path)/1024:.1f} KB)")
    print("=" * 60)
    print("  IMPORT COMPLETE! ALL BIBLE PLACES READY FOR MAP SCREEN")
    print("=" * 60)

if __name__ == "__main__":
    run_import()
