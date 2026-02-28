---
name: firecrawl-web-scraper
description: High-performance web scraping tool using Firecrawl API for efficient content extraction, data collection, and website analysis. Use when users need to scrape websites, extract specific content, analyze web pages, or collect data from multiple URLs with minimal context overhead.
---

# Firecrawl Web Scraper

## Overview

This skill provides efficient web scraping capabilities using the Firecrawl API, designed to minimize context window usage while maximizing scraping performance. It handles single URLs, batch processing, specialized content extraction, and **content factory workflows** for trend analysis and content creation.

## Core Capabilities

### 1. Single URL Scraping
Extract content from individual web pages with customizable output formats:

```python
# Basic usage - get clean markdown content
scrape_url("https://example.com")

# Advanced usage - extract specific elements
scrape_url("https://example.com", 
          extract_type="structured",
          include_links=True,
          include_images=True)
```

### 2. Batch URL Processing
Process multiple URLs efficiently with automatic rate limiting and error handling:

```python
# Batch scrape with custom settings
batch_scrape([
    "https://site1.com",
    "https://site2.com/page1",
    "https://site2.com/page2"
], output_format="json", max_concurrent=3)
```

### 3. Content Factory Workflow 🔥
**NEW**: Automated trend analysis and content idea generation for content creators:

```bash
# Run complete content factory workflow
python scripts/content_factory_workflow.py --urls content_urls.txt --api-key your-key

# Output: trending analysis + content ideas + actionable reports
```

**Features:**
- **Trend Analysis**: Identify hot keywords and topics from scraped content
- **Video Content Extraction**: Extract video metadata, duration, creator info
- **Engagement Analysis**: Parse likes, comments, shares, views data
- **Content Ideas Generation**: AI-powered suggestions based on trending data
- **Hotness Scoring**: Rate content popularity potential (1-10 scale)

### 4. Structured Data Extraction
Extract specific content types like tables, forms, navigation menus, or custom selectors:

```python
# Extract tables and convert to CSV
extract_tables("https://example.com/data")

# Extract all links and metadata
extract_links("https://example.com", include_internal=True)

# Analyze content for trends
analyzer = ContentAnalyzer(api_key="your-key")
analysis = analyzer.analyze_content("https://popular-article.com")
```

## Quick Start Workflows

### Basic Scraping Workflow
1. **Simple Scraping**: Use `scrape_url()` for basic content extraction
2. **Batch Processing**: Use `batch_scraper.py` for multiple URLs
3. **Structured Extraction**: Use specialized functions for tables, links, or custom elements
4. **Export Results**: Choose from markdown, JSON, CSV, or custom formats

### Content Factory Workflow 🚀
1. **Collect URLs**: Gather trending content URLs from various platforms
2. **Batch Analysis**: Run `content_factory_workflow.py` to analyze all content
3. **Trend Identification**: Get hot keywords, topics, and engagement patterns
4. **Content Ideas**: Receive AI-generated content suggestions with popularity scores
5. **Report Export**: Get actionable reports in multiple formats

## When to Use This Skill

Trigger this skill when users request:

**Basic Scraping:**
- "Scrape this website: [URL]"
- "Extract data from these pages"
- "Get all the links from this site"
- "Analyze the content structure of [URL]"

**Content Factory Use Cases:**
- "Analyze trending content for content ideas"
- "Find hot topics from these articles/videos"
- "Generate content ideas based on popular posts"
- "What are the trending keywords in this content?"
- "Help me create viral content based on current trends"
- "Analyze competitor content for insights"

## Performance Optimization

- **Context Efficiency**: Results are processed and summarized to minimize token usage
- **Rate Limiting**: Built-in delays prevent API throttling
- **Error Handling**: Robust retry mechanisms for failed requests
- **Caching**: Optional result caching for repeated requests
- **Selective Loading**: Load only necessary content based on extraction type

## Resources

This skill includes comprehensive tools and documentation for efficient web scraping:

### scripts/
Executable Python scripts for direct use:

- **`firecrawl_scraper.py`** - Core scraping library with `FirecrawlScraper` class and utility functions
- **`batch_scraper.py`** - Command-line tool for batch processing URLs from files
- **`content_analyzer.py`** - 🔥 Content analysis engine for trend detection and engagement analysis
- **`content_factory_workflow.py`** - 🚀 Complete workflow for content creators and marketers

**Usage examples:**
```bash
# Basic batch scraping
python scripts/batch_scraper.py --urls urls.txt --api-key your-key --format json

# Content factory workflow
python scripts/content_factory_workflow.py --urls trending_urls.txt --api-key your-key

# Test with sample URLs
python scripts/content_factory_workflow.py --sample-urls --api-key your-key
```

### references/
Detailed documentation loaded as needed:

- **`firecrawl_api.md`** - Complete Firecrawl API reference, error codes, and optimization tips
- **`usage_examples.md`** - Practical examples for common scraping scenarios and advanced use cases

**Load when:** Users need API details, error troubleshooting, or implementation examples

### assets/
Template files for quick setup:

- **`url_list_template.txt`** - Template for organizing URLs in batch operations
- **`config_template.json`** - Configuration template with all available options
- **`content_factory_urls.txt`** - 🔥 Curated URL template for content factory workflows (social media, news, video platforms)
