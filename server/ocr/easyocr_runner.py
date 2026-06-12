#!/usr/bin/env python3
"""EasyOCR sidecar for Cashendar.

Reads an image path from argv, prints {"text": "..."} on stdout.
Bounding boxes are clustered into visual lines (receipts are columnar:
article on the left, price on the right) so the downstream line parser
sees "NAME .... 1.99" on one line.
"""
import json
import sys


def group_into_lines(results):
    # results: list of (bbox, text, confidence); bbox = 4 corner points
    entries = []
    for bbox, text, _conf in results:
        ys = [point[1] for point in bbox]
        xs = [point[0] for point in bbox]
        entries.append({
            "text": text,
            "top": min(ys),
            "bottom": max(ys),
            "left": min(xs),
        })

    entries.sort(key=lambda e: e["top"])

    lines = []
    for entry in entries:
        center = (entry["top"] + entry["bottom"]) / 2
        placed = False
        for line in lines:
            # Same visual line when vertical centers overlap the line's band
            if line["top"] <= center <= line["bottom"]:
                line["parts"].append(entry)
                line["top"] = min(line["top"], entry["top"])
                line["bottom"] = max(line["bottom"], entry["bottom"])
                placed = True
                break
        if not placed:
            lines.append({
                "top": entry["top"],
                "bottom": entry["bottom"],
                "parts": [entry],
            })

    rendered = []
    for line in lines:
        parts = sorted(line["parts"], key=lambda e: e["left"])
        rendered.append(" ".join(part["text"] for part in parts))
    return "\n".join(rendered)


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "usage: easyocr_runner.py <image>"}), file=sys.stderr)
        sys.exit(1)

    image_path = sys.argv[1]
    try:
        import easyocr
        reader = easyocr.Reader(["en"], gpu=False, verbose=False)
        results = reader.readtext(image_path, detail=1, paragraph=False)
        print(json.dumps({"text": group_into_lines(results)}))
    except Exception as exc:  # noqa: BLE001 - report anything to the caller
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
