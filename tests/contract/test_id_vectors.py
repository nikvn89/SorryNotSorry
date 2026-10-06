"""
Golden grievance-id vectors shared with the frontend (tests/js/ids.test.ts and
tests/js/ids-html.test.ts read the same file). Every id is computed by the
contract's own code on the real SDK Keccak256.

Regenerate:  WRITE_VECTORS=1 python3 -m pytest tests/contract/test_id_vectors.py
"""
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VECTORS = ROOT / "tests" / "js" / "id-vectors.json"
CONTRACT = str(ROOT / "contracts" / "NoIfApology.py")

COMPLAINANT = "0x3065e31b1d993d7c0d59e6786844cba56780b2d3"
RESPONDENT = "0x76dd809f34e0b72d9339bc509e1e19fafeb445c2"
COMPLAINTS = [
    "Called my pull request lazy in the public channel",
    "Mocked my accent in the team meeting",
    "  Took credit\tfor my slides\n in the review  ",
    "\u001cIgnored my review comments\u001f",
    "Interrupted me\u0085three\u001dtimes\u001ein a row",
    "﻿Complaint with a byte order mark",
    "A ri de mon accent　en réunion \U0001F622",
]


def build(contract):
    rows = []
    for text in COMPLAINTS:
        norm = contract._normalize_text(text.strip())
        rows.append({"complaint": text, "normalized": norm, "py_len": len(norm),
                     "grievance_id": contract._grievance_id(COMPLAINANT, RESPONDENT, norm)})
    return {"complainant": COMPLAINANT, "respondent": RESPONDENT, "grievances": rows}


def test_vectors_match_contract(direct_deploy):
    data = build(direct_deploy(CONTRACT))
    if os.environ.get("WRITE_VECTORS") == "1":
        VECTORS.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    assert json.loads(VECTORS.read_text(encoding="utf-8")) == data
