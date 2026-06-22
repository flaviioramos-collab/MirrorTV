#!/usr/bin/env python3
"""Merge cover.pdf + body.pdf into the final delivery PDF."""

import os
from pypdf import PdfReader, PdfWriter

A4_W, A4_H = 595.28, 841.89  # A4 in points


def normalize_page_to_a4(page):
    box = page.mediabox
    w, h = float(box.width), float(box.height)
    # Force scale to exact A4 if dimensions differ by even sub-points
    if abs(w - A4_W) > 0.1 or abs(h - A4_H) > 0.1:
        page.scale_to(A4_W, A4_H)
    return page


def main():
    cover = "/home/z/my-project/scripts/cover.pdf"
    body = "/home/z/my-project/scripts/body.pdf"
    output = "/home/z/my-project/download/MirrorTV-Quickstart-PWA-para-APK.pdf"

    writer = PdfWriter()
    cover_page = PdfReader(cover).pages[0]
    writer.add_page(normalize_page_to_a4(cover_page))
    for page in PdfReader(body).pages:
        writer.add_page(normalize_page_to_a4(page))

    writer.add_metadata({
        "/Title": "MirrorTV — Quickstart PWA para APK",
        "/Author": "Z.ai",
        "/Creator": "Z.ai",
        "/Subject": "Guia passo a passo para transformar a PWA MirrorTV em APK Android",
        "/Keywords": "PWA, APK, Android, PWABuilder, Vercel, Bubblewrap, TWA, MirrorTV",
    })

    os.makedirs(os.path.dirname(output), exist_ok=True)
    with open(output, "wb") as f:
        writer.write(f)

    size_kb = os.path.getsize(output) / 1024
    print(f"Final PDF: {output}")
    print(f"Size: {size_kb:.1f} KB")
    print(f"Pages: {len(PdfReader(output).pages)}")


if __name__ == "__main__":
    main()
