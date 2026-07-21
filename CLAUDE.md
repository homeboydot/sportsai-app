# SportsAI Development Guidelines

## Project Overview

SportsAI is an existing Expo React Native application.

This is not a new project.
Always work inside the existing codebase.

## Rules

1. Never create a replacement project.
2. Never generate ZIP files as the main workflow.
3. Never delete working features without approval.
4. Make small incremental changes.
5. Preserve the current UI and navigation.
6. Explain changes before applying them.
7. Test changes with Expo before committing.
8. Keep Git commits small and meaningful.

## Project Structure

- App.js = application entry
- screens = full pages
- components = reusable UI components
- navigation = app navigation
- theme = design system

## Development Style

Prefer:

- clean React Native patterns
- reusable components
- separated data/services
- readable code
- maintainable architecture

## Current Goal

Transform SportsAI from a UI prototype into a real AI-powered sports analysis application.

First major improvement:
Create a proper data layer for matches without breaking existing screens.