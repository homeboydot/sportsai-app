# SportsAI — AI Sports Assistant

A premium, non-gambling-feeling AI sports assistant UI. Built with Expo /
React Native, now a real multi-screen app with bottom tab navigation.

## Screens

| Tab | File | Purpose |
|---|---|---|
| Home | `screens/HomeScreen.js` | Briefing, Build My Ticket, AI Insight, live rail, quick actions |
| AI Analyst | `screens/AIChatScreen.js` | Chat with the assistant, sample conversation, suggestion prompts |
| Live Matches | `screens/MatchesScreen.js` | Full list of live matches, scoreboard-style, no odds |
| Ticket Builder | `screens/TicketBuilderScreen.js` | Explains the AI analysis process, "Create Analysis" CTA |
| Profile | `screens/ProfileScreen.js` | Favorite teams/leagues, AI preferences |

## Navigation

`navigation/AppNavigator.js` wraps all five screens in
`@react-navigation/bottom-tabs`, with `components/BottomNav.js` supplied
as the custom `tabBar`. This keeps the exact original floating-glass-pill
visual (dark background, emerald active state, BlurView) but now drives
it off real navigation state instead of local component state — includes
a sliding active-tab indicator and a per-icon focus bounce.

`App.js` is unchanged in spirit: it still owns font loading and splash
screen handling, and now renders `<AppNavigator />` instead of
`<HomeScreen />` directly.

## Design system

**Palette**
| Token | Hex | Use |
|---|---|---|
| `bgBase` | `#08090A` | matte black canvas |
| `emerald` | `#12E19B` | primary accent, CTAs, active states |
| `emeraldDeep` | `#0B9E6D` | gradient partner / pressed states |
| `textPrimary` | `#F5F7F6` | headlines, primary copy |
| `textSecondary` | `#9AA3A0` | supporting copy |

**Type**
- Display: Space Grotesk (Medium/SemiBold) — greeting, headlines, big numbers
- Body: Inter (Regular/Medium/SemiBold) — everyday UI text
- Mono: JetBrains Mono — scores, timers, confidence tags

**Signature element**
`components/AIAvatar.js` — a breathing emerald orb, not a bot mascot or
chat-bubble icon. Appears largest on AIChatScreen, and at smaller sizes
in the Home header and AI Insight card, so the same presence follows the
user across every tab.

## Architecture

```
App.js                          — font loading, splash screen, renders AppNavigator
navigation/
  AppNavigator.js                — bottom-tabs navigator, dark nav theme, custom tabBar
theme/tokens.js                  — single source of truth: color, type, spacing, shadow
screens/
  HomeScreen.js                  — briefing + CTA + insight + live rail + quick actions
  AIChatScreen.js                — chat header, sample conversation, suggestion chips
  MatchesScreen.js                — vertical live match list
  TicketBuilderScreen.js          — process explainer + Create Analysis CTA
  ProfileScreen.js                — identity, favorites, AI preferences
components/
  GlassCard.js                   — base glassmorphism surface (BlurView + gradient sheen)
  AIAvatar.js                    — signature animated orb
  GreetingHeader.js               — Home-only "Good Evening" header
  ScreenHeader.js                 — shared heading block for the other 4 screens
  MatchSummaryCard.js             — today's briefing card
  BuildTicketButton.js            — primary CTA, now with configurable title/subtitle/icon
  AIInsightCard.js                — proactive AI insight, "Ask why" affordance
  LiveMatchCard.js                — single match tile, now with optional style override for reuse
  LiveMatchesSection.js           — horizontal live matches rail (Home)
  ChatBubble.js                   — AI/user message bubble (AIChatScreen)
  SuggestionChip.js               — tappable prompt suggestion (AIChatScreen)
  TagChip.js                      — favorite team/league tag (ProfileScreen)
  QuickActions.js                 — 2x2 grid of secondary actions (Home)
  BottomNav.js                    — custom floating glass tab bar for react-navigation
```

Every component still pulls exclusively from `theme/tokens.js` — no
hardcoded colors or spacing anywhere in the new screens either.

## Why it doesn't read as a betting app

- No odds, no stake fields, no "bet slip" language on any screen —
  including the new Matches and Ticket Builder screens.
- Ticket Builder explicitly explains the AI process (scan → weigh →
  explain) and states no selections are placed automatically.
- Copy voice throughout stays analyst/assistant register.

## Setup

```bash
npx create-expo-app sportsai --template blank
# copy these files into the generated project, replacing App.js
cd sportsai
npx expo install @react-navigation/native @react-navigation/bottom-tabs \
  react-native-screens react-native-safe-area-context \
  expo-blur expo-linear-gradient expo-font expo-splash-screen
npm install @expo-google-fonts/inter @expo-google-fonts/space-grotesk \
  @expo-google-fonts/jetbrains-mono @expo/vector-icons
npx expo start
```

`npx expo install` (rather than plain `npm install`) is used for the
native/navigation packages so Expo resolves versions compatible with your
installed Expo SDK automatically.

Scan the QR code with Expo Go (iOS/Android) or press `w` for a web preview.

## Extending further

- Wire `BuildTicketButton`'s `onPress` on both Home and TicketBuilderScreen
  to your real ticket-generation flow.
- Replace the static arrays in `MatchesScreen.js` / `LiveMatchesSection.js`
  with a shared live-data source — both already consume the same match
  shape (`league, minute, home, away, homeScore, awayScore`).
- `ChatBubble` and `SuggestionChip` are ready to drive a real chat state
  (message list + input) on `AIChatScreen.js`.

