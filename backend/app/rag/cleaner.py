"""Deterministic text normalization and cleaning for RAG corpus documents.
Safely cleans artifacts while strictly preserving numbers, conditions, and headings.
"""
from __future__ import annotations

import re


class TextCleaner:
    """Normalizes extracted text while preserving all factual constraints."""

    # Generic header/footer pagination patterns (e.g. "Page 12 of 45", "Page - 4 -", "--- 2 ---")
    PAGINATION_PATTERNS = [
        re.compile(r"^\s*(?:Page|PAGE)\s*\d+\s*(?:of|OF|\/)\s*\d+\s*$", re.MULTILINE),
        re.compile(r"^\s*[-—–]+\s*\d+\s*[-—–]+\s*$", re.MULTILINE),
        re.compile(r"^\s*(?:Page|PAGE)\s*[-—–:]?\s*\d+\s*$", re.MULTILINE),
    ]

    # Repeated form-feed / control characters
    CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")

    @classmethod
    def clean_text(cls, raw_text: str) -> str:
        if not raw_text:
            return ""

        # 1. Strip non-printable control characters
        text = cls.CONTROL_CHARS.sub(" ", raw_text)

        # 2. Normalize Windows/Mac linebreaks to Unix \n
        text = text.replace("\r\n", "\n").replace("\r", "\n")

        # 3. Strip standalone page number / pagination artifacts
        for pat in cls.PAGINATION_PATTERNS:
            text = pat.sub("", text)

        # 4. Repair broken word-hyphenation at line breaks (e.g., "quali-\nfication" -> "qualification")
        # Ensure we don't accidentally merge bullet points like "- item"
        text = re.sub(r"([a-zA-Z]{2,})-\n\s*([a-zA-Z]{2,})", r"\1\2", text)

        # 5. Fix unnatural intra-paragraph line-breaks:
        # A line ending with a lowercase letter or comma followed by a single newline
        # and lowercase letter is typically an artificial PDF wrap.
        lines = text.split("\n")
        reconstructed = []
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if not line:
                reconstructed.append("")
                i += 1
                continue

            # If current line does not look like a heading, list item, or sentence end,
            # and next line starts with lowercase, join them with a single space.
            if (
                i + 1 < len(lines)
                and not line.startswith(("#", "-", "*", "•", "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9.", "(a)", "(b)", "(c)"))
                and not line.endswith((".", ":", ";", "?", "!"))
            ):
                next_line = lines[i + 1].strip()
                if next_line and (next_line[0].islower() or next_line[0].isdigit() or next_line.startswith(("and ", "or ", "with ", "in ", "of "))):
                    line = f"{line} {next_line}"
                    i += 1  # Skip next line as it was merged

            reconstructed.append(line)
            i += 1

        text = "\n".join(reconstructed)

        # 6. Normalize multiple horizontal spaces and tabs into a single space
        text = re.sub(r"[ \t]+", " ", text)

        # 7. Collapse more than 2 consecutive newlines into 2 (paragraph break)
        text = re.sub(r"\n{3,}", "\n\n", text)

        return text.strip()
