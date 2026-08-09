## v65 - OBS 16:9 and 9:16 overlay screens
- Added `/obs16.9` and `/obs9.16` output routes.
- Both routes start with green chroma background for OBS keying.
- Both routes follow the live slide, scripture, manual verse, and poll messages.
- Poll results render as full OBS overlays sized separately for horizontal and vertical scenes.
- Existing `/obslowerthirds`, `/obsslides`, projector, scripture, confidence, admin, audience, and lesson behavior remains unchanged.

## v64 - All-slide scripture output guard
- Applied the scripture-screen guard to every lesson and every slide.
- Only slides with type `sc` can send content to `/scriptures`.
- Cover, point, setup, question, poll, and closing slides now clear `/scriptures` instead of sending a broad passage or leaving the previous verse onscreen.
- No other presentation, audience, poll, notes, route, or Supabase behavior changed.


## v61 - Audience Notes UI visible fix

- Replaced the online viewer Current Slide card with a visible Teaching Notes card.
- Teaching Notes now shows the current slide's point list instead of the slide preview.
- Notes textarea is bound even when the card is rendered in the base HTML.
- Old online slide preview is hard-hidden so older layout patches cannot bring it back.
- Kept v60 point-forward lesson slides and verse push fixes unchanged.

# v59 Lesson 4 + Verse Reliability + Audience Notes

- Added Lesson 4: **What It Takes to Make It** from Matthew 10:16-28.
- Set Lesson 4 open for July 9, 2026.
- Fixed verse-bank reliability by exposing/syncing the active verse bank and forcing push events to P1 and P2.
- Patched mobile verse bank and mobile full Bible Bank pushes so they no longer depend on a missing `window.VERSE_BANK` value.
- Replaced the online audience slideshow card with an audience notes section showing current slide points plus a saved notes textarea.
- Added `/api/notes-save` and `supabase/v59-audience-notes.sql` for per-attendee/session note storage.

## v60 - Point-forward lesson slides
- Reworked Lesson 4 slideshow from scripture-heavy to point-forward teaching slides.
- Kept core scripture slides for Matthew 10:16, Matthew 10:19-20, Matthew 10:22, and Matthew 10:28.
- Preserved verse push reliability patch and audience saved notes system from v59.

## v62 Admin Lesson 4 Button
- Added the missing Lesson 4 button to the presenter/admin command bar.
- Marked Lesson 4 open in base lesson metadata so admin/home routes do not treat it as locked.
- Added a small runtime guard that reinserts the Lesson 4 admin button if older layout code redraws the command bar.

## v61 - Final Lesson 5
- Added Lesson 5: Matthew 10: The Five Outcomes of Ministry.
- Added 14 slides, 3 polls, 10 reflection questions, presenter notes, and verse bank for Matthew 10:29-42.
- Added Spanish audience slide translations and RVR 1960 verse text for Matthew 10:29-42.
- Added Lesson 5 to admin and date-based lesson selection.
- Preserved prior routes, sync, audience notes, polls, questions, and projector behavior.

## v62 - Lesson 5 scripture language fix
- Fixed Lesson 5 scripture-screen payloads so the main text is RVR Spanish.
- Kept KJV English as the secondary text underneath.
- Point slides now send the actual referenced Bible passage instead of repeating the English point text with a Spanish reference.
- No other routes, lessons, polls, notes, or sync behavior changed.

## v63 - Lesson 5 scripture-slide-only fix
- Lesson 5 now sends scripture to `/scriptures` only on actual scripture slides.
- Setup, point, question, and closing slides no longer generate the full Matthew 10:29-42 passage.
- Auto P2 clears the scripture output on Lesson 5 non-scripture slides.
- No other lesson, route, UI, poll, notes, or sync behavior changed.
