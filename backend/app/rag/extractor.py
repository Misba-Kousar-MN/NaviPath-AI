"""Document text extractor for PDF, TXT, and HTML files.
Supports structure preservation and flags image-only scanned PDFs for OCR.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class PageText:
    page_number: int
    text: str


@dataclass
class ExtractionResult:
    source_path: str
    file_type: str
    success: bool
    total_pages: int
    extracted_text: str
    pages: list[PageText] = field(default_factory=list)
    requires_ocr: bool = False
    warning: str | None = None


class DocumentExtractor:
    """Extracts raw text from official PDF, HTML, and TXT files."""

    @classmethod
    def extract_file(cls, file_path: str | Path) -> ExtractionResult:
        path = Path(file_path)
        if not path.exists():
            return ExtractionResult(
                source_path=str(path),
                file_type="unknown",
                success=False,
                total_pages=0,
                extracted_text="",
                warning=f"File not found: {path}",
            )

        suffix = path.suffix.lower()
        if suffix == ".pdf":
            return cls._extract_pdf(path)
        elif suffix in (".txt", ".md"):
            return cls._extract_txt(path)
        elif suffix in (".html", ".htm"):
            return cls._extract_html(path)
        else:
            return ExtractionResult(
                source_path=str(path),
                file_type=suffix,
                success=False,
                total_pages=0,
                extracted_text="",
                warning=f"Unsupported file format: {suffix}",
            )

    @classmethod
    def _extract_pdf(cls, path: Path) -> ExtractionResult:
        try:
            import pymupdf  # PyMuPDF
            doc = pymupdf.open(str(path))
            pages: list[PageText] = []
            full_text_parts: list[str] = []
            total_pages = len(doc)

            for page_num, page in enumerate(doc, start=1):
                text = page.get_text() or ""
                pages.append(PageText(page_number=page_num, text=text))
                full_text_parts.append(text)

            doc.close()
            combined_text = "\n\n".join(full_text_parts).strip()

            # Check if scanned / image-only
            if total_pages > 0 and len(combined_text.replace(" ", "").replace("\n", "")) < 50:
                return ExtractionResult(
                    source_path=str(path),
                    file_type="pdf",
                    success=False,
                    total_pages=total_pages,
                    extracted_text="",
                    pages=pages,
                    requires_ocr=True,
                    warning="Scanned or image-only PDF detected; text extraction requires OCR.",
                )

            return ExtractionResult(
                source_path=str(path),
                file_type="pdf",
                success=True,
                total_pages=total_pages,
                extracted_text=combined_text,
                pages=pages,
                requires_ocr=False,
            )
        except Exception as e:
            # Fallback to pypdf if pymupdf encountered an issue
            try:
                import pypdf
                reader = pypdf.PdfReader(str(path))
                pages = []
                full_text_parts = []
                total_pages = len(reader.pages)
                for page_num, page in enumerate(reader.pages, start=1):
                    text = page.extract_text() or ""
                    pages.append(PageText(page_number=page_num, text=text))
                    full_text_parts.append(text)

                combined_text = "\n\n".join(full_text_parts).strip()
                if total_pages > 0 and len(combined_text.replace(" ", "").replace("\n", "")) < 50:
                    return ExtractionResult(
                        source_path=str(path),
                        file_type="pdf",
                        success=False,
                        total_pages=total_pages,
                        extracted_text="",
                        pages=pages,
                        requires_ocr=True,
                        warning="Scanned or image-only PDF detected; text extraction requires OCR.",
                    )

                return ExtractionResult(
                    source_path=str(path),
                    file_type="pdf",
                    success=True,
                    total_pages=total_pages,
                    extracted_text=combined_text,
                    pages=pages,
                    requires_ocr=False,
                )
            except Exception as e_fallback:
                return ExtractionResult(
                    source_path=str(path),
                    file_type="pdf",
                    success=False,
                    total_pages=0,
                    extracted_text="",
                    warning=f"PDF extraction failed: {e}; fallback error: {e_fallback}",
                )

    @classmethod
    def _extract_txt(cls, path: Path) -> ExtractionResult:
        try:
            text = path.read_text(encoding="utf-8")
            return ExtractionResult(
                source_path=str(path),
                file_type="txt",
                success=True,
                total_pages=1,
                extracted_text=text,
                pages=[PageText(page_number=1, text=text)],
            )
        except UnicodeDecodeError:
            try:
                text = path.read_text(encoding="latin-1")
                return ExtractionResult(
                    source_path=str(path),
                    file_type="txt",
                    success=True,
                    total_pages=1,
                    extracted_text=text,
                    pages=[PageText(page_number=1, text=text)],
                )
            except Exception as e:
                return ExtractionResult(
                    source_path=str(path),
                    file_type="txt",
                    success=False,
                    total_pages=0,
                    extracted_text="",
                    warning=f"TXT read error: {e}",
                )

    @classmethod
    def _extract_html(cls, path: Path) -> ExtractionResult:
        try:
            from bs4 import BeautifulSoup

            raw_html = path.read_text(encoding="utf-8", errors="replace")
            soup = BeautifulSoup(raw_html, "html.parser")

            # Remove scripts and style elements
            for element in soup(["script", "style", "nav", "footer", "header", "noscript"]):
                element.decompose()

            # Preserve block structure: headings and paragraphs
            lines = []
            for element in soup.find_all(["h1", "h2", "h3", "h4", "p", "li", "tr"]):
                text = element.get_text(strip=True)
                if text:
                    tag = element.name
                    if tag in ("h1", "h2", "h3", "h4"):
                        lines.append(f"\n### {text}\n")
                    elif tag == "li":
                        lines.append(f"- {text}")
                    else:
                        lines.append(text)

            extracted = "\n".join(lines).strip()
            if not extracted:
                extracted = soup.get_text(separator="\n", strip=True)

            return ExtractionResult(
                source_path=str(path),
                file_type="html",
                success=True,
                total_pages=1,
                extracted_text=extracted,
                pages=[PageText(page_number=1, text=extracted)],
            )
        except Exception as e:
            return ExtractionResult(
                source_path=str(path),
                file_type="html",
                success=False,
                total_pages=0,
                extracted_text="",
                warning=f"HTML extraction error: {e}",
            )
