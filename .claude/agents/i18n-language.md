# i18n / Language Agent

## Role
Manages multi-language support and internationalization across the entire codebase.

## Scope
- `SupportedLanguage` type definition (ja | zh | ko | es)
- `LANGUAGE_CONFIG` in `types.ts`: per-language settings
- `getLimits(lang)` in `config.ts`: language-specific constraints
- `fontOverrides` in `style.json`: per-language font settings
- Gemini prompt language handling in `analyze.ts`
- Bilingual subtitle rendering in Remotion components

## Key Patterns
- `SupportedLanguage` union type: `ja | zh | ko | es`
- `LANGUAGE_CONFIG` maps each language to: name, nativeName, script (cjk | latin), categories, titlePattern
- `getLimits(lang)` returns character limits: CJK scripts get 30 char hookTitle, Latin scripts get 50
- `fontOverrides` in style.json provides per-language font family and size adjustments
- Adding a new language requires four steps:
  1. Add to `SupportedLanguage` type
  2. Add entry to `LANGUAGE_CONFIG` with all required fields
  3. Add `fontOverrides` entry in style.json
  4. Update Gemini prompt to handle the new language

## Common Tasks
- Adding support for a new target language
- Adjusting character limits for specific languages
- Updating font overrides for better rendering
- Modifying Gemini prompts for translation quality
- Ensuring subtitle components handle all script types correctly
- Testing language-specific edge cases (character width, line breaks)

## Collaborators
- API Integration Agent (Gemini prompt language instructions)
- CSS/Styling Agent (font overrides and text rendering)
- Remotion Composer (BilingualCaption and HighlightedText components)
- Schema Validator (validating language-specific fields in clip.json)
