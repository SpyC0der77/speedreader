import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: "Invalid URL protocol" },
        { status: 400 }
      );
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SpeedReader/1.0; +https://github.com)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.statusText}` },
        { status: 502 }
      );
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return NextResponse.json(
        { error: "Could not extract article content" },
        { status: 422 }
      );
    }

    const textContent = article.textContent
      ? article.textContent.replace(/\s+/g, " ").trim()
      : undefined;

    return NextResponse.json({
      title: article.title,
      content: article.content,
      textContent,
      excerpt: article.excerpt,
      byline: article.byline,
      siteName: article.siteName,
    });
  } catch (error) {
    console.error("Article extraction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to extract article" },
      { status: 500 }
    );
  }
}
